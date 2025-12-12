from datetime import date, timedelta
from typing import List, Optional
from models.book import Book
from models.reader import Reader
from models.rental import Rental, RentalStatus
from repository.repository import BookRepository, ReaderRepository, RentalRepository
from patterns.strategy import PricingContext, DailyPricingStrategy
from patterns.discount import DiscountContext, CategoryDiscountStrategy
from patterns.fine import FineContext, StandardFineCalculator
from patterns.observer import Subject, OverdueNotifier


class LibraryService:
    """Main service class using Singleton pattern"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(LibraryService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
        
        self.book_repo = BookRepository()
        self.reader_repo = ReaderRepository()
        self.rental_repo = RentalRepository()
        self.pricing_context = PricingContext(DailyPricingStrategy())
        self.discount_context = DiscountContext(CategoryDiscountStrategy())
        self.fine_context = FineContext(StandardFineCalculator())
        self.observer_subject = Subject()
        self.observer_subject.attach(OverdueNotifier())
        
        self._initialized = True
    
    def add_book(self, book: Book) -> int:
        """Add a book to the library"""
        return self.book_repo.add(book)
    
    def get_all_books(self) -> List[Book]:
        """Get all books"""
        return self.book_repo.get_all()
    
    def get_available_books(self) -> List[Book]:
        """Get available books"""
        return self.book_repo.get_available_books()
    
    def add_reader(self, reader: Reader) -> int:
        """Register a new reader"""
        return self.reader_repo.add(reader)
    
    def get_all_readers(self) -> List[Reader]:
        """Get all readers"""
        return self.reader_repo.get_all()
    
    def rent_book(self, book_id: int, reader_id: int, rental_days: int = 14) -> Optional[Rental]:
        """Rent a book to a reader"""
        book = self.book_repo.get_by_id(book_id)
        reader = self.reader_repo.get_by_id(reader_id)
        
        if not book or not reader:
            return None
        
        if not book.is_available():
            return None
        
        # Calculate rental cost
        expected_return = date.today() + timedelta(days=rental_days)
        rental_cost = self.pricing_context.calculate_cost(
            book.base_rental_cost, date.today(), expected_return
        )
        
        # Apply discount
        rental_cost = self.discount_context.apply_discount(rental_cost, reader.category)
        
        # Create rental
        rental = Rental(
            id=None,
            book_id=book_id,
            reader_id=reader_id,
            issue_date=date.today(),
            expected_return_date=expected_return,
            actual_return_date=None,
            status=RentalStatus.ACTIVE,
            deposit_paid=book.deposit_cost,
            rental_cost=rental_cost
        )
        
        # Rent the book
        if book.rent_copy():
            rental_id = self.rental_repo.add(rental)
            # Update book in database to reflect the change in available copies
            self.book_repo.update(book)
            return self.rental_repo.get_by_id(rental_id)
        
        return None
    
    def return_book(self, rental_id: int, damage_level: Optional[str] = None) -> Optional[Rental]:
        """Return a book"""
        rental = self.rental_repo.get_by_id(rental_id)
        if not rental or rental.status == RentalStatus.RETURNED:
            return None
        
        book = self.book_repo.get_by_id(rental.book_id)
        if not book:
            return None
        
        # Calculate fines
        if rental.is_overdue():
            days_overdue = (date.today() - rental.expected_return_date).days
            rental.fine_amount = self.fine_context.get_overdue_fine(
                days_overdue, rental.rental_cost
            )
        
        if damage_level:
            rental.damage_fine = self.fine_context.get_damage_fine(book.value, damage_level)
            rental.status = RentalStatus.DAMAGED
        else:
            rental.status = RentalStatus.RETURNED
        
        rental.actual_return_date = date.today()
        rental.update_status()
        book.return_copy()
        
        self.rental_repo.update(rental)
        self.book_repo.update(book)
        
        return rental
    
    def get_active_rentals(self) -> List[Rental]:
        """Get all active rentals"""
        rentals = self.rental_repo.get_active_rentals()
        for rental in rentals:
            rental.update_status()
            if rental.is_overdue():
                self.observer_subject.notify(rental, "overdue")
        return rentals
    
    def get_overdue_rentals(self) -> List[Rental]:
        """Get all overdue rentals"""
        return self.rental_repo.get_overdue_rentals()
    
    def get_reader_rentals(self, reader_id: int) -> List[Rental]:
        """Get all rentals for a reader"""
        return self.rental_repo.get_reader_rentals(reader_id)
    
    def get_financial_status(self) -> dict:
        """Get financial status report"""
        rentals = self.rental_repo.get_all()
        
        total_deposits = sum(r.deposit_paid for r in rentals)
        total_rental_income = sum(r.rental_cost for r in rentals if r.status == RentalStatus.RETURNED)
        total_fines = sum(r.fine_amount + r.damage_fine for r in rentals)
        total_revenue = total_rental_income + total_fines
        
        return {
            "total_deposits": total_deposits,
            "total_rental_income": total_rental_income,
            "total_fines": total_fines,
            "total_revenue": total_revenue,
            "active_rentals": len([r for r in rentals if r.status == RentalStatus.ACTIVE]),
            "total_rentals": len(rentals)
        }
    
    def get_financial_history(self) -> List[dict]:
        """Get history of all financial operations"""
        rentals = self.rental_repo.get_all()
        history = []
        
        for rental in rentals:
            book = self.book_repo.get_by_id(rental.book_id)
            reader = self.reader_repo.get_by_id(rental.reader_id)
            
            # Rental transaction
            history.append({
                'id': rental.id,
                'date': rental.issue_date.isoformat(),
                'type': 'Rental',
                'description': f"Rental: {book.title if book else 'Unknown'} to {reader.full_name if reader else 'Unknown'}",
                'amount': rental.deposit_paid,
                'transaction_type': 'deposit'
            })
            
            # Return transaction (if returned)
            if rental.status in [RentalStatus.RETURNED, RentalStatus.DAMAGED]:
                history.append({
                    'id': rental.id,
                    'date': rental.actual_return_date.isoformat() if rental.actual_return_date else rental.issue_date.isoformat(),
                    'type': 'Return',
                    'description': f"Return: {book.title if book else 'Unknown'} from {reader.full_name if reader else 'Unknown'}",
                    'amount': rental.rental_cost,
                    'transaction_type': 'income'
                })
                
                # Fine transactions
                if rental.fine_amount > 0:
                    history.append({
                        'id': rental.id,
                        'date': rental.actual_return_date.isoformat() if rental.actual_return_date else rental.issue_date.isoformat(),
                        'type': 'Fine',
                        'description': f"Overdue fine: {book.title if book else 'Unknown'}",
                        'amount': rental.fine_amount,
                        'transaction_type': 'fine'
                    })
                
                if rental.damage_fine > 0:
                    history.append({
                        'id': rental.id,
                        'date': rental.actual_return_date.isoformat() if rental.actual_return_date else rental.issue_date.isoformat(),
                        'type': 'Damage Fine',
                        'description': f"Damage fine: {book.title if book else 'Unknown'}",
                        'amount': rental.damage_fine,
                        'transaction_type': 'fine'
                    })
        
        # Sort by date (newest first)
        history.sort(key=lambda x: x['date'], reverse=True)
        return history


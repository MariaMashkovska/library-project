from abc import ABC, abstractmethod
from typing import List, Optional
from models.book import Book
from models.reader import Reader
from models.rental import Rental
from database.db import db
from database.models import BookModel, ReaderModel, RentalModel
from models.rental import RentalStatus
from datetime import date


class Repository(ABC):
    """Repository pattern for data access"""
    
    @abstractmethod
    def get_all(self) -> List:
        pass
    
    @abstractmethod
    def get_by_id(self, id: int):
        pass
    
    @abstractmethod
    def add(self, entity) -> int:
        pass
    
    @abstractmethod
    def update(self, entity) -> None:
        pass
    
    @abstractmethod
    def delete(self, id: int) -> None:
        pass


class BookRepository(Repository):
    """Repository for books using PostgreSQL"""
    
    def get_all(self) -> List[Book]:
        book_models = BookModel.query.all()
        return [book_model.to_book() for book_model in book_models]
    
    def get_by_id(self, id: int) -> Optional[Book]:
        book_model = BookModel.query.get(id)
        return book_model.to_book() if book_model else None
    
    def add(self, book: Book) -> int:
        book_model = BookModel.from_book(book)
        db.session.add(book_model)
        db.session.commit()
        return book_model.id
    
    def update(self, book: Book) -> None:
        book_model = BookModel.query.get(book.id)
        if book_model:
            book_model.title = book.title
            book_model.author = book.author
            book_model.genre = book.genre
            book_model.deposit_cost = book.deposit_cost
            book_model.base_rental_cost = book.base_rental_cost
            book_model.total_copies = book.total_copies
            book_model.available_copies = book.available_copies
            book_model.value = book.value
            db.session.commit()
    
    def delete(self, id: int) -> None:
        book_model = BookModel.query.get(id)
        if book_model:
            db.session.delete(book_model)
            db.session.commit()
    
    def get_available_books(self) -> List[Book]:
        book_models = BookModel.query.filter(BookModel.available_copies > 0).all()
        return [book_model.to_book() for book_model in book_models]


class ReaderRepository(Repository):
    """Repository for readers using PostgreSQL"""
    
    def get_all(self) -> List[Reader]:
        reader_models = ReaderModel.query.all()
        return [reader_model.to_reader() for reader_model in reader_models]
    
    def get_by_id(self, id: int) -> Optional[Reader]:
        reader_model = ReaderModel.query.get(id)
        return reader_model.to_reader() if reader_model else None
    
    def add(self, reader: Reader) -> int:
        reader_model = ReaderModel.from_reader(reader)
        db.session.add(reader_model)
        db.session.commit()
        return reader_model.id
    
    def update(self, reader: Reader) -> None:
        reader_model = ReaderModel.query.get(reader.id)
        if reader_model:
            reader_model.full_name = reader.full_name
            reader_model.address = reader.address
            reader_model.telephone = reader.telephone
            reader_model.category = reader.category
            db.session.commit()
    
    def delete(self, id: int) -> None:
        reader_model = ReaderModel.query.get(id)
        if reader_model:
            db.session.delete(reader_model)
            db.session.commit()


class RentalRepository(Repository):
    """Repository for rentals using PostgreSQL"""
    
    def get_all(self) -> List[Rental]:
        rental_models = RentalModel.query.all()
        return [rental_model.to_rental() for rental_model in rental_models]
    
    def get_by_id(self, id: int) -> Optional[Rental]:
        rental_model = RentalModel.query.get(id)
        return rental_model.to_rental() if rental_model else None
    
    def add(self, rental: Rental) -> int:
        rental_model = RentalModel.from_rental(rental)
        db.session.add(rental_model)
        db.session.commit()
        return rental_model.id
    
    def update(self, rental: Rental) -> None:
        rental_model = RentalModel.query.get(rental.id)
        if rental_model:
            rental_model.book_id = rental.book_id
            rental_model.reader_id = rental.reader_id
            rental_model.issue_date = rental.issue_date
            rental_model.expected_return_date = rental.expected_return_date
            rental_model.actual_return_date = rental.actual_return_date
            rental_model.status = rental.status
            rental_model.deposit_paid = rental.deposit_paid
            rental_model.rental_cost = rental.rental_cost
            rental_model.fine_amount = rental.fine_amount
            rental_model.damage_fine = rental.damage_fine
            db.session.commit()
    
    def delete(self, id: int) -> None:
        rental_model = RentalModel.query.get(id)
        if rental_model:
            db.session.delete(rental_model)
            db.session.commit()
    
    def get_active_rentals(self) -> List[Rental]:
        rental_models = RentalModel.query.filter(RentalModel.status == RentalStatus.ACTIVE).all()
        return [rental_model.to_rental() for rental_model in rental_models]
    
    def get_overdue_rentals(self) -> List[Rental]:
        today = date.today()
        rental_models = RentalModel.query.filter(
            RentalModel.status == RentalStatus.ACTIVE,
            RentalModel.expected_return_date < today
        ).all()
        rentals = [rental_model.to_rental() for rental_model in rental_models]
        return [r for r in rentals if r.is_overdue()]
    
    def get_reader_rentals(self, reader_id: int) -> List[Rental]:
        rental_models = RentalModel.query.filter(RentalModel.reader_id == reader_id).all()
        return [rental_model.to_rental() for rental_model in rental_models]


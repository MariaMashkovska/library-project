from sqlalchemy import Column, Integer, String, Float, Date, Enum as SQLEnum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import date
from database.db import db
from models.book import Genre
from models.reader import ReaderCategory
from models.rental import RentalStatus
import enum


class BookModel(db.Model):
    __tablename__ = 'books'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    genre = Column(SQLEnum(Genre, name='genre_enum'), nullable=False)
    deposit_cost = Column(Float, nullable=False)
    base_rental_cost = Column(Float, nullable=False)
    total_copies = Column(Integer, nullable=False)
    available_copies = Column(Integer, nullable=False)
    value = Column(Float, nullable=False)
    
    rentals = relationship('RentalModel', back_populates='book')
    
    def to_book(self):
        """Convert database model to domain model"""
        from models.book import Book
        book = Book(
            id=self.id,
            title=self.title,
            author=self.author,
            genre=self.genre,
            deposit_cost=self.deposit_cost,
            base_rental_cost=self.base_rental_cost,
            total_copies=self.total_copies,
            available_copies=self.available_copies,
            value=self.value
        )
        return book
    
    @staticmethod
    def from_book(book):
        """Convert domain model to database model"""
        # Only set ID if it's not None (for updates), let DB auto-generate for new records
        model = BookModel(
            title=book.title,
            author=book.author,
            genre=book.genre,
            deposit_cost=book.deposit_cost,
            base_rental_cost=book.base_rental_cost,
            total_copies=book.total_copies,
            available_copies=book.available_copies,
            value=book.value
        )
        if book.id is not None:
            model.id = book.id
        return model


class ReaderModel(db.Model):
    __tablename__ = 'readers'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=False)
    telephone = Column(String(50), nullable=False)
    category = Column(SQLEnum(ReaderCategory, name='reader_category_enum'), nullable=False)
    
    rentals = relationship('RentalModel', back_populates='reader')
    
    def to_reader(self):
        """Convert database model to domain model"""
        from models.reader import Reader
        reader = Reader(
            id=self.id,
            full_name=self.full_name,
            address=self.address,
            telephone=self.telephone,
            category=self.category
        )
        return reader
    
    @staticmethod
    def from_reader(reader):
        """Convert domain model to database model"""
        # Only set ID if it's not None (for updates), let DB auto-generate for new records
        model = ReaderModel(
            full_name=reader.full_name,
            address=reader.address,
            telephone=reader.telephone,
            category=reader.category
        )
        if reader.id is not None:
            model.id = reader.id
        return model


class RentalModel(db.Model):
    __tablename__ = 'rentals'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    book_id = Column(Integer, ForeignKey('books.id'), nullable=False)
    reader_id = Column(Integer, ForeignKey('readers.id'), nullable=False)
    issue_date = Column(Date, nullable=False)
    expected_return_date = Column(Date, nullable=False)
    actual_return_date = Column(Date, nullable=True)
    status = Column(SQLEnum(RentalStatus, name='rental_status_enum'), nullable=False)
    deposit_paid = Column(Float, nullable=False)
    rental_cost = Column(Float, nullable=False)
    fine_amount = Column(Float, default=0.0)
    damage_fine = Column(Float, default=0.0)
    
    book = relationship('BookModel', back_populates='rentals')
    reader = relationship('ReaderModel', back_populates='rentals')
    
    def to_rental(self):
        """Convert database model to domain model"""
        from models.rental import Rental
        rental = Rental(
            id=self.id,
            book_id=self.book_id,
            reader_id=self.reader_id,
            issue_date=self.issue_date,
            expected_return_date=self.expected_return_date,
            actual_return_date=self.actual_return_date,
            status=self.status,
            deposit_paid=self.deposit_paid,
            rental_cost=self.rental_cost,
            fine_amount=self.fine_amount,
            damage_fine=self.damage_fine
        )
        return rental
    
    @staticmethod
    def from_rental(rental):
        """Convert domain model to database model"""
        # Only set ID if it's not None (for updates), let DB auto-generate for new records
        model = RentalModel(
            book_id=rental.book_id,
            reader_id=rental.reader_id,
            issue_date=rental.issue_date,
            expected_return_date=rental.expected_return_date,
            actual_return_date=rental.actual_return_date,
            status=rental.status,
            deposit_paid=rental.deposit_paid,
            rental_cost=rental.rental_cost,
            fine_amount=rental.fine_amount,
            damage_fine=rental.damage_fine
        )
        if rental.id is not None:
            model.id = rental.id
        return model


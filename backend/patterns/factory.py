from abc import ABC, abstractmethod
from typing import Optional
from models.book import Book, Genre
from models.reader import Reader, ReaderCategory


class BookFactory(ABC):
    """Abstract factory for creating books"""
    
    @abstractmethod
    def create_book(self, title: str, author: str, genre: Genre, 
                   value: float, copies: int) -> Book:
        pass


class StandardBookFactory(BookFactory):
    """Factory for creating standard books with default pricing"""
    
    def create_book(self, title: str, author: str, genre: Genre,
                   value: float, copies: int) -> Book:
        # Deposit is 50% of book value, base rental is 5% of value per day
        deposit_cost = value * 0.5
        base_rental_cost = value * 0.05
        
        return Book(
            id=None,
            title=title,
            author=author,
            genre=genre,
            deposit_cost=deposit_cost,
            base_rental_cost=base_rental_cost,
            total_copies=copies,
            available_copies=copies,
            value=value
        )


class PremiumBookFactory(BookFactory):
    """Factory for creating premium books with higher pricing"""
    
    def create_book(self, title: str, author: str, genre: Genre,
                   value: float, copies: int) -> Book:
        # Premium books: 70% deposit, 8% rental per day
        deposit_cost = value * 0.7
        base_rental_cost = value * 0.08
        
        return Book(
            id=None,
            title=title,
            author=author,
            genre=genre,
            deposit_cost=deposit_cost,
            base_rental_cost=base_rental_cost,
            total_copies=copies,
            available_copies=copies,
            value=value
        )


class ReaderFactory:
    """Factory for creating readers"""
    
    @staticmethod
    def create_reader(full_name: str, address: str, telephone: str,
                     category: ReaderCategory) -> Reader:
        return Reader(
            id=None,
            full_name=full_name,
            address=address,
            telephone=telephone,
            category=category
        )


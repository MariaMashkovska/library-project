from dataclasses import dataclass
from datetime import datetime
from typing import Optional
from enum import Enum


class Genre(Enum):
    FICTION = "Fiction"
    NON_FICTION = "Non-Fiction"
    SCIENCE = "Science"
    HISTORY = "History"
    BIOGRAPHY = "Biography"
    MYSTERY = "Mystery"
    ROMANCE = "Romance"
    FANTASY = "Fantasy"


@dataclass
class Book:
    id: Optional[int]
    title: str
    author: str
    genre: Genre
    deposit_cost: float
    base_rental_cost: float
    total_copies: int
    available_copies: int
    value: float  # Book value for calculating costs
    
    def __post_init__(self):
        # ID will be set by the database when saving
        if self.available_copies > self.total_copies:
            raise ValueError("Available copies cannot exceed total copies")
    
    def is_available(self) -> bool:
        return self.available_copies > 0
    
    def rent_copy(self) -> bool:
        if self.is_available():
            self.available_copies -= 1
            return True
        return False
    
    def return_copy(self) -> None:
        if self.available_copies < self.total_copies:
            self.available_copies += 1


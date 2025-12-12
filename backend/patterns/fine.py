from abc import ABC, abstractmethod
from models.rental import RentalStatus


class FineCalculator(ABC):
    """Strategy pattern for calculating fines"""
    
    @abstractmethod
    def calculate_overdue_fine(self, days_overdue: int, rental_cost: float) -> float:
        pass
    
    @abstractmethod
    def calculate_damage_fine(self, book_value: float, damage_level: str) -> float:
        pass


class StandardFineCalculator(FineCalculator):
    """Standard fine calculation"""
    
    def calculate_overdue_fine(self, days_overdue: int, rental_cost: float) -> float:
        # $2 per day overdue, capped at 50% of book value
        return min(days_overdue * 2.0, rental_cost * 5)
    
    def calculate_damage_fine(self, book_value: float, damage_level: str) -> float:
        damage_rates = {
            "minor": 0.1,   # 10% of book value
            "moderate": 0.4,  # 40% of book value
            "severe": 0.7,    # 70% of book value
            "destroyed": 1.0  # 100% of book value
        }
        rate = damage_rates.get(damage_level.lower(), 0.0)
        return book_value * rate


class FineContext:
    """Context for fine calculation"""
    
    def __init__(self, calculator: FineCalculator):
        self._calculator = calculator
    
    def set_calculator(self, calculator: FineCalculator) -> None:
        self._calculator = calculator
    
    def get_overdue_fine(self, days_overdue: int, rental_cost: float) -> float:
        return self._calculator.calculate_overdue_fine(days_overdue, rental_cost)
    
    def get_damage_fine(self, book_value: float, damage_level: str) -> float:
        return self._calculator.calculate_damage_fine(book_value, damage_level)


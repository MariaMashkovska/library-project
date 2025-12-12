from abc import ABC, abstractmethod
from datetime import date, timedelta
from typing import Protocol


class RentalPricingStrategy(ABC):
    """Strategy pattern for calculating rental costs based on rental period"""
    
    @abstractmethod
    def calculate_rental_cost(self, base_cost: float, days: int) -> float:
        pass


class DailyPricingStrategy(RentalPricingStrategy):
    """Daily pricing: cost per day"""
    
    def calculate_rental_cost(self, base_cost: float, days: int) -> float:
        return base_cost * days


class WeeklyPricingStrategy(RentalPricingStrategy):
    """Weekly pricing: cost per week with daily rate"""
    
    def calculate_rental_cost(self, base_cost: float, days: int) -> float:
        weeks = (days + 6) // 7  # Round up to nearest week
        return base_cost * weeks


class TieredPricingStrategy(RentalPricingStrategy):
    """Tiered pricing: different rates for different periods"""
    
    def calculate_rental_cost(self, base_cost: float, days: int) -> float:
        if days <= 7:
            return base_cost * days
        elif days <= 14:
            return base_cost * 7 + (base_cost * 0.8) * (days - 7)
        else:
            return base_cost * 7 + (base_cost * 0.8) * 7 + (base_cost * 0.6) * (days - 14)


class PricingContext:
    """Context class for strategy pattern"""
    
    def __init__(self, strategy: RentalPricingStrategy):
        self._strategy = strategy
    
    def set_strategy(self, strategy: RentalPricingStrategy) -> None:
        self._strategy = strategy
    
    def calculate_cost(self, base_cost: float, issue_date: date, return_date: date) -> float:
        days = (return_date - issue_date).days
        if days <= 0:
            days = 1
        return self._strategy.calculate_rental_cost(base_cost, days)


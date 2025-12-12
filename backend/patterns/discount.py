from abc import ABC, abstractmethod
from models.reader import ReaderCategory


class DiscountStrategy(ABC):
    """Strategy pattern for applying discounts based on reader category"""
    
    @abstractmethod
    def calculate_discount(self, amount: float, category: ReaderCategory) -> float:
        pass


class NoDiscountStrategy(DiscountStrategy):
    """No discount applied"""
    
    def calculate_discount(self, amount: float, category: ReaderCategory) -> float:
        return 0.0


class CategoryDiscountStrategy(DiscountStrategy):
    """Discount based on reader category"""
    
    DISCOUNT_RATES = {
        ReaderCategory.REGULAR: 0.0,
        ReaderCategory.STUDENT: 0.15,  # 15% discount
        ReaderCategory.SENIOR: 0.20,   # 20% discount
        ReaderCategory.VIP: 0.25       # 25% discount
    }
    
    def calculate_discount(self, amount: float, category: ReaderCategory) -> float:
        rate = self.DISCOUNT_RATES.get(category, 0.0)
        return amount * rate


class DiscountContext:
    """Context for discount strategy"""
    
    def __init__(self, strategy: DiscountStrategy):
        self._strategy = strategy
    
    def set_strategy(self, strategy: DiscountStrategy) -> None:
        self._strategy = strategy
    
    def apply_discount(self, amount: float, category: ReaderCategory) -> float:
        discount = self._strategy.calculate_discount(amount, category)
        return max(0.0, amount - discount)


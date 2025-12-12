from dataclasses import dataclass
from datetime import datetime, date
from typing import Optional
from enum import Enum


class RentalStatus(Enum):
    ACTIVE = "Active"
    RETURNED = "Returned"
    OVERDUE = "Overdue"
    DAMAGED = "Damaged"


@dataclass
class Rental:
    id: Optional[int]
    book_id: int
    reader_id: int
    issue_date: date
    expected_return_date: date
    actual_return_date: Optional[date]
    status: RentalStatus
    deposit_paid: float
    rental_cost: float
    fine_amount: float = 0.0
    damage_fine: float = 0.0
    
    def __post_init__(self):
        # ID will be set by the database when saving
        pass
    
    def is_overdue(self) -> bool:
        if self.status == RentalStatus.RETURNED:
            return False
        return date.today() > self.expected_return_date
    
    def update_status(self) -> None:
        if self.status == RentalStatus.ACTIVE:
            if self.is_overdue():
                self.status = RentalStatus.OVERDUE


from dataclasses import dataclass
from typing import Optional
from enum import Enum


class ReaderCategory(Enum):
    REGULAR = "Regular"
    STUDENT = "Student"
    SENIOR = "Senior"
    VIP = "VIP"


@dataclass
class Reader:
    id: Optional[int]
    full_name: str
    address: str
    telephone: str
    category: ReaderCategory
    
    def __post_init__(self):
        # ID will be set by the database when saving
        pass


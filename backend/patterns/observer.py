from abc import ABC, abstractmethod
from typing import List
from models.rental import Rental


class Observer(ABC):
    """Observer pattern for notifications"""
    
    @abstractmethod
    def update(self, rental: Rental, event: str) -> None:
        pass


class OverdueNotifier(Observer):
    """Notifies about overdue rentals"""
    
    def update(self, rental: Rental, event: str) -> None:
        if event == "overdue":
            print(f"ALERT: Rental {rental.id} is overdue! Reader {rental.reader_id}")


class Subject:
    """Subject in observer pattern"""
    
    def __init__(self):
        self._observers: List[Observer] = []
    
    def attach(self, observer: Observer) -> None:
        if observer not in self._observers:
            self._observers.append(observer)
    
    def detach(self, observer: Observer) -> None:
        self._observers.remove(observer)
    
    def notify(self, rental: Rental, event: str) -> None:
        for observer in self._observers:
            observer.update(rental, event)


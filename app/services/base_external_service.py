from abc import ABC, abstractmethod

class ExternalService(ABC):
    @abstractmethod
    async def get_tests(self):
        """Retrieve test/experiment data from external service"""
        pass 
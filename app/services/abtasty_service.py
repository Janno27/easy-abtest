import httpx
from app.services.base_external_service import ExternalService

class ABTastyService(ExternalService):
    def __init__(self, api_key: str):
        self.base_url = "https://api.abtasty.com"
        self.headers = {"X-API-KEY": api_key}
    
    async def get_tests(self):
        """Retrieve test/experiment data from AB Tasty API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.base_url}/v2/experiments", headers=self.headers)
            response.raise_for_status()
            return response.json() 
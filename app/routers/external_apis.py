from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any, List

from app.services.abtasty_service import ABTastyService
from app.core.auth import get_current_user_api_keys

router = APIRouter(prefix="/api/external", tags=["External APIs"])

@router.get("/abtasty/tests", response_model=List[Dict[str, Any]])
async def get_ab_tasty_tests(api_keys: Dict[str, str] = Depends(get_current_user_api_keys)):
    """
    Retrieve all tests from AB Tasty account
    """
    if "abtasty" not in api_keys or not api_keys["abtasty"]:
        raise HTTPException(status_code=401, detail="AB Tasty API key not configured")
    
    try:
        abtasty_service = ABTastyService(api_key=api_keys["abtasty"])
        return await abtasty_service.get_tests()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching AB Tasty tests: {str(e)}") 
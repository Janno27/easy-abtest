from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class HypothesisRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    message_history: Optional[List[dict]] = None
    model: str = "deepseek"  # Par défaut, on utilise deepseek

class TitleRequest(BaseModel):
    message: str
    model: str = "deepseek"

class HypothesisResponse(BaseModel):
    message: str
    conversation_id: str
    timestamp: float
    structured_data: Optional[Dict[str, Any]] = None
    lang_confidence: Optional[float] = None

class TitleResponse(BaseModel):
    title: str

class ThinkingStep(BaseModel):
    step: str
    status: str  # 'processing'|'completed'|'error'
    details: Optional[str] = None
    reasoning_content: Optional[str] = None 
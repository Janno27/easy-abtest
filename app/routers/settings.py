from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from pydantic import BaseModel
import json
import os
from pathlib import Path

router = APIRouter(prefix="/api/settings", tags=["Settings"])

class ApiKeyUpdate(BaseModel):
    provider: str
    key: str

def get_config_dir():
    """Return the path to the config directory, creating it if it doesn't exist"""
    config_dir = Path(os.environ.get("CONFIG_DIR", "./config"))
    config_dir.mkdir(exist_ok=True, parents=True)
    return config_dir

@router.post("/tools")
async def update_tool_api_key(update: ApiKeyUpdate):
    """Update an external tool's API key"""
    try:
        config_dir = get_config_dir()
        api_keys_file = config_dir / "user_api_keys.json"
        
        # Charger les clés existantes ou créer un dictionnaire vide
        if api_keys_file.exists():
            with open(api_keys_file) as f:
                api_keys = json.load(f)
        else:
            api_keys = {}
        
        # Mettre à jour la clé API
        api_keys[update.provider] = update.key
        
        # Enregistrer les modifications
        with open(api_keys_file, 'w') as f:
            json.dump(api_keys, f)
        
        return {"status": "success", "message": f"API key for {update.provider} updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update API key: {str(e)}")

@router.post("/models")
async def update_model_api_key(update: ApiKeyUpdate):
    """Update a model's API key"""
    try:
        config_dir = get_config_dir()
        model_keys_file = config_dir / "model_api_keys.json"
        
        # Charger les clés existantes ou créer un dictionnaire vide
        if model_keys_file.exists():
            with open(model_keys_file) as f:
                model_keys = json.load(f)
        else:
            model_keys = {}
        
        # Mettre à jour la clé API
        model_keys[update.provider] = update.key
        
        # Enregistrer les modifications
        with open(model_keys_file, 'w') as f:
            json.dump(model_keys, f)
        
        # Mettre à jour les variables d'environnement pour les services qui en dépendent
        if update.provider == "huggingface":
            os.environ["HF_API_KEY"] = update.key
        elif update.provider == "deepseek":
            os.environ["DEEPSEEK_API_KEY"] = update.key
        
        return {"status": "success", "message": f"API key for {update.provider} updated successfully"}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update API key: {str(e)}")

@router.get("/models")
async def get_model_settings():
    """Get model settings and available models"""
    from app.core.config import get_settings
    settings = get_settings()
    
    # Éviter de retourner les clés API complètes
    return {
        "models": {
            "llama": {
                "name": "Llama 3",
                "model_id": settings.hf_llama_model,
                "api_configured": bool(settings.hf_api_key) 
            },
            "deepseek": {
                "name": "Deepseek Chat",
                "api_url": settings.deepseek_api_url,
                "api_configured": bool(settings.deepseek_api_key)
            },
            "deepseek-reasoner": {
                "name": "Deepseek Reasoner",
                "model_id": settings.deepseek_reasoner_model,
                "api_configured": bool(settings.deepseek_api_key)
            }
        }
    } 
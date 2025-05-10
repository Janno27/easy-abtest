from fastapi import Depends, HTTPException
from typing import Dict, Optional
from pydantic import BaseModel
import json
import os
from pathlib import Path

# Modèle pour stocker les API keys
class UserAPIKeys(BaseModel):
    abtasty: Optional[str] = None
    # Ajoutez d'autres clés API au besoin

# Fonction pour lire les clés API depuis un fichier
async def get_current_user_api_keys() -> Dict[str, str]:
    """
    Récupère les clés API de l'utilisateur depuis la configuration
    """
    try:
        # Dans une application réelle, cela viendrait d'une base de données ou 
        # d'un autre mécanisme d'authentification sécurisé
        config_dir = Path(os.environ.get("CONFIG_DIR", "./config"))
        config_file = config_dir / "user_api_keys.json"
        
        if not config_file.exists():
            return {"abtasty": None}
        
        with open(config_file) as f:
            return json.load(f)
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Erreur lors de la récupération des clés API: {str(e)}"
        ) 
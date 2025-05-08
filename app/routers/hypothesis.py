from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import os
import time
from app.core.config import Settings, get_settings
from app.services.rate_limiter import RateLimiter
from app.core.prompts import (
    TITLE_GENERATION_PROMPT, 
    get_prompt_by_message_position,
    get_language_instruction
)
from app.core.language import detect_language, get_language_name

router = APIRouter(
    prefix="/hypothesis",
    tags=["hypothesis"],
    responses={404: {"description": "Not found"}},
)

rate_limiter = RateLimiter(max_requests=10, time_window=60)  # 10 requests per minute

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

@router.get("/check-config")
async def check_config(settings: Settings = Depends(get_settings)):
    """
    Endpoint pour vérifier la configuration de l'API Hugging Face
    """
    return {
        "status": "ok",
        "models": {
            "llama": settings.hf_llama_model,
            "deepseek": "API Deepseek",
            "deepseek-reasoner": "API Deepseek Reasoner"
        },
        "api_configured": bool(settings.hf_api_key) and bool(settings.deepseek_api_key),
        "hf_api_key_starts_with": settings.hf_api_key[:5] + "..." if settings.hf_api_key else None,
        "deepseek_api_key_starts_with": settings.deepseek_api_key[:5] + "..." if settings.deepseek_api_key else None
    }

@router.post("/generate", response_model=HypothesisResponse)
async def generate_hypothesis(
    request: HypothesisRequest,
    req: Request,
    settings: Settings = Depends(get_settings)
):
    # Apply rate limiting
    client_ip = req.client.host
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    
    # Create a conversation ID if one doesn't exist
    conversation_id = request.conversation_id or f"conv_{int(time.time() * 1000)}"
    
    # Sélection du modèle
    model = request.model.lower()
    if model not in ["llama", "deepseek", "deepseek-reasoner"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model: {model}. Supported models: llama, deepseek, deepseek-reasoner."
        )
    
    # Vérification des clés API
    if model == "llama" and (not settings.hf_api_key or not settings.hf_api_key.strip()):
        raise HTTPException(
            status_code=500, 
            detail="HF_API_KEY not configured. Please set this environment variable."
        )
    
    if model in ["deepseek", "deepseek-reasoner"] and (not settings.deepseek_api_key or not settings.deepseek_api_key.strip()):
        raise HTTPException(
            status_code=500, 
            detail="DEEPSEEK_API_KEY not configured. Please set this environment variable."
        )
    
    try:
        # Déterminer si c'est le premier message de l'utilisateur
        is_first_message = not request.message_history or len(request.message_history) <= 1
        
        # Utiliser notre fonction de gestion de prompts selon la position du message
        system_prompt = get_prompt_by_message_position(is_first_message)
        
        # Détecter la langue de l'utilisateur avec notre module de détection
        user_message = request.message
        detected_language = detect_language(user_message)
        
        print(f"Detected language: {detected_language}")
        
        # Ajouter une instruction explicite pour la langue détectée
        language_instruction = get_language_instruction(detected_language)
        
        # Prepare the history for the API
        messages = []
        messages.append({"role": "system", "content": system_prompt})
        
        # Ajouter l'instruction de langue comme premier message
        messages.append({"role": "system", "content": language_instruction})
        
        if request.message_history:
            for msg in request.message_history:
                role = msg.get("role", "")
                content = msg.get("content", "")
                if role in ["user", "assistant"]:
                    messages.append({"role": role, "content": content})
        
        # Add the current message
        messages.append({"role": "user", "content": request.message})
        
        # API Call depending on model
        if model == "llama":
            return await call_huggingface_api(
                messages,
                settings.hf_api_key,
                settings.hf_llama_model,
                conversation_id,
                detected_language
            )
        elif model == "deepseek-reasoner":
            return await call_deepseek_api(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                conversation_id,
                "deepseek-reasoner",
                detected_language
            )
        else:  # deepseek standard
            return await call_deepseek_api(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                conversation_id,
                "deepseek-chat",
                detected_language
            )
            
    except Exception as e:
        error_message = f"Error generating hypothesis: {str(e)}"
        print(f"Exception in generate_hypothesis: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)

@router.post("/generate-title", response_model=TitleResponse)
async def generate_title(
    request: TitleRequest,
    req: Request,
    settings: Settings = Depends(get_settings)
):
    # Apply rate limiting
    client_ip = req.client.host
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    
    # Sélection du modèle
    model = request.model.lower()
    if model not in ["llama", "deepseek", "deepseek-reasoner"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid model: {model}. Supported models: llama, deepseek, deepseek-reasoner."
        )
    
    try:
        # Debug info
        print(f"Generating title with model: {model}")
        print(f"Message: {request.message[:50]}...")
        
        # Utiliser le prompt pour la génération de titre
        system_prompt = TITLE_GENERATION_PROMPT
        
        # Détecter la langue pour personnaliser la réponse
        detected_language = detect_language(request.message)
        
        # Préparer la requête pour l'API
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request.message}
        ]
        
        # API Call depending on model
        if model == "llama":
            response = await call_title_api(messages, settings.hf_api_key, settings.hf_llama_model, "llama")
        elif model == "deepseek-reasoner":
            # Pour éviter les erreurs avec Deepseek Reasoner, utiliser toujours le modèle standard pour les titres
            print("Notice: Using standard Deepseek model for title generation instead of Deepseek Reasoner")
            response = await call_title_api(messages, settings.deepseek_api_key, settings.deepseek_api_url, "deepseek")
        else:  # deepseek standard
            response = await call_title_api(messages, settings.deepseek_api_key, settings.deepseek_api_url, "deepseek")
        
        print(f"Generated title: {response}")
            
        return TitleResponse(title=response)
            
    except Exception as e:
        error_message = f"Error generating title: {str(e)}"
        print(f"Exception in generate_title: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)

async def call_huggingface_api(messages, api_key, model_name, conversation_id, detected_language="en"):
    """
    Appel à l'API Hugging Face pour le modèle Llama
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Debug logging
        print(f"Using HF model: {model_name}")
        print(f"Using API URL: {api_url}")
        
        # Essayer le format structuré d'abord
        try:
            payload = {
                "inputs": messages,
                "parameters": {
                    "max_new_tokens": 1024,
                    "temperature": 0.7,
                    "top_p": 0.9
                }
            }
            
            response = await client.post(
                api_url,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 422:  # Format non accepté
                raise ValueError("Format payload non accepté")
                
        except (ValueError, httpx.HTTPStatusError):
            # Essayer avec juste le message comme input
            print("Trying alternative payload format...")
            last_message = messages[-1]["content"] if messages and messages[-1]["role"] == "user" else ""
            
            payload = {
                "inputs": last_message,
                "parameters": {
                    "max_new_tokens": 1024,
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "return_full_text": False
                }
            }
            
            response = await client.post(
                api_url,
                json=payload,
                headers=headers
            )
        
        if response.status_code != 200:
            error_detail = f"Hugging Face API error ({response.status_code}): {response.text}"
            print(f"API Error: {error_detail}")
            raise HTTPException(status_code=response.status_code, detail=error_detail)
        
        data = response.json()
        print(f"Response data type: {type(data)}")
        
        # Extract generated text depending on HF return format
        assistant_message = None
        
        # Handle different response formats
        if isinstance(data, list) and len(data) > 0:
            # Format: [{"generated_text": "..."}]
            assistant_message = data[0].get("generated_text", "")
        elif isinstance(data, dict):
            if "generated_text" in data:
                # Format: {"generated_text": "..."}
                assistant_message = data["generated_text"]
            elif "choices" in data and data["choices"]:
                # Format: {"choices": [{"message": {"content": "..."}}]}
                assistant_message = data["choices"][0]["message"]["content"]
        
        if not assistant_message:
            print(f"Unexpected response format: {data}")
            raise HTTPException(status_code=500, detail="Invalid response format from Hugging Face API")
        
        # Extraire les éventuelles données structurées (tables, etc.)
        structured_data = extract_structured_data(assistant_message)
        
        # Return the result
        return HypothesisResponse(
            message=assistant_message,
            conversation_id=conversation_id,
            timestamp=time.time(),
            structured_data=structured_data,
            lang_confidence=0.95 if detected_language in ['en', 'fr', 'es', 'de'] else 0.8
        )


async def call_deepseek_api(messages, api_key, api_url, conversation_id, model_type="deepseek-chat", detected_language="en"):
    """
    Appel à l'API Deepseek directement
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # Sélection du modèle Deepseek basée sur le type
        model_name = "deepseek-chat"
        if model_type == "deepseek-reasoner":
            model_name = "deepseek-reasoner"
        
        # Debug logging
        print(f"Using Deepseek model: {model_name}")
        print(f"Using Deepseek API URL: {api_url}")
        
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": 1024
        }
        
        response = await client.post(
            api_url,
            json=payload,
            headers=headers
        )
        
        if response.status_code != 200:
            error_detail = f"Deepseek API error ({response.status_code}): {response.text}"
            print(f"API Error: {error_detail}")
            raise HTTPException(status_code=response.status_code, detail=error_detail)
        
        data = response.json()
        print(f"Deepseek Response: {data}")
        
        # Format typique de réponse Deepseek: {"id": "...", "choices": [{"message": {"role": "assistant", "content": "..."}}]}
        if "choices" in data and len(data["choices"]) > 0 and "message" in data["choices"][0]:
            assistant_message = data["choices"][0]["message"]["content"]
        else:
            print(f"Unexpected Deepseek response format: {data}")
            raise HTTPException(status_code=500, detail="Invalid response format from Deepseek API")
        
        # Extraire les données structurées
        structured_data = extract_structured_data(assistant_message)
        
        # Return the result
        return HypothesisResponse(
            message=assistant_message,
            conversation_id=conversation_id,
            timestamp=time.time(),
            structured_data=structured_data,
            lang_confidence=0.95 if detected_language in ['en', 'fr', 'es', 'de'] else 0.8
        )

async def call_title_api(messages, api_key, api_url, model_type):
    """
    Appel API simplifié pour générer un titre court
    """
    try:
        if model_type == "llama":
            # Hugging Face API
            async with httpx.AsyncClient(timeout=30.0) as client:
                api_url = f"https://api-inference.huggingface.co/models/{api_url}"
                
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                
                payload = {
                    "inputs": messages[-1]["content"],
                    "parameters": {
                        "max_new_tokens": 50,
                        "temperature": 0.5,
                        "top_p": 0.9,
                        "return_full_text": False
                    }
                }
                
                response = await client.post(
                    api_url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail=f"API error: {response.text}")
                
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get("generated_text", "").strip()
                else:
                    return "Nouvelle hypothèse"
        else:
            # Deepseek API
            async with httpx.AsyncClient(timeout=30.0) as client:
                headers = {
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                }
                
                # Fix: Utiliser toujours "deepseek-chat" pour les titres avec Deepseek
                # Le modèle Reasoner cause des erreurs avec les requêtes courtes
                model_name = "deepseek-chat"
                
                payload = {
                    "model": model_name,
                    "messages": messages,
                    "temperature": 0.5,
                    "top_p": 0.9,
                    "max_tokens": 50
                }
                
                print(f"Generating title with model: {model_name}")
                
                response = await client.post(
                    api_url,
                    json=payload,
                    headers=headers
                )
                
                if response.status_code != 200:
                    raise HTTPException(status_code=response.status_code, detail=f"API error: {response.text}")
                
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0 and "message" in data["choices"][0]:
                    return data["choices"][0]["message"]["content"].strip()
                else:
                    return "Nouvelle hypothèse"
    except Exception as e:
        print(f"Error in call_title_api: {str(e)}")
        return "Nouvelle hypothèse"

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Extrait les données structurées (tableaux, graphiques) du texte markdown.
    
    Args:
        text (str): Le texte markdown à analyser
        
    Returns:
        Dict[str, Any]: Dictionnaire avec les éléments structurés extraits
    """
    # Initialiser le conteneur de données structurées
    structured_data = {
        "tables": extract_markdown_tables(text),
        "buttons": [
            {"type": "button", "text": "Calculer taille d'échantillon", "action": "calculate_sample_size"}
        ]
    }
    
    return structured_data

def extract_markdown_tables(text: str) -> List[Dict[str, Any]]:
    """
    Extrait les tableaux markdown du texte.
    
    Args:
        text (str): Le texte markdown à analyser
        
    Returns:
        List[Dict[str, Any]]: Liste des tableaux extraits
    """
    import re
    
    tables = []
    
    # Recherche des tableaux markdown
    table_pattern = r'\|(.+?)\|[\r\n]+\|([-:| ]+)\|[\r\n]+((?:\|.+\|[\r\n]+)+)'
    
    matches = re.finditer(table_pattern, text, re.DOTALL)
    
    for i, match in enumerate(matches):
        try:
            # Extraire les en-têtes, séparateurs et lignes
            headers_raw = match.group(1).strip()
            separators = match.group(2).strip()
            rows_raw = match.group(3).strip()
            
            # Transformer les en-têtes en liste
            headers = [h.strip() for h in headers_raw.split('|') if h.strip()]
            
            # Extraire les alignements à partir des séparateurs
            alignments = []
            for sep in separators.split('|'):
                sep = sep.strip()
                if sep.startswith(':') and sep.endswith(':'):
                    alignments.append('center')
                elif sep.endswith(':'):
                    alignments.append('right')
                else:
                    alignments.append('left')
            
            # Transformer les lignes en liste de dictionnaires
            rows = []
            for row in rows_raw.split('\n'):
                if not row.strip() or '|' not in row:
                    continue
                    
                cols = [col.strip() for col in row.strip().split('|')[1:-1]]
                if cols and len(cols) == len(headers):
                    row_dict = {headers[j]: cols[j] for j in range(len(headers))}
                    rows.append(row_dict)
            
            # Ajouter le tableau formaté
            tables.append({
                "id": f"table_{i+1}",
                "headers": headers,
                "rows": rows,
                "alignments": alignments
            })
        except Exception as e:
            print(f"Error extracting table: {str(e)}")
            continue
    
    return tables 
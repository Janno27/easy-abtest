from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, StreamingResponse
from typing import Optional, List, Dict, Any
import time
import json
import asyncio

from app.core.config import Settings, get_settings
from app.services.rate_limiter import RateLimiter
from app.core.prompts import (
    TITLE_GENERATION_PROMPT, 
    get_prompt_by_message_position,
    get_language_instruction
)
from app.core.language import detect_language, get_language_name
from app.core.cache import generate_cache_key, get_cached_response, cache_response, get_cache_stats

from app.routers.hypothesis.models import (
    HypothesisRequest,
    TitleRequest,
    HypothesisResponse,
    TitleResponse,
    ThinkingStep
)
from app.routers.hypothesis.streaming import stream_deepseek_response
from app.routers.hypothesis.api_calls import (
    call_huggingface_api,
    call_deepseek_api, 
    call_title_api
)
from app.routers.hypothesis.data_extraction import extract_structured_data

router = APIRouter(
    prefix="/hypothesis",
    tags=["hypothesis"],
    responses={404: {"description": "Not found"}},
)

rate_limiter = RateLimiter(max_requests=10, time_window=60)  # 10 requests per minute

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
        
        # Génération de la clé de cache
        cache_key = generate_cache_key(messages, model)
        
        # Vérification du cache
        cached_response = get_cached_response(cache_key)
        if cached_response:
            print("Cache hit!")
            return cached_response
        
        # API Call depending on model (cache miss)
        if model == "llama":
            llm_response = await call_huggingface_api(
                messages,
                settings.hf_api_key,
                settings.hf_llama_model,
                conversation_id,
                detected_language
            )
        elif model == "deepseek-reasoner":
            llm_response = await call_deepseek_api(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                conversation_id,
                "deepseek-reasoner",
                detected_language
            )
        else:  # deepseek standard
            llm_response = await call_deepseek_api(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                conversation_id,
                "deepseek-chat",
                detected_language
            )
        
        # Mise en cache de la réponse
        cache_response(cache_key, llm_response)
        
        return llm_response
            
    except Exception as e:
        error_message = f"Error generating hypothesis: {str(e)}"
        print(f"Exception in generate_hypothesis: {error_message}")
        raise HTTPException(status_code=500, detail=error_message)

@router.get("/stream", response_class=StreamingResponse)
async def stream_hypothesis(
    message: str,
    conversation_id: Optional[str] = None,
    model: str = 'deepseek-reasoner',
    req: Request = None,
    settings: Settings = Depends(get_settings)
):
    """
    Endpoint qui stream le processus de génération d'hypothèse avec étapes de raisonnement en SSE
    """
    # Apply rate limiting
    client_ip = req.client.host if req else "unknown"
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again later.")
    
    # Create a conversation ID if one doesn't exist
    conversation_id = conversation_id or f"conv_{int(time.time() * 1000)}"
    
    # Preparation
    if model != "deepseek-reasoner":
        model = "deepseek-reasoner"  # Forcer l'utilisation de deepseek-reasoner pour le streaming
    
    # Pour le message SSE
    async def event_generator():
        try:
            # Préparer les messages
            is_first_message = True  # Nous n'avons pas l'historique en GET, on suppose que c'est le premier message
            system_prompt = get_prompt_by_message_position(is_first_message)
            detected_language = detect_language(message)
            language_instruction = get_language_instruction(detected_language)
            
            messages = []
            messages.append({"role": "system", "content": system_prompt})
            messages.append({"role": "system", "content": language_instruction})
            messages.append({"role": "user", "content": message})
            
            # Message de début du raisonnement avec la langue adaptée
            reasoning_label = "Analyse"
            if detected_language == "fr":
                reasoning_label = "Analyse"
            elif detected_language == "en":
                reasoning_label = "Analysis"
            elif detected_language == "es":
                reasoning_label = "Análisis"
            elif detected_language == "de":
                reasoning_label = "Analyse"
            
            # On démarre directement avec l'étape de raisonnement (sans l'initialisation)
            step = ThinkingStep(
                step="reasoning",
                status="processing",
                details=f"{reasoning_label} en cours..."
            )
            yield f"data: {json.dumps(step.dict())}\n\n"
            
            # Stream la réponse de DeepSeek
            async for chunk in stream_deepseek_response(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                model,
                detected_language
            ):
                yield f"data: {json.dumps(chunk.dict())}\n\n"
                # Réduire le délai pour accélérer le stream
                await asyncio.sleep(0.01)
            
            # Message final pour indiquer que c'est terminé
            completion_label = "Analyse terminée"
            if detected_language == "fr":
                completion_label = "Analyse terminée"
            elif detected_language == "en":
                completion_label = "Analysis completed"
            elif detected_language == "es":
                completion_label = "Análisis completado"
            elif detected_language == "de":
                completion_label = "Analyse abgeschlossen"
                
            step = ThinkingStep(
                step="reasoning",
                status="completed",
                details=completion_label
            )
            yield f"data: {json.dumps(step.dict())}\n\n"
            
            # Ajouter un message [DONE] pour indiquer la fin du stream
            yield f"data: [DONE]\n\n"
            
        except Exception as e:
            error_message = f"Error in streaming: {str(e)}"
            print(f"Stream error: {error_message}")
            
            # Adapter le message d'erreur à la langue
            error_prefix = "Erreur"
            if detected_language == "en":
                error_prefix = "Error"
            elif detected_language == "es":
                error_prefix = "Error"
            elif detected_language == "de":
                error_prefix = "Fehler"
                
            error_step = ThinkingStep(
                step="error",
                status="error", 
                details=f"{error_prefix}: {str(e)}"
            )
            
            yield f"data: {json.dumps(error_step.dict())}\n\n"
            
            # Ajouter un message [DONE] même en cas d'erreur
            yield f"data: [DONE]\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive", 
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "*"
        }
    )

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

@router.get("/cache-stats")
async def cache_statistics():
    """
    Retourne des statistiques sur l'utilisation du cache
    """
    return get_cache_stats() 
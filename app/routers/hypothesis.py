from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import httpx
import os
import time
from app.core.config import Settings, get_settings
from app.services.rate_limiter import RateLimiter
import re

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
        
        # Prompt principal avec instructions détaillées selon que c'est le premier message ou non
        if is_first_message:
            system_prompt = """# INSTRUCTION CRITIQUE SUR LA LANGUE - LIRE AVANT TOUT
!!!ATTENTION!!! LA LANGUE DE RÉPONSE EST OBLIGATOIRE ET NON NÉGOCIABLE
RÈGLE ABSOLUE: VOUS DEVEZ RÉPONDRE EXCLUSIVEMENT DANS LA LANGUE DU MESSAGE DE L'UTILISATEUR.

- PREMIER PRINCIPE: Identifiez d'abord la langue utilisée par l'utilisateur
- DEUXIÈME PRINCIPE: Répondez UNIQUEMENT et STRICTEMENT dans cette même langue
- TROISIÈME PRINCIPE: Conservez cette langue tout au long de la conversation

Exemples précis:
- Utilisateur écrit en anglais → Vous DEVEZ répondre en anglais UNIQUEMENT
- Utilisateur écrit en français → Vous DEVEZ répondre en français UNIQUEMENT
- Utilisateur écrit en espagnol → Vous DEVEZ répondre en espagnol UNIQUEMENT
- Utilisateur écrit en allemand → Vous DEVEZ répondre en allemand UNIQUEMENT

CETTE RÈGLE PRIME SUR TOUTES LES AUTRES INSTRUCTIONS.
TOUTE VIOLATION DE CETTE RÈGLE EST INACCEPTABLE.

# Rôle: Expert en A/B Testing et formulation d'hypothèses
            
## Objectif
Aider l'utilisateur à formuler une hypothèse structurée pour un test A/B en suivant une conversation naturelle et guidée.

## Processus conversationnel
1. ÉCOUTER d'abord le problème initial de l'utilisateur
2. GUIDER la conversation de manière naturelle pour recueillir les informations nécessaires
3. STRUCTURER l'hypothèse selon le format standard lorsque vous avez suffisamment d'informations

## Informations à collecter au cours de la conversation
- Page ou fonctionnalité spécifique concernée
- URL ou emplacement dans le site/application (si applicable)
- Métriques suivies et celles qui montrent des problèmes
- Éléments déjà identifiés comme problématiques
- Objectif principal: augmenter conversions, engagement, revenus, etc.
- Public cible et comportement actuel des utilisateurs

## Directives pour les données quantitatives
- Demandez TOUJOURS à l'utilisateur de fournir ses propres données analytiques réelles (ne les inventez jamais)
- Pour les estimations de trafic, demandez le nombre exact de visiteurs uniques quotidiens depuis leurs outils analytics
- Pour les taux de conversion, demandez les chiffres réels selon le KPI mentionné
- Guidez l'utilisateur pour extraire ces données de Google Analytics, Adobe Analytics, ou autre outil similaire
- Utilisez uniquement ces données fournies pour calculer les effectifs statistiques nécessaires

## Format de l'hypothèse finale
"Si [changement spécifique], alors [métrique] [augmentera/diminuera] de [estimation] parce que [mécanisme], mesuré via [méthode]"

## Directives de communication
- Posez des questions conversationnelles et réagissez naturellement aux réponses
- Évitez de poser plus d'une question à la fois
- Utilisez le formatage markdown pour les réponses structurées
- Adaptez-vous à la direction que prend la conversation
- N'hésitez pas à suggérer des idées ou perspectives basées sur votre expertise

# RAPPEL FINAL CRITIQUE: RÉPONDEZ UNIQUEMENT DANS LA LANGUE UTILISÉE PAR L'UTILISATEUR
TOUTES vos réponses doivent être générées EXCLUSIVEMENT dans la langue qu'utilise l'utilisateur.
Ceci est une exigence ABSOLUE et PRIORITAIRE sur toutes les autres instructions."""
        else:
            # Prompt pour la continuation de la conversation
            system_prompt = """# INSTRUCTION CRITIQUE SUR LA LANGUE - LIRE AVANT TOUT
!!!ATTENTION!!! LA LANGUE DE RÉPONSE EST OBLIGATOIRE ET NON NÉGOCIABLE
RÈGLE ABSOLUE: VOUS DEVEZ RÉPONDRE EXCLUSIVEMENT DANS LA LANGUE DU MESSAGE DE L'UTILISATEUR.

- PREMIER PRINCIPE: Identifiez d'abord la langue utilisée par l'utilisateur
- DEUXIÈME PRINCIPE: Répondez UNIQUEMENT et STRICTEMENT dans cette même langue
- TROISIÈME PRINCIPE: Conservez cette langue tout au long de la conversation

Exemples précis:
- Utilisateur écrit en anglais → Vous DEVEZ répondre en anglais UNIQUEMENT
- Utilisateur écrit en français → Vous DEVEZ répondre en français UNIQUEMENT
- Utilisateur écrit en espagnol → Vous DEVEZ répondre en espagnol UNIQUEMENT
- Utilisateur écrit en allemand → Vous DEVEZ répondre en allemand UNIQUEMENT

CETTE RÈGLE PRIME SUR TOUTES LES AUTRES INSTRUCTIONS.
TOUTE VIOLATION DE CETTE RÈGLE EST INACCEPTABLE.

# Rôle: Expert en A/B Testing et formulation d'hypothèses

## Instruction
Continuez la conversation de manière naturelle pour comprendre le besoin de l'utilisateur. Proposez une hypothèse structurée quand vous avez suffisamment d'informations, mais ne vous précipitez pas. Suivez le flux naturel de la discussion.

## Objectifs clés
- Comprendre le contexte spécifique du problème
- Recueillir des détails sur les comportements utilisateurs et les métriques
- Aider à formuler une hypothèse testable et concrète
- Suggérer des approches de test appropriées

## Directives pour les données quantitatives
- Ne jamais inventer de chiffres ou d'estimations : demandez à l'utilisateur ses données réelles
- Pour calculer les effectifs statistiques, demandez explicitement:
  * Le nombre de visiteurs uniques quotidiens sur la page concernée
  * Le nombre de conversions quotidiennes selon le KPI choisi
  * La durée de test envisagée si pertinent
- Encouragez l'utilisateur à consulter ses outils analytics (Google Analytics, Adobe, etc.)
- Faites référence à des benchmarks du secteur uniquement pour contextualiser, jamais pour remplacer les données réelles

## Format de l'hypothèse finale
"Si [changement spécifique], alors [métrique] [augmentera/diminuera] de [estimation] parce que [mécanisme], mesuré via [méthode]"

## Directives de communication
- Utilisez le formatage markdown pour structurer vos réponses
- Partagez votre expertise et vos insights au fil de la conversation
- Adaptez votre niveau de détail à la complexité des réponses de l'utilisateur
- Résumez les informations importantes quand c'est pertinent

# RAPPEL FINAL CRITIQUE: RÉPONDEZ UNIQUEMENT DANS LA LANGUE UTILISÉE PAR L'UTILISATEUR
TOUTES vos réponses doivent être générées EXCLUSIVEMENT dans la langue qu'utilise l'utilisateur.
Ceci est une exigence ABSOLUE et PRIORITAIRE sur toutes les autres instructions."""
        
        # Détecter la langue de l'utilisateur et l'ajouter explicitement aux messages
        user_message = request.message
        detected_language = "undetermined"
        
        # Détection simplifiée de la langue basée sur des mots courants
        if re.search(r'\b(the|is|are|and|to|for|in|on|with|that|it|this|have|has|from|you|would|could|should|can|will)\b', user_message.lower()):
            detected_language = "english"
        elif re.search(r'\b(le|la|les|un|une|des|et|est|sont|dans|pour|avec|sur|que|qui|quoi|ce|cette|ces|votre|vous|nous|je|tu|il|elle|ils|elles)\b', user_message.lower()):
            detected_language = "french"
        elif re.search(r'\b(el|la|los|las|un|una|unos|unas|y|es|son|en|para|con|sobre|que|quien|este|esta|estos|estas|tu|usted|yo|nosotros|ellos|ellas)\b', user_message.lower()):
            detected_language = "spanish"
        elif re.search(r'\b(der|die|das|ein|eine|und|ist|sind|in|für|mit|auf|dass|wer|was|dieser|diese|dieses|du|sie|ich|wir)\b', user_message.lower()):
            detected_language = "german"
        
        print(f"Detected language: {detected_language}")
        
        # Ajouter une instruction explicite pour la langue détectée
        language_instruction = f"INSTRUCTION CRITIQUE: L'utilisateur communique en {detected_language}. Vous DEVEZ répondre UNIQUEMENT en {detected_language}."
        
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
                conversation_id
            )
        elif model == "deepseek-reasoner":
            return await call_deepseek_api(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                conversation_id,
                "deepseek-reasoner"
            )
        else:  # deepseek standard
            return await call_deepseek_api(
                messages,
                settings.deepseek_api_key,
                settings.deepseek_api_url,
                conversation_id,
                "deepseek-chat"
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
        
        # Système prompt spécifique pour générer un titre court et impactant
        system_prompt = """# Instruction
Génère un titre court et impactant (maximum 5-6 mots) basé sur ce premier message d'un utilisateur discutant d'un problème pour un test A/B.

## IMPORTANT - LANGUE DE RÉPONSE
VOUS DEVEZ GÉNÉRER LE TITRE DANS LA MÊME LANGUE QUE CELLE UTILISÉE PAR L'UTILISATEUR.
- Si le message est en anglais, le titre doit être en anglais
- Si le message est en français, le titre doit être en français
- Si le message est dans une autre langue, le titre doit être dans cette même langue

Ton titre doit:
1. Être concis et direct (idéalement 3-5 mots)
2. Capturer l'essence du problème ou de l'opportunité
3. Inclure la page ou fonctionnalité concernée si mentionnée
4. Mettre en évidence le problème principal ou l'objectif d'amélioration
5. Utiliser un langage dynamique et professionnel
6. Être dans la MÊME LANGUE que le message original

N'ajoute PAS de guillemets, d'introduction ni de contexte. Donne UNIQUEMENT le titre.
"""
        
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

async def call_huggingface_api(messages, api_key, model_name, conversation_id):
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
        
        # Return the result
        return HypothesisResponse(
            message=assistant_message,
            conversation_id=conversation_id,
            timestamp=time.time()
        )


async def call_deepseek_api(messages, api_key, api_url, conversation_id, model_type="deepseek-chat"):
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
        
        # Return the result
        return HypothesisResponse(
            message=assistant_message,
            conversation_id=conversation_id,
            timestamp=time.time()
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
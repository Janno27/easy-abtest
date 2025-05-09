import httpx
import time
from fastapi import HTTPException
from app.routers.hypothesis.models import HypothesisResponse
from app.routers.hypothesis.data_extraction import extract_structured_data

# Paramètres standard utilisés dans toutes les API calls (importants pour le caching)
DEFAULT_TEMPERATURE = 0.7
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TOP_P = 0.9

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
                    "max_new_tokens": DEFAULT_MAX_TOKENS,
                    "temperature": DEFAULT_TEMPERATURE,
                    "top_p": DEFAULT_TOP_P
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
                    "max_new_tokens": DEFAULT_MAX_TOKENS,
                    "temperature": DEFAULT_TEMPERATURE,
                    "top_p": DEFAULT_TOP_P,
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
            "temperature": DEFAULT_TEMPERATURE,
            "top_p": DEFAULT_TOP_P,
            "max_tokens": DEFAULT_MAX_TOKENS
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
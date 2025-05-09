import httpx
import json
from typing import AsyncGenerator
from app.routers.hypothesis.models import ThinkingStep

async def stream_deepseek_response(
    messages, 
    api_key, 
    api_url, 
    model_type="deepseek-reasoner", 
    language="fr"
) -> AsyncGenerator[ThinkingStep, None]:
    """
    Stream la réponse de DeepSeek Reasoner pour récupérer le reasoning_content en temps réel
    """
    async with httpx.AsyncClient(timeout=120.0) as client:
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        print(f"Streaming with model: {model_type}")
        
        payload = {
            "model": model_type,
            "messages": messages,
            "temperature": 0.7,
            "top_p": 0.9,
            "max_tokens": 1024,
            "stream": True  # Activer le streaming
        }
        
        # Utiliser la méthode stream pour recevoir les chunks
        async with client.stream("POST", api_url, json=payload, headers=headers) as response:
            if response.status_code != 200:
                error_detail = f"Deepseek API error ({response.status_code})"
                print(f"API Error: {error_detail}")
                
                # Adapter le message d'erreur à la langue
                error_msg = f"Erreur API: {error_detail}"
                if language == "en":
                    error_msg = f"API Error: {error_detail}" 
                elif language == "es":
                    error_msg = f"Error de API: {error_detail}"
                elif language == "de":
                    error_msg = f"API-Fehler: {error_detail}"
                
                yield ThinkingStep(
                    step="error",
                    status="error",
                    details=error_msg
                )
                return
            
            reasoning_content = ""
            regular_content = ""
            
            # Traiter les chunks de données SSE
            async for line in response.aiter_lines():
                if line.startswith("data:"):
                    try:
                        line_data = line[5:].strip()
                        
                        # Vérifier si c'est un message de fin [DONE]
                        if line_data == "[DONE]":
                            print("Received [DONE] from API")
                            break
                            
                        # Analyser le JSON
                        chunk_data = json.loads(line_data)
                        
                        # Traiter le reasoning_content (Chain of Thought) si présent
                        if "choices" in chunk_data and len(chunk_data["choices"]) > 0:
                            choice = chunk_data["choices"][0]
                            
                            # Si le chunk contient du reasoning_content
                            if "delta" in choice and "reasoning_content" in choice["delta"]:
                                delta_reasoning = choice["delta"]["reasoning_content"] or ""
                                reasoning_content += delta_reasoning
                                
                                # Envoyer un chunk de reasoning seulement s'il y a du contenu significatif
                                if len(delta_reasoning.strip()) > 0:
                                    yield ThinkingStep(
                                        step="reasoning",
                                        status="processing",
                                        reasoning_content=reasoning_content
                                    )
                            
                            # Si le chunk contient du contenu normal
                            elif "delta" in choice and "content" in choice["delta"]:
                                delta_content = choice["delta"]["content"] or ""
                                regular_content += delta_content
                    
                    except json.JSONDecodeError as e:
                        print(f"Error decoding JSON: {str(e)}, line: {line}")
                        continue
                    except Exception as e:
                        print(f"Error processing chunk: {str(e)}")
                        continue 
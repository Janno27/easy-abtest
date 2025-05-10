import httpx
import json
from typing import AsyncGenerator
from app.routers.hypothesis.models import ThinkingStep
import asyncio

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
    client = None
    try:
        client = httpx.AsyncClient(timeout=120.0)
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
            try:
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
            except httpx.ReadTimeout as e:
                print(f"Read timeout during streaming: {str(e)}")
                error_msg = "Temps d'attente dépassé lors du traitement"
                if language == "en":
                    error_msg = "Read timeout during processing"
                elif language == "es":
                    error_msg = "Tiempo de espera agotado durante el procesamiento"
                elif language == "de":
                    error_msg = "Zeitüberschreitung während der Verarbeitung"
                
                yield ThinkingStep(
                    step="error",
                    status="error",
                    details=error_msg
                )
            except httpx.ReadError as e:
                print(f"Read error during streaming: {str(e)}")
                # C'est probablement dû à une déconnexion client, on ne renvoie rien
                return
            except asyncio.CancelledError:
                print("Streaming was cancelled")
                # Propager l'annulation
                raise
            except Exception as e:
                print(f"Unexpected error during streaming: {str(e)}")
                error_msg = "Erreur inattendue"
                if language == "en":
                    error_msg = "Unexpected error"
                elif language == "es":
                    error_msg = "Error inesperado"
                elif language == "de":
                    error_msg = "Unerwarteter Fehler"
                
                yield ThinkingStep(
                    step="error",
                    status="error",
                    details=error_msg
                )
    
    except httpx.ConnectTimeout:
        print("Connect timeout to DeepSeek API")
        error_msg = "Impossible de se connecter à l'API"
        if language == "en":
            error_msg = "Unable to connect to API"
        elif language == "es":
            error_msg = "No se pudo conectar a la API"
        elif language == "de":
            error_msg = "Keine Verbindung zur API möglich"
        
        yield ThinkingStep(
            step="error",
            status="error",
            details=error_msg
        )
    
    except asyncio.CancelledError:
        print("Stream request was cancelled")
        # Propager l'annulation
        raise
    
    except Exception as e:
        print(f"Error in stream_deepseek_response: {str(e)}")
        error_msg = "Erreur de communication avec l'API"
        if language == "en":
            error_msg = "API communication error"
        elif language == "es":
            error_msg = "Error de comunicación con la API"
        elif language == "de":
            error_msg = "API-Kommunikationsfehler"
        
        yield ThinkingStep(
            step="error",
            status="error",
            details=error_msg
        )
    
    finally:
        # Fermer le client dans tous les cas
        if client:
            await client.aclose() 
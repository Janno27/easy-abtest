from cachetools import TTLCache
from hashlib import sha256
import json
from typing import Optional, Dict, Any
from datetime import timedelta
import redis
import time

from app.core.config import settings
from app.routers.hypothesis.models import HypothesisResponse

# Cache mémoire pour requêtes fréquentes (max 1000 entrées, 15 min)
memory_cache = TTLCache(maxsize=1000, ttl=900)

# Cache persistant Redis pour stockage long terme
redis_cache = redis.Redis.from_url(settings.REDIS_URL) if settings.REDIS_URL else None

# Statistiques sur le cache
cache_stats = {
    "memory_hits": 0,
    "redis_hits": 0,
    "misses": 0,
    "stores": 0,
    "request_time_saved": 0  # en secondes
}

def generate_cache_key(messages: list, model: str, max_tokens: int = 1024, temperature: float = 0.7) -> str:
    """
    Génère une clé de cache unique basée sur les messages et paramètres du modèle
    """
    key_data = {
        "messages": messages,
        "model": model,
        "temp": temperature,
        "max_tokens": max_tokens
    }
    return sha256(json.dumps(key_data, sort_keys=True).encode()).hexdigest()

def get_cached_response(cache_key: str) -> Optional[HypothesisResponse]:
    """
    Récupère une réponse du cache (mémoire puis Redis)
    """
    global cache_stats
    
    # Vérifier le cache mémoire
    if cache_key in memory_cache:
        cache_stats["memory_hits"] += 1
        print(f"Cache hit (memory): {cache_key[:8]}... | Stats: {cache_stats}")
        return memory_cache[cache_key]
    
    # Vérifier le cache Redis
    if redis_cache:
        redis_data = redis_cache.get(cache_key)
        if redis_data:
            cache_stats["redis_hits"] += 1
            print(f"Cache hit (Redis): {cache_key[:8]}... | Stats: {cache_stats}")
            try:
                response_dict = json.loads(redis_data)
                
                # Calculer le temps économisé (différence entre maintenant et timestamp de création)
                if "timestamp" in response_dict:
                    time_saved = time.time() - response_dict["timestamp"]
                    cache_stats["request_time_saved"] += time_saved
                
                response = HypothesisResponse(**response_dict)
                memory_cache[cache_key] = response  # Mise à jour cache mémoire
                return response
            except Exception as e:
                print(f"Error deserializing Redis cache: {e}")
    
    cache_stats["misses"] += 1
    print(f"Cache miss: {cache_key[:8]}... | Stats: {cache_stats}")
    return None

def cache_response(cache_key: str, response: HypothesisResponse, ttl_hours: int = 24):
    """
    Stocke une réponse dans le cache (mémoire et Redis)
    """
    global cache_stats
    cache_stats["stores"] += 1
    
    # Cache mémoire
    memory_cache[cache_key] = response
    
    # Cache Redis (si disponible)
    if redis_cache:
        try:
            # Convertir Pydantic model en dictionnaire
            response_dict = response.dict()
            redis_cache.setex(
                cache_key,
                timedelta(hours=ttl_hours),
                json.dumps(response_dict)
            )
            print(f"Response cached with key: {cache_key[:8]}... | Stats: {cache_stats}")
        except Exception as e:
            print(f"Error caching response in Redis: {e}")

def get_cache_stats() -> Dict[str, Any]:
    """
    Retourne les statistiques d'utilisation du cache
    """
    total_hits = cache_stats["memory_hits"] + cache_stats["redis_hits"]
    total_requests = total_hits + cache_stats["misses"]
    
    if total_requests > 0:
        hit_rate = (total_hits / total_requests) * 100
    else:
        hit_rate = 0
    
    return {
        **cache_stats,
        "total_hits": total_hits,
        "total_requests": total_requests,
        "hit_rate_percent": round(hit_rate, 2),
        "memory_cache_size": len(memory_cache),
        "memory_cache_maxsize": memory_cache.maxsize,
        "redis_available": redis_cache is not None
    } 
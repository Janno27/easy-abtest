from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import httpx
import logging
from typing import Optional, Any, List, Tuple

# Configuration du logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("abtasty")

# Création du router
router = APIRouter()

# Endpoints AB Tasty Public API
auth_url = "https://api.abtasty.com/oauth/v2/token"
# Core API pour récupérer les tests d'un compte
core_tests_url = "https://api.abtasty.com/api/core/accounts/{account_id}/tests"
# URL pour récupérer les détails d'un test spécifique - version v1 comme indiqué dans l'erreur
test_details_url = "https://api.abtasty.com/api/v1/accounts/{account_id}/tests/{test_id}"
# URL pour récupérer les variations d'un test
test_variations_url = "https://api.abtasty.com/api/core/accounts/{account_id}/tests/{test_id}/variations"

class ABTastyCredentials(BaseModel):
    client_id: str
    client_secret: str

class ABTastyTestRequest(ABTastyCredentials):
    account_id: str  # Numeric account ID from abtastyConfig
    status: Optional[int] = 1  # 1 pour actifs
    page: Optional[int] = 1
    per_page: Optional[int] = 50

async def get_auth_token(client_id: str, client_secret: str) -> Optional[str]:
    """
    Récupère un token OAuth2 (grant_type=client_credentials).
    Envoie un JSON avec grant_type, client_id et client_secret.
    """
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "EasyABTest/1.0"
    }
    json_body = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(auth_url, json=json_body, headers=headers)

        logger.info(f"[Auth] {resp.status_code} / Req CT: {resp.request.headers.get('Content-Type')}")
        if resp.status_code != 200:
            logger.error(f"[Auth] échec {resp.status_code}: {resp.text}")
            return None
        return resp.json().get("access_token")
    except Exception as e:
        logger.exception(f"[Auth] exception: {e}")
        return None

@router.post("/verify", summary="Vérifie les credentials AB Tasty")
async def verify(credentials: ABTastyCredentials) -> dict:
    """
    Vérifie la validité des credentials en récupérant un token.
    Retourne {'valid': True} si succès.
    """
    token = await get_auth_token(credentials.client_id, credentials.client_secret)
    valid = token is not None
    logger.info(f"[Verify] résultat: {'valide' if valid else 'invalide'}")
    return {"valid": valid}

@router.get("/tests", summary="Liste des tests AB Tasty via Core API")
async def list_tests(
    client_id: str,
    client_secret: str,
    account_id: str,
    status: Optional[str] = "1",
    page: Optional[int] = 1,
    per_page: Optional[int] = 50
) -> Any:
    """
    Récupère la liste des tests d'un compte via l'API Core d'AB Tasty.

    Query params:
      - client_id: Public API client ID
      - client_secret: Public API client secret
      - account_id: Numeric account ID
      - status: 1 pour actifs, 0 pour inactifs
      - page: numéro de page
      - per_page: éléments par page
    """
    # Conversion de status en entier
    try:
        status_int = int(status) if status is not None else 1
    except ValueError:
        status_int = 1
        
    logger.info(f"[Tests] Paramètres reçus: account_id={account_id}, status={status_int}, page={page}, per_page={per_page}")
    
    token = await get_auth_token(client_id, client_secret)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Construction de l'URL
    url = core_tests_url.format(account_id=account_id)

    # Paramètres de filtre et pagination
    filter_params = {}
    
    # Gestion du statut
    if status_int is not None:
        filter_params["filter[active]"] = str(status_int)
        logger.info(f"[Tests] Ajout du filtre de statut: filter[active]={status_int}")
    
    # Pagination
    filter_params["_page"] = str(page)
    filter_params["_max_per_page"] = str(per_page)

    logger.info(f"[Tests] Paramètres de requête construits: {filter_params}")

    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        "Content-Type": "application/json",
        "User-Agent": "EasyABTest/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers, params=filter_params)

        logger.info(f"[Tests] GET {resp.url} -> {resp.status_code}")
        if resp.status_code != 200:
            error_detail = f"Failed to fetch tests: {resp.text}"
            logger.error(f"[Tests] échec {resp.status_code}: {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=error_detail)

        response_data = resp.json()
        items = response_data.get("_embedded", {}).get("items", [])
        items_count = len(items)
            
        logger.info(f"[Tests] {items_count} tests récupérés")
        
        return response_data
    except Exception as e:
        logger.exception(f"[Tests] exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test-details/{test_id}", summary="Détails d'un test AB Tasty")
async def test_details(
    test_id: str,
    client_id: str,
    client_secret: str,
    account_id: str
) -> Any:
    """
    Récupère les détails d'un test spécifique via l'API v1 d'AB Tasty.

    Path params:
      - test_id: ID du test
    
    Query params:
      - client_id: Public API client ID
      - client_secret: Public API client secret
      - account_id: Numeric account ID
    """
    logger.info(f"[Test Details] Récupération des détails pour le test ID: {test_id}, account_id: {account_id}")
    
    token = await get_auth_token(client_id, client_secret)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Construction de l'URL - utilisation de l'API v1 comme indiqué dans l'erreur
    url = test_details_url.format(account_id=account_id, test_id=test_id)

    # En-têtes selon la documentation fournie
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept-Language": "false",  # Selon la documentation
        "User-Agent": "EasyABTest/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)

        logger.info(f"[Test Details] GET {resp.url} -> {resp.status_code}")
        if resp.status_code != 200:
            error_detail = f"Failed to fetch test details: {resp.text}"
            logger.error(f"[Test Details] échec {resp.status_code}: {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=error_detail)

        response_data = resp.json()
        logger.info(f"[Test Details] Détails récupérés pour le test {test_id}")
        
        return response_data
    except Exception as e:
        logger.exception(f"[Test Details] exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/test-variations/{test_id}", summary="Variations d'un test AB Tasty")
async def test_variations(
    test_id: str,
    client_id: str,
    client_secret: str,
    account_id: str
) -> Any:
    """
    Récupère les variations d'un test spécifique via l'API Core d'AB Tasty.

    Path params:
      - test_id: ID du test
    
    Query params:
      - client_id: Public API client ID
      - client_secret: Public API client secret
      - account_id: Numeric account ID
    """
    logger.info(f"[Test Variations] Récupération des variations pour le test ID: {test_id}, account_id: {account_id}")
    
    token = await get_auth_token(client_id, client_secret)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Construction de l'URL
    url = test_variations_url.format(account_id=account_id, test_id=test_id)

    # En-têtes selon la documentation
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "EasyABTest/1.0"
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(url, headers=headers)

        logger.info(f"[Test Variations] GET {resp.url} -> {resp.status_code}")
        if resp.status_code != 200:
            error_detail = f"Failed to fetch test variations: {resp.text}"
            logger.error(f"[Test Variations] échec {resp.status_code}: {resp.text}")
            raise HTTPException(status_code=resp.status_code, detail=error_detail)

        response_data = resp.json()
        logger.info(f"[Test Variations] Variations récupérées pour le test {test_id}")
        
        return response_data
    except Exception as e:
        logger.exception(f"[Test Variations] exception: {e}")
        raise HTTPException(status_code=500, detail=str(e))
import sys
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time
from loguru import logger

# Ajouter le répertoire parent au chemin d'importation Python pour permettre
# l'importation du module 'app' même si ce fichier est exécuté directement
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Maintenant on peut importer depuis 'app'
from app.core.config import settings
from app.routers import estimate
from app.routers import hypothesis
from app.routers import external_apis
from app.routers import imports
from app.routers import settings as settings_router
from app.core.logging import setup_logging

# Setup logging
setup_logging()

app = FastAPI(
    title="A/B Test Calculator API",
    description="API for calculating A/B test sample sizes and durations",
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuration des CORS pour permettre les requêtes depuis le frontend
# Définition manuelle des origines pour éviter les problèmes de configuration
origins = ["http://localhost:3000", "http://localhost:8080", "http://localhost:5173", "*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to log request processing time
@app.middleware("http")
async def log_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    logger.debug(f"Request {request.method} {request.url.path} processed in {process_time:.4f} seconds")
    return response

# Include routers
app.include_router(estimate.router, tags=["estimate"])
app.include_router(hypothesis.router, tags=["hypothesis"])
app.include_router(external_apis.router, tags=["external APIs"])
app.include_router(imports.router, tags=["imports"])
app.include_router(settings_router.router, tags=["settings"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to the A/B Test Calculator API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
        "status": "Ready for calculation"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True) 
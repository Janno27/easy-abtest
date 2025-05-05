from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import estimate
from app.core.logging import setup_logging
import time
from loguru import logger

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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
"""
MDReader Backend API
Main FastAPI application entry point
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.config import settings
from app.database import check_database_connection
from app.routers import auth, workspaces, documents, folders, files, websocket

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events
    """
    # Startup
    logger.info(f"Starting {settings.APP_NAME} v{settings.API_VERSION}")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"Debug mode: {settings.DEBUG}")
    
    # Check database connection
    if not check_database_connection():
        logger.error("Failed to connect to database!")
        raise RuntimeError("Database connection failed")
    
    logger.info("✅ Database connection successful")
    logger.info(f"🚀 API server starting on {settings.APP_HOST}:{settings.APP_PORT}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API server...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Modern markdown editor with AI integration",
    version=settings.API_VERSION,
    docs_url="/docs" if settings.ENABLE_SWAGGER_UI else None,
    redoc_url="/redoc" if settings.ENABLE_REDOC else None,
    lifespan=lifespan,
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS.split(","),
    allow_headers=settings.CORS_ALLOW_HEADERS.split(",") if settings.CORS_ALLOW_HEADERS != "*" else ["*"],
)


# Include routers
app.include_router(auth.router)
app.include_router(workspaces.router)
app.include_router(documents.router)
app.include_router(folders.router)
app.include_router(files.router)
app.include_router(websocket.router)


# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """
    Health check endpoint for monitoring
    Returns API status and database connectivity
    """
    db_status = check_database_connection()
    
    return JSONResponse(
        status_code=status.HTTP_200_OK if db_status else status.HTTP_503_SERVICE_UNAVAILABLE,
        content={
            "status": "healthy" if db_status else "unhealthy",
            "service": settings.APP_NAME,
            "version": settings.API_VERSION,
            "environment": settings.ENV,
            "database": "connected" if db_status else "disconnected"
        }
    )


# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """
    API root endpoint
    Returns basic API information
    """
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.API_VERSION,
        "docs": "/docs" if settings.ENABLE_SWAGGER_UI else None,
        "health": "/health"
    }


# API Info endpoint
@app.get("/api/v1/info", tags=["System"])
async def api_info():
    """
    Get detailed API information
    """
    return {
        "name": settings.APP_NAME,
        "version": settings.API_VERSION,
        "environment": settings.ENV,
        "debug": settings.DEBUG,
        "endpoints": {
            "health": "/health",
            "docs": "/docs" if settings.ENABLE_SWAGGER_UI else None,
            "redoc": "/redoc" if settings.ENABLE_REDOC else None,
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.APP_HOST,
        port=settings.APP_PORT,
        reload=settings.ENABLE_HOT_RELOAD and settings.is_development,
        log_level=settings.LOG_LEVEL.lower(),
    )


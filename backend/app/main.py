import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import db_helper
from app.routes import auth, chat, services, user, snippets

# Configure logger
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("codementor.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Connect to MongoDB
    try:
        db_helper.connect()
    except Exception as e:
        logger.error(f"Failed to connect to database during startup: {e}", exc_info=True)
    yield
    # Shutdown: Close MongoDB connection
    db_helper.close()

app = FastAPI(
    title="CodeMentor AI API",
    description="Intelligent coding assistant backend powered by Gemini & MongoDB.",
    version="1.0.0",
    lifespan=lifespan
)

# Secure Production CORS configuration
allowed_origins = settings.cors_origins
logger.info(f"CORS origins configured: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request logger middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Received request: {request.method} {request.url.path}")
    try:
        response = await call_next(request)
        logger.info(f"Response status: {response.status_code} for {request.method} {request.url.path}")
        return response
    except Exception as e:
        logger.error(f"Exception during request {request.method} {request.url.path}: {e}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "An internal server error occurred. Please try again later."}
        )

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# Register routers
app.include_router(auth.router)
app.include_router(chat.router)
app.include_router(services.router)
app.include_router(user.router)
app.include_router(snippets.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "CodeMentor AI API",
        "message": "Welcome to the CodeMentor AI backend services. Use /docs for API documentation."
    }

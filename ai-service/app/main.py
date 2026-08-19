from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import bilan_generator, test_scoring, session_summary

app = FastAPI(
    title=settings.APP_NAME,
    description="Clinical NLP & Psychometric AI Microservice for PsyPro SaaS Platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register clinical routers
app.include_router(bilan_generator.router, prefix="/api/v1")
app.include_router(test_scoring.router, prefix="/api/v1")
app.include_router(session_summary.router, prefix="/api/v1")

@app.get("/", tags=["Health Check"])
async def root():
    return {
        "status": "online",
        "service": "PsyPro AI Clinical Engine",
        "version": "1.0.0",
        "provider": settings.AI_PROVIDER,
        "endpoints": {
            "orthophonie_bilan": "/api/v1/bilan/generate",
            "psychological_scoring": "/api/v1/tests/score",
            "soap_session_summary": "/api/v1/session/soap-summary",
            "docs": "/docs"
        }
    }

@app.get("/health", tags=["Health Check"])
async def health():
    return {"status": "healthy"}

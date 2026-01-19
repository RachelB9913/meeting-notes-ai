from fastapi import FastAPI
from dotenv import load_dotenv
import logging

from app.routes.health import router as health_router
from app.routes.transcribe import router as transcribe_router
from app.routes.summarize import router as summarize_router
from app.routes.process import router as process_router
from app.routes.export import router as export_router

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)

def create_app() -> FastAPI:
    app = FastAPI(title="Meeting Notes AI")

    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Routes
    app.include_router(health_router)
    app.include_router(transcribe_router)
    app.include_router(summarize_router)
    app.include_router(process_router)
    app.include_router(export_router)

    return app


app = create_app()
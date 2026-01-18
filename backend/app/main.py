from fastapi import FastAPI
from dotenv import load_dotenv

from app.routes.health import router as health_router
from app.routes.transcribe import router as transcribe_router
from app.routes.summarize import router as summarize_router
from app.routes.process import router as process_router
from app.routes.export import router as export_router

load_dotenv()


def create_app() -> FastAPI:
    app = FastAPI(title="Meeting Notes AI")

    # Routes
    app.include_router(health_router)
    app.include_router(transcribe_router)
    app.include_router(summarize_router)
    app.include_router(process_router)
    app.include_router(export_router)

    return app


app = create_app()
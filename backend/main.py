"""
RETURNKART.IN — FASTAPI ENTRY POINT
Written last — all dependencies exist before this file.
PORT is read from environment (injected by Replit). NEVER hardcode it.
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.config import PORT, FRONTEND_URL, ENV
from backend.api.health import router as health_router

app = FastAPI(
    title="ReturnKart.in API",
    description="AI-powered e-commerce return window tracker for India",
    version="1.0.0",
    docs_url="/api/docs" if ENV != "production" else None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "https://return-kart-tracker.replit.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")

# Stub routers — uncomment as Phase 1 services are built (Tasks #10-15)
# from backend.api.auth import router as auth_router
# from backend.api.orders import router as orders_router
# app.include_router(auth_router, prefix="/api/auth")
# app.include_router(orders_router, prefix="/api/orders")

if __name__ == "__main__":
    print(f"ReturnKart backend starting on port {PORT} [{ENV}]")
    uvicorn.run("backend.main:app", host="0.0.0.0", port=PORT, reload=(ENV != "production"))

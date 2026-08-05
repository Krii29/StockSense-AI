from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.stock import router as stock_router

app = FastAPI(
    title="AI Stock Market Analysis API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(stock_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to AI Stock Market Analysis API 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }
from fastapi import FastAPI

app = FastAPI(
    title="AI Stock Market Analysis API",
    version="1.0.0"
)

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
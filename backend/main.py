from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers.health_router import router as health_router
from routers.enhancement_router import router as enhancement_router

app = FastAPI(
    title="AI Image Enhancement API",
    description="Real-ESRGAN based image enhancement service - Preserving Original Quality",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with prefix
app.include_router(health_router, prefix="/api", tags=["Health"])
app.include_router(enhancement_router, prefix="/api", tags=["Enhancement"])

@app.get("/")
async def root():
    return {
        "message": "AI Image Enhancement API", 
        "version": "1.0.0",
        "description": "Preserving original image quality with Real-ESRGAN"
    }
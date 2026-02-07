"""
TravelOps AI Orchestrator - Main Application Entry Point

This FastAPI application provides AI-powered travel orchestration for multi-city trips.
It intelligently selects transport modes, accommodations, and creates optimized itineraries
based on budget constraints and user preferences.

Usage:
    python main.py
    or
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from api.routes import app

# Export the app for uvicorn
__all__ = ['app']

if __name__ == "__main__":
    import uvicorn

    print("""
    ==============================================================

         TravelOps AI Orchestrator
         AI-Powered Multi-City Travel Planning

       Server starting at: http://localhost:8000
       API Docs: http://localhost:8000/docs
       ReDoc: http://localhost:8000/redoc

    ==============================================================
    """)

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

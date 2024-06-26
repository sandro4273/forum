"""
Programmierprojekt Forum, 2024-04-01
Luca Flühler, Lucien Ruffet, Sandro Kuster

Dieses Modul bietet den Einstiegspunkt für die API. Es initialisiert die FastAPI-App und konfiguriert die CORS-Middleware,
um Anfragen von der Frontend-Anwendung zu ermöglichen. Die API-Router werden in der main.py-Datei zusammengeführt, um
die API zu starten.

Hauptquellen:
- FastAPI: https://fastapi.tiangolo.com/
- Pydantic: https://pydantic-docs.helpmanual.io/
- Sqlite3: https://docs.python.org/3/library/sqlite3.html
- Github Copilot und ChatGPT als Unterstützung für die Entwicklung

Aufteilung des Projekts:
- Luca Flühler: Stichwortextraktion, Post-Empfehlungen, User-Authentifizierung
- Lucien Ruffet: Frontend, CSS-Styling
- Sandro Kuster: Post-Suche, CRUD-Operationen, Chat-Funktion

Github Repository: https://github.com/sandro4273/forum
"""

from fastapi import FastAPI  # FastAPI is the main framework used for the backend API
from fastapi.middleware.cors import CORSMiddleware  # CORS is needed to allow requests from the frontend
from backend.api.api import api_router  # API router which connects all the endpoints

# In case of CORS error, add your local host to the list of origins
origins = [
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000"
]

# Initialize FastAPI
app = FastAPI()

# Configure the CORS middleware
app.add_middleware(CORSMiddleware,
                   allow_origins=origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

# Include all routes from the api_router. This connects all endpoints defined in api.py
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

# Forum

## Lokale Ausführung

### Voraussetzungen
- Python 3.10
- Requirements installieren: `pip install -r requirements.txt`

### Backend-Server starten
- `/backend/main.py` ausführen.
- Alternative: `uvicorn backend.main:app --reload` ausführen.

    → Dies öffnet den Backend-Server auf http://127.0.0.1:8000/  

### Frontend-Server starten
- `python -m http.server 5500` ausführen. 
- Alternative: VS Code-Erweiterung 'Live Server' installieren und `/frontend/public/index.html` als Live-Server starten ('Go Live', unten rechts)

    → Dies öffnet den Frontend-Server auf http://localhost:5500/    

### Problembehandlung
- Das Forum hat keine Inhalte
  - Entwicklertools im Browser öffnen (F12)
  - Konsole auf CORS-Fehler überprüfen 
  - Eigene localhost-Adressen in `/backend/main.py` in 'origins' kopieren.

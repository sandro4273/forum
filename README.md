# Forum

Anleitung:
1. Ordner in IDE öffnen (vorzugsweise VS Code)
2. In VS Code die Extension 'liveserver' installieren
3. Requirements installieren ('pip install -r requirements.txt')
4. Backendserver mit 'uvicorn api:app --reload' starten
5. index.html als Live-Server starten (Bei VS Code Icon unten rechts)

Sollte Forum leer sein:
- F12 in Browser -> Console -> Wird CORS Error angezeigt, localhost-Adresse bei api.py in 'origins' hereinkopieren

Alternative zu 'liveserver' für andere Umgebungen:
- In neuem Terminal 'python -m http.server 5500' ausführen. Dies öffnet den Frontend-Server auf http://localhost:5500/

# Forum

Anleitung:
1. Ordner in IDE öffnen (vorzugsweise VS Code)
2. In VS Code die Extension 'liveserver' installieren
3. Requirements installieren ('pip install requirements.txt')
4. Backendserver mit 'uvicorn api:app --reload' starten
5. index.html als Live-Server starten (Bei VS Code Icon unten rechts)

Sollte Forum leer sein:
- F12 in Browser -> Console -> Wird CORS Error angezeigt, localhost-Adresse bei api.py in 'origins' hereinkopieren

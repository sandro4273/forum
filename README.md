# Forum

Anleitung:
1. Ordner in IDE öffnen (vorzugsweise VS Code)
2. In VS Code die Extension 'liveserver' installieren
3. uvicorn und FastAPI installieren ('pip install uvicorn' und 'pip install fastapi')
4. jwt installieren ('pip install pyjwt')
5. yake installieren ('pip install yake')
6. spacy installieren ('pip install spacy')
7. en_core_web_sm installieren ('python -m spacy download en_core_web_sm')
8. pydantic e-mail validator installieren ('pip install pydantic[email]')
9. Backendserver mit 'uvicorn api:app --reload' starten
10. index.html als Live-Server starten (Bei VS Code Icon unten rechts)

Bei CORS error die localhost-Adresse bei api.py in origins hereinkopieren

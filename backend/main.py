from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.api.api import api_router

# In case of CORS error, add your local host to the list of origins
origins = [
    "http://localhost:8000",
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:8000"
]

# Initialize FastAPI
app = FastAPI()

app.add_middleware(CORSMiddleware,
                   allow_origins=origins,
                   allow_credentials=True,
                   allow_methods=["*"],
                   allow_headers=["*"])

# Include API router
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Test-Server läuft!"}

@app.get("/test")
def test_endpoint():
    return {"status": "Backend ist erreichbar"}
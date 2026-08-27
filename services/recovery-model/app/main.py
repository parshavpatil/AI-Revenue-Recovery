from datetime import datetime, timezone

from fastapi import FastAPI

app = FastAPI(
    title="RecoverAI Recovery Model",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {
        "service": "recoverai-recovery-model",
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "module": 1,
    }


@app.get("/")
def root() -> dict:
    return {
        "message": "Recovery model service foundation is ready.",
        "next_module": 6,
    }

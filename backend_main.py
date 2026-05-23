"""
Gate Alert System — FastAPI Backend
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import uvicorn

from database import engine, Base
from routers import auth, admin, devices, gate, schedule, notifications

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Gate Alert System API",
    description="Secure family gate alert system",
    version="1.0.0",
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["Admin"])
app.include_router(devices.router,       prefix="/api/devices",       tags=["Devices"])
app.include_router(gate.router,          prefix="/api/gate",          tags=["Gate"])
app.include_router(schedule.router,      prefix="/api/schedule",      tags=["Schedule"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

@app.get("/")
def root():
    return {"status": "Gate Alert System Online", "version": "1.0.0"}

@app.get("/health")
def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

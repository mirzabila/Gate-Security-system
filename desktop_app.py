"""
Gate Alert System â€” Desktop Launcher
Single-file server: FastAPI backend + Web UI
Opens browser automatically on start.
"""
import os, sys, time, threading, webbrowser, warnings
warnings.filterwarnings("ignore")

# â”€â”€ Resolve paths â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS
    DATA_DIR = os.path.dirname(sys.executable)
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = BASE_DIR

STATIC_DIR = BASE_DIR
DB_PATH    = os.path.join(DATA_DIR, 'desktop_gate_alert.db')

os.environ.setdefault('DATABASE_URL', f'sqlite:///{DB_PATH}')
os.environ.setdefault('SECRET_KEY',   'gate-alert-desktop-2024-secure')

sys.path.insert(0, BASE_DIR)

# â”€â”€ DB init + seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import desktop_models as models
from desktop_database import engine, Base, SessionLocal
Base.metadata.create_all(bind=engine)
from desktop_router_auth import _seed
_db = SessionLocal()
try:
    _seed(_db)
finally:
    _db.close()

# â”€â”€ FastAPI app â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import desktop_router_auth as auth, desktop_router_admin as admin, desktop_router_devices as devices, desktop_router_gate as gate, desktop_router_schedule as schedule, desktop_router_notifications as notifications

app = FastAPI(title="Gate Alert System", version="1.0.0", docs_url="/api/docs")
app.add_middleware(GZipMiddleware, minimum_size=500)
app.add_middleware(CORSMiddleware, allow_origins=["*"],
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router,          prefix="/api/auth",          tags=["Auth"])
app.include_router(admin.router,         prefix="/api/admin",         tags=["Admin"])
app.include_router(devices.router,       prefix="/api/devices",       tags=["Devices"])
app.include_router(gate.router,          prefix="/api/gate",          tags=["Gate"])
app.include_router(schedule.router,      prefix="/api/schedule",      tags=["Schedule"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/", response_class=HTMLResponse)
async def ui():
    return FileResponse(os.path.join(STATIC_DIR, "desktop_web_ui_index.html"))

@app.get("/health")
def health():
    return {"status": "online"}

PORT = int(os.getenv("PORT", "8000"))
OPEN_BROWSER = os.getenv("OPEN_BROWSER", "1") == "1"

def _open_browser():
    time.sleep(2)
    webbrowser.open(f"http://localhost:{PORT}")

if __name__ == "__main__":
    print("=" * 58)
    print("  ðŸšª  Gate Alert System  v1.0")
    print(f"  URL  : http://localhost:{PORT}")
    print(f"  Docs : http://localhost:{PORT}/api/docs")
    print(f"  DB   : {DB_PATH}")
    print("  Close this window to stop the server.")
    print("=" * 58)
    if OPEN_BROWSER:
        threading.Thread(target=_open_browser, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=PORT,
                log_level="warning", ws_ping_interval=20, ws_ping_timeout=20)




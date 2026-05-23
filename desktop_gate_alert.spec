# gate_alert.spec
# PyInstaller build spec for Gate Alert Desktop
import sys, os
from PyInstaller.utils.hooks import collect_all, collect_data_files, collect_submodules

block_cipher = None

# Collect all data from passlib, jose, uvicorn etc.
datas = [
    ('static', 'static'),
    ('routers', 'routers'),
]

# Add passlib data
try:
    passlib_datas, _, _ = collect_all('passlib')
    datas += passlib_datas
except Exception:
    pass

hiddenimports = [
    # SQLAlchemy dialects
    'sqlalchemy.dialects.sqlite',
    'sqlalchemy.pool',
    # Uvicorn
    'uvicorn.logging',
    'uvicorn.loops',
    'uvicorn.loops.auto',
    'uvicorn.loops.asyncio',
    'uvicorn.protocols',
    'uvicorn.protocols.http',
    'uvicorn.protocols.http.auto',
    'uvicorn.protocols.http.h11_impl',
    'uvicorn.protocols.http.httptools_impl',
    'uvicorn.protocols.websockets',
    'uvicorn.protocols.websockets.auto',
    'uvicorn.protocols.websockets.websockets_impl',
    'uvicorn.protocols.websockets.wsproto_impl',
    'uvicorn.lifespan',
    'uvicorn.lifespan.off',
    'uvicorn.lifespan.on',
    # FastAPI / Starlette
    'fastapi',
    'starlette',
    'starlette.routing',
    'starlette.staticfiles',
    'starlette.responses',
    # Passlib / bcrypt
    'passlib',
    'passlib.handlers',
    'passlib.handlers.bcrypt',
    'passlib.handlers.sha2_crypt',
    'bcrypt',
    # Python Jose
    'jose',
    'jose.jwt',
    'jose.algorithms',
    # Pydantic
    'pydantic',
    'pydantic.v1',
    # Multipart
    'multipart',
    'python_multipart',
    # App modules
    'models',
    'database',
    'schemas',
    'security',
    'push_service',
    'routers.auth',
    'routers.admin',
    'routers.devices',
    'routers.gate',
    'routers.schedule',
    'routers.notifications',
    # Email validator (pydantic)
    'email_validator',
    'aiofiles',
    'anyio',
    'anyio._backends._asyncio',
    'h11',
    'httpx',
    'httpcore',
    'websockets',
    'websockets.legacy',
    'websockets.legacy.server',
]

a = Analysis(
    ['app.py'],
    pathex=['.'],
    binaries=[],
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['tkinter', 'matplotlib', 'numpy', 'pandas', 'PIL', 'cv2'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='GateAlert',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,          # shows console window (good for status messages)
    disable_windowed_traceback=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon=None,
)

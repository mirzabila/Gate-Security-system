# Baig House Gate Security System

This folder contains the complete Gate Alert project packaged under one main folder.

## Fastest way to run on Windows

1. Install Python 3.11 if it is not already installed.
2. Double-click `START_DESKTOP_APP.bat`.
3. Open `http://localhost:8000` if the browser does not open automatically.

Default login:

- Name: `Mirza Bilal`
- Password: `admin@gate2024`
- Admin PIN: `1234`

## Folder contents

- `gate-alert-desktop/` - desktop web app and FastAPI backend, ready for local deployment.
- `gate-alert/` - full React Native Expo mobile app plus FastAPI backend source.
- `START_DESKTOP_APP.bat` - creates the virtual environment, installs dependencies, and starts the desktop app.

## Notes

- The app stores local data in `gate-alert-desktop/gate_alert.db`.
- Python virtual environments and cache folders were intentionally not included because they are machine-specific.
- For a clean deployment on another PC, copy this entire `Baig House Gate security System` folder and run `START_DESKTOP_APP.bat`.

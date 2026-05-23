# 🚪 Gate Alert System

A secure, real-time family gate alert app for Android & iOS.
Built with **React Native (Expo)** frontend and **FastAPI (Python)** backend.

---

## 👥 Family Structure

| Role | Name | Key Limit |
|------|------|-----------|
| Super Admin | **Mirza Bilal** | Up to 50 devices, manages all families |
| Family Admin | Iftikhar Mehmood | Up to 4 devices |
| Family Admin | Sajid Mehmood | Up to 4 devices |
| Family Admin | Majid Mehmood | Up to 4 devices |
| Family Admin | Mirza Younas | Up to 4 devices |
| Family Admin | Mirza Yousaf | Up to 4 devices |
| Family Admin | Iftikhar Najmi | Up to 4 devices |
| Family Admin | Ghiyour Asif | Up to 4 devices |
| Family Admin | Khalil Baig | Up to 4 devices |

**Default password for all admins:** `admin@gate2024`
**Default admin PIN:** `1234`

> ⚠️ Change both immediately after first login.

---

## 📁 Project Structure

```
gate-alert/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point
│   ├── database.py           # DB connection (SQLite dev / PostgreSQL prod)
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic request/response schemas
│   ├── security.py           # JWT auth + password hashing
│   ├── push_service.py       # Expo push notification sender
│   ├── requirements.txt
│   ├── Dockerfile
│   └── routers/
│       ├── auth.py           # Login, register, seed
│       ├── admin.py          # Super admin — families, keys, users
│       ├── devices.py        # Device registration/management
│       ├── gate.py           # Gate trigger, WebSocket, push alerts
│       ├── schedule.py       # Availability calendar
│       └── notifications.py  # In-app notification inbox
│
├── frontend/                 # React Native Expo app
│   ├── App.js                # Root — Redux, WebSocket, push hooks
│   ├── app.json              # Expo config
│   ├── eas.json              # EAS Build config (APK + IPA)
│   ├── babel.config.js
│   ├── package.json
│   └── src/
│       ├── screens/
│       │   ├── LoginScreen.js
│       │   ├── RegisterScreen.js
│       │   ├── HomeScreen.js         # Live gate events + trigger
│       │   ├── AdminScreen.js        # Super admin dashboard (PIN locked)
│       │   ├── FamilyAdminScreen.js  # Family admin dashboard (PIN locked)
│       │   ├── DevicesScreen.js      # Manage registered devices
│       │   ├── NotificationsScreen.js # Alert inbox with badges
│       │   ├── ScheduleScreen.js     # Calendar unavailability
│       │   └── ProfileScreen.js      # User info + logout
│       ├── components/
│       │   └── GateAlertModal.js     # Full-screen popup when gate rings
│       ├── navigation/
│       │   └── AppNavigator.js       # Stack + Tab navigation
│       ├── services/
│       │   └── api.js                # All API + WebSocket endpoints
│       ├── store/
│       │   └── index.js              # Redux slices (auth, alert, notif)
│       ├── hooks/
│       │   ├── useWebSocket.js       # Persistent WS connection
│       │   └── useNotifications.js   # Push token + foreground handler
│       └── utils/
│           └── theme.js              # Colours, fonts, spacing
│
├── nginx/
│   └── nginx.conf            # Reverse proxy with WebSocket support
├── docker-compose.yml        # Full stack deployment
└── README.md
```

---

## 🚀 Backend Setup

### Option A — Local Development (SQLite)

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The database is auto-created at `gate_alert.db`.
All admin accounts are seeded automatically on first run.

### Option B — Docker (PostgreSQL + Nginx)

```bash
# From project root
docker-compose up --build -d
```

Backend available at: `http://localhost:8000`
API docs at: `http://localhost:8000/docs`

---

## 📱 Mobile App Setup

### Prerequisites

```bash
npm install -g expo-cli eas-cli
cd frontend
npm install
```

### Run on your phone (Expo Go)

```bash
cd frontend
npx expo start
```

Scan the QR code with **Expo Go** (iOS App Store / Google Play).

> Set `EXPO_PUBLIC_API_URL` in `frontend/.env` to your backend IP, e.g.:
> `EXPO_PUBLIC_API_URL=http://192.168.1.x:8000`

---

## 📦 Building Installable Files (APK / IPA)

### Step 1 — Create Expo / EAS account
```bash
npx expo login
eas init
```

### Step 2 — Build Android APK (installable directly)
```bash
cd frontend
eas build --platform android --profile preview
```
This produces a `.apk` file you can **download and install directly** on any Android phone.

### Step 3 — Build iOS IPA (requires Apple Developer account)
```bash
eas build --platform ios --profile preview
```
Produces a `.ipa` for ad-hoc distribution via TestFlight or direct install.

### Step 4 — Download & Install
- After build completes, EAS provides a **download URL**
- Android: download the `.apk`, open it on your phone, tap Install
- iOS: install via TestFlight or use Apple Configurator 2

### Build locally (Android only, no EAS account needed)
```bash
cd frontend
npx expo run:android --variant release
```
APK output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 🔑 How the Key System Works

1. **Mirza Bilal** (super admin) has a **Super Key** — share this with anyone who should join as a family
2. Each **Family Admin** has a unique **Family Key** — share with up to 4 family members
3. New users go to **Register → enter invite key** to join the right family
4. Mirza Bilal can increase any family's device limit from the Admin dashboard
5. Keys can be regenerated at any time from the dashboard

---

## 🔔 Gate Alert Flow

```
Gate bell rings
      ↓
Admin triggers alert in app (or hardware sensor hits /api/gate/trigger)
      ↓
Backend broadcasts via WebSocket to all connected apps
Backend sends Expo push notification to all registered devices
Backend creates in-app notification for all users
      ↓
All family members see full-screen popup with vibration
      ↓
Any member taps "I'll Handle It" → event marked acknowledged
```

---

## 🔐 Security

- All passwords hashed with bcrypt
- JWT tokens (7-day expiry, stored in device secure storage)
- Admin dashboards locked behind a 4-digit PIN
- Family invite keys can be regenerated at any time
- Device limits enforced per family

---

## 🌐 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/register` | Register with invite key |
| GET  | `/api/auth/me` | Current user info |
| GET  | `/api/admin/families` | List all families (super admin) |
| POST | `/api/admin/families` | Create family (super admin) |
| GET  | `/api/admin/super-key` | Get current super key |
| POST | `/api/gate/trigger` | Trigger gate alert |
| POST | `/api/gate/acknowledge/:id` | Acknowledge event |
| GET  | `/api/gate/events` | Recent events |
| WS   | `/api/gate/ws` | WebSocket for live alerts |
| POST | `/api/devices/register` | Register device |
| POST | `/api/schedule/` | Set availability |
| GET  | `/api/notifications/` | Get notifications |

Full interactive docs: `http://localhost:8000/docs`

---

## 📞 Support

Built for the Mirza/Babar/Mehmood family network.
For issues, contact your family admin or Mirza Bilal.

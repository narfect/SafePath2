# SafePath

## Purpose

SafePath is a safety-focused navigation platform that helps users plan and travel more securely by providing real-time route safety scoring, community-driven safety reporting, and emergency SOS features with peer-to-peer responder coordination.

## Solution

SafePath addresses safety concerns during travel through:

- **Route Safety Scoring**: Analyzes geographic segments for safety hazards based on community reports, generating real-time danger scores for alternative routes
- **Safety Data**: Crowdsourced incident reports (harassment, theft, danger areas) mapped to geographic zones
- **SOS Alerts**: Emergency dispatch system that notifies nearby users in the same zone to provide immediate peer assistance
- **User Profiles**: Profile management with emergency contacts and credit-based helper incentives for SOS responses
- **SMS Integration**: Twilio-powered SMS notifications for emergency alerts and critical updates

## Tech Stack

**Frontend**

- React + React Router for UI and client-side routing
- Vite for fast bundling and development
- Firebase Authentication for user registration/login
- Firebase Realtime Database for live updates
- Leaflet + React-Leaflet for map visualization
- Tailwind CSS for styling

**Backend**

- FastAPI (Python) for REST API
- SQLModel + SQLAlchemy for ORM and data modeling
- SQLite for local development database
- Twilio SDK for SMS notifications
- OSRM (OpenStreetMap Routing Machine) for route calculations
- Nominatim for location search and geocoding

**Integrations**

- Firebase (Auth, Realtime DB)
- Twilio (SMS)
- OSRM (Routing)
- Nominatim (Geocoding)

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│           React Frontend (Vite)                     │
│  ├─ Auth: Firebase Authentication                  │
│  ├─ Components: Journey Planner, Map, SOS Panel    │
│  └─ Services: Location, Routes, Safety, SOS        │
└──────────────┬──────────────────────────────────────┘
               │ HTTPS/HTTP
               ▼
┌─────────────────────────────────────────────────────┐
│        FastAPI Backend (Port 8001)                  │
│  ├─ REST API: /api/routes, /api/search, /users     │
│  ├─ SOS System: /sos/trigger, /sos/respond         │
│  ├─ Safety Data: Segments, Reports, Scores        │
│  └─ Database: SQLModel ORM with SQLite             │
└─────────────────────────────────────────────────────┘
               │
        ┌──────┼──────┬─────────┐
        ▼      ▼      ▼         ▼
     SQLite  OSRM  Nominatim  Twilio
      DB    Routes  Geocoding  SMS
```

### Core Modules

**Backend**

- `main.py`: FastAPI app, API endpoints (routes, search, users, SOS)
- `models.py`: SQLModel entities (`User`, `Segment`)
- `database.py`: Database engine and session setup
- `app/utils/`:
  - `segment_utils.py`: Geographic segment operations and safety scoring
  - `sos_utils.py`: SOS logic, proximity checks, distance calculations
  - `safety_data_service.py`: Aggregated safety data service
  - `sos_alert_service.py`: SOS notification and alert management

**Frontend**

- `src/App.jsx`: Main app routing
- `src/components/`: UI components (Auth, Journey Planner, Map, SOS, etc.)
- `src/utils/`:
  - `firebaseAuth.js`: Register/login/logout flows
  - `locationService.js`: GPS tracking
  - `directionsService.js`: Route requests
  - `sosService.js`: SOS alert submission
  - `reportService.js`: Safety incident reporting
  - `safetyScore.js`: Client-side score calculation

## Getting Started

### Local Development

1. Backend

```powershell
cd safejourney/backend
python -m uvicorn main:app --reload
# Runs on http://localhost:8001
```

2. Frontend

```powershell
cd safejourney/fend
npm install
npm run dev
# Runs on http://localhost:5174
```

### Environment Configuration

**Backend (.env)**

```
DATABASE_URL=sqlite:///./safejourney.db
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_PHONE_NUMBER=<your-twilio-number>
```

**Frontend (.env)**

```
VITE_API_BASE_URL=http://localhost:8001
```

### Firebase Setup

- Configure Firebase project credentials in `safejourney/fend/src/config/firebase.js`
- Enable Authentication (Email/Password) and Realtime Database

## Project Structure

```
safejourney/
├─ backend/          # FastAPI server
│  ├─ main.py
│  ├─ models.py
│  ├─ database.py
│  ├─ requirements.txt
│  └─ app/utils/     # Core services
├─ fend/             # React frontend
│  ├─ src/
│  │  ├─ components/
│  │  ├─ utils/
│  │  ├─ config/
│  │  └─ App.jsx
│  ├─ package.json
│  └─ vite.config.js
└─ README.md
```

## API Endpoints

**Routes & Search**

- `POST /api/routes` - Get multiple route options with safety scores
- `POST /api/search` - Search locations by address

**Users**

- `POST /users/` - Create user profile
- `GET /api/users/{uid}` - Get user details

**SOS System**

- `POST /sos/trigger` - Trigger SOS alert
- `POST /sos/respond` - Respond to SOS alert
- `GET /sos/nearby` - Get nearby SOS alerts

**Health**

- `GET /health` - API health check

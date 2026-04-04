# SafePath

SafePath is a safety-first navigation app with:
- React frontend (`fend`)
- FastAPI backend (`backend`)
- Firebase auth + user profile sync
- Route safety scoring + SOS alert flows

## Project Structure

- `backend/main.py`: FastAPI app and API endpoints
- `backend/models.py`: SQLModel entities (`User`, `Segment`)
- `backend/database.py`: DB engine/session setup
- `fend/src/App.jsx`: App routing
- `fend/src/config/api.js`: Frontend API base URL config
- `fend/src/utils/routes.js`: Frontend route constants

## Local Run

1. Backend

```powershell
cd safejourney/backend
python -m uvicorn main:app --reload
```

2. Frontend

```powershell
cd safejourney/fend
npm install
npm run dev
```

## Environment

- Frontend API URL: set `VITE_API_BASE_URL` (optional)
- Backend DB URL: set `DATABASE_URL` in `backend/.env`

If not set, defaults are:
- Frontend -> `http://localhost:8000`
- Backend -> local SQLite `safejourney.db`

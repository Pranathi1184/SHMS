# SHMS Frontend

Role-aware React dashboard for Smart Hospital Management System.

## Stack
- React 19
- Vite
- Material UI
- React Router
- React Hook Form
- Axios

## Run
```powershell
npm install
npm run dev
```

## Build
```powershell
npm run build
```

## Tests
```powershell
npm test -- --runInBand --watchAll=false
```

## Environment

The frontend uses `VITE_API_BASE_URL` if provided.

Default fallback in code:
- `http://localhost:5000/api`

## Notes
- Authentication token and user profile are persisted in `localStorage`.
- Protected routes and role checks are applied in app routing/layout.

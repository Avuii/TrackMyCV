# Local Development

Run the whole local application from the repository root:

```bash
npm run dev
```

This starts:

- SQL Server from `docker-compose.yml`
- ASP.NET Core API at `http://localhost:5228`
- Vite frontend at `http://localhost:5173`

The local app in `frontend/` is the working application: it uses email/password registration, stores auth sessions in the API database, and connects Applications and Documents to the backend. Uploaded CVs and other files are saved by the API under `backend/TrackMyCV.Api/App_Data/uploads`, while their metadata is stored in SQL Server. In Development the API applies EF migrations automatically on startup.

The static GitHub Pages showcase remains separate in `demo/`.

Stop everything with `Ctrl+C`.

If SQL Server is already running, or Docker is not available:

```bash
npm run dev:skip-db
```

On Windows you can also double-click:

```text
start-dev.cmd
```

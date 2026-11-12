# Local Development

## Backend with Docker

From the repository root with Docker Desktop running:

```bash
docker compose up -d --build api
docker compose logs -f api
```

Compose starts SQL Server, waits for it to accept queries, and starts the API at
`http://localhost:5228`. The API applies database migrations on startup.
Stop any API already listening on port 5228 (for example from Visual Studio) before starting.
The SQL volume and the host `App_Data` directory retain database records and uploaded files.
Optional OpenAI and email settings come from the root `.env` file.
If you use a custom SQL password, set `MSSQL_SA_PASSWORD` to the password of the existing SQL instance.

Start the frontend separately with `npm --prefix frontend run dev`.
Use `docker compose stop api` to stop only the API, or `docker compose stop` to stop both services.

## Backend on the host

On a fresh clone, create the local API configuration before starting the host backend:

```powershell
Copy-Item backend/TrackMyCV.Api/appsettings.example.json backend/TrackMyCV.Api/appsettings.json
```

The destination is ignored by Git. Keep personal keys and passwords in local configuration or the root `.env` file.

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

## Email reminders from a local backend

The local API can send reminders through an existing SMTP account. For the Gmail setup used by NearEarth, place these settings in the ignored root `.env` file and restart the API:

```dotenv
EMAIL__ENABLED=true
EMAIL__HOST=smtp.gmail.com
EMAIL__PORT=587
EMAIL__ENABLESSL=true
EMAIL__USERNAME=your-account@gmail.com
EMAIL__PASSWORD=your-app-password
EMAIL__FROMEMAIL=your-account@gmail.com
```

When running the API in Docker, set `TZ` to the time zone used for your calendar, for example `Europe/Warsaw`.

Set the recipient in **Profile → Notifications** and use **Send test email** to verify delivery to that inbox. In **Preferences**, set **Suggest follow-up after** to choose the delay from the last contact or the application date. The same delay applies to in-app suggestions and email follow-ups. The local API checks for due reminders on startup and every five minutes while it is running.

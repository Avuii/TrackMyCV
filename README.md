<p align="center">
  <img src="docs/logo-removebg.png" alt="TrackMyCV logo" width="180" />
</p>

<h1 align="center">TrackMyCV</h1>

<p align="center">
  Track job applications, organize recruitment materials, and prepare for interviews in one workspace.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-active%20development-A67856?labelColor=5C5148&style=for-the-badge" alt="Status: active development" />
  <a href="https://avuii.github.io/TrackMyCV/">
    <img src="https://img.shields.io/badge/GitHub%20Pages-Interactive%20demo-C49A6C?labelColor=7A5C42&style=for-the-badge&logo=github&logoColor=white" alt="Open the TrackMyCV demo on GitHub Pages" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-5F7476?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-4D6473?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6E8FA3?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Lucide-8A6F5A?style=for-the-badge&logo=lucide&logoColor=white" alt="Lucide React" />
  <br />
  <img src="https://img.shields.io/badge/ASP.NET%20Core-10-5E4B3D?style=for-the-badge&logo=dotnet&logoColor=white" alt="ASP.NET Core 10" />
  <img src="https://img.shields.io/badge/EF%20Core-10-735846?style=for-the-badge&logo=dotnet&logoColor=white" alt="Entity Framework Core 10" />
  <img src="https://img.shields.io/badge/SQL%20Server-2022-7A4A4A?style=for-the-badge" alt="SQL Server 2022" />
  <br />
  <img src="https://img.shields.io/badge/Docker%20Compose-4D6473?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Compose" />
  <img src="https://img.shields.io/badge/OpenAI%20API-7A4A4A?style=for-the-badge" alt="OpenAI API" />
  <img src="https://img.shields.io/badge/LaTeX-5F7476?style=for-the-badge&logo=latex&logoColor=white" alt="LaTeX" />
</p>

TrackMyCV brings together applications, employer research, interview dates, CV versions, and recruitment notes. The full-stack app runs locally with an ASP.NET Core API and SQL Server. The GitHub Pages demo uses sample data, simulated sign-in, and browser storage.

## Interface preview

| Dashboard | Applications |
| --- | --- |
| <img src="docs/screenshots/dashboard.png" alt="Recruitment dashboard" width="380" /> | <img src="docs/screenshots/applications.png" alt="Applications and recruitment statuses" width="380" /> |

| Calendar | Documents |
| --- | --- |
| <img src="docs/screenshots/calendar.png" alt="Recruitment calendar" width="380" /> | <img src="docs/screenshots/documents.png" alt="Recruitment files and links" width="380" /> |

<details>
<summary>More screenshots</summary>

- [Companies](docs/screenshots/companies.png)
- [Statistics](docs/screenshots/statistics.png)
- [Notes](docs/screenshots/notes.png)

</details>

## Development checklist

### Implemented

- [x] Email and password registration, sign-in, sign-out, and database-backed sessions.
- [x] Application tracking with search, filters, recruitment statuses, next steps, and CSV import and export.
- [x] Dashboard and recruitment statistics calculated from the user's applications.
- [x] Calendar with month, week, and day views, upcoming events, and API-backed event storage. Events support time ranges, locations, meeting links, icons, and colors.
- [x] Recruitment documents and links with categories, metadata, archiving, and file downloads. SQL Server stores metadata and the API stores uploaded files in `App_Data/uploads`.
- [x] Company profiles, editable notes with checklists and attachments, job preferences, and workspace appearance settings. These features use browser storage in the full app.
- [x] Desktop and mobile layouts, light/dark/system themes, accent colors, density, and animation settings.
- [x] Configurable email reminders for interviews, deadlines, and follow-ups, plus weekly summaries, monthly reports, and a test-email action. Delivery requires SMTP configuration. Application follow-ups currently use a seven-day threshold.
- [x] General CV review and job-match review, with results saved to review history.
- [x] Editable AI-generated cover letters with PDF preview, download, and saving to Documents.
- [x] AI Job Scout interface with profile preferences, matching controls, result tabs, run history for the current session, and handlers for saving, ignoring, and adding matches to Applications.
- [x] Docker Compose configuration for local SQL Server and the API, EF Core migrations, and a GitHub Actions workflow for publishing the demo to GitHub Pages.

### Remaining work

1. **Make AI Job Scout return real offers.**
   - [ ] Connect a permitted job API, RSS feed, or company careers source and wire it into manual search. The current source list is empty and the search handler has no provider call.
   - [ ] Normalize and deduplicate offers, score them against job preferences, explain matches, and keep offers already tracked out of new results.
   - [ ] Persist results, saved and ignored offers, and run history. Add scheduled searches and notifications for new matches.
2. **Finish connecting the recruitment workspace.**
   - [ ] Sync company profiles, notes and attachments, and job preferences through the API so they follow the account across devices.
   - [ ] Link applications to documents by ID. The application currently stores the CV name. Extend links between applications, notes, companies, and calendar deadlines, and build an activity timeline and document usage history.
   - [ ] Add in-app notifications and follow-up suggestions. Connect the profile's follow-up interval to the email worker and verify timing and delivery with SMTP.
3. **Verify and deploy the full app.**
   - [ ] Add automated coverage for authentication, application CRUD, document uploads, calendar sync, reminders, and AI flows. The GitHub Pages workflow builds the demo.
   - [ ] Update the dependency flagged by the backend build audit (`System.Security.Cryptography.Pkcs` 9.0.4) and pin frontend dependencies with a committed lockfile.
   - [ ] Set up a production frontend, API, and database with deployment-time migrations, persistent uploads, backups, API health checks, and monitoring.
4. **Expand preparation and improve usability.**
   - [ ] Add job offer and CV comparisons, reusable document templates, and interview preparation collections.
   - [ ] Add AI interview questions, job-description summaries, and application-specific recommendations for documents and next steps.
   - [ ] Improve mobile flows, accessibility, loading and error states, onboarding, and dashboard customization.

## Run locally

Use Node.js 22.12 or newer, the .NET 10 SDK, and Docker with Linux containers for SQL Server. Run the following commands in PowerShell from the repository root.

```powershell
Copy-Item backend/TrackMyCV.Api/appsettings.example.json backend/TrackMyCV.Api/appsettings.json
Copy-Item .env.example .env
npm install --prefix frontend
npm run dev
```

Create the configuration files on a fresh clone. If they already exist, keep your local settings. Open the frontend at `http://localhost:5173`. The API runs at `http://localhost:5228`, with Swagger at `/swagger`. In Development, the API applies EF Core migrations at startup.

To run the API in Docker or use an existing SQL Server instance, follow the [local development guide](docs/local-development.md).

### Optional integrations

- Set `OPENAI_API_KEY` in `.env` to enable CV reviews and cover letter generation. The API extracts text from uploaded PDF, DOCX, TXT, or RTF files and sends the relevant content to OpenAI. Image-only PDFs require a text version. Cover-letter PDF rendering needs a LaTeX compiler such as `pdflatex`, which is included in the API Docker image.
- Set `EMAIL__ENABLED=true` and configure the SMTP values from [`.env.example`](.env.example) to enable email delivery. Set your recipient address in the app's notification settings and use the test-email action to check delivery.

### Build checks

```bash
npm run build --prefix frontend
npm run build --prefix demo
dotnet build backend/TrackMyCV.slnx
```

To run the interactive demo locally, use `npm ci --prefix demo` followed by `npm run dev --prefix demo`.

## Repository overview

| Path | Purpose |
| --- | --- |
| [`frontend/`](frontend/) | Full app interface built with React, TypeScript, Vite, CSS, and Lucide icons |
| [`backend/`](backend/) | ASP.NET Core .NET 10 API, domain and application layers, and EF Core persistence for SQL Server |
| [`demo/`](demo/) | Separate interactive demo with sample data and simulated sign-in |
| [`docs/`](docs/) | Screenshots and local development guide |
| [`docker-compose.yml`](docker-compose.yml) | Local SQL Server and API services |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | Builds and deploys the demo to GitHub Pages |


## Author

Created by **[Avuii](https://github.com/Avuii)**

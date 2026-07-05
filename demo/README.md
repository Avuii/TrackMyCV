# TrackMyCV / ApplyFlow Frontend

Frontend-only live mockup aplikacji do śledzenia rekrutacji.

## Uruchomienie

```bash
npm install
npm run dev
```

## Co działa w mockupie

- logowanie po e-mailu i haśle, lokalnie w `localStorage`,
- nawigacja po widokach,
- jeden spójny nagłówek strony pod topbarem, bez dublowania nazw sekcji,
- działający modal `Add application`,
- zapisywanie nowych aplikacji w `localStorage`,
- zmiana statusów aplikacji,
- usuwanie aplikacji,
- eksport CSV,
- filtrowanie i wyszukiwanie aplikacji,
- pobieranie ikon firm z Google favicon service z fallbackiem do inicjału,
- dashboard i statystyki liczone z aktualnych danych,
- profil, dropdown i popup customizacji,
- tryb jasny i ciemny,
- notatki z możliwością edycji treści,
- dynamiczna karta inspiracji w sidebarze z losowym zdjęciem i złotą myślą,
- zdjęcia z `public/assets` w estetyce soft/cozy/coffee.

Backend w .NET można później podpiąć przez zastąpienie operacji `localStorage` wywołaniami API.

## Public demo safety note

This repository contains only mock demo data. It does not include real job applications, real CV files, API keys, backend credentials or production secrets.

The demo login is frontend-only and stores data in `localStorage`. It is intended only for portfolio presentation and should not be used as real authentication.

Before publishing your own fork, make sure not to commit:

- real e-mail addresses,
- real CV files,
- real application history,
- API keys or `.env` files,
- private screenshots,
- unlicensed images.

Company logos are loaded through Google's public favicon service when a company domain is provided. If no domain is provided, the app falls back to initials.

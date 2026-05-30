# Cruise Login Setup

The private cruise route lives at `/cruise` and is not linked from the public homepage.

## What this flow does

- `/cruise` shows a simple private name login.
- `POST /api/cruise-login` checks the name and sets a secure session cookie.
- `GET /api/cruise-content` only returns the trip page if that cookie is valid.
- The actual trip page is stored in `private/cruise-page.html`, so it is not published as a public static route.
- Direct requests to `/private/*`, `/cruise-sunset-soft.html`, and `/cruise.html` are blocked by `vercel.json`.

## Vercel environment variables

Add these in your Vercel project settings:

- `CRUISE_LOGIN_NAME`
- `CRUISE_SESSION_SECRET`

Recommended:

- `CRUISE_LOGIN_NAME`: `Erica`
- `CRUISE_SESSION_SECRET`: a long random string, at least 32 characters

## Note

This is intentionally simpler than a real username/password login. It is fine for a lightweight private page, but it is less secure than using a real password.

## Notes

- The current local source file is [cruise-sunset-soft.html](/c:/code/Personal%20website/cruise-sunset-soft.html).
- The older draft is still [cruise.html](/c:/code/Personal%20website/cruise.html).
- The deployed private version is [cruise-page.html](/c:/code/Personal%20website/private/cruise-page.html).
- If your repo is public, the source code in the repo is still visible to anyone browsing the repository itself. This setup protects the deployed website route, not a public Git repository.

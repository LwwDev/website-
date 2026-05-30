# Cruise Login Setup

The private cruise route lives at `/cruise` and is not linked from the public homepage.

## What this flow does

- `/cruise` shows a simple name prompt.
- If the typed name is `Erica` or `Liam`, the trip page opens.
- Any other name sends the visitor back to `https://liamwohlstedt.xyz`.
- `/api/cruise-content` returns the private HTML used by the cruise view.
- The actual trip page is stored in `private/cruise-page.html`, so it is not published as a public static route.
- Direct requests to `/private/*`, `/cruise-sunset-soft.html`, and `/cruise.html` are blocked by `vercel.json`.

## Notes

- This version does not use Supabase or any environment variables.
- The current local source file is [cruise-sunset-soft.html](/c:/code/Personal%20website/cruise-sunset-soft.html).
- The older draft is still [cruise.html](/c:/code/Personal%20website/cruise.html).
- The deployed private version is [cruise-page.html](/c:/code/Personal%20website/private/cruise-page.html).
- If your repo is public, the source code in the repo is still visible to anyone browsing the repository itself. This setup protects the deployed website route, not a public Git repository.

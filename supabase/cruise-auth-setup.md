# Cruise Auth Setup

The private cruise route lives at `/cruise` and is not linked from the public homepage.

## What this flow does

- `/cruise` shows a Supabase email/password login.
- After a successful sign-in, the page requests `/api/cruise-content`.
- `/api/cruise-content` verifies the Supabase access token server-side before returning the private HTML.
- The actual trip page is stored in `private/cruise-page.html`, so it is not published as a public static route.
- Direct requests to `/private/*`, `/cruise-sunset-soft.html`, and `/cruise.html` are blocked by `vercel.json`.

## Vercel environment variables

Add these in your Vercel project settings:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRUISE_ALLOWED_EMAILS`

Recommended `CRUISE_ALLOWED_EMAILS` value:

```txt
erica@example.com,liam@example.com
```

## Notes

- In Supabase, enable `Email` auth and create the actual users under `Authentication` → `Users`.
- `SUPABASE_ANON_KEY` is safe in the browser. `SUPABASE_SERVICE_ROLE_KEY` must stay server-only in Vercel.
- The current local source file is [cruise-sunset-soft.html](/c:/code/Personal%20website/cruise-sunset-soft.html).
- The older draft is still [cruise.html](/c:/code/Personal%20website/cruise.html).
- The deployed private version is [cruise-page.html](/c:/code/Personal%20website/private/cruise-page.html).
- If your repo is public, the source code in the repo is still visible to anyone browsing the repository itself. This setup protects the deployed website route, not a public Git repository.

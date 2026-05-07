# WEBSITE-PORTFOLIO

## Secure contact form setup (Vercel)

This portfolio now includes a server-side contact endpoint at `/api/contact`.

The browser sends form data to that endpoint, and the endpoint delivers messages using one of these options:

1. Resend (recommended)
2. A custom webhook fallback

### Option A: Resend (recommended)

Set these Vercel environment variables:

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL` (your inbox)
- `CONTACT_FROM_EMAIL` (optional; defaults to `onboarding@resend.dev`)

### Option B: Webhook fallback

If you do not use Resend, set:

- `CONTACT_WEBHOOK_URL`

The API will forward sanitized JSON payloads to this URL.

### Security notes

- Do not place API keys in `index.html`.
- The endpoint includes payload validation, a honeypot field, and basic rate limiting.
- Frontend code is always viewable by end users; keep sensitive logic in `/api/*` only.

## Editing workflow (keep local files readable)

Local source files stay readable/editable:

- `index.html`
- `projects.html`

Do **not** minify these files in place while editing.

### One-time setup

```bash
npm install
```

### Deploy build (minify only in separate folder)

```bash
npm run build:deploy
```

This creates a `deploy/` folder containing the minified HTML files and copied assets.
Your original files in the project root remain editable.
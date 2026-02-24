# Hamilton George Care — Policy Platform

A full-stack platform for managing, distributing and tracking care policies and procedures.

**Stack:** Next.js 15 · TypeScript · Supabase · Claude AI · Resend · Tailwind CSS

---

## Features

- **Admin portal** — upload documents (PDF, DOCX, TXT), enhance with Claude AI, publish/archive
- **Read tracking** — see which carers have/haven't read each document
- **Knowledge check quizzes** — carers must pass before confirming they've read a document
- **Email notifications** — automated emails via Resend when a document is published; manual reminders to unread carers
- **Compliance reports** — per-carer and per-document dashboards + CSV export
- **Carer portal** — clean document list, read confirmation, compliance progress bar

---

## Deployment

See [SETUP.md](./SETUP.md) for full setup and deployment instructions.

### Quick start (local)

```bash
# 1. Fill in credentials
cp .env.local.example .env.local   # edit with your keys

# 2. Install and run
npm install
npm run dev
```

---

## Environment Variables

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → API |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXT_PUBLIC_APP_URL` | Your deployed URL (e.g. `https://your-app.vercel.app`) |

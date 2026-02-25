# CLAUDE.md — Hamilton George Care Policy Platform

## Project Overview

Hamilton George Care (HGC) is a full-stack SaaS application for managing, distributing, and tracking care policies and procedures. It enables a care business to upload policy documents, enhance them with AI, publish them to carers, track read compliance via quizzes, and generate compliance reports.

**Tech stack:** Next.js 15 (App Router) · React 19 · TypeScript 5 · Supabase (PostgreSQL + Auth + Storage) · Claude AI (Anthropic SDK) · Resend (Email) · Tailwind CSS v4

## Commands

```bash
npm run dev       # Start Next.js dev server (http://localhost:3000)
npm run build     # Production build
npm run start     # Start production server
npm run lint      # Run ESLint (eslint-config-next with core-web-vitals + typescript)
```

There is no test runner configured. No unit or integration tests exist yet.

## Environment Variables

Create a `.env.local` file (gitignored) with:

| Variable | Visibility | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public (browser) | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public (browser) | Supabase anonymous key |
| `NEXT_PUBLIC_APP_URL` | Public (browser) | Deployed app URL (used in email links) |
| `ANTHROPIC_API_KEY` | Server only | Claude AI API key for document enhancement |
| `RESEND_API_KEY` | Server only | Resend email service API key |

Server-only keys must **never** be prefixed with `NEXT_PUBLIC_`.

## Directory Structure

```
app/                          # Next.js App Router
├── globals.css               # Tailwind v4 import + CSS variables
├── layout.tsx                # Root layout (force-dynamic, Inter font)
├── page.tsx                  # Root redirect → /login
├── login/page.tsx            # Email/password login (client component)
├── auth/callback/route.ts    # OAuth code exchange handler
├── admin/                    # Admin portal (role-guarded)
│   ├── layout.tsx            # Auth guard: redirects non-admins
│   ├── page.tsx              # Dashboard (stats, alerts, recent docs)
│   ├── documents/
│   │   ├── page.tsx          # Document management list
│   │   └── new/page.tsx      # Upload new document (PDF/DOCX/TXT)
│   ├── users/page.tsx        # Team member list with compliance %
│   └── reports/page.tsx      # Compliance reports + CSV export
├── carer/                    # Carer portal (role-guarded)
│   ├── layout.tsx            # Auth guard: redirects admins → /admin
│   ├── page.tsx              # My Documents dashboard
│   └── documents/[id]/page.tsx  # Read individual document + quiz
└── api/                      # API route handlers
    ├── extract-text/route.ts       # POST: Extract text from PDF/DOCX/TXT
    ├── enhance-document/route.ts   # POST: Stream Claude AI enhancement
    ├── mark-read/route.ts          # POST: Mark document as read + quiz score
    ├── send-notifications/route.ts # POST: Send published emails to all carers
    ├── send-reminder/route.ts      # POST: Remind unread carers
    ├── documents/status/route.ts   # POST: Change status + auto-notify on publish
    └── reports/export/route.ts     # GET: CSV compliance export

components/                   # Reusable UI components (all client components)
├── nav.tsx                   # Navigation bar (role-based links, responsive)
├── documents-manage-client.tsx  # Admin doc management (enhance, reads, quiz tabs)
├── read-document-client.tsx     # Carer document reader + quiz flow
├── quiz-editor.tsx              # Admin quiz question CRUD
└── quiz-player.tsx              # Carer quiz taking interface

lib/                          # Shared utilities and services
├── email.ts                  # Resend email templates (published + reminder)
└── supabase/
    ├── client.ts             # Browser Supabase client (createBrowserClient)
    └── server.ts             # Server Supabase client (createServerClient, cookies)

types/
└── index.ts                  # All TypeScript interfaces (Profile, Document, etc.)

supabase/
└── schema.sql                # Full database schema (tables, RLS, triggers, storage)
```

## Architecture & Patterns

### Server vs Client Components

- **Server components** (default): All pages (`page.tsx`) and layouts (`layout.tsx`) fetch data directly from Supabase on the server. They do NOT have `"use client"` at the top.
- **Client components**: Files in `components/` and `app/login/page.tsx` use `"use client"` for interactive features (forms, tabs, streaming). They call API routes via `fetch()` for mutations.
- **Convention**: Keep data fetching in server components. Pass data as props to client components for interactivity.

### Authentication & Authorization

- **Auth provider**: Supabase Auth with email/password (`signInWithPassword`)
- **Session management**: `@supabase/ssr` manages cookies; server client reads them via `cookies()`
- **Role-based access**: Two roles defined in `profiles.role`: `'admin'` | `'carer'`
- **Route guards**: Admin and carer layouts check the user's role and redirect unauthorized users
- **Database security**: All tables use Row Level Security (RLS). Carers can only see published documents. Users can only manage their own read records. Admins have full access.

### Database (Supabase PostgreSQL)

Four custom tables plus Supabase's built-in `auth.users`:

| Table | Purpose |
|---|---|
| `profiles` | User metadata (full_name, role). Auto-created via trigger on `auth.users` insert. FK cascade delete. |
| `documents` | Policy documents. Status: `draft` → `published` → `archived`. Stores original + enhanced content. |
| `document_reads` | Tracks which user read which document, when, quiz results. Unique on `(document_id, user_id)`. |
| `quiz_questions` | Multiple-choice questions per document. Options stored as JSONB array. |

Schema is defined in `supabase/schema.sql`. Storage uses a private `documents` bucket for uploaded files.

### Styling

- **Tailwind CSS v4** via PostCSS (`@import "tailwindcss"` in globals.css)
- **CSS custom properties** in `:root`: `--hg-navy: #1e3a5f`, `--hg-navy-light: #2d5488`, `--background: #f8fafc`, `--foreground: #0f172a`
- **Responsive**: Uses Tailwind breakpoints (`sm:`, `md:`, `lg:`). Mobile hamburger menu in nav.
- **No component library** — all UI is hand-built with Tailwind utility classes.

### AI Document Enhancement

- Uses the `@anthropic-ai/sdk` with `claude-opus-4-6` model
- Streams responses via `ReadableStream` (text/plain SSE pattern)
- Prompt instructs Claude to rewrite for clarity, plain English, bullet points, logical sections
- Enhanced content is saved to `documents.enhanced_content` after streaming completes

### Email System

- Uses `resend` package for transactional emails
- Two templates in `lib/email.ts`:
  - **Published notification**: Sent to all carers when a document is published
  - **Reminder**: Sent to carers who haven't read a specific document
- Emails include personalized greeting, document title, and direct link

## Key Conventions

### TypeScript

- Strict mode enabled in `tsconfig.json`
- All shared types live in `types/index.ts` — import from `@/types`
- Path alias: `@/*` maps to project root (e.g., `@/lib/supabase/server`, `@/components/nav`)
- No semicolons in type definitions (project style)

### File Naming

- All lowercase with hyphens: `documents-manage-client.tsx`, `quiz-editor.tsx`
- Client components are suffixed with `-client` when they have a server component counterpart
- API routes use `route.ts` in nested folders matching the URL path

### Data Flow

1. **Server component** creates Supabase server client → queries data → passes to client component as props
2. **Client component** uses `fetch('/api/...')` for mutations (mark-read, enhance, status change)
3. **API routes** create their own Supabase server client → validate auth → perform operations → return JSON

### Error Handling

- API routes: try-catch with `NextResponse.json({ error }, { status })` pattern
- Client components: `useState` for error messages, displayed inline
- Auth failures: redirect to `/login`

### Document Lifecycle

1. Admin uploads file → text extracted via `/api/extract-text` → draft document created
2. Admin optionally enhances with AI → enhanced content saved
3. Admin optionally adds quiz questions via QuizEditor
4. Admin publishes → status changes to `published` → notification emails sent automatically
5. Carers see document in their portal → read → take quiz (if present) → marked as read
6. Admin views compliance in reports → can export CSV → can send reminders

## Configuration Notes

- `next.config.ts`: `serverExternalPackages: ['pdf-parse', 'mammoth']` — these Node.js packages must not be bundled for the browser
- `app/layout.tsx`: `export const dynamic = 'force-dynamic'` — disables static caching for all routes (required for auth-dependent pages)
- ESLint: Uses `eslint-config-next` with `core-web-vitals` and `typescript` presets. Ignores `.next/`, `out/`, `build/`.

## Common Tasks

### Adding a new API route

1. Create `app/api/<route-name>/route.ts`
2. Export named functions matching HTTP methods (`GET`, `POST`, etc.)
3. Create Supabase server client with `await createClient()` from `@/lib/supabase/server`
4. Check auth: `const { data: { user } } = await supabase.auth.getUser()`
5. Return `NextResponse.json(...)` with appropriate status codes

### Adding a new page

1. Create `app/<portal>/[path]/page.tsx` (server component by default)
2. Fetch data using Supabase server client
3. If interactivity needed, create a client component in `components/` and pass data as props
4. Auth is handled by the parent layout's guard — no need to re-check in pages

### Adding a new database table

1. Add the table definition to `supabase/schema.sql`
2. Include RLS policies following the existing pattern (admins full access, carers restricted)
3. Add the TypeScript interface to `types/index.ts`
4. Run the SQL in the Supabase dashboard or via migrations

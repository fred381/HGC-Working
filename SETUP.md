# Deployment Guide

This guide covers everything needed to deploy the Hamilton George Care Policy Platform on Vercel.

---

## Step 1 — Create a Supabase project

1. Go to **supabase.com** and sign up / log in
2. Click **New Project**, give it a name (e.g. `hamilton-george-care`), choose a region close to you
3. Wait for the project to be ready (~2 minutes)

### Run the database schema

1. In the Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open `supabase/schema.sql` from this project and paste the entire contents into the editor
4. Click **Run**

### Create the file storage bucket

1. In the Supabase dashboard, go to **Storage**
2. Click **New bucket**
3. Name it `documents`, leave **Public bucket** OFF (private)
4. Click **Save**

### Get your API keys

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## Step 2 — Get an Anthropic API key

1. Go to **console.anthropic.com**
2. Sign up / log in
3. Go to **API Keys** → **Create Key**
4. Copy the key → `ANTHROPIC_API_KEY`

---

## Step 3 — Get a Resend API key (for emails)

1. Go to **resend.com** and sign up / log in
2. Go to **API Keys** → **Create API Key**
3. Copy the key → `RESEND_API_KEY`

> **Domain setup (for production emails):** In Resend, go to **Domains** and add `hamiltongeorgecare.com`. Follow the DNS instructions to verify it. Until then, emails will send from `onboarding@resend.dev`.

---

## Step 4 — Push to GitHub

1. Create a new repository at **github.com/new**
   - Name: `hamilton-george-care`
   - Set to **Private**
   - Do NOT add a README (we already have one)

2. On your computer, unzip the project and run:

```bash
cd hamilton-george-care
git init
git add -A
git commit -m "Initial commit: Hamilton George Care policy platform"
git remote add origin https://github.com/YOUR_USERNAME/hamilton-george-care.git
git branch -M main
git push -u origin main
```

---

## Step 5 — Deploy to Vercel

1. Go to **vercel.com** and sign up / log in with your GitHub account
2. Click **Add New → Project**
3. Find and import `hamilton-george-care` from your GitHub repos
4. Vercel will auto-detect it as a Next.js project

### Add environment variables

Before deploying, click **Environment Variables** and add all of these:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | From Supabase (Step 1) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | From Supabase (Step 1) |
| `ANTHROPIC_API_KEY` | From Anthropic (Step 2) |
| `RESEND_API_KEY` | From Resend (Step 3) |
| `NEXT_PUBLIC_APP_URL` | Leave blank for now — add after deploy |

5. Click **Deploy**

After deploying, you'll get a URL like `https://hamilton-george-care.vercel.app`.

6. Go back to Vercel → **Settings → Environment Variables** and update `NEXT_PUBLIC_APP_URL` to your Vercel URL
7. Redeploy (Vercel dashboard → **Deployments** → **Redeploy**)

### Set Supabase redirect URLs

1. In Supabase, go to **Authentication → URL Configuration**
2. Set **Site URL** to your Vercel URL (e.g. `https://hamilton-george-care.vercel.app`)
3. Add to **Redirect URLs**: `https://hamilton-george-care.vercel.app/auth/callback`

---

## Step 6 — Create your first admin user

1. In Supabase, go to **Authentication → Users**
2. Click **Add user → Create new user**
3. Enter your email and a password
4. Click **Create user**
5. Go to **SQL Editor** and run:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Your Name'
WHERE email = 'your-email@example.com';
```

6. Visit your Vercel URL, log in — you'll land on the admin dashboard

---

## Step 7 — Add carer accounts

For each carer:

1. In Supabase → **Authentication → Users** → **Add user**
2. Enter their email and a temporary password
3. Their profile will be created automatically with the `carer` role

Or share the login URL and have them sign up (if you enable sign-ups in Supabase Auth settings — by default, only invited users can sign in).

---

## Local development

```bash
# Copy and fill in your credentials
cp .env.local .env.local.bak   # backup

# Edit .env.local with your real keys, then:
npm install
npm run dev
# → http://localhost:3000
```

---

## Custom domain

To use `app.hamiltongeorgecare.com` (or similar):

1. In Vercel → **Settings → Domains** → add your domain
2. Follow the DNS instructions (add a CNAME record at your domain registrar)
3. Update `NEXT_PUBLIC_APP_URL` in Vercel to the new domain
4. Update Supabase Site URL and Redirect URLs to the new domain
5. Redeploy

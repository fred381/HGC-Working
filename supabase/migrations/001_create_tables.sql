-- ============================================================================
-- HGC Rota Manager — core tables: carers, clients, shifts
-- Run this in the Supabase SQL Editor to set up the database.
-- ============================================================================

-- ── Carers ──────────────────────────────────────────────────────────────────

create table if not exists carers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  employee_id   text not null default '',
  role          text not null default 'Carer',
  contact_number text not null default '',
  daily_rate    numeric(10,2) not null default 0,
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── Clients ─────────────────────────────────────────────────────────────────

create table if not exists clients (
  id            uuid primary key default gen_random_uuid(),
  client_id     text not null default '',
  name          text not null,
  care_needs    text not null default '',
  address       text not null default '',
  active        boolean not null default true,
  created_at    timestamptz not null default now()
);

-- ── Shifts ──────────────────────────────────────────────────────────────────

create table if not exists shifts (
  id            uuid primary key default gen_random_uuid(),
  carer_id      uuid not null references carers(id) on delete cascade,
  client_id     uuid not null references clients(id) on delete cascade,
  date          date not null,
  shift_type    text not null default 'full_day',
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create index if not exists idx_shifts_date on shifts(date);
create index if not exists idx_shifts_carer on shifts(carer_id);
create index if not exists idx_shifts_client on shifts(client_id);

-- ── Row-Level Security ──────────────────────────────────────────────────────
-- For the demo (no auth), allow all operations via the anon key.
-- Tighten these policies when authentication is re-enabled.

alter table carers  enable row level security;
alter table clients enable row level security;
alter table shifts  enable row level security;

create policy "Allow all access to carers"  on carers  for all using (true) with check (true);
create policy "Allow all access to clients" on clients for all using (true) with check (true);
create policy "Allow all access to shifts"  on shifts  for all using (true) with check (true);

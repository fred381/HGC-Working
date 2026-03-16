-- ============================================================
-- Hamilton George Care — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Carers table
create table carers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  employee_id text not null default '',
  role        text not null default 'Carer',
  contact_number text not null default '',
  email       text not null default '',
  daily_rate  numeric(10,2) not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Clients table
create table clients (
  id          uuid primary key default gen_random_uuid(),
  client_id   text not null default '',
  name        text not null,
  care_needs  text not null default '',
  address     text not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- Shifts table
create table shifts (
  id          uuid primary key default gen_random_uuid(),
  carer_id    uuid not null references carers(id) on delete cascade,
  client_id   uuid not null references clients(id) on delete cascade,
  date        date not null,
  shift_type  text not null default 'full_day',
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

-- Indexes for common queries
create index shifts_carer_id_idx  on shifts(carer_id);
create index shifts_client_id_idx on shifts(client_id);
create index shifts_date_idx      on shifts(date);

-- Tags table (handover, no care required, etc.)
create table tags (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  date        date not null,
  tag_type    text not null check (tag_type in ('handover', 'no_care_required')),
  notes       text not null default '',
  created_at  timestamptz not null default now()
);

create index tags_client_id_idx on tags(client_id);
create index tags_date_idx      on tags(date);
create unique index tags_client_date_type_idx on tags(client_id, date, tag_type);

-- Enable Row Level Security (required by Supabase, open for now)
alter table carers  enable row level security;
alter table clients enable row level security;
alter table shifts  enable row level security;
alter table tags    enable row level security;

-- Allow all operations for authenticated and anonymous users
-- (tighten these once you add auth)
create policy "Allow all on carers"  on carers  for all using (true) with check (true);
create policy "Allow all on clients" on clients for all using (true) with check (true);
create policy "Allow all on shifts"  on shifts  for all using (true) with check (true);
create policy "Allow all on tags"    on tags    for all using (true) with check (true);

-- Enable realtime for tags and shifts
alter publication supabase_realtime add table tags;
alter publication supabase_realtime add table shifts;

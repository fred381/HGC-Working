-- ============================================================
-- Hamilton George Care — User Profiles & Role System
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Profiles table (linked to Supabase Auth users)
create table profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text not null default '',
  role        text not null default 'carer' check (role in ('admin', 'carer')),
  active      boolean not null default true,
  confirmed   boolean not null default false,
  invited_at  timestamptz,
  created_at  timestamptz not null default now()
);

-- Index for quick role lookups
create index profiles_role_idx on profiles(role);

-- Enable RLS
alter table profiles enable row level security;

-- All authenticated users can read profiles
create policy "Authenticated users can read profiles"
  on profiles for select
  using (auth.role() = 'authenticated');

-- Users can update their own name only
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Admins can update any profile (role, active, etc.)
create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert profiles (for invite flow)
create policy "Admins can insert profiles"
  on profiles for insert
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can delete profiles (for cancelling invitations)
create policy "Admins can delete profiles"
  on profiles for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 2. Auto-create a profile when a new user signs up or is invited
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, confirmed, invited_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'carer'),
    false,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3. Helper function: check if current user is admin (for use in app)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$ language sql security definer;

-- ============================================================
-- IMPORTANT: After running this SQL, make your first user
-- an admin by running (replace YOUR_USER_ID):
--
--   update profiles set role = 'admin' where id = 'YOUR_USER_ID';
--
-- Find your user ID in: Authentication → Users → click user → copy UUID
-- ============================================================

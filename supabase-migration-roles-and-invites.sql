-- ============================================================
-- Hamilton George Care — Migration: Roles, Invites & Carer Email
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Rename 'staff' role to 'carer' in profiles
update profiles set role = 'carer' where role = 'staff';

-- Update the role check constraint
alter table profiles drop constraint if exists profiles_role_check;
alter table profiles add constraint profiles_role_check check (role in ('admin', 'carer'));

-- 2. Add confirmed and invited_at columns to profiles
alter table profiles add column if not exists confirmed boolean not null default false;
alter table profiles add column if not exists invited_at timestamptz;

-- Mark all existing users as confirmed (they already have accounts)
update profiles set confirmed = true where confirmed = false;

-- 3. Add email column to carers table (for linking auth users to carer profiles)
alter table carers add column if not exists email text not null default '';

-- 4. Add admin delete policy on profiles (for cancelling invitations)
do $$
begin
  if not exists (
    select 1 from pg_policies where policyname = 'Admins can delete profiles'
  ) then
    create policy "Admins can delete profiles"
      on profiles for delete
      using (
        exists (
          select 1 from profiles
          where id = auth.uid() and role = 'admin'
        )
      );
  end if;
end $$;

-- 5. Update the handle_new_user trigger to include invited_at
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role, invited_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'carer'),
    now()
  );
  return new;
end;
$$ language plpgsql security definer;

-- ============================================================
-- DONE! After running this migration:
-- 1. All existing 'staff' users are now 'carer' users
-- 2. All existing users are marked as confirmed
-- 3. New invitations will show as pending until the user
--    clicks their magic link and signs in
-- 4. The carers table now has an email column — update your
--    carer records with matching email addresses to link
--    carer accounts to their auth profiles
-- ============================================================

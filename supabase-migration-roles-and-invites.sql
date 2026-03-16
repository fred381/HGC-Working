-- ============================================================
-- Hamilton George Care — Migration: Clean Roles & Invite System
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Rename 'staff' role to 'carer' (if any old rows exist)
UPDATE profiles SET role = 'carer' WHERE role = 'staff';

-- Update the role check constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'carer'));

-- 2. Add confirmed and invited_at columns (if not already present)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS confirmed boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_at timestamptz;

-- Mark all EXISTING users as confirmed (they already have accounts)
UPDATE profiles SET confirmed = true WHERE confirmed = false;

-- 3. Add email column to carers table (for linking auth users to carer profiles)
ALTER TABLE carers ADD COLUMN IF NOT EXISTS email text NOT NULL DEFAULT '';

-- 4. Add admin delete policy on profiles (for cancelling invitations)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can delete profiles'
  ) THEN
    CREATE POLICY "Admins can delete profiles"
      ON profiles FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END $$;

-- 5. Update the handle_new_user trigger to include invited_at and confirmed=false
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, confirmed, invited_at)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'role', 'carer'),
    false,
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- DONE! After running this:
--
-- 1. All existing users keep their roles (staff → carer)
-- 2. All existing users are marked as confirmed
-- 3. New users created via inviteUserByEmail will start as
--    confirmed=false and show in "Pending Invitations"
-- 4. When they set their password and sign in, the app will
--    mark them as confirmed
--
-- IMPORTANT: You also need to set these Supabase Dashboard settings:
--
-- Authentication → URL Configuration:
--   Site URL:       https://your-app.vercel.app
--   Redirect URLs:  https://your-app.vercel.app/auth/callback
--                   http://localhost:5173/auth/callback
--
-- Authentication → Email Templates:
--   Invite: Change the {{ .ConfirmationURL }} link to redirect
--           to your callback URL (this is usually automatic)
--
-- Environment variables needed (Vercel + local .env):
--   VITE_SUPABASE_URL=https://xxx.supabase.co
--   VITE_SUPABASE_ANON_KEY=eyJ...
--   VITE_SUPABASE_SERVICE_ROLE_KEY=eyJ...  (for admin invite API)
--   VITE_SITE_URL=https://your-app.vercel.app  (optional, defaults to window.location.origin)
-- ============================================================

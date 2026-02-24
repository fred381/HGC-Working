-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  role text not null default 'carer' check (role in ('admin', 'carer')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-create profile on user sign-up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'carer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Documents table
create table public.documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  original_content text,
  enhanced_content text,
  file_url text,
  file_name text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  review_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Admins can do everything with documents" on public.documents
  for all using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Carers can view published documents" on public.documents
  for select using (
    status = 'published'
    and exists (
      select 1 from public.profiles where id = auth.uid() and role = 'carer'
    )
  );

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.handle_updated_at();

-- Document reads table
create table public.document_reads (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  quiz_passed boolean,
  quiz_score integer,
  unique(document_id, user_id)
);

alter table public.document_reads enable row level security;

create policy "Users can insert their own reads" on public.document_reads
  for insert with check (auth.uid() = user_id);

create policy "Users can view their own reads" on public.document_reads
  for select using (auth.uid() = user_id);

create policy "Admins can view all reads" on public.document_reads
  for select using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Users can update their own reads" on public.document_reads
  for update using (auth.uid() = user_id);

-- Quiz questions table
create table public.quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid references public.documents(id) on delete cascade,
  question text not null,
  options jsonb not null,
  correct_index integer not null,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.quiz_questions enable row level security;

create policy "Admins can manage quiz questions" on public.quiz_questions
  for all using (
    exists (
      select 1 from public.profiles where id = auth.uid() and role = 'admin'
    )
  );

create policy "Carers can view quiz questions for published docs" on public.quiz_questions
  for select using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.status = 'published'
    )
  );

-- Storage bucket (run this in SQL editor or create manually in dashboard)
-- insert into storage.buckets (id, name, public) values ('documents', 'documents', false);

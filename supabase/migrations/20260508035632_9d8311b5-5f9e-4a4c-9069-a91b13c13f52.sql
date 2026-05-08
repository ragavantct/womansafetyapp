
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  auto_email boolean not null default true,
  alarm_sound boolean not null default true,
  dark_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "own profile select" on public.profiles for select using (auth.uid() = id);
create policy "own profile insert" on public.profiles for insert with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Emergency contacts
create table public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  relationship text,
  created_at timestamptz not null default now()
);
alter table public.emergency_contacts enable row level security;
create policy "own contacts all" on public.emergency_contacts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Alerts history
create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  latitude double precision,
  longitude double precision,
  location_url text,
  recipients jsonb not null default '[]'::jsonb,
  status text not null default 'sent',
  created_at timestamptz not null default now()
);
alter table public.alerts enable row level security;
create policy "own alerts all" on public.alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

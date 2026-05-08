-- =========================================================
-- Suraksha / Women Safety Reach - Supabase Auth SQL Schema
-- =========================================================
-- Run this whole file in:
-- Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- This schema is designed for the current frontend tables:
--   public.profiles
--   public.emergency_contacts
--   public.alerts
--
-- It uses Supabase Auth users from auth.users and protects all user
-- data with Row Level Security (RLS).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------
-- Shared timestamp helper
-- ---------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------
-- Profiles
-- One profile row per authenticated user.
-- Auto-created by the auth trigger below.
-- ---------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  auto_email boolean not null default true,
  alarm_sound boolean not null default true,
  dark_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists auto_email boolean;
alter table public.profiles add column if not exists alarm_sound boolean;
alter table public.profiles add column if not exists dark_mode boolean;
alter table public.profiles add column if not exists created_at timestamptz;
alter table public.profiles add column if not exists updated_at timestamptz;

update public.profiles
set full_name = coalesce(full_name, ''),
    phone = coalesce(phone, ''),
    auto_email = coalesce(auto_email, true),
    alarm_sound = coalesce(alarm_sound, true),
    dark_mode = coalesce(dark_mode, false),
    created_at = coalesce(created_at, now()),
    updated_at = coalesce(updated_at, now());

alter table public.profiles alter column full_name set default '';
alter table public.profiles alter column phone set default '';
alter table public.profiles alter column auto_email set default true;
alter table public.profiles alter column alarm_sound set default true;
alter table public.profiles alter column dark_mode set default false;
alter table public.profiles alter column created_at set default now();
alter table public.profiles alter column updated_at set default now();
alter table public.profiles alter column full_name set not null;
alter table public.profiles alter column phone set not null;
alter table public.profiles alter column auto_email set not null;
alter table public.profiles alter column alarm_sound set not null;
alter table public.profiles alter column dark_mode set not null;
alter table public.profiles alter column created_at set not null;
alter table public.profiles alter column updated_at set not null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Emergency Contacts
-- Used by src/routes/contacts.tsx and src/lib/sos.ts.
-- ---------------------------------------------------------
create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  phone text not null,
  email text not null,
  relationship text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint emergency_contacts_email_shape
    check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

alter table public.emergency_contacts add column if not exists relationship text;
alter table public.emergency_contacts add column if not exists updated_at timestamptz;

update public.emergency_contacts
set relationship = coalesce(relationship, ''),
    updated_at = coalesce(updated_at, created_at, now());

alter table public.emergency_contacts alter column relationship set default '';
alter table public.emergency_contacts alter column updated_at set default now();
alter table public.emergency_contacts alter column relationship set not null;
alter table public.emergency_contacts alter column updated_at set not null;

create index if not exists emergency_contacts_user_id_idx
on public.emergency_contacts(user_id);

create index if not exists emergency_contacts_user_created_at_idx
on public.emergency_contacts(user_id, created_at);

alter table public.emergency_contacts enable row level security;

drop policy if exists "emergency_contacts_select_own" on public.emergency_contacts;
drop policy if exists "emergency_contacts_insert_own" on public.emergency_contacts;
drop policy if exists "emergency_contacts_update_own" on public.emergency_contacts;
drop policy if exists "emergency_contacts_delete_own" on public.emergency_contacts;
drop policy if exists "Users can manage their own emergency contacts" on public.emergency_contacts;

create policy "emergency_contacts_select_own"
on public.emergency_contacts
for select
to authenticated
using (auth.uid() = user_id);

create policy "emergency_contacts_insert_own"
on public.emergency_contacts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "emergency_contacts_update_own"
on public.emergency_contacts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "emergency_contacts_delete_own"
on public.emergency_contacts
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists emergency_contacts_set_updated_at on public.emergency_contacts;
create trigger emergency_contacts_set_updated_at
before update on public.emergency_contacts
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Alerts
-- Used by src/lib/sos.ts and src/routes/history.tsx.
-- ---------------------------------------------------------
create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  latitude double precision,
  longitude double precision,
  location_url text,
  recipients jsonb not null default '[]'::jsonb,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint alerts_recipients_array
    check (jsonb_typeof(recipients) = 'array'),
  constraint alerts_status_allowed
    check (status in ('sent', 'failed', 'pending'))
);

alter table public.alerts add column if not exists updated_at timestamptz;

update public.alerts
set updated_at = coalesce(updated_at, created_at, now());

alter table public.alerts alter column updated_at set default now();
alter table public.alerts alter column updated_at set not null;

create index if not exists alerts_user_id_idx
on public.alerts(user_id);

create index if not exists alerts_user_created_at_idx
on public.alerts(user_id, created_at desc);

alter table public.alerts enable row level security;

drop policy if exists "alerts_select_own" on public.alerts;
drop policy if exists "alerts_insert_own" on public.alerts;
drop policy if exists "alerts_update_own" on public.alerts;
drop policy if exists "alerts_delete_own" on public.alerts;
drop policy if exists "Users can manage their own alerts" on public.alerts;

create policy "alerts_select_own"
on public.alerts
for select
to authenticated
using (auth.uid() = user_id);

create policy "alerts_insert_own"
on public.alerts
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "alerts_update_own"
on public.alerts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "alerts_delete_own"
on public.alerts
for delete
to authenticated
using (auth.uid() = user_id);

drop trigger if exists alerts_set_updated_at on public.alerts;
create trigger alerts_set_updated_at
before update on public.alerts
for each row
execute function public.set_updated_at();

-- ---------------------------------------------------------
-- Auth Trigger
-- Creates a profile immediately after a Supabase Auth signup.
-- Signup passes full_name in user metadata from src/routes/signup.tsx.
-- ---------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
  set full_name = excluded.full_name,
      updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- ---------------------------------------------------------
-- Grants
-- RLS still controls row access; these grants allow the Supabase
-- authenticated role to use the public tables.
-- ---------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.emergency_contacts to authenticated;
grant select, insert, update, delete on public.alerts to authenticated;
grant usage on all sequences in schema public to authenticated;

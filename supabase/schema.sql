-- ============================================================
-- FormFlow — Supabase Schema v2
-- Drop existing tables first if upgrading, then re-run
-- ============================================================

create extension if not exists "uuid-ossp";

-- User Profiles
create table if not exists public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  role        text not null default 'viewer',
  invited_by  uuid references auth.users(id),
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Forms
create table if not exists public.forms (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  name         text not null default 'Untitled Form',
  description  text,
  category     text not null default 'contact',
  fields       jsonb not null default '[]',
  theme        jsonb not null default '{}',
  automations  jsonb not null default '[]',
  is_published boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Responses
create table if not exists public.responses (
  id           uuid primary key default uuid_generate_v4(),
  form_id      uuid references public.forms(id) on delete cascade not null,
  data         jsonb not null default '{}',
  submitted_at timestamptz not null default now(),
  ip_address   text,
  user_agent   text
);

-- Automation Logs
create table if not exists public.automation_logs (
  id              uuid primary key default uuid_generate_v4(),
  form_id         uuid references public.forms(id) on delete cascade not null,
  response_id     uuid references public.responses(id) on delete cascade not null,
  automation_type text not null,
  status          text not null default 'pending',
  payload         jsonb,
  error           text,
  created_at      timestamptz not null default now()
);

-- Indexes
create index if not exists idx_forms_user    on public.forms(user_id);
create index if not exists idx_resp_form     on public.responses(form_id);
create index if not exists idx_resp_time     on public.responses(submitted_at desc);
create index if not exists idx_logs_form     on public.automation_logs(form_id);

-- updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

drop trigger if exists forms_updated_at    on public.forms;
drop trigger if exists profiles_updated_at on public.user_profiles;
create trigger forms_updated_at    before update on public.forms           for each row execute procedure public.handle_updated_at();
create trigger profiles_updated_at before update on public.user_profiles   for each row execute procedure public.handle_updated_at();

-- Auto-create profile: first user = admin, rest = viewer
create or replace function public.handle_new_user()
returns trigger as $$
declare user_role text;
begin
  select case when count(*) = 0 then 'admin' else 'viewer' end into user_role from public.user_profiles;
  insert into public.user_profiles (id, email, role) values (new.id, new.email, user_role) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- RLS
alter table public.user_profiles   enable row level security;
alter table public.forms           enable row level security;
alter table public.responses       enable row level security;
alter table public.automation_logs enable row level security;

drop policy if exists "admin_all_profiles"     on public.user_profiles;
drop policy if exists "user_own_profile"       on public.user_profiles;
drop policy if exists "staff_manage_forms"     on public.forms;
drop policy if exists "viewer_read_forms"      on public.forms;
drop policy if exists "staff_read_responses"   on public.responses;
drop policy if exists "public_submit"          on public.responses;
drop policy if exists "staff_logs"             on public.automation_logs;

create policy "admin_all_profiles"   on public.user_profiles for all    using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'admin'));
create policy "user_own_profile"     on public.user_profiles for select using (id = auth.uid());
create policy "staff_manage_forms"   on public.forms         for all    using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','editor')));
create policy "viewer_read_forms"    on public.forms         for select using (exists (select 1 from public.user_profiles where id = auth.uid() and role = 'viewer'));
create policy "staff_read_responses" on public.responses     for select using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','editor','viewer')));
create policy "public_submit"        on public.responses     for insert with check (exists (select 1 from public.forms where forms.id = form_id and forms.is_published = true));
create policy "staff_logs"           on public.automation_logs for all  using (exists (select 1 from public.user_profiles where id = auth.uid() and role in ('admin','editor')));

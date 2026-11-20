-- Pehla Qadam: one table. Only the server (service role key) touches it.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  email text not null unique,
  name text not null,
  lang text not null default 'ur' check (lang in ('en','ur')),
  lesson_day smallint not null default 0 check (lesson_day between 0 and 6),
  answers jsonb not null,
  route text check (route in ('fund','bank','gold')),
  next_week smallint not null default 2,
  last_sent_at timestamptz,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  -- Pricing. The plan is only ever changed on the server or by hand in Supabase, never by the client.
  plan text not null default 'free' check (plan in ('free','plus','teams')),
  plan_requested text,
  plan_requested_at timestamptz,
  chat_day date,                              -- Asia/Karachi day of the last counted chat message
  chat_count int not null default 0,          -- user messages sent on chat_day (free plan limit)
  last_checkin_at timestamptz                 -- last monthly plan check-in email (plus and teams only)
);

-- Row level security on, with no policies: the public anon key can read or write nothing.
alter table public.profiles enable row level security;

-- MIGRATION for a database created before pricing existed. Safe to run more than once.
alter table public.profiles add column if not exists plan text not null default 'free' check (plan in ('free','plus','teams'));
alter table public.profiles add column if not exists plan_requested text;
alter table public.profiles add column if not exists plan_requested_at timestamptz;
alter table public.profiles add column if not exists chat_day date;
alter table public.profiles add column if not exists chat_count int not null default 0;
alter table public.profiles add column if not exists last_checkin_at timestamptz;

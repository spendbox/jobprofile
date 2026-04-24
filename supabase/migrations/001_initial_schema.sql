-- ============================================================
-- TalentDeck — Initial Schema
-- ============================================================

-- ----------------------------------------------------------------
-- Extensions
-- ----------------------------------------------------------------
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------

-- User metadata (extends auth.users 1-to-1)
create table public.user_profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null,
  user_role      text not null check (user_role in ('talent', 'employer')),
  company_name   text,
  avatar_url     text,
  created_at     timestamptz default now() not null
);

-- Talent role profiles (one user can have many)
create table public.profiles (
  id                      uuid primary key default gen_random_uuid(),
  user_id                 uuid not null references auth.users(id) on delete cascade,
  role_title              text not null,
  bio                     text,
  skills                  text[]   not null default '{}',
  years_experience        integer  not null default 0,
  salary_expectation      integer,
  location                text,
  timezone                text,
  availability_status     text     not null default 'open'
                            check (availability_status in ('available', 'open', 'not_looking')),
  portfolio_url           text,
  cv_url                  text,
  intro_video_url         text,
  profile_views           integer  not null default 0,
  times_shown             integer  not null default 0,
  availability_updated_at timestamptz not null default now(),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

-- Interview requests (employer → talent profile)
create table public.interview_requests (
  id          uuid primary key default gen_random_uuid(),
  employer_id uuid not null references auth.users(id) on delete cascade,
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'pending'
                check (status in ('pending', 'accepted', 'declined')),
  stage       text not null default 'discovered'
                check (stage in ('discovered', 'interested', 'interview', 'offer', 'hired')),
  message     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (employer_id, profile_id)
);

-- Profile view log
create table public.profile_views (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  viewer_id  uuid references auth.users(id),
  viewed_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------
create index profiles_user_id_idx    on public.profiles (user_id);
create index profiles_role_title_idx on public.profiles using gin (to_tsvector('english', role_title));
create index profiles_skills_idx     on public.profiles using gin (skills);
create index profiles_exposure_idx   on public.profiles (times_shown, availability_updated_at desc);

create index interview_requests_employer_idx on public.interview_requests (employer_id);
create index interview_requests_profile_idx  on public.interview_requests (profile_id);

-- ----------------------------------------------------------------
-- Triggers — updated_at
-- ----------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create trigger trg_interview_requests_updated_at
  before update on public.interview_requests
  for each row execute procedure public.set_updated_at();

-- ----------------------------------------------------------------
-- Trigger — increment profile_views on insert into profile_views
-- ----------------------------------------------------------------
create or replace function public.inc_profile_views()
returns trigger language plpgsql security definer as $$
begin
  update public.profiles set profile_views = profile_views + 1 where id = new.profile_id;
  return new;
end;
$$;

create trigger trg_profile_view_count
  after insert on public.profile_views
  for each row execute procedure public.inc_profile_views();

-- ----------------------------------------------------------------
-- RPC — increment times_shown (called by search results)
-- ----------------------------------------------------------------
create or replace function public.increment_times_shown(profile_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.profiles set times_shown = times_shown + 1 where id = profile_id;
end;
$$;

-- ----------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------
alter table public.user_profiles      enable row level security;
alter table public.profiles           enable row level security;
alter table public.interview_requests enable row level security;
alter table public.profile_views      enable row level security;

-- user_profiles
create policy "Public read"          on public.user_profiles for select using (true);
create policy "Owner insert"         on public.user_profiles for insert with check (auth.uid() = id);
create policy "Owner update"         on public.user_profiles for update using (auth.uid() = id);

-- profiles
create policy "Public read profiles" on public.profiles for select using (true);
create policy "Owner insert profile" on public.profiles for insert with check (auth.uid() = user_id);
create policy "Owner update profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Owner delete profile" on public.profiles for delete using (auth.uid() = user_id);

-- interview_requests
create policy "View own requests" on public.interview_requests
  for select using (
    auth.uid() = employer_id
    or profile_id in (select id from public.profiles where user_id = auth.uid())
  );

create policy "Employer insert request" on public.interview_requests
  for insert with check (auth.uid() = employer_id);

create policy "Update own request" on public.interview_requests
  for update using (
    auth.uid() = employer_id
    or profile_id in (select id from public.profiles where user_id = auth.uid())
  );

-- profile_views
create policy "Anyone insert view" on public.profile_views
  for insert with check (true);

create policy "Profile owner reads views" on public.profile_views
  for select using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
  );

-- ----------------------------------------------------------------
-- Storage buckets
-- ----------------------------------------------------------------
insert into storage.buckets (id, name, public)
values
  ('cvs',     'cvs',     true),
  ('avatars', 'avatars', true),
  ('videos',  'videos',  true)
on conflict (id) do nothing;

-- Storage policies
create policy "Auth upload CVs"     on storage.objects for insert
  with check (bucket_id = 'cvs' and auth.role() = 'authenticated');
create policy "Public read CVs"     on storage.objects for select
  using (bucket_id = 'cvs');

create policy "Auth upload avatars" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.role() = 'authenticated');
create policy "Public read avatars" on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Auth upload videos"  on storage.objects for insert
  with check (bucket_id = 'videos' and auth.role() = 'authenticated');
create policy "Public read videos"  on storage.objects for select
  using (bucket_id = 'videos');

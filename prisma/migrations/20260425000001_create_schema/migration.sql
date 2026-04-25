-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tables
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  user_role    TEXT NOT NULL CHECK (user_role IN ('talent', 'employer')),
  company_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_title              TEXT NOT NULL,
  bio                     TEXT,
  skills                  TEXT[] NOT NULL DEFAULT '{}',
  years_experience        INTEGER NOT NULL DEFAULT 0,
  salary_expectation      INTEGER,
  location                TEXT,
  timezone                TEXT,
  availability_status     TEXT NOT NULL DEFAULT 'open'
                            CHECK (availability_status IN ('available', 'open', 'not_looking')),
  portfolio_url           TEXT,
  cv_url                  TEXT,
  intro_video_url         TEXT,
  profile_views           INTEGER NOT NULL DEFAULT 0,
  times_shown             INTEGER NOT NULL DEFAULT 0,
  availability_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.interview_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'accepted', 'declined')),
  stage       TEXT NOT NULL DEFAULT 'discovered'
                CHECK (stage IN ('discovered', 'interested', 'interview', 'offer', 'hired')),
  message     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (employer_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.profile_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewer_id  UUID REFERENCES auth.users(id),
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS profiles_user_id_idx         ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS profiles_role_title_idx      ON public.profiles USING GIN (to_tsvector('english', role_title));
CREATE INDEX IF NOT EXISTS profiles_skills_idx          ON public.profiles USING GIN (skills);
CREATE INDEX IF NOT EXISTS profiles_exposure_idx        ON public.profiles (times_shown, availability_updated_at DESC);
CREATE INDEX IF NOT EXISTS ir_employer_idx              ON public.interview_requests (employer_id);
CREATE INDEX IF NOT EXISTS ir_profile_idx               ON public.interview_requests (profile_id);

-- Functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.inc_profile_views()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET profile_views = profile_views + 1 WHERE id = NEW.profile_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_times_shown(profile_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles SET times_shown = times_shown + 1 WHERE id = profile_id;
END;
$$;

-- Triggers (drop first for idempotency)
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_interview_requests_updated_at ON public.interview_requests;
CREATE TRIGGER trg_interview_requests_updated_at
  BEFORE UPDATE ON public.interview_requests
  FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profile_view_count ON public.profile_views;
CREATE TRIGGER trg_profile_view_count
  AFTER INSERT ON public.profile_views
  FOR EACH ROW EXECUTE PROCEDURE public.inc_profile_views();

-- RLS
ALTER TABLE public.user_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views      ENABLE ROW LEVEL SECURITY;

-- Policies — user_profiles
DROP POLICY IF EXISTS "Public read"  ON public.user_profiles;
CREATE POLICY "Public read"          ON public.user_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner insert" ON public.user_profiles;
CREATE POLICY "Owner insert"         ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Owner update" ON public.user_profiles;
CREATE POLICY "Owner update"         ON public.user_profiles FOR UPDATE USING (auth.uid() = id);

-- Policies — profiles
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
CREATE POLICY "Public read profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Owner insert profile" ON public.profiles;
CREATE POLICY "Owner insert profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner update profile" ON public.profiles;
CREATE POLICY "Owner update profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Owner delete profile" ON public.profiles;
CREATE POLICY "Owner delete profile" ON public.profiles FOR DELETE USING (auth.uid() = user_id);

-- Policies — interview_requests
DROP POLICY IF EXISTS "View own requests" ON public.interview_requests;
CREATE POLICY "View own requests" ON public.interview_requests
  FOR SELECT USING (
    auth.uid() = employer_id
    OR profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Employer insert request" ON public.interview_requests;
CREATE POLICY "Employer insert request" ON public.interview_requests
  FOR INSERT WITH CHECK (auth.uid() = employer_id);

DROP POLICY IF EXISTS "Update own request" ON public.interview_requests;
CREATE POLICY "Update own request" ON public.interview_requests
  FOR UPDATE USING (
    auth.uid() = employer_id
    OR profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Policies — profile_views
DROP POLICY IF EXISTS "Anyone insert view" ON public.profile_views;
CREATE POLICY "Anyone insert view" ON public.profile_views
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Profile owner reads views" ON public.profile_views;
CREATE POLICY "Profile owner reads views" ON public.profile_views
  FOR SELECT USING (
    profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('cvs',     'cvs',     true),
  ('avatars', 'avatars', true),
  ('videos',  'videos',  true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Auth upload CVs"  ON storage.objects;
CREATE POLICY "Auth upload CVs"          ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cvs' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read CVs"  ON storage.objects;
CREATE POLICY "Public read CVs"          ON storage.objects FOR SELECT
  USING (bucket_id = 'cvs');

DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
CREATE POLICY "Auth upload avatars"         ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"         ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth upload videos" ON storage.objects;
CREATE POLICY "Auth upload videos"         ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Public read videos" ON storage.objects;
CREATE POLICY "Public read videos"         ON storage.objects FOR SELECT
  USING (bucket_id = 'videos');

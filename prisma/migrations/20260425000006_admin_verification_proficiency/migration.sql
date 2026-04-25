-- Verification fields on user_profiles
ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz;

-- Proficiency tests (admin-managed, RLS blocks public SELECT)
CREATE TABLE IF NOT EXISTS public.proficiency_tests (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title              text        NOT NULL,
  description        text,
  skill_category     text        NOT NULL,
  questions          jsonb       NOT NULL DEFAULT '[]',
  passing_score      integer     NOT NULL DEFAULT 70,
  time_limit_minutes integer     NOT NULL DEFAULT 30,
  is_active          boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.proficiency_tests ENABLE ROW LEVEL SECURITY;
-- No public SELECT policy — talent accesses via SECURITY DEFINER functions
-- Admin uses service role which bypasses RLS

-- Test attempts
CREATE TABLE IF NOT EXISTS public.test_attempts (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid        NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  test_id      uuid        NOT NULL REFERENCES public.proficiency_tests(id) ON DELETE CASCADE,
  score        integer     NOT NULL,
  passed       boolean     NOT NULL,
  answers      jsonb       NOT NULL DEFAULT '{}',
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, test_id)
);

ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "attempts_own_select" ON public.test_attempts;
CREATE POLICY "attempts_own_select" ON public.test_attempts
  FOR SELECT USING (user_id = auth.uid());

-- List available tests (no questions, no correct answers)
CREATE OR REPLACE FUNCTION public.get_available_tests()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'id',                 id,
        'title',              title,
        'description',        description,
        'skill_category',     skill_category,
        'question_count',     jsonb_array_length(questions),
        'passing_score',      passing_score,
        'time_limit_minutes', time_limit_minutes,
        'created_at',         created_at
      ) ORDER BY created_at DESC
    ), '[]'::jsonb)
    FROM public.proficiency_tests
    WHERE is_active = true
  );
END;
$$;

-- Get a single test for taking — strips correct answers
CREATE OR REPLACE FUNCTION public.get_test_for_attempt(p_test_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_test public.proficiency_tests%ROWTYPE;
  v_questions jsonb;
BEGIN
  SELECT * INTO v_test
  FROM public.proficiency_tests
  WHERE id = p_test_id AND is_active = true;

  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT COALESCE(jsonb_agg(q - 'correct' ORDER BY ordinality), '[]'::jsonb)
  INTO v_questions
  FROM jsonb_array_elements(v_test.questions) WITH ORDINALITY AS t(q, ordinality);

  RETURN jsonb_build_object(
    'id',                 v_test.id,
    'title',              v_test.title,
    'description',        v_test.description,
    'skill_category',     v_test.skill_category,
    'questions',          v_questions,
    'passing_score',      v_test.passing_score,
    'time_limit_minutes', v_test.time_limit_minutes
  );
END;
$$;

-- Score and store a test attempt (correct answers never exposed to client)
CREATE OR REPLACE FUNCTION public.submit_test_attempt(
  p_test_id uuid,
  p_answers  jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_test          public.proficiency_tests%ROWTYPE;
  v_question      jsonb;
  v_correct_count integer := 0;
  v_total         integer;
  v_score         integer;
  v_passed        boolean;
BEGIN
  SELECT * INTO v_test
  FROM public.proficiency_tests
  WHERE id = p_test_id AND is_active = true;

  IF NOT FOUND THEN RAISE EXCEPTION 'Test not found'; END IF;

  v_total := jsonb_array_length(v_test.questions);

  FOR v_question IN SELECT value FROM jsonb_array_elements(v_test.questions) LOOP
    IF (p_answers->>(v_question->>'id'))::integer = (v_question->>'correct')::integer THEN
      v_correct_count := v_correct_count + 1;
    END IF;
  END LOOP;

  v_score  := CASE WHEN v_total > 0 THEN ROUND((v_correct_count::decimal / v_total) * 100) ELSE 0 END;
  v_passed := v_score >= v_test.passing_score;

  INSERT INTO public.test_attempts (user_id, test_id, score, passed, answers)
  VALUES (auth.uid(), p_test_id, v_score, v_passed, p_answers)
  ON CONFLICT (user_id, test_id) DO UPDATE SET
    score        = EXCLUDED.score,
    passed       = EXCLUDED.passed,
    answers      = EXCLUDED.answers,
    completed_at = now();

  RETURN jsonb_build_object(
    'score',           v_score,
    'passed',          v_passed,
    'correct_count',   v_correct_count,
    'total_questions', v_total
  );
END;
$$;

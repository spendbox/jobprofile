-- Public function: get passed proficiency tests for a user (used on public profile pages)
-- Returns only passed attempts with safe metadata — never exposes questions or correct answers
CREATE OR REPLACE FUNCTION public.get_passed_tests_for_user(p_user_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(
      jsonb_build_object(
        'test_id',        ta.test_id,
        'score',          ta.score,
        'completed_at',   ta.completed_at,
        'title',          pt.title,
        'skill_category', pt.skill_category
      ) ORDER BY ta.completed_at DESC
    ), '[]'::jsonb)
    FROM public.test_attempts ta
    JOIN public.proficiency_tests pt ON pt.id = ta.test_id
    WHERE ta.user_id = p_user_id
      AND ta.passed = true
      AND pt.is_active = true
  );
END;
$$;

-- Policy: talent can update their own user_profile fields (name, avatar, company_name)
DROP POLICY IF EXISTS "user_profiles_own_update" ON public.user_profiles;
CREATE POLICY "user_profiles_own_update" ON public.user_profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

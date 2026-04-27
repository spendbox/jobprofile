-- Drop proficiency test system
DROP FUNCTION IF EXISTS public.get_passed_tests_for_user(uuid);
DROP FUNCTION IF EXISTS public.submit_test_attempt(uuid, jsonb);
DROP FUNCTION IF EXISTS public.get_test_for_attempt(uuid);
DROP FUNCTION IF EXISTS public.get_available_tests();
DROP TABLE IF EXISTS public.test_attempts CASCADE;
DROP TABLE IF EXISTS public.proficiency_tests CASCADE;

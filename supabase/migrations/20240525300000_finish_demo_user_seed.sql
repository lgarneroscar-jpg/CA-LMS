-- Finish demo@corpacad.com → Demo Preview with realistic seed progress
-- Requires auth user demo@corpacad.com to exist

UPDATE public.profiles
SET
  institution_id = (SELECT id FROM institutions WHERE name = 'Demo Preview' LIMIT 1),
  role = 'student',
  is_demo = true,
  full_name = 'Demo Student',
  xp = 280,
  streak_days = 12,
  last_active_date = CURRENT_DATE,
  onboarding_complete = true,
  diagnostic_complete = true,
  rank = 2
WHERE id = (SELECT id FROM auth.users WHERE email = 'demo@corpacad.com' LIMIT 1);

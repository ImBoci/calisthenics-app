-- ==============================================================================
-- CALISTHENICS SQUAD APP - STAGE 1 SUPABASE SCHEMA
-- Optimized for 3-friend Calisthenics squad tracking
-- ==============================================================================

-- 1. Create profiles table linked to Supabase auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  starting_level TEXT DEFAULT 'Beginner',
  favorite_exercise TEXT DEFAULT 'Pull-ups',
  
  -- Future-proofing fields for Stage 2 & 3 (Leaderboards & Points)
  total_xp INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Squad members can view each other's profiles (needed for squad leaderboard)
CREATE POLICY "Public profiles are viewable by authenticated users" 
ON public.profiles 
FOR SELECT 
TO authenticated 
USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = id);

-- 4. Trigger: Automatically insert profile when a new user signs up via Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    username, 
    display_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it already exists before recreating
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- FUTURE STAGE 2 & 3 PREPARED SCHEMA (Ready to uncomment when building Stage 2)
-- ==============================================================================

/*
-- STAGE 2: WORKOUT LOGS
CREATE TABLE IF NOT EXISTS public.workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  workout_date DATE DEFAULT CURRENT_DATE NOT NULL,
  notes TEXT,
  points_earned INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workout_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES public.workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL, -- e.g. "Pull-ups", "Dips", "Push-ups"
  reps INTEGER NOT NULL,
  weight_added_kg NUMERIC DEFAULT 0,
  set_number INTEGER NOT NULL
);

-- STAGE 3: LEADERBOARD VIEW
CREATE OR REPLACE VIEW public.squad_leaderboard AS
SELECT 
  p.id,
  p.username,
  p.display_name,
  p.avatar_url,
  p.total_xp,
  p.streak_days,
  COUNT(w.id) as total_workouts
FROM public.profiles p
LEFT JOIN public.workout_logs w ON p.id = w.user_id
GROUP BY p.id
ORDER BY p.total_xp DESC;
*/


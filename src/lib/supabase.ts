import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = 
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  !supabaseUrl.includes('placeholder')
);

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY) are missing. Check your .env.local file.'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
);

export const ADMIN_EMAIL = 'vargadaniel001@gmail.com';

export const SECTIONS = [
  'warmup',
  'joint_prep',
  'static',
  'dynamic',
  'stretching'
] as const;

export type ExerciseSection = typeof SECTIONS[number];

// Display labels for UI
export const SECTION_LABELS: Record<ExerciseSection, string> = {
  warmup: 'Warmup',
  joint_prep: 'Joint Preparation',
  static: 'Static Exercises',
  dynamic: 'Dynamic Exercises',
  stretching: 'Stretching',
};
export type MetricType = 'reps' | 'time';

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  starting_level?: string;
  favorite_exercise?: string;
  total_xp?: number;
  created_at: string;
  updated_at?: string;
}

export interface Exercise {
  id: string;
  name: string;
  name_en?: string;
  section: ExerciseSection;
  metric_type: MetricType;
  created_at?: string;
}

export interface ExerciseSuggestion {
  id: string;
  user_id: string;
  user_email: string;
  exercise_name: string;
  suggested_section: ExerciseSection;
  metric_type: MetricType;
  notes?: string;
  created_at?: string;
}

export interface UserPB {
  id: string;
  user_id: string;
  exercise_id: string;
  best_value: number;
  is_assisted: boolean;
  assist_notes?: string;
  achieved_at?: string;
  updated_at?: string;
  exercise?: Exercise;
}

export interface WorkoutPlanItem {
  id: string;
  plan_id: string;
  exercise_id: string;
  order_index: number;
  exercise?: Exercise;
}

export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  items?: WorkoutPlanItem[];
}

export interface WorkoutLog {
  id: string;
  user_id: string;
  completed_at: string;
  plan_id?: string;
}

/** Competitive sections shown on the Leaderboard */
export const COMPETITIVE_SECTIONS: ExerciseSection[] = [
  'static',
  'dynamic',
];

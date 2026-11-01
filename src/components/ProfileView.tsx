import React, { useEffect, useState } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { ThemeToggle } from './ThemeToggle';
import { 
  LogOut, 
  Dumbbell, 
  Award, 
  Calendar, 
  Flame, 
  Check, 
  Pencil, 
  UserCircle2 
} from 'lucide-react';

interface ProfileViewProps {
  onLogout: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [favoriteExercise, setFavoriteExercise] = useState('Pull-ups');
  const [startingLevel, setStartingLevel] = useState('Beginner');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setFavoriteExercise(data.favorite_exercise || 'Pull-ups');
        setStartingLevel(data.starting_level || 'Beginner');
      } else {
        // Fallback to user metadata if profile row isn't created yet
        const meta = user.user_metadata || {};
        const fallback: Profile = {
          id: user.id,
          username: meta.username || user.email?.split('@')[0] || 'athlete',
          display_name: meta.display_name || 'Athlete',
          favorite_exercise: 'Pull-ups',
          starting_level: 'Beginner',
          created_at: user.created_at,
        };
        setProfile(fallback);
        setDisplayName(fallback.display_name);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setFeedbackMsg(null);
    try {
      const updates = {
        id: profile.id,
        display_name: displayName.trim(),
        favorite_exercise: favoriteExercise,
        starting_level: startingLevel,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(updates);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditing(false);
      setFeedbackMsg('Profile updated!');
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFeedbackMsg(`Save error: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'C';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formattedDate = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric',
      })
    : 'Recently';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-retro-day-accent dark:border-retro-night-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-4 pb-24 pt-4">
      {/* Top Header Card */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-retro-day-accent dark:text-retro-night-accent">
            Stage 1 Squad
          </span>
          <h2 className="text-xl font-bold text-retro-day-text dark:text-retro-night-text">
            Athlete Card
          </h2>
        </div>
        <ThemeToggle />
      </div>

      {feedbackMsg && (
        <div className="mb-4 p-3 rounded-xl bg-retro-day-accentSoft dark:bg-retro-night-accentSoft border border-retro-day-accent/30 dark:border-retro-night-accent/30 text-retro-day-text dark:text-retro-night-text text-xs flex items-center justify-between">
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Main Profile Badge Card */}
      <div className="bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-6 border-2 border-retro-day-border dark:border-retro-night-border shadow-[0_4px_24px_-4px_rgba(74,55,40,0.08)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.6)] relative overflow-hidden">
        {/* Subtle retro badge background decoration */}
        <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-retro-day-accentSoft/60 dark:bg-retro-night-accentSoft/30 pointer-events-none" />

        <div className="flex items-center gap-4 relative">
          {/* Avatar with retro ring */}
          <div className="relative">
            <div className="w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border-2 border-retro-day-borderStrong/40 dark:border-retro-night-borderStrong flex items-center justify-center shadow-inner text-retro-day-text dark:text-retro-night-text font-bold text-2xl font-mono">
              {getInitials(profile?.display_name || profile?.username)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-retro-day-accent dark:bg-retro-night-accent text-white p-1 rounded-full shadow">
              <Flame className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Display Name"
                className="w-full text-lg font-bold bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-lg px-2 py-1 text-retro-day-text dark:text-retro-night-text"
              />
            ) : (
              <h3 className="text-xl font-bold text-retro-day-text dark:text-retro-night-text truncate font-sans">
                {profile?.display_name || 'Athlete'}
              </h3>
            )}
            <p className="text-sm font-mono text-retro-day-textMuted dark:text-retro-night-textMuted truncate">
              @{profile?.username || 'member'}
            </p>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-retro-day-accentSoft dark:bg-retro-night-accentSoft text-retro-day-text dark:text-retro-night-text border border-retro-day-accent/20 dark:border-retro-night-accent/20">
              <Award className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
              <span>Squad Member</span>
            </div>
          </div>
        </div>

        {/* Calisthenics Starter Stats */}
        <div className="mt-6 pt-5 border-t border-retro-day-border dark:border-retro-night-border grid grid-cols-2 gap-3">
          {/* Starting Level */}
          <div className="p-3 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/80 dark:border-retro-night-border/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted block mb-1">
              Starting Level
            </span>
            {editing ? (
              <select
                value={startingLevel}
                onChange={e => setStartingLevel(e.target.value)}
                className="w-full text-xs font-bold bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border rounded p-1 text-retro-day-text dark:text-retro-night-text"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Beast Mode">Beast Mode</option>
              </select>
            ) : (
              <p className="text-sm font-bold text-retro-day-text dark:text-retro-night-text flex items-center gap-1.5">
                <Award className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent" />
                {profile?.starting_level || 'Beginner'}
              </p>
            )}
          </div>

          {/* Favorite Exercise */}
          <div className="p-3 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/80 dark:border-retro-night-border/80">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted block mb-1">
              Favorite Move
            </span>
            {editing ? (
              <select
                value={favoriteExercise}
                onChange={e => setFavoriteExercise(e.target.value)}
                className="w-full text-xs font-bold bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border rounded p-1 text-retro-day-text dark:text-retro-night-text"
              >
                <option value="Pull-ups">Pull-ups</option>
                <option value="Dips">Dips</option>
                <option value="Push-ups">Push-ups</option>
                <option value="Muscle-ups">Muscle-ups</option>
                <option value="Handstands">Handstands</option>
                <option value="Pistol Squats">Pistol Squats</option>
              </select>
            ) : (
              <p className="text-sm font-bold text-retro-day-text dark:text-retro-night-text flex items-center gap-1.5 truncate">
                <Dumbbell className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent shrink-0" />
                <span className="truncate">{profile?.favorite_exercise || 'Pull-ups'}</span>
              </p>
            )}
          </div>
        </div>

        {/* Member Since Footnote */}
        <div className="mt-4 flex items-center justify-between text-xs text-retro-day-textMuted dark:text-retro-night-textMuted">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            Joined {formattedDate}
          </span>
          <button
            onClick={() => {
              if (editing) {
                handleSave();
              } else {
                setEditing(true);
              }
            }}
            disabled={saving}
            className="flex items-center gap-1 text-retro-day-accent dark:text-retro-night-accent font-semibold hover:underline active:scale-95 transition-transform"
          >
            {editing ? (
              <>
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Done'}
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" /> Edit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stage Roadmap Peek */}
      <div className="mt-5 p-4 rounded-2xl bg-retro-day-cardAlt/80 dark:bg-retro-night-cardAlt/60 border border-retro-day-border dark:border-retro-night-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-2">
          <UserCircle2 className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent" />
          <span>Stage 2 & 3 Roadmap</span>
        </div>
        <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted leading-relaxed">
          Your profile schema is linked and ready for Workout Logs, Daily Calisthenics Streaks, and 3-Player Squad Leaderboard Points!
        </p>
      </div>

      {/* Sign Out Button */}
      <div className="mt-6">
        <button
          onClick={onLogout}
          type="button"
          className="w-full py-3 px-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
        >
          <LogOut className="w-4 h-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};


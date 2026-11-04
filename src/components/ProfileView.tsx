import React, { useEffect, useState, useRef } from 'react';
import { supabase, Profile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { 
  LogOut, 
  Dumbbell, 
  Award, 
  Calendar as CalendarIcon, 
  Flame, 
  Check, 
  Pencil, 
  UserCircle2,
  ChevronLeft,
  ChevronRight,
  Camera,
  X
} from 'lucide-react';

interface ProfileViewProps {
  onLogout: () => void;
  currentUser?: User | null;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onLogout, currentUser }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [checkingIn, setCheckingIn] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [displayName, setDisplayName] = useState('');
  const [favoriteExercise, setFavoriteExercise] = useState('Pull-ups');
  const [startingLevel, setStartingLevel] = useState('Beginner');

  useEffect(() => {
    fetchProfile();
    fetchWorkoutDates();
  }, [currentUser]);

  const fetchWorkoutDates = async () => {
    if (!currentUser) return;
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', currentUser.id);
      if (error) throw error;
      const dates = (data || []).map(log => log.completed_at);
      setWorkoutDates(dates);
    } catch (err) {
      console.error('Error fetching workout dates:', err);
    }
  };

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

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;
    setSaving(true);
    setFeedbackMsg(null);
    try {
      console.log('Updating profile for user:', profile.id);
      const updates = {
        id: profile.id,
        display_name: displayName.trim(),
        favorite_exercise: favoriteExercise,
        starting_level: startingLevel,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(updates)
        .select();

      if (error) {
        console.error('Profile update error:', error);
        alert('Save error: ' + error.message);
        setFeedbackMsg('Save error: ' + error.message);
        return;
      }

      console.log('Profile saved successfully:', data);
      setProfile(prev => prev ? { ...prev, ...updates } : null);
      setEditing(false);
      setFeedbackMsg('Profile updated!');
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Profile save exception:', err);
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

  const handleCheckIn = async () => {
    if (!currentUser) return;
    setCheckingIn(true);
    try {
      const dateToLog = selectedDate || new Date();
      const dateStr = dateToLog.toISOString().split('T')[0];
      const existingLog = workoutDates.includes(dateStr);

      if (existingLog) {
        // Remove workout log
        const { error } = await supabase
          .from('workout_logs')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('completed_at', dateStr);
        if (error) throw error;
        setFeedbackMsg('Workout removed for this date');
      } else {
        // Add workout log
        const { error } = await supabase
          .from('workout_logs')
          .insert({
            user_id: currentUser.id,
            completed_at: dateStr,
          });
        if (error) throw error;
        setFeedbackMsg('Workout logged! 💪');
      }
      await fetchWorkoutDates();
      setSelectedDate(null);
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error('Error updating workout log:', err);
      setFeedbackMsg('Could not update workout log');
    } finally {
      setCheckingIn(false);
    }
  };

  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    const days = [];
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  };

  const isWorkoutDay = (day: number) => {
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return workoutDates.includes(dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentMonth.getMonth() === today.getMonth() &&
           currentMonth.getFullYear() === today.getFullYear();
  };

  const isFutureDate = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date > today;
  };

  const isSelectedDate = (day: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() &&
           currentMonth.getMonth() === selectedDate.getMonth() &&
           currentMonth.getFullYear() === selectedDate.getFullYear();
  };

  const handleDateClick = (day: number) => {
    if (isFutureDate(day)) return;
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(clickedDate);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      setFeedbackMsg('Avatar updated! 📸');
      setTimeout(() => setFeedbackMsg(null), 2500);
    } catch (err) {
      console.error('Error uploading avatar:', err);
      setFeedbackMsg('Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
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
    <div className="w-full max-w-md mx-auto pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Athlete Card Header */}
      <div className="mb-4">
        <h2 className="text-center text-xl font-extrabold uppercase tracking-[0.2em] text-retro-day-accent dark:text-retro-night-accent flex items-center justify-center gap-2">
          <UserCircle2 className="w-5 h-5" />
          Profile
        </h2>
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
            <div 
              onClick={editing ? triggerFileInput : undefined}
              className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border-2 border-retro-day-borderStrong/40 dark:border-retro-night-borderStrong flex items-center justify-center shadow-inner overflow-hidden ${editing ? 'cursor-pointer' : ''}`}
            >
              {profile?.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt="Avatar" 
                  className="object-cover w-full h-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-retro-day-text dark:text-retro-night-text font-bold text-2xl font-mono">
                  {getInitials(profile?.display_name || profile?.username)}
                </span>
              )}
              {editing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-2xl">
                <div className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-retro-day-accent dark:bg-retro-night-accent text-white p-1 rounded-full shadow">
              <Flame className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />

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
            <CalendarIcon className="w-3.5 h-3.5" />
            Joined {formattedDate}
          </span>
          <button
            type="button"
            onClick={(e) => {
              if (editing) {
                handleSave(e);
              } else {
                setEditing(true);
              }
            }}
            disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-retro-day-accent dark:text-retro-night-accent hover:underline active:scale-95 transition-transform"
          >
            {editing ? (
              <>
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Done'}
              </>
            ) : (
              <>
                <Pencil className="w-3.5 h-3.5" /> <span>Edit</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workout Activity Calendar */}
      <div className="mt-5 p-4 rounded-3xl bg-retro-day-card dark:bg-retro-night-card border-2 border-retro-day-border dark:border-retro-night-border shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-retro-day-accent dark:text-retro-night-accent" />
            <h3 className="text-sm font-bold text-retro-day-text dark:text-retro-night-text uppercase tracking-wide">
              Activity Calendar
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-lg bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text hover:border-retro-day-accent active:scale-95 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-retro-day-text dark:text-retro-night-text min-w-[100px] text-center">
              {currentMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-lg bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text hover:border-retro-day-accent active:scale-95 transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day} className="text-center text-[10px] font-bold text-retro-day-textMuted dark:text-retro-night-textMuted uppercase">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {getCalendarDays().map((day, idx) => {
            if (day === null) {
              return <div key={idx} className="aspect-square" />;
            }
            const hasWorkout = isWorkoutDay(day);
            const today = isToday(day);
            const future = isFutureDate(day);
            const selected = isSelectedDate(day);
            return (
              <button
                key={idx}
                onClick={() => handleDateClick(day)}
                disabled={future}
                className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  future
                    ? 'text-retro-day-textMuted/30 dark:text-retro-night-textMuted/30 cursor-not-allowed'
                    : hasWorkout
                    ? 'bg-retro-day-accent dark:bg-retro-night-accent text-white'
                    : selected
                    ? 'bg-retro-day-accentSoft/70 dark:bg-retro-night-accentSoft/50 text-retro-day-text dark:text-retro-night-text border-2 border-retro-day-accent dark:border-retro-night-accent'
                    : today
                    ? 'bg-retro-day-accentSoft/50 dark:bg-retro-night-accentSoft/30 text-retro-day-text dark:text-retro-night-text border border-retro-day-accent/30'
                    : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt text-retro-day-textMuted dark:text-retro-night-textMuted hover:bg-retro-day-cardAlt/80'
                }`}
              >
                {day}
              </button>
            );
          })}
        </div>

        {/* Check-in Button */}
        <button
          onClick={handleCheckIn}
          disabled={checkingIn}
          className="mt-3 w-full py-2.5 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          {checkingIn
            ? 'Saving...'
            : selectedDate
            ? (() => {
                const dateStr = selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const isLogged = workoutDates.includes(selectedDate.toISOString().split('T')[0]);
                return isLogged ? `Remove Workout for ${dateStr}` : `Log Workout for ${dateStr}`;
              })()
            : 'Check-in Today\'s Workout'}
        </button>
      </div>

      {/* Squad Card Footnote */}
      <div className="mt-5 p-4 rounded-2xl bg-retro-day-cardAlt/80 dark:bg-retro-night-cardAlt/60 border border-retro-day-border dark:border-retro-night-border">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-2">
          <UserCircle2 className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent" />
          <span>Squad Brotherhood</span>
        </div>
        <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted leading-relaxed">
          Log your personal bests, build custom workout plans, and compare progress with your friends on the squad leaderboard.
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


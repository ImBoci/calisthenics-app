import React, { useState, useEffect } from 'react';
import { supabase, Exercise, UserPB } from '../lib/supabase';
import { 
  X, 
  Award, 
  Calendar as CalendarIcon, 
  Trophy, 
  Flame, 
  ShieldCheck, 
  Clock, 
  Repeat, 
  ChevronLeft, 
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { calculateUserLevel, SquadLevelInfo, getSquadLevel } from '../utils/levelCalculator';

export interface FriendProfileData {
  id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
}

interface FriendProfileModalProps {
  friend: FriendProfileData | null;
  onClose: () => void;
  allCompetitiveExercises: Exercise[];
  allPbs: UserPB[];
}

export const FriendProfileModal: React.FC<FriendProfileModalProps> = ({
  friend,
  onClose,
  allCompetitiveExercises,
  allPbs,
}) => {
  const { t, language } = useLanguage();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<string[]>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(true);

  useEffect(() => {
    if (friend) {
      fetchFriendWorkoutLogs(friend.id);
    }
  }, [friend]);

  const fetchFriendWorkoutLogs = async (userId: string) => {
    setLoadingWorkouts(true);
    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', userId);

      if (error) throw error;
      setWorkoutDates((data || []).map(log => log.completed_at));
    } catch (err) {
      console.error('Error fetching friend workouts:', err);
      setWorkoutDates([]);
    } finally {
      setLoadingWorkouts(false);
    }
  };

  if (!friend) return null;

  // Filter friend's PBs
  const friendPbs = allPbs.filter(pb => pb.user_id === friend.id);
  const friendPbsMap: Record<string, UserPB> = {};
  friendPbs.forEach(pb => {
    friendPbsMap[pb.exercise_id] = pb;
  });

  // Calculate Friend's Calisthenics Level
  const pbsWithMetric = friendPbs.map(pb => {
    const ex = allCompetitiveExercises.find(e => e.id === pb.exercise_id);
    return {
      best_value: pb.best_value,
      is_assisted: pb.is_assisted,
      metric_type: ex?.metric_type || 'reps'
    };
  });
  const friendLevel: SquadLevelInfo = calculateUserLevel(pbsWithMetric, language);

  // Calendar helpers
  const getCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (number | null)[] = [];
    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6; // Monday = 0

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(i);
    }
    return days;
  };

  const isWorkoutDay = (day: number) => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutDates.includes(dateStr);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'A';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-md max-h-[90vh] bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-5 border-2 border-retro-day-border dark:border-retro-night-border shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-retro-day-border dark:border-retro-night-border shrink-0">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5 text-retro-day-accent dark:text-retro-night-accent" />
            <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text uppercase tracking-wider">
              {language === 'hu' ? 'Csapattárs Profilja' : 'Squad Mate Profile'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text dark:hover:text-retro-night-text hover:bg-retro-day-cardAlt dark:hover:bg-retro-night-cardAlt transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pt-3 pr-1 scrollbar-none">
          
          {/* Friend Profile Card */}
          <div className="p-4 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/80 dark:border-retro-night-border/80">
            <div className="flex items-center gap-3.5">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-retro-day-surface dark:bg-retro-night-surface border-2 border-retro-day-borderStrong/40 dark:border-retro-night-borderStrong flex items-center justify-center overflow-hidden shadow-inner">
                  {friend.avatar_url ? (
                    <img 
                      src={friend.avatar_url} 
                      alt="" 
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className="text-retro-day-text dark:text-retro-night-text font-bold text-xl font-mono">
                    {getInitials(friend.display_name || friend.username)}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 bg-retro-day-accent dark:bg-retro-night-accent text-white p-0.5 rounded-full shadow">
                  <Flame className="w-3 h-3 fill-current" />
                </div>
              </div>

              {/* Name & Username */}
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-bold text-retro-day-text dark:text-retro-night-text truncate font-sans">
                  {friend.display_name}
                </h4>
                <p className="text-xs font-mono text-retro-day-textMuted dark:text-retro-night-textMuted truncate">
                  @{friend.username}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-retro-day-accent dark:bg-retro-night-accent text-white font-mono shadow-sm">
                    {friendLevel.badge}
                  </span>
                  <span className="text-xs font-bold text-retro-day-accent dark:text-retro-night-accent truncate">
                    {friendLevel.title}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Read-Only Activity Calendar */}
          <div className="p-4 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/80 dark:border-retro-night-border/80">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent" />
                <h4 className="text-xs font-bold text-retro-day-text dark:text-retro-night-text uppercase tracking-wide">
                  {t.activityCalendar}
                </h4>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => navigateMonth(-1)}
                  className="p-1 rounded-lg bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text hover:border-retro-day-accent active:scale-95 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-bold text-retro-day-text dark:text-retro-night-text min-w-[85px] text-center">
                  {t.months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </span>
                <button
                  type="button"
                  onClick={() => navigateMonth(1)}
                  className="p-1 rounded-lg bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text hover:border-retro-day-accent active:scale-95 transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {loadingWorkouts ? (
              <div className="py-6 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border-2 border-retro-day-accent dark:border-retro-night-accent border-t-transparent animate-spin" />
              </div>
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-1.5">
                  {t.dayNamesShort.map((day, idx) => (
                    <div key={idx} className="text-center text-[9px] font-bold text-retro-day-textMuted dark:text-retro-night-textMuted uppercase">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {getCalendarDays().map((day, idx) => {
                    if (day === null) {
                      return <div key={idx} className="aspect-square" />;
                    }
                    const hasWorkout = isWorkoutDay(day);
                    return (
                      <div
                        key={idx}
                        className={`aspect-square rounded-lg flex items-center justify-center text-[11px] font-bold transition-all ${
                          hasWorkout
                            ? 'bg-retro-day-accent dark:bg-retro-night-accent text-white shadow-sm'
                            : 'bg-retro-day-card dark:bg-retro-night-card text-retro-day-textMuted/70 dark:text-retro-night-textMuted/70'
                        }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>

                {/* Workout Count Footnote */}
                <div className="mt-2 text-right">
                  <span className="text-[10px] font-mono text-retro-day-textMuted dark:text-retro-night-textMuted">
                    {workoutDates.length} {language === 'hu' ? 'naplózott edzés összesen' : 'logged workouts total'}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Personal Bests (PBs) List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-500" />
                {t.personalBests} ({friendPbs.length})
              </span>
            </div>

            {allCompetitiveExercises.length === 0 ? (
              <p className="text-xs text-retro-day-textMuted text-center py-4">
                {t.noExercisesFound}
              </p>
            ) : (
              <div className="space-y-1.5">
                {allCompetitiveExercises.map(ex => {
                  const pb = friendPbsMap[ex.id];
                  const hasRecord = Boolean(pb);

                  return (
                    <div
                      key={ex.id}
                      className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                        hasRecord
                          ? 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border-retro-day-border/80 dark:border-retro-night-border/80'
                          : 'bg-retro-day-card/50 dark:bg-retro-night-card/50 border-retro-day-border/40 dark:border-retro-night-border/40 opacity-60'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-retro-day-text dark:text-retro-night-text truncate">
                            {ex.name}
                          </span>
                        </div>
                        {hasRecord ? (
                          <div className="mt-0.5">
                            {pb.is_assisted ? (
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium truncate block">
                                {t.assisted}: {pb.assist_notes || 'Band'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-0.5 font-medium">
                                <ShieldCheck className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                                {t.bodyweight}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-retro-day-textMuted/70 italic">
                            {language === 'hu' ? 'Még nincs rekord' : 'No record yet'}
                          </span>
                        )}
                      </div>

                      {/* PB Score */}
                      <div className="text-right shrink-0">
                        {hasRecord ? (
                          <span className="text-sm font-extrabold font-mono text-retro-day-text dark:text-retro-night-text flex items-center gap-1 justify-end">
                            {ex.metric_type === 'time' ? (
                              <Clock className="w-3.5 h-3.5 text-amber-500" />
                            ) : (
                              <Repeat className="w-3.5 h-3.5 text-retro-day-accent" />
                            )}
                            <span>{pb.best_value} {ex.metric_type === 'time' ? t.sec : t.reps}</span>
                          </span>
                        ) : (
                          <span className="text-xs font-mono text-retro-day-textMuted/50 font-bold">
                            —
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Modal Close Button */}
        <div className="pt-3 border-t border-retro-day-border dark:border-retro-night-border mt-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-xl border border-retro-day-border dark:border-retro-night-border text-retro-day-text font-bold text-xs hover:bg-retro-day-cardAlt dark:hover:bg-retro-night-cardAlt transition-colors"
          >
            {t.close}
          </button>
        </div>

      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { supabase, Exercise, UserPB, SECTIONS } from '../lib/supabase';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Flame, 
  Search, 
  Clock, 
  Repeat, 
  ShieldCheck, 
  X,
  Plus
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface LeaderboardViewProps {
  currentUser: User | null;
  onNavigateToPBs: () => void;
}

interface RankedPB extends UserPB {
  display_name: string;
  isCurrentUser: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser, onNavigateToPBs }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allPbs, setAllPbs] = useState<UserPB[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { display_name: string; username: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  useEffect(() => {
    loadLeaderboardData();
  }, [currentUser]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all exercises
      const { data: exData, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (exErr) throw exErr;
      setExercises(exData || []);

      // 2. Fetch all user PBs across all squad members
      const { data: pbData, error: pbErr } = await supabase
        .from('user_pbs')
        .select('*')
        .order('best_value', { ascending: false });

      if (pbErr) throw pbErr;
      setAllPbs(pbData || []);

      // 3. Fetch user profiles for display names
      try {
        const { data: profData, error: profErr } = await supabase
          .from('profiles')
          .select('id, display_name, username');

        if (!profErr && profData) {
          const map: Record<string, { display_name: string; username: string }> = {};
          profData.forEach(p => {
            map[p.id] = { display_name: p.display_name, username: p.username };
          });
          setProfileMap(map);
        }
      } catch {
        // Profiles table might not be populated or cached yet
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group PBs by exercise
  const pbsByExercise: Record<string, RankedPB[]> = {};
  allPbs.forEach(pb => {
    if (!pbsByExercise[pb.exercise_id]) {
      pbsByExercise[pb.exercise_id] = [];
    }

    const isCurrent = pb.user_id === currentUser?.id;
    const profile = profileMap[pb.user_id];
    let displayName = 'Squad Mate';

    if (isCurrent) {
      displayName = currentUser?.user_metadata?.display_name || 'You';
    } else if (profile?.display_name) {
      displayName = profile.display_name;
    } else if (profile?.username) {
      displayName = `@${profile.username}`;
    }

    pbsByExercise[pb.exercise_id].push({
      ...pb,
      display_name: displayName,
      isCurrentUser: isCurrent,
    });
  });

  // Sort each exercise's PBs:
  // Bodyweight first or highest numeric value
  Object.keys(pbsByExercise).forEach(exId => {
    pbsByExercise[exId].sort((a, b) => {
      // If one is unassisted and one is assisted, unassisted can rank higher if desired, or purely by best_value
      if (b.best_value !== a.best_value) {
        return b.best_value - a.best_value;
      }
      return (a.is_assisted ? 1 : 0) - (b.is_assisted ? 1 : 0);
    });
  });

  const filteredExercises = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSection = selectedSection === 'All' || ex.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  // Separate exercises with records vs exercises without
  const exercisesWithRecords = filteredExercises.filter(ex => pbsByExercise[ex.id]?.length > 0);
  const exercisesWithoutRecords = filteredExercises.filter(ex => !pbsByExercise[ex.id]?.length);

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-xs uppercase tracking-widest font-bold text-retro-day-accent dark:text-retro-night-accent flex items-center gap-1.5">
            <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            Squad Scoreboard
          </span>
          <h2 className="text-xl font-bold text-retro-day-text dark:text-retro-night-text">
            Leaderboard
          </h2>
        </div>

        <button
          onClick={onNavigateToPBs}
          className="px-3 py-1.5 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Log PB
        </button>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-retro-day-textMuted dark:text-retro-night-textMuted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search moves on scoreboard..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 text-sm focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-retro-day-textMuted dark:text-retro-night-textMuted p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Section Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
        {['All', ...SECTIONS].map(sec => {
          const isSelected = selectedSection === sec;
          return (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all font-semibold active:scale-95 border ${
                isSelected
                  ? 'bg-retro-day-accent text-white border-retro-day-accent shadow-sm'
                  : 'bg-retro-day-card dark:bg-retro-night-card text-retro-day-textMuted dark:text-retro-night-textMuted border-retro-day-border dark:border-retro-night-border hover:text-retro-day-text'
              }`}
            >
              {sec}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-3 border-retro-day-accent dark:border-retro-night-accent border-t-transparent animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-8 text-center bg-retro-day-card dark:bg-retro-night-card rounded-3xl border border-retro-day-border dark:border-retro-night-border">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-retro-day-textMuted dark:text-retro-night-textMuted opacity-60" />
          <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text mb-1">
            No exercises found
          </h3>
          <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted">
            Add or seed exercises in the Catalog tab to start tracking squad rankings!
          </p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="p-6 text-center text-xs text-retro-day-textMuted dark:text-retro-night-textMuted bg-retro-day-card dark:bg-retro-night-card rounded-2xl border border-retro-day-border dark:border-retro-night-border">
          No exercises matching &quot;{searchQuery}&quot;.
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Active Competitions (Exercises with PBs) */}
          {exercisesWithRecords.map(ex => {
            const rankings = pbsByExercise[ex.id] || [];
            return (
              <div
                key={ex.id}
                className="p-4 rounded-3xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border shadow-sm overflow-hidden"
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-retro-day-border dark:border-retro-night-border">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted dark:text-retro-night-textMuted">
                        {ex.section}
                      </span>
                      <span className="text-[10px] font-mono text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-1">
                        {ex.metric_type === 'time' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            Hold (s)
                          </>
                        ) : (
                          <>
                            <Repeat className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                            Reps
                          </>
                        )}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text font-sans">
                      {ex.name}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-retro-day-accent dark:text-retro-night-accent flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {rankings.length} {rankings.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                {/* Squad Members Ranked */}
                <div className="space-y-2">
                  {rankings.map((rank, idx) => {
                    const isFirst = idx === 0;
                    const isSecond = idx === 1;
                    const isThird = idx === 2;

                    return (
                      <div
                        key={rank.id}
                        className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 transition-colors ${
                          rank.isCurrentUser
                            ? 'bg-retro-day-accentSoft/70 dark:bg-retro-night-accentSoft/40 border border-retro-day-accent/30 dark:border-retro-night-accent/30'
                            : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/70 dark:border-retro-night-border/70'
                        }`}
                      >
                        {/* Rank Badge & Name */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${
                            isFirst
                              ? 'bg-amber-400 text-amber-950 font-extrabold ring-2 ring-amber-300'
                              : isSecond
                              ? 'bg-slate-300 text-slate-800'
                              : isThird
                              ? 'bg-amber-700/60 text-amber-100'
                              : 'bg-retro-day-card dark:bg-retro-night-card text-retro-day-textMuted dark:text-retro-night-textMuted border border-retro-day-border'
                          }`}>
                            {isFirst ? (
                              <Crown className="w-4 h-4 fill-current" />
                            ) : isSecond ? (
                              <Medal className="w-4 h-4" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <span className="text-xs font-bold text-retro-day-text dark:text-retro-night-text truncate block">
                              {rank.display_name} {rank.isCurrentUser && <span className="text-retro-day-accent dark:text-retro-night-accent font-semibold text-[11px]">(You)</span>}
                            </span>
                            {rank.is_assisted ? (
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium truncate block">
                                Assisted: {rank.assist_notes || 'Band'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-0.5 font-medium">
                                <ShieldCheck className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                                Bodyweight
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PB Score */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold font-mono text-retro-day-text dark:text-retro-night-text block">
                            {rank.best_value} {ex.metric_type === 'time' ? 's' : 'reps'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Exercises without records (Collapsed hint) */}
          {exercisesWithoutRecords.length > 0 && (
            <div className="mt-6 pt-4 border-t border-retro-day-border dark:border-retro-night-border">
              <span className="text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted block mb-2">
                Uncontested Moves ({exercisesWithoutRecords.length})
              </span>
              <div className="space-y-1.5">
                {exercisesWithoutRecords.slice(0, 5).map(ex => (
                  <div
                    key={ex.id}
                    className="p-3 rounded-2xl bg-retro-day-card/60 dark:bg-retro-night-card/60 border border-dashed border-retro-day-border dark:border-retro-night-border flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-retro-day-textMuted dark:text-retro-night-textMuted truncate pr-2">
                      {ex.name}
                    </span>
                    <button
                      onClick={onNavigateToPBs}
                      className="text-xs font-bold text-retro-day-accent dark:text-retro-night-accent hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      Set 1st Record
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};


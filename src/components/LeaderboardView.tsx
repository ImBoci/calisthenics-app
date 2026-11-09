import React, { useState, useEffect } from 'react';
import { supabase, Exercise, UserPB } from '../lib/supabase';
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
import { useLanguage, getSectionLabel } from '../context/LanguageContext';
import { calculateUserLevel, getSquadLevel, SquadLevelInfo } from '../utils/levelCalculator';
import { FriendProfileModal, FriendProfileData } from './FriendProfileModal';

interface LeaderboardViewProps {
  currentUser: User | null;
  onNavigateToPBs: () => void;
}

interface RankedPB extends UserPB {
  display_name: string;
  isCurrentUser: boolean;
  exercise_name?: string;
  exercise_metric_type?: string;
  exercise_section?: string;
  avatar_url?: string;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser, onNavigateToPBs }) => {
  const { t, language } = useLanguage();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allPbs, setAllPbs] = useState<UserPB[]>([]);
  const [profileMap, setProfileMap] = useState<Record<string, { display_name: string; username: string; avatar_url?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedExercise, setSelectedExercise] = useState<string>('All');
  const [selectedFriend, setSelectedFriend] = useState<FriendProfileData | null>(null);

  // Map DB values to display labels (competitive categories only)
  const FILTER_LABELS: Record<string, string> = {
    'all': t.filterAll,
    'static': t.filterStatic,
    'dynamic': t.filterDynamic,
  };

  useEffect(() => {
    loadLeaderboardData();
  }, [currentUser]);

  const loadLeaderboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch competitive exercises (static and dynamic)
      const { data: exData, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .in('section', ['static', 'dynamic'])
        .order('name', { ascending: true });

      if (exErr) throw exErr;
      setExercises(exData || []);

      // 2. Fetch all squad PBs
      const { data: pbsData, error: pbsErr } = await supabase
        .from('user_pbs')
        .select('*')
        .order('best_value', { ascending: false });

      if (pbsErr) throw pbsErr;
      setAllPbs(pbsData || []);

      // 3. Fetch all profiles
      const { data: profilesData, error: profilesErr } = await supabase
        .from('profiles')
        .select('id, display_name, username, avatar_url');

      if (!profilesErr && profilesData) {
        const map: Record<string, { display_name: string; username: string; avatar_url?: string }> = {};
        profilesData.forEach(p => {
          map[p.id] = { 
            display_name: p.display_name, 
            username: p.username,
            avatar_url: p.avatar_url
          };
        });
        setProfileMap(map);
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
    let displayName = t.squadMate;

    if (isCurrent) {
      displayName = currentUser?.user_metadata?.display_name || t.you;
    } else if (profile?.display_name) {
      displayName = profile.display_name;
    } else if (profile?.username) {
      displayName = `@${profile.username}`;
    }

    // Match exercise from exercises array by exercise_id
    const exercise = exercises.find(e => e.id === pb.exercise_id);
    const exerciseName = exercise?.name || t.unknownExercise;
    const exerciseMetric = exercise?.metric_type || 'reps';
    const exerciseSection = exercise?.section || 'static';
    const avatarUrl = profile?.avatar_url;

    pbsByExercise[pb.exercise_id].push({
      ...pb,
      display_name: displayName,
      isCurrentUser: isCurrent,
      exercise_name: exerciseName,
      exercise_metric_type: exerciseMetric,
      exercise_section: exerciseSection,
      avatar_url: avatarUrl,
    });
  });

  // Calculate level for every squad member from their logged PBs
  const userPbsMap: Record<string, { best_value: number; is_assisted: boolean; metric_type: string }[]> = {};
  allPbs.forEach(pb => {
    if (!userPbsMap[pb.user_id]) {
      userPbsMap[pb.user_id] = [];
    }
    const ex = exercises.find(e => e.id === pb.exercise_id);
    userPbsMap[pb.user_id].push({
      best_value: pb.best_value,
      is_assisted: pb.is_assisted,
      metric_type: ex?.metric_type || 'reps',
    });
  });

  const userLevelMap: Record<string, SquadLevelInfo> = {};
  Object.keys(profileMap).forEach(userId => {
    userLevelMap[userId] = calculateUserLevel(userPbsMap[userId] || [], language);
  });
  Object.keys(userPbsMap).forEach(userId => {
    if (!userLevelMap[userId]) {
      userLevelMap[userId] = calculateUserLevel(userPbsMap[userId], language);
    }
  });

  // Sort each exercise's PBs:
  Object.keys(pbsByExercise).forEach(exId => {
    pbsByExercise[exId].sort((a, b) => {
      if (b.best_value !== a.best_value) {
        return b.best_value - a.best_value;
      }
      return (a.is_assisted ? 1 : 0) - (b.is_assisted ? 1 : 0);
    });
  });

  // Filter to only competitive exercises (static and dynamic)
  const competitiveExercises = exercises.filter(ex => 
    ex.section === 'static' || ex.section === 'dynamic'
  );

  const filteredExercises = competitiveExercises.filter(ex => {
    const query = searchQuery.toLowerCase().trim();
    const rankings = pbsByExercise[ex.id] || [];
    const matchesExName = !query || ex.name.toLowerCase().includes(query);
    const matchesMemberName = Boolean(query && rankings.some(r =>
      r.display_name.toLowerCase().includes(query) ||
      (profileMap[r.user_id]?.username && profileMap[r.user_id].username.toLowerCase().includes(query))
    ));
    const matchesSearch = matchesExName || matchesMemberName;
    const matchesSection = selectedSection === 'all' || ex.section === selectedSection;
    const matchesExercise = selectedExercise === 'All' || ex.id === selectedExercise;
    return matchesSearch && matchesSection && matchesExercise;
  });

  const handleOpenFriendProfile = (userId: string, fallbackName: string, avatarUrl?: string) => {
    const profile = profileMap[userId];
    const isCurrent = userId === currentUser?.id;
    const displayName = isCurrent 
      ? (currentUser?.user_metadata?.display_name || fallbackName || t.you)
      : (profile?.display_name || fallbackName);
    const username = profile?.username || (isCurrent ? currentUser?.user_metadata?.username : '') || 'member';
    const avatar = profile?.avatar_url || avatarUrl;

    setSelectedFriend({
      id: userId,
      display_name: displayName,
      username: username,
      avatar_url: avatar
    });
  };

  // Separate exercises with records vs exercises without
  const exercisesWithRecords = filteredExercises.filter(ex => pbsByExercise[ex.id]?.length > 0);
  const exercisesWithoutRecords = filteredExercises.filter(ex => !pbsByExercise[ex.id]?.length);

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-center text-xl font-extrabold uppercase tracking-[0.2em] text-retro-day-accent dark:text-retro-night-accent flex-1 flex items-center justify-center gap-2">
          <Crown className="w-5 h-5 text-amber-500 fill-amber-500" />
          {t.leaderboard}
        </h2>
        <button
          onClick={onNavigateToPBs}
          className="px-3 py-1.5 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          {t.logPB}
        </button>
      </div>

      {/* Search Input (filter by move or friend name/username) */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-retro-day-textMuted dark:text-retro-night-textMuted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={language === 'hu' ? 'Keresés gyakorlat vagy sportoló neve alapján...' : 'Search moves or athlete name...'}
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

      {/* Exercise Filter Dropdown */}
      <div className="mb-3">
        <select
          value={selectedExercise}
          onChange={e => setSelectedExercise(e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-sm font-bold focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
        >
          <option value="All">{t.allCompetitiveExercises}</option>
          {competitiveExercises.map(ex => (
            <option key={ex.id} value={ex.id}>{ex.name}</option>
          ))}
        </select>
      </div>

      {/* Section Filter Pills (Competitive categories only) */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
        {(['all', 'static', 'dynamic'] as const).map(sec => {
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
              {FILTER_LABELS[sec]}
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
            {t.noExercisesFound}
          </h3>
          <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted">
            {t.noExercisesFoundHint}
          </p>
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="p-6 text-center text-xs text-retro-day-textMuted dark:text-retro-night-textMuted bg-retro-day-card dark:bg-retro-night-card rounded-2xl border border-retro-day-border dark:border-retro-night-border">
          {t.noSearchResults}
        </div>
      ) : (
        <div className="space-y-3.5">
          {/* Active Competitions (Exercises with PBs) */}
          {exercisesWithRecords.map(ex => {
            const rankings = pbsByExercise[ex.id] || [];
            const firstRanking = rankings[0];
            const exerciseName = firstRanking?.exercise_name || ex.name;
            const exerciseMetric = firstRanking?.exercise_metric_type || ex.metric_type;
            const exerciseSection = firstRanking?.exercise_section || ex.section;
            
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
                        {getSectionLabel(t, exerciseSection)}
                      </span>
                      <span className="text-[10px] font-mono text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-1">
                        {exerciseMetric === 'time' ? (
                          <>
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            {t.holdDuration}
                          </>
                        ) : (
                          <>
                            <Repeat className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                            {t.reps}
                          </>
                        )}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text font-sans">
                      {exerciseName}
                    </h3>
                  </div>

                  <span className="text-xs font-mono font-bold text-retro-day-accent dark:text-retro-night-accent flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    {rankings.length} {rankings.length === 1 ? t.record : t.records}
                  </span>
                </div>

                {/* Squad Members Ranked */}
                <div className="space-y-2">
                  {rankings.map((rank, idx) => {
                    const isFirst = idx === 0;
                    const isSecond = idx === 1;
                    const isThird = idx === 2;
                    const memberLevel = userLevelMap[rank.user_id] || getSquadLevel(1.0, language);

                    return (
                      <div
                        key={rank.id}
                        onClick={() => handleOpenFriendProfile(rank.user_id, rank.display_name, rank.avatar_url)}
                        className={`p-2.5 rounded-2xl flex items-center justify-between gap-2.5 transition-all cursor-pointer active:scale-[0.99] hover:border-retro-day-accent ${
                          rank.isCurrentUser
                            ? 'bg-retro-day-accentSoft/70 dark:bg-retro-night-accentSoft/40 border border-retro-day-accent/30 dark:border-retro-night-accent/30'
                            : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/70 dark:border-retro-night-border/70'
                        }`}
                        title={language === 'hu' ? 'Kattints a profil megtekintéséhez' : 'Click to inspect profile'}
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

                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-lg bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/60 dark:border-retro-night-border/60 flex items-center justify-center overflow-hidden shrink-0">
                            {rank.avatar_url ? (
                              <img 
                                src={rank.avatar_url} 
                                alt="" 
                                className="object-cover w-full h-full"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.parentElement!.querySelector('span')?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <span className={`text-xs font-bold text-retro-day-text dark:text-retro-night-text ${rank.avatar_url ? 'hidden' : ''}`}>
                              {rank.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-retro-day-text dark:text-retro-night-text truncate block">
                                {rank.display_name} {rank.isCurrentUser && <span className="text-retro-day-accent dark:text-retro-night-accent font-semibold text-[11px]">({t.you})</span>}
                              </span>
                              <span className="px-1.5 py-0.2 rounded-md text-[9px] font-extrabold bg-retro-day-accent/15 dark:bg-retro-night-accent/25 text-retro-day-accent dark:text-retro-night-accent border border-retro-day-accent/30 dark:border-retro-night-accent/30 font-mono shrink-0">
                                {memberLevel.badge}
                              </span>
                            </div>
                            {rank.is_assisted ? (
                              <span className="text-[10px] text-amber-800 dark:text-amber-300 font-medium truncate block">
                                {t.assisted}: {rank.assist_notes || 'Band'}
                              </span>
                            ) : (
                              <span className="text-[10px] text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-0.5 font-medium">
                                <ShieldCheck className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                                {t.bodyweight}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* PB Score */}
                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold font-mono text-retro-day-text dark:text-retro-night-text block">
                            {rank.best_value} {rank.exercise_metric_type === 'time' ? t.sec : t.reps}
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
                {t.contestedMoves} ({exercisesWithoutRecords.length})
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
                      {t.setFirstRecord}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Friend Profile Modal */}
      {selectedFriend && (
        <FriendProfileModal
          friend={selectedFriend}
          onClose={() => setSelectedFriend(null)}
          allCompetitiveExercises={competitiveExercises}
          allPbs={allPbs}
        />
      )}
    </div>
  );
};

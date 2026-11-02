import React, { useState, useEffect } from 'react';
import { supabase, Exercise, UserPB, SECTIONS } from '../lib/supabase';
import { 
  Trophy, 
  Flame, 
  Search, 
  Clock, 
  Repeat, 
  Plus, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface PBsViewProps {
  currentUser: User | null;
}

export const PBsView: React.FC<PBsViewProps> = ({ currentUser }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userPbs, setUserPbs] = useState<Record<string, UserPB>>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSection, setSelectedSection] = useState<string>('All');

  // Map display labels to DB section values
  const SECTION_MAP: Record<string, string> = {
    'All': 'All',
    'Static Exercises': 'Static Exercises',
    'Dynamic Exercises': 'Dynamic Exercises',
  };

  // Modal State
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [bestValue, setBestValue] = useState<string>('');
  const [isAssisted, setIsAssisted] = useState(false);
  const [assistNotes, setAssistNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch exercises
      const { data: exData, error: exErr } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (exErr) throw exErr;
      const exList = exData || [];
      setExercises(exList);

      // 2. Fetch logged in user's PBs
      if (currentUser) {
        const { data: pbData, error: pbErr } = await supabase
          .from('user_pbs')
          .select('*')
          .eq('user_id', currentUser.id);

        if (pbErr) throw pbErr;

        const map: Record<string, UserPB> = {};
        (pbData || []).forEach(pb => {
          map[pb.exercise_id] = pb;
        });
        setUserPbs(map);
      }
    } catch (err) {
      console.error('Error loading PBs data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openLogModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalError(null);
    const existing = userPbs[exercise.id];
    if (existing) {
      setBestValue(existing.best_value.toString());
      setIsAssisted(Boolean(existing.is_assisted));
      setAssistNotes(existing.assist_notes || '');
    } else {
      setBestValue('');
      setIsAssisted(false);
      setAssistNotes('');
    }
  };

  const handleSavePB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExercise || !currentUser) return;
    const num = parseFloat(bestValue);
    if (isNaN(num) || num <= 0) {
      setModalError('Please enter a valid positive number');
      return;
    }

    setSaving(true);
    setModalError(null);

    try {
      const now = new Date().toISOString();
      const existing = userPbs[selectedExercise.id];

      const payload = {
        user_id: currentUser.id,
        exercise_id: selectedExercise.id,
        best_value: num,
        is_assisted: isAssisted,
        assist_notes: isAssisted ? (assistNotes.trim() || 'Assisted') : null,
        achieved_at: now,
        updated_at: now,
      };

      let savedRecord: UserPB;

      if (existing?.id) {
        const { data, error } = await supabase
          .from('user_pbs')
          .update(payload)
          .eq('id', existing.id)
          .select()
          .single();
        if (error) throw error;
        savedRecord = data;
      } else {
        const { data, error } = await supabase
          .from('user_pbs')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        savedRecord = data;
      }

      setUserPbs(prev => ({ ...prev, [selectedExercise.id]: savedRecord }));
      setSelectedExercise(null);
      showToast(`Personal Best updated for ${selectedExercise.name}! 🔥`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setModalError(err.message);
      } else {
        setModalError('Could not save record');
      }
    } finally {
      setSaving(false);
    }
  };

  // Filter exercises
  const filtered = exercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchQuery.toLowerCase());
    const dbSectionValue = SECTION_MAP[selectedSection] || selectedSection;
    const matchesSection = selectedSection === 'All' || ex.section === dbSectionValue;
    return matchesSearch && matchesSection;
  });

  // Calculate summary counts
  const totalLogged = Object.keys(userPbs).length;

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-24">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-retro-day-accent dark:bg-retro-night-accent text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-center text-xl font-extrabold uppercase tracking-[0.2em] text-retro-day-accent dark:text-retro-night-accent flex-1 flex items-center justify-center gap-2">
          <Trophy className="w-5 h-5" />
          Personal Bests
        </h2>
        {/* Total PBs Badge */}
        <div className="px-3 py-1.5 rounded-2xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border flex items-center gap-1.5 shadow-sm">
          <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span className="text-xs font-bold font-mono text-retro-day-text dark:text-retro-night-text">
            {totalLogged} PBs
          </span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-retro-day-textMuted dark:text-retro-night-textMuted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter moves for PB tracking..."
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
        {['All', 'Static Exercises', 'Dynamic Exercises'].map(sec => {
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

      {/* Exercises / PBs List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-3 border-retro-day-accent dark:border-retro-night-accent border-t-transparent animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-8 text-center bg-retro-day-card dark:bg-retro-night-card rounded-3xl border border-retro-day-border dark:border-retro-night-border">
          <Trophy className="w-10 h-10 mx-auto mb-3 text-retro-day-textMuted dark:text-retro-night-textMuted opacity-60" />
          <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text mb-1">
            No exercises in catalog
          </h3>
          <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted mb-4">
            Visit the Catalog tab to add or seed calisthenics moves first.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-6 text-center text-xs text-retro-day-textMuted dark:text-retro-night-textMuted bg-retro-day-card dark:bg-retro-night-card rounded-2xl border border-retro-day-border dark:border-retro-night-border">
          No exercises found matching your search.
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map(ex => {
            const pb = userPbs[ex.id];
            const hasPB = Boolean(pb);

            return (
              <div
                key={ex.id}
                className="p-4 rounded-3xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border shadow-sm flex items-center justify-between gap-3 relative overflow-hidden"
              >
                {/* Subtle highlight if PB exists */}
                {hasPB && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-retro-day-accentSoft/40 dark:bg-retro-night-accentSoft/20 rounded-bl-3xl pointer-events-none" />
                )}

                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-retro-day-text dark:text-retro-night-text truncate font-sans mb-1">
                    {ex.name}
                  </h4>

                  {/* PB Badge Display */}
                  <div className="mt-2">
                    {hasPB ? (
                      <div className="inline-flex items-center flex-wrap gap-1.5">
                        {/* Score Tag */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-retro-day-accentSoft dark:bg-retro-night-accentSoft border border-retro-day-accent/30 dark:border-retro-night-accent/30 text-retro-day-text dark:text-retro-night-text text-xs font-bold font-mono">
                          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          <span>
                            {pb.best_value} {ex.metric_type === 'time' ? 'Seconds' : 'Reps'}
                          </span>
                        </div>

                        {/* Assistance Badge */}
                        {pb.is_assisted ? (
                          <span className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-[10px] font-semibold">
                            Assisted: {pb.assist_notes || 'Band'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted dark:text-retro-night-textMuted text-[10px] font-semibold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                            Bodyweight
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-retro-day-textMuted/70 dark:text-retro-night-textMuted/60 italic">
                        No record logged yet
                      </span>
                    )}
                  </div>
                </div>

                {/* Log / Edit Button */}
                <div className="shrink-0">
                  <button
                    onClick={() => openLogModal(ex)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm ${
                      hasPB
                        ? 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text hover:border-retro-day-accent'
                        : 'bg-retro-day-accent text-white hover:bg-retro-day-accentHover'
                    }`}
                  >
                    {hasPB ? (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-retro-day-accent dark:text-retro-night-accent" />
                        Update
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        Log PB
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LOG OR UPDATE PERSONAL BEST */}
      {/* ========================================================================= */}
      {selectedExercise && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-5 border-2 border-retro-day-border dark:border-retro-night-border shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500 fill-amber-500" />
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted">
                    {selectedExercise.section}
                  </span>
                  <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text leading-tight">
                    {selectedExercise.name}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setSelectedExercise(null)}
                className="p-1 rounded-full text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSavePB} className="space-y-4">
              {/* Metric Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
                  {selectedExercise.metric_type === 'time'
                    ? 'Hold Duration (Seconds)'
                    : 'Reps Completed'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-retro-day-textMuted dark:text-retro-night-textMuted">
                    {selectedExercise.metric_type === 'time' ? (
                      <Clock className="w-4 h-4" />
                    ) : (
                      <Repeat className="w-4 h-4" />
                    )}
                  </div>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={bestValue}
                    onChange={e => setBestValue(e.target.value)}
                    placeholder={selectedExercise.metric_type === 'time' ? 'e.g. 15' : 'e.g. 8'}
                    className="w-full pl-10 pr-16 py-3 rounded-2xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base font-mono font-bold focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-retro-day-textMuted dark:text-retro-night-textMuted uppercase font-mono">
                    {selectedExercise.metric_type === 'time' ? 'sec' : 'reps'}
                  </span>
                </div>
              </div>

              {/* Assisted Toggle Checkbox */}
              <div className="p-3.5 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="pr-2">
                    <span className="text-xs font-bold text-retro-day-text dark:text-retro-night-text block">
                      Assisted Movement
                    </span>
                    <span className="text-[11px] text-retro-day-textMuted dark:text-retro-night-textMuted block">
                      Using resistance band, chair, or partner
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAssisted}
                    onChange={e => setIsAssisted(e.target.checked)}
                    className="w-5 h-5 rounded-lg text-retro-day-accent focus:ring-retro-day-accent accent-retro-day-accent cursor-pointer"
                  />
                </label>

                {/* Assistance Details Input (revealed when checked) */}
                {isAssisted && (
                  <div className="mt-3 pt-3 border-t border-retro-day-border/70 dark:border-retro-night-border/70 animate-in fade-in duration-150">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                      Assistance Details
                    </label>
                    <input
                      type="text"
                      value={assistNotes}
                      onChange={e => setAssistNotes(e.target.value)}
                      placeholder="e.g. Heavy black band, Light red band"
                      className="w-full px-3 py-2 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base placeholder-retro-day-textMuted/50 text-xs focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedExercise(null)}
                  className="flex-1 py-3 rounded-xl border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {saving ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Record
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


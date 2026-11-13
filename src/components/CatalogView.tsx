import React, { useState, useEffect } from 'react';
import { supabase, Exercise, ExerciseSuggestion, SECTIONS, ExerciseSection, MetricType, ADMIN_EMAIL } from '../lib/supabase';
import {
  Plus,
  Search,
  BookOpen,
  Sparkles,
  Check,
  X,
  Clock,
  Repeat,
  MessageSquare,
  Trash2,
  Layers,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { useLanguage, getSectionLabel, getExerciseName } from '../context/LanguageContext';

interface CatalogViewProps {
  currentUser: User | null;
  onSuggestionCountChange?: (count: number) => void;
}

export const CatalogView: React.FC<CatalogViewProps> = ({ currentUser, onSuggestionCountChange }) => {
  const { t, language } = useLanguage();
  const isAdmin = currentUser?.email === ADMIN_EMAIL;

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [suggestions, setSuggestions] = useState<ExerciseSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showSuggestionsDrawer, setShowSuggestionsDrawer] = useState(false);

  // Add Exercise Form (Admin)
  const [name, setName] = useState('');
  const [section, setSection] = useState<ExerciseSection>('warmup');
  const [metricType, setMetricType] = useState<MetricType>('reps');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [exerciseToDelete, setExerciseToDelete] = useState<Exercise | null>(null);

  // Suggest Form (Friends)
  const [suggestName, setSuggestName] = useState('');
  const [suggestSection, setSuggestSection] = useState<ExerciseSection>('static');
  const [suggestMetric, setSuggestMetric] = useState<MetricType>('reps');
  const [suggestNotes, setSuggestNotes] = useState('');

  useEffect(() => {
    fetchExercises();
    if (isAdmin) {
      fetchSuggestions();
    }
  }, [isAdmin]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const list = data || [];
      setSuggestions(list);
      if (onSuggestionCountChange) {
        onSuggestionCountChange(list.length);
      }
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  // Sanitize section value to match DB format (now SECTIONS already has lowercase values)
  const sanitizeSection = (section: ExerciseSection): string => {
    return section; // SECTIONS already has lowercase DB values
  };

  // Admin: Add Exercise directly
  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const sanitizedSection = sanitizeSection(section);
      console.log('Adding exercise:', { name: name.trim(), section: sanitizedSection, metric_type: metricType });
      
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: name.trim(),
          section: sanitizedSection,
          metric_type: metricType,
        })
        .select()
        .single();

      if (error) {
        console.error('Add exercise error:', error);
        setFormError(error.message);
        return;
      }

      console.log('Exercise added successfully:', data);
      setExercises(prev => [...prev, data]);
      setName('');
      setShowAddModal(false);
      showToast(`${t.added}: "${getExerciseName(data, language)}"`);
    } catch (err: unknown) {
      console.error('Add exercise exception:', err);
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(t.failedToAddExercise);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Friend: Submit Suggestion
  const handleSuggestExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestName.trim() || !currentUser) return;
    setSubmitting(true);
    setFormError(null);

    try {
      const { error } = await supabase
        .from('exercise_suggestions')
        .insert({
          user_id: currentUser.id,
          user_email: currentUser.email || 'Friend',
          exercise_name: suggestName.trim(),
          suggested_section: suggestSection,
          metric_type: suggestMetric,
          notes: suggestNotes.trim() || null,
        });

      if (error) throw error;

      setSuggestName('');
      setSuggestNotes('');
      setShowSuggestModal(false);
      showToast(t.suggestionSent);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(t.failedToSendSuggestion);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Approve suggestion -> moves to exercises table and deletes from suggestions
  const handleApproveSuggestion = async (sugg: ExerciseSuggestion) => {
    try {
      // 1. Insert the new exercise into exercises
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          name: sugg.exercise_name,
          section: sugg.suggested_section,
          metric_type: sugg.metric_type,
        })
        .select()
        .single();

      if (error) throw error;

      // 2. Immediately delete the suggestion from exercise_suggestions
      const { error: delError } = await supabase
        .from('exercise_suggestions')
        .delete()
        .eq('id', sugg.id);

      if (delError) {
        console.error('Error deleting suggestion after approval:', delError);
      }

      // 3. Update local state so badge and modal update immediately
      if (data) {
        setExercises(prev => [...prev, data]);
      }
      setSuggestions(prev => {
        const next = prev.filter(s => s.id !== sugg.id);
        if (onSuggestionCountChange) onSuggestionCountChange(next.length);
        return next;
      });

      showToast(`${t.approved}: "${sugg.exercise_name}"`);
    } catch (err) {
      console.error('Error approving suggestion:', err);
      showToast(err instanceof Error ? err.message : 'Error approving suggestion');
    }
  };

  // Admin: Dismiss suggestion
  const handleDismissSuggestion = async (suggId: string) => {
    try {
      const { error } = await supabase
        .from('exercise_suggestions')
        .delete()
        .eq('id', suggId);

      if (!error) {
        // Remove from local suggestions list and decrement badge count
        setSuggestions(prev => {
          const next = prev.filter(s => s.id !== suggId);
          if (onSuggestionCountChange) onSuggestionCountChange(next.length);
          return next;
        });
        showToast(t.suggestionDismissed);
      } else {
        console.error('Error dismissing suggestion:', error);
        showToast(error.message);
      }
    } catch (err) {
      console.error('Error dismissing suggestion:', err);
    }
  };

  const handleDelete = async () => {
    if (!exerciseToDelete || !isAdmin) return;
    const deleting = exerciseToDelete;
    try {
      const { error } = await supabase
        .from('exercises')
        .delete()
        .eq('id', deleting.id);

      if (!error) {
        setExercises(prev => prev.filter(e => e.id !== deleting.id));
        showToast(language === 'hu' ? 'Gyakorlat törölve' : 'Exercise deleted');
      } else {
        console.error('Error deleting exercise:', error);
        showToast(error.message);
      }
    } catch (err) {
      console.error('Error deleting exercise:', err);
    } finally {
      setExerciseToDelete(null);
    }
  };

  // Admin: 1-click starter seed if catalog is empty
  const handleSeedDefaults = async () => {
    setSubmitting(true);
    const defaults = [
      { name: 'Jumping Jacks', section: 'warmup', metric_type: 'time' },
      { name: 'Arm Circles & Crosses', section: 'warmup', metric_type: 'time' },
      { name: 'Wrist Rotations & Flexions', section: 'joint_prep', metric_type: 'time' },
      { name: 'Shoulder Dislocates', section: 'joint_prep', metric_type: 'reps' },
      { name: 'Scapular Pull-ups', section: 'joint_prep', metric_type: 'reps' },
      { name: 'Handstand Hold (Wall/Chest)', section: 'static', metric_type: 'time' },
      { name: 'L-Sit Hold (Parallettes/Floor)', section: 'static', metric_type: 'time' },
      { name: 'Planche Lean', section: 'static', metric_type: 'time' },
      { name: 'Dead Hang', section: 'static', metric_type: 'time' },
      { name: 'Pull-ups', section: 'dynamic', metric_type: 'reps' },
      { name: 'Dips (Parallel Bars)', section: 'dynamic', metric_type: 'reps' },
      { name: 'Push-ups', section: 'dynamic', metric_type: 'reps' },
      { name: 'Pike Push-ups', section: 'dynamic', metric_type: 'reps' },
      { name: 'Muscle-ups', section: 'dynamic', metric_type: 'reps' },
      { name: 'Shoulder Bridge Stretch', section: 'stretching', metric_type: 'time' },
      { name: 'Pike Hamstring Stretch', section: 'stretching', metric_type: 'time' },
      { name: 'Cobra Chest Stretch', section: 'stretching', metric_type: 'time' },
    ];

    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert(defaults)
        .select();

      if (error) throw error;
      setExercises(data || []);
      showToast(t.classicMovesSeeded);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Map DB values to display labels
  const FILTER_LABELS: Record<string, string> = {
    'all': t.filterAll,
    'warmup': t.sectionLabelWarmup,
    'joint_prep': t.sectionLabelJointPrep,
    'static': t.sectionLabelStatic,
    'dynamic': t.sectionLabelDynamic,
    'stretching': t.sectionLabelStretching,
  };

  // Filter exercises
  const filteredExercises = exercises.filter(ex => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      ex.name.toLowerCase().includes(q) ||
      (ex.name_en?.toLowerCase().includes(q) ?? false);
    const matchesSection = selectedSectionFilter === 'all' || ex.section === selectedSectionFilter;
    return matchesSearch && matchesSection;
  });

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-[calc(6rem+env(safe-area-inset-bottom))]">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-retro-day-accent dark:bg-retro-night-accent text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex items-center justify-between w-full mb-4 px-1">
        <h2 className="text-base md:text-lg font-bold tracking-wider uppercase text-retro-day-accent dark:text-retro-night-accent flex items-center gap-2 truncate min-w-0">
          <BookOpen className="w-5 h-5 shrink-0" />
          <span className="truncate">{language === 'hu' ? 'GYAKORLATOK' : 'EXERCISES'}</span>
        </h2>
        {/* Action Button: Admin Add vs Friend Suggest */}
        <div className="flex items-center gap-2 shrink-0">
          {isAdmin ? (
            <>
              {suggestions.length > 0 && (
                <button
                  onClick={() => setShowSuggestionsDrawer(true)}
                  className="relative p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200 active:scale-95 transition-all"
                  title={t.viewFriendSuggestions}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center">
                    {suggestions.length}
                  </span>
                </button>
              )}
              <button
                onClick={() => { setFormError(null); setShowAddModal(true); }}
                className="px-2.5 sm:px-3 py-2 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover dark:bg-retro-night-accent dark:hover:bg-retro-night-accentHover text-white text-xs font-bold flex items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition-all shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>{language === 'hu' ? 'Új' : 'New'}<span className="hidden sm:inline"> {language === 'hu' ? 'gyakorlat' : 'Exercise'}</span></span>
              </button>
            </>
          ) : (
            <button
              onClick={() => { setFormError(null); setShowSuggestModal(true); }}
              className="px-2.5 sm:px-3 py-2 rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border hover:bg-retro-day-accent hover:text-white text-retro-day-text dark:text-retro-night-text text-xs font-bold flex items-center gap-1 sm:gap-1.5 active:scale-95 transition-all shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-retro-day-accent dark:text-retro-night-accent shrink-0" />
              <span>{t.suggest}</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin indicator tag */}
      {isAdmin && (
        <div className="mb-3 px-3 py-1.5 rounded-xl bg-retro-day-accentSoft/60 dark:bg-retro-night-accentSoft/40 border border-retro-day-accent/30 dark:border-retro-night-accent/30 flex items-center justify-between text-[11px] text-retro-day-text dark:text-retro-night-text font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-retro-day-accent dark:text-retro-night-accent" />
            {t.adminPrivileges}
          </span>
          {suggestions.length > 0 && (
            <button
              onClick={() => setShowSuggestionsDrawer(true)}
              className="underline font-bold text-retro-day-accent dark:text-retro-night-accent"
            >
              {suggestions.length} {t.pendingSuggestions}
            </button>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-retro-day-textMuted dark:text-retro-night-textMuted pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder={t.searchMoves}
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

      {/* Section Filter Pills (Horizontal Scroll) */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none text-xs">
        {(['all', ...SECTIONS] as const).map(sec => {
          const isSelected = selectedSectionFilter === sec;
          return (
            <button
              key={sec}
              onClick={() => setSelectedSectionFilter(sec)}
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

      {/* Catalog List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-3 border-retro-day-accent dark:border-retro-night-accent border-t-transparent animate-spin" />
        </div>
      ) : exercises.length === 0 ? (
        <div className="p-8 text-center bg-retro-day-card dark:bg-retro-night-card rounded-3xl border border-retro-day-border dark:border-retro-night-border">
          <Layers className="w-10 h-10 mx-auto mb-3 text-retro-day-textMuted dark:text-retro-night-textMuted opacity-60" />
          <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text mb-1">
            {t.catalogEmpty}
          </h3>
          <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted mb-4">
            {isAdmin
              ? t.catalogEmptyAdminHint
              : t.catalogEmptyFriendHint}
          </p>

          {isAdmin ? (
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button
                onClick={() => setShowAddModal(true)}
                className="py-2.5 px-4 rounded-xl bg-retro-day-accent text-white font-bold text-xs shadow"
              >
                + {t.addExercise}
              </button>
              <button
                onClick={handleSeedDefaults}
                disabled={submitting}
                className="py-2.5 px-4 rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text font-bold text-xs hover:border-retro-day-accent transition-all"
              >
                {submitting ? t.loading : `⚡ ${t.seedClassics}`}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSuggestModal(true)}
              className="py-2.5 px-4 rounded-xl bg-retro-day-accent text-white font-bold text-xs shadow"
            >
              + {t.suggestExercise}
            </button>
          )}
        </div>
      ) : filteredExercises.length === 0 ? (
        <div className="p-6 text-center text-xs text-retro-day-textMuted dark:text-retro-night-textMuted bg-retro-day-card dark:bg-retro-night-card rounded-2xl border border-retro-day-border dark:border-retro-night-border">
          {t.noExercisesFoundMatching} &quot;{searchQuery}&quot; in {FILTER_LABELS[selectedSectionFilter]}.
        </div>
      ) : (
        <div className="space-y-2">
          {filteredExercises.map(ex => (
            <div
              key={ex.id}
              className="p-3.5 rounded-2xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border shadow-sm flex items-center justify-between"
            >
              <div className="min-w-0 pr-3">
                <h4 className="text-sm font-bold text-retro-day-text dark:text-retro-night-text truncate">
                  {getExerciseName(ex, language)}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted dark:text-retro-night-textMuted">
                    {getSectionLabel(t, ex.section)}
                  </span>
                  <span className="text-[10px] font-mono text-retro-day-textMuted dark:text-retro-night-textMuted flex items-center gap-1">
                    {ex.metric_type === 'time' ? (
                      <>
                        <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        {t.seconds}
                      </>
                    ) : (
                      <>
                        <Repeat className="w-3 h-3 text-retro-day-accent dark:text-retro-night-accent" />
                        {t.metricReps}
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border flex items-center justify-center text-retro-day-accent dark:text-retro-night-accent">
                  {ex.metric_type === 'time' ? <Clock className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setExerciseToDelete(ex)}
                    className="w-8 h-8 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 flex items-center justify-center transition-all active:scale-95"
                    title={language === 'hu' ? 'Gyakorlat törlése' : 'Delete exercise'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN ADD EXERCISE */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-5 border-2 border-retro-day-border dark:border-retro-night-border shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent" />
                <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text">
                  {t.addExercise}
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-full text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddExercise} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.exerciseName}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t.exerciseNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.routineSection}
                </label>
                <select
                  value={section}
                  onChange={e => setSection(e.target.value as ExerciseSection)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                >
                  {SECTIONS.map(s => (
                    <option key={s} value={s}>{getSectionLabel(t, s)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.metricType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMetricType('reps')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      metricType === 'reps'
                        ? 'bg-retro-day-accent text-white border-retro-day-accent shadow-sm'
                        : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt text-retro-day-textMuted dark:text-retro-night-textMuted border-retro-day-border dark:border-retro-night-border'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    {t.metricReps}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetricType('time')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      metricType === 'time'
                        ? 'bg-retro-day-accent text-white border-retro-day-accent shadow-sm'
                        : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt text-retro-day-textMuted dark:text-retro-night-textMuted border-retro-day-border dark:border-retro-night-border'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t.metricTime} (s)
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? t.saving : t.addToCatalog}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: FRIEND SUGGEST EXERCISE */}
      {/* ========================================================================= */}
      {showSuggestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-sm bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-5 border-2 border-retro-day-border dark:border-retro-night-border shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-retro-day-accent dark:text-retro-night-accent" />
                <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text">
                  {t.suggestExercise}
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestModal(false)}
                className="p-1 rounded-full text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted mb-3">
              Propose a move to the squad admin. Once approved, it will appear in the catalog!
            </p>

            {formError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSuggestExercise} className="space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.exerciseName}
                </label>
                <input
                  type="text"
                  required
                  value={suggestName}
                  onChange={e => setSuggestName(e.target.value)}
                  placeholder={t.suggestNamePlaceholder}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.routineSection}
                </label>
                <select
                  value={suggestSection}
                  onChange={e => setSuggestSection(e.target.value as ExerciseSection)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                >
                  {SECTIONS.map(s => (
                    <option key={s} value={s}>{getSectionLabel(t, s)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.metricType}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSuggestMetric('reps')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      suggestMetric === 'reps'
                        ? 'bg-retro-day-accent text-white border-retro-day-accent shadow-sm'
                        : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt text-retro-day-textMuted dark:text-retro-night-textMuted border-retro-day-border dark:border-retro-night-border'
                    }`}
                  >
                    <Repeat className="w-3.5 h-3.5" />
                    {t.metricReps}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestMetric('time')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      suggestMetric === 'time'
                        ? 'bg-retro-day-accent text-white border-retro-day-accent shadow-sm'
                        : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt text-retro-day-textMuted dark:text-retro-night-textMuted border-retro-day-border dark:border-retro-night-border'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {t.metricTime}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  {t.noteForSquad}
                </label>
                <input
                  type="text"
                  value={suggestNotes}
                  onChange={e => setSuggestNotes(e.target.value)}
                  placeholder={t.notePlaceholder}
                  className="w-full px-3.5 py-2 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSuggestModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted font-bold text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {submitting ? t.sending : t.sendProposal}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: ADMIN INCOMING SUGGESTIONS */}
      {/* ========================================================================= */}
      {showSuggestionsDrawer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[85vh] bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-5 border-2 border-retro-day-border dark:border-retro-night-border shadow-2xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-retro-day-border dark:border-retro-night-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text">
                  {t.incomingSuggestions} ({suggestions.length})
                </h3>
              </div>
              <button
                onClick={() => setShowSuggestionsDrawer(false)}
                className="p-1 rounded-full text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-3">
              {suggestions.length === 0 ? (
                <div className="text-center py-10 text-xs text-retro-day-textMuted dark:text-retro-night-textMuted">
                  {t.allSuggestionsReviewed}
                </div>
              ) : (
                suggestions.map(sugg => (
                  <div
                    key={sugg.id}
                    className="p-3.5 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <div>
                        <h4 className="text-sm font-bold text-retro-day-text dark:text-retro-night-text">
                          {sugg.exercise_name}
                        </h4>
                        <span className="text-[10px] text-retro-day-textMuted dark:text-retro-night-textMuted">
                          {t.from}: {sugg.user_email}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-retro-day-surface dark:bg-retro-night-surface border border-retro-day-border dark:border-retro-night-border">
                        {getSectionLabel(t, sugg.suggested_section)} • {sugg.metric_type === 'time' ? t.metricTime : t.metricReps}
                      </div>
                    </div>

                    {sugg.notes && (
                      <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted italic bg-retro-day-bg/60 dark:bg-retro-night-bg/60 p-2 rounded-xl mb-3 border border-retro-day-border/60 dark:border-retro-night-border/60">
                        &quot;{sugg.notes}&quot;
                      </p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDismissSuggestion(sugg.id)}
                        className="py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-1 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t.dismiss}
                      </button>
                      <button
                        onClick={() => handleApproveSuggestion(sugg)}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {t.approveAddToCatalog}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => setShowSuggestionsDrawer(false)}
              className="w-full mt-2 py-2.5 rounded-xl border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted font-bold text-xs"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}

      {exerciseToDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#241E1B] border border-stone-800 rounded-2xl p-5 shadow-2xl flex flex-col space-y-4">
            <div className="p-2.5 bg-red-950/40 border border-red-900/30 rounded-xl text-red-400 w-fit">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-stone-100">
                {language === 'hu' ? 'Gyakorlat törlése' : 'Delete Exercise'}
              </h3>
              <p className="text-sm text-stone-400 leading-relaxed">
                {language === 'hu'
                  ? `Biztosan törölni szeretnéd a(z) "${getExerciseName(exerciseToDelete, language)}" gyakorlatot? Ez a lépés nem vonható vissza.`
                  : `Are you sure you want to delete "${getExerciseName(exerciseToDelete, language)}"? This action cannot be undone.`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setExerciseToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-stone-700 text-stone-300 hover:bg-stone-800 text-sm font-medium transition"
              >
                {language === 'hu' ? 'Mégse' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-900/60 border border-red-700/50 text-red-200 hover:bg-red-800/80 text-sm font-semibold transition"
              >
                {language === 'hu' ? 'Törlés' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { supabase, Exercise, WorkoutPlan, SECTIONS, ExerciseSection } from '../lib/supabase';
import { 
  Dumbbell, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  Repeat, 
  ChevronRight, 
  RotateCcw,
  Layers,
  ArrowLeft,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface WorkoutsViewProps {
  currentUser: User | null;
  onNavigateToCatalog: () => void;
}

export const WorkoutsView: React.FC<WorkoutsViewProps> = ({ currentUser, onNavigateToCatalog: _onNavigateToCatalog }) => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [catalogExercises, setCatalogExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  // Active viewing/training routine
  const [activePlan, setActivePlan] = useState<WorkoutPlan | null>(null);
  const [checkedExerciseIds, setCheckedExerciseIds] = useState<Record<string, boolean>>({});

  // Builder modal
  const [showBuilder, setShowBuilder] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [savingPlan, setSavingPlan] = useState(false);
  const [builderError, setBuilderError] = useState<string | null>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fetchCatalogExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      console.log('Modal loaded exercises:', data, error);

      if (error) {
        console.error('Error fetching exercises for modal:', error);
        throw error;
      }
      
      console.log(`Successfully loaded ${data?.length || 0} exercises for modal`);
      setCatalogExercises(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching exercises:', err);
      return [];
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch catalog exercises (unfiltered)
      const allExercises = await fetchCatalogExercises();

      const exerciseMap: Record<string, Exercise> = {};
      allExercises.forEach(ex => {
        exerciseMap[ex.id] = ex;
      });

      // 2. Fetch workout plans for current user
      if (currentUser) {
        const { data: planData, error: planErr } = await supabase
          .from('workout_plans')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (planErr) throw planErr;
        const rawPlans = planData || [];

        // 3. Fetch plan items for these plans
        if (rawPlans.length > 0) {
          const planIds = rawPlans.map(p => p.id);
          const { data: itemsData, error: itemsErr } = await supabase
            .from('workout_plan_items')
            .select('*')
            .in('plan_id', planIds)
            .order('order_index', { ascending: true });

          if (itemsErr) throw itemsErr;

          const itemsByPlan: Record<string, typeof itemsData> = {};
          (itemsData || []).forEach(item => {
            if (!itemsByPlan[item.plan_id]) itemsByPlan[item.plan_id] = [];
            itemsByPlan[item.plan_id].push({
              ...item,
              exercise: exerciseMap[item.exercise_id],
            });
          });

          const completePlans: WorkoutPlan[] = rawPlans.map(p => ({
            ...p,
            items: itemsByPlan[p.id] || [],
          }));

          setPlans(completePlans);
        } else {
          setPlans([]);
        }
      }
    } catch (err) {
      console.error('Error loading workout plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const openBuilder = async () => {
    setBuilderError(null);
    setSelectedExerciseIds([]);
    setNewTitle('');
    setShowBuilder(true);
    await fetchCatalogExercises();
  };

  const toggleSelectExercise = (exerciseId: string) => {
    setSelectedExerciseIds(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  // Seed default moves right inside the builder if catalog is empty
  const handleSeedDefaults = async () => {
    setSeeding(true);
    const defaults = [
      { name: 'Jumping Jacks', section: 'Warmup', metric_type: 'time' },
      { name: 'Arm Circles & Crosses', section: 'Warmup', metric_type: 'time' },
      { name: 'Wrist Rotations & Flexions', section: 'Joint Preparation', metric_type: 'time' },
      { name: 'Shoulder Dislocates', section: 'Joint Preparation', metric_type: 'reps' },
      { name: 'Scapular Pull-ups', section: 'Joint Preparation', metric_type: 'reps' },
      { name: 'Handstand Hold (Wall/Chest)', section: 'Static Exercises', metric_type: 'time' },
      { name: 'L-Sit Hold (Parallettes/Floor)', section: 'Static Exercises', metric_type: 'time' },
      { name: 'Planche Lean', section: 'Static Exercises', metric_type: 'time' },
      { name: 'Dead Hang', section: 'Static Exercises', metric_type: 'time' },
      { name: 'Pull-ups', section: 'Dynamic Exercises', metric_type: 'reps' },
      { name: 'Dips (Parallel Bars)', section: 'Dynamic Exercises', metric_type: 'reps' },
      { name: 'Push-ups', section: 'Dynamic Exercises', metric_type: 'reps' },
      { name: 'Pike Push-ups', section: 'Dynamic Exercises', metric_type: 'reps' },
      { name: 'Muscle-ups', section: 'Dynamic Exercises', metric_type: 'reps' },
      { name: 'Shoulder Bridge Stretch', section: 'Stretching', metric_type: 'time' },
      { name: 'Pike Hamstring Stretch', section: 'Stretching', metric_type: 'time' },
      { name: 'Cobra Chest Stretch', section: 'Stretching', metric_type: 'time' },
    ];

    try {
      const { data, error } = await supabase
        .from('exercises')
        .insert(defaults)
        .select();

      if (error) throw error;
      setCatalogExercises(data || []);
      showToast(`Loaded ${data?.length || 0} moves into catalog!`);
    } catch (err) {
      console.error('Error seeding moves:', err);
    } finally {
      setSeeding(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !currentUser) return;
    if (selectedExerciseIds.length === 0) {
      setBuilderError('Please select at least 1 exercise for your routine');
      return;
    }

    setSavingPlan(true);
    setBuilderError(null);

    try {
      const { data: plan, error: planError } = await supabase
        .from('workout_plans')
        .insert({
          user_id: currentUser.id,
          title: newTitle.trim(),
        })
        .select()
        .single();

      if (planError) throw planError;

      const sectionOrder: Record<string, number> = {
        'Warmup': 1,
        'Joint Preparation': 2,
        'Static Exercises': 3,
        'Dynamic Exercises': 4,
        'Stretching': 5,
      };

      const sortedExerciseIds = [...selectedExerciseIds].sort((aId, bId) => {
        const exA = catalogExercises.find(e => e.id === aId);
        const exB = catalogExercises.find(e => e.id === bId);
        const orderA = exA ? (sectionOrder[exA.section] || 99) : 99;
        const orderB = exB ? (sectionOrder[exB.section] || 99) : 99;
        return orderA - orderB;
      });

      const planItems = sortedExerciseIds.map((exId, idx) => ({
        plan_id: plan.id,
        exercise_id: exId,
        order_index: idx,
      }));

      const { data: insertedItems, error: itemsError } = await supabase
        .from('workout_plan_items')
        .insert(planItems)
        .select();

      if (itemsError) throw itemsError;

      const exerciseMap: Record<string, Exercise> = {};
      catalogExercises.forEach(ex => {
        exerciseMap[ex.id] = ex;
      });

      const fullPlan: WorkoutPlan = {
        ...plan,
        items: (insertedItems || []).map(it => ({
          ...it,
          exercise: exerciseMap[it.exercise_id],
        })),
      };

      setPlans(prev => [fullPlan, ...prev]);
      setShowBuilder(false);
      setNewTitle('');
      setSelectedExerciseIds([]);
      setActivePlan(fullPlan);
      showToast(`Created routine "${fullPlan.title}"!`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setBuilderError(err.message);
      } else {
        setBuilderError('Failed to save workout plan');
      }
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this routine?')) return;
    try {
      const { error } = await supabase
        .from('workout_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      setPlans(prev => prev.filter(p => p.id !== planId));
      if (activePlan?.id === planId) {
        setActivePlan(null);
      }
      showToast('Routine deleted');
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleMarkCompleted = async (planId: string) => {
    if (!currentUser) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const { error } = await supabase
        .from('workout_logs')
        .insert({
          user_id: currentUser.id,
          completed_at: today,
          plan_id: planId,
        });
      if (error) throw error;
      showToast('Workout logged! 💪');
    } catch (err) {
      console.error('Error logging workout:', err);
      showToast('Could not log workout');
    }
  };

  const toggleCheckExercise = (id: string) => {
    setCheckedExerciseIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const resetChecklist = () => {
    setCheckedExerciseIds({});
  };

  const groupPlanItemsBySection = (plan: WorkoutPlan) => {
    const grouped: Record<ExerciseSection, Exercise[]> = {
      'Warmup': [],
      'Joint Preparation': [],
      'Static Exercises': [],
      'Dynamic Exercises': [],
      'Stretching': [],
    };

    (plan.items || []).forEach(item => {
      if (item.exercise) {
        grouped[item.exercise.section]?.push(item.exercise);
      }
    });

    return grouped;
  };

  return (
    <div className="w-full max-w-md mx-auto pt-2 pb-24">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 bg-retro-day-accent dark:bg-retro-night-accent text-white px-4 py-2 rounded-2xl shadow-lg text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* VIEW 1: ACTIVE ROUTINE CHECKLIST CARD */}
      {activePlan ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActivePlan(null)}
              className="py-1.5 px-3 rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-xs font-bold flex items-center gap-1 active:scale-95"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Routines
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={resetChecklist}
                className="p-2 rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted dark:text-retro-night-textMuted text-xs flex items-center gap-1 active:scale-95"
                title="Reset session checklist"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleDeletePlan(activePlan.id)}
                className="p-2 rounded-xl border border-rose-300 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 active:scale-95"
                title="Delete routine"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Routine Title Banner */}
          <div className="p-4 rounded-3xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border shadow-sm">
            <h3 className="text-xl font-bold text-retro-day-text dark:text-retro-night-text">
              {activePlan.title}
            </h3>

            {/* Checklist Progress */}
            {activePlan.items && activePlan.items.length > 0 && (
              <div className="mt-3">
                {(() => {
                  const total = activePlan.items.length;
                  const completed = activePlan.items.filter(it => checkedExerciseIds[it.exercise_id]).length;
                  const pct = Math.round((completed / total) * 100);
                  return (
                    <div>
                      <div className="flex justify-between text-xs font-mono font-bold text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
                        <span>Progress</span>
                        <span>{completed}/{total} ({pct}%)</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-retro-day-cardAlt dark:bg-retro-night-cardAlt overflow-hidden border border-retro-day-border/50">
                        <div 
                          className="h-full bg-retro-day-accent dark:bg-retro-night-accent transition-all duration-300 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Mark Completed Button */}
          <button
            onClick={() => handleMarkCompleted(activePlan.id)}
            className="w-full py-3 rounded-2xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            Mark as Completed
          </button>

          {/* Grouped Checklist */}
          {(() => {
            const grouped = groupPlanItemsBySection(activePlan);
            return (
              <div className="space-y-4">
                {SECTIONS.map((sec, secIdx) => {
                  const list = grouped[sec];
                  if (!list || list.length === 0) return null;

                  return (
                    <div 
                      key={sec} 
                      className="p-4 rounded-3xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border shadow-sm"
                    >
                      {/* Section Header */}
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-retro-day-border dark:border-retro-night-border">
                        <span className="w-5 h-5 rounded-full bg-retro-day-accentSoft dark:bg-retro-night-accentSoft text-retro-day-accent dark:text-retro-night-accent text-xs font-mono font-bold flex items-center justify-center">
                          {secIdx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-retro-day-text dark:text-retro-night-text uppercase tracking-wide">
                          {sec}
                        </h4>
                        <span className="ml-auto text-[11px] text-retro-day-textMuted dark:text-retro-night-textMuted font-mono">
                          {list.length} moves
                        </span>
                      </div>

                      {/* Checklist Items */}
                      <div className="space-y-2">
                        {list.map(ex => {
                          const isDone = Boolean(checkedExerciseIds[ex.id]);
                          return (
                            <button
                              key={ex.id}
                              type="button"
                              onClick={() => toggleCheckExercise(ex.id)}
                              className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 active:scale-[0.99] touch-manipulation min-h-[48px] ${
                                isDone
                                  ? 'bg-retro-day-accentSoft/60 dark:bg-retro-night-accentSoft/30 border-retro-day-accent/40 dark:border-retro-night-accent/40 opacity-75'
                                  : 'bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border-retro-day-border dark:border-retro-night-border'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                                  isDone
                                    ? 'bg-retro-day-accent dark:bg-retro-night-accent border-retro-day-accent text-white shadow-sm'
                                    : 'border-retro-day-borderStrong/40 dark:border-retro-night-borderStrong bg-retro-day-surface dark:bg-retro-night-surface'
                                }`}>
                                  {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                                </div>
                                <span className={`text-sm font-bold truncate ${
                                  isDone
                                    ? 'line-through text-retro-day-textMuted dark:text-retro-night-textMuted'
                                    : 'text-retro-day-text dark:text-retro-night-text'
                                }`}>
                                  {ex.name}
                                </span>
                              </div>

                              <span className="text-[10px] font-mono shrink-0 px-2 py-0.5 rounded-full bg-retro-day-surface dark:bg-retro-night-surface text-retro-day-textMuted dark:text-retro-night-textMuted border border-retro-day-border/60">
                                {ex.metric_type === 'time' ? 'Hold' : 'Reps'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      ) : (
        /* VIEW 2: ROUTINES LIST & BUILD BUTTON */
        <div>
          {/* Centered green header */}
          <h2 className="text-center text-lg font-extrabold uppercase tracking-[0.2em] text-retro-day-accent dark:text-retro-night-accent mb-4 flex items-center justify-center gap-2">
            <Dumbbell className="w-5 h-5" />
            Workout Routines
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 rounded-full border-3 border-retro-day-accent dark:border-retro-night-accent border-t-transparent animate-spin" />
            </div>
          ) : plans.length === 0 ? (
            <div className="p-8 text-center bg-retro-day-card dark:bg-retro-night-card rounded-3xl border border-retro-day-border dark:border-retro-night-border">
              <Layers className="w-10 h-10 mx-auto mb-3 text-retro-day-textMuted dark:text-retro-night-textMuted opacity-60" />
              <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text mb-1">
                No Workout Plans Yet
              </h3>
              <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted mb-4">
                Build your first routine organized into Warmup, Joint Prep, Static, Dynamic, and Stretching!
              </p>
              <button
                onClick={openBuilder}
                className="py-2.5 px-4 rounded-xl bg-retro-day-accent text-white font-bold text-xs shadow-md"
              >
                + Build Custom Routine
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* New Routine button */}
              <button
                onClick={openBuilder}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-retro-day-accent/40 dark:border-retro-night-accent/40 text-retro-day-accent dark:text-retro-night-accent text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all hover:bg-retro-day-accentSoft/30 dark:hover:bg-retro-night-accentSoft/20"
              >
                <Plus className="w-4 h-4" />
                New Routine
              </button>

              {plans.map(plan => {
                const count = plan.items?.length || 0;
                return (
                  <div
                    key={plan.id}
                    className="p-4 rounded-3xl bg-retro-day-card dark:bg-retro-night-card border border-retro-day-border dark:border-retro-night-border shadow-sm hover:border-retro-day-accent cursor-pointer transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-3" onClick={() => setActivePlan(plan)}>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-base font-bold text-retro-day-text dark:text-retro-night-text truncate">
                          {plan.title}
                        </h4>
                        <p className="text-xs text-retro-day-textMuted dark:text-retro-night-textMuted mt-1">
                          {count} exercises • 5 sections
                        </p>
                      </div>
                      <div className="flex items-center gap-1 text-retro-day-accent dark:text-retro-night-accent font-bold text-xs">
                        <span>Start</span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                    {/* Mark Completed inline */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleMarkCompleted(plan.id); }}
                      className="mt-2 w-full py-2 rounded-xl bg-retro-day-accentSoft dark:bg-retro-night-accentSoft text-retro-day-accent dark:text-retro-night-accent text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all border border-retro-day-accent/20 dark:border-retro-night-accent/20"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark as Completed
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ROUTINE BUILDER */}
      {/* ========================================================================= */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="w-full max-w-md max-h-[85vh] bg-retro-day-card dark:bg-retro-night-card rounded-3xl p-5 border-2 border-retro-day-border dark:border-retro-night-border shadow-2xl flex flex-col animate-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-retro-day-border dark:border-retro-night-border">
              <div className="flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-retro-day-accent dark:text-retro-night-accent" />
                <h3 className="text-base font-bold text-retro-day-text dark:text-retro-night-text">
                  New Workout Routine
                </h3>
              </div>
              <button
                onClick={() => setShowBuilder(false)}
                className="p-1 rounded-full text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {builderError && (
              <div className="my-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs">
                {builderError}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="flex-1 flex flex-col overflow-hidden pt-3">
              {/* Routine Title */}
              <div className="mb-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1">
                  Routine Name
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Monday Pull & Handstand"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-retro-day-bg dark:bg-retro-night-bg border border-retro-day-border dark:border-retro-night-border text-retro-day-text dark:text-retro-night-text text-base focus:outline-none focus:ring-2 focus:ring-retro-day-accent"
                />
              </div>

              {/* Select Exercises header */}
              <div className="flex items-center justify-between text-xs font-bold text-retro-day-textMuted dark:text-retro-night-textMuted mb-2">
                <span className="uppercase tracking-wider">Select Exercises ({selectedExerciseIds.length})</span>
                <span className="text-[11px] font-normal italic">Grouped by 5 sections</span>
              </div>

              {/* If catalog is empty inside builder modal */}
              {catalogExercises.length === 0 ? (
                <div className="p-6 text-center bg-retro-day-cardAlt dark:bg-retro-night-cardAlt rounded-2xl border border-retro-day-border dark:border-retro-night-border my-auto">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 text-retro-day-accent dark:text-retro-night-accent" />
                  <p className="text-xs font-bold text-retro-day-text dark:text-retro-night-text mb-1">
                    No exercises in catalog yet
                  </p>
                  <p className="text-[11px] text-retro-day-textMuted dark:text-retro-night-textMuted mb-3">
                    Load starter calisthenics moves now or add custom ones in the Catalog tab.
                  </p>
                  <button
                    type="button"
                    onClick={handleSeedDefaults}
                    disabled={seeding}
                    className="w-full py-2.5 px-4 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                  >
                    {seeding ? 'Loading moves...' : '⚡ Load Starter Calisthenics Moves'}
                  </button>
                </div>
              ) : (
                /* Scrollable multi-select categorized by 5 sections */
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {SECTIONS.map((sec, idx) => {
                    const moves = catalogExercises.filter(ex => ex.section === sec);
                    if (moves.length === 0) return null;

                    return (
                      <div key={sec} className="p-3 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border/80">
                        <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-retro-day-text dark:text-retro-night-text uppercase tracking-wider">
                          <span className="w-4 h-4 rounded-full bg-retro-day-accent text-white text-[10px] font-mono flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span>{sec}</span>
                          <span className="ml-auto text-[10px] text-retro-day-textMuted font-mono">
                            {moves.filter(m => selectedExerciseIds.includes(m.id)).length}/{moves.length}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {moves.map(m => {
                            const isSelected = selectedExerciseIds.includes(m.id);
                            return (
                              <button
                                key={m.id}
                                type="button"
                                onClick={() => toggleSelectExercise(m.id)}
                                className={`w-full text-left p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all min-h-[44px] touch-manipulation active:scale-[0.99] ${
                                  isSelected
                                    ? 'bg-retro-day-accent text-white border-retro-day-accent shadow-sm'
                                    : 'bg-retro-day-surface dark:bg-retro-night-surface text-retro-day-text dark:text-retro-night-text border-retro-day-border dark:border-retro-night-border'
                                }`}
                              >
                                <span className="truncate pr-2">{m.name}</span>
                                <div className="flex items-center gap-1 shrink-0 text-[10px] font-mono opacity-80">
                                  {m.metric_type === 'time' ? <Clock className="w-3 h-3" /> : <Repeat className="w-3 h-3" />}
                                  {isSelected && <Check className="w-3.5 h-3.5 ml-1 stroke-[3]" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-3 border-t border-retro-day-border dark:border-retro-night-border mt-3">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="flex-1 py-3 rounded-xl border border-retro-day-border dark:border-retro-night-border text-retro-day-textMuted font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPlan || catalogExercises.length === 0}
                  className="flex-1 py-3 rounded-xl bg-retro-day-accent hover:bg-retro-day-accentHover text-white font-bold text-xs shadow-md disabled:opacity-50"
                >
                  {savingPlan ? 'Saving...' : `Save Routine (${selectedExerciseIds.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

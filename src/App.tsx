import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { LoginRegister } from './components/LoginRegister';
import { ProfileView } from './components/ProfileView';
import { BottomNav } from './components/BottomNav';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { Session } from '@supabase/supabase-js';
import { Dumbbell, Trophy } from 'lucide-react';

function MainApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'profile' | 'workouts' | 'leaderboard'>('profile');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSession(session);
      setCurrentTab('profile');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-retro-day-bg dark:bg-retro-night-bg">
        <div className="w-8 h-8 rounded-full border-3 border-retro-day-accent dark:border-retro-night-accent border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-day-bg dark:bg-retro-night-bg text-retro-day-text dark:text-retro-night-text transition-colors duration-200 flex flex-col justify-between">
      {/* Centered mobile-first container */}
      <div className="w-full max-w-md mx-auto flex flex-col flex-1 min-h-screen relative">
        {/* Safe-area Top Header - Stays inside mobile column on both desktop & mobile */}
        <header className="w-full px-4 pt-safe pb-2 flex items-center justify-between z-30">
          <div className="flex items-center gap-2">
            <img src="/icon.svg" alt="Chalk & Timber" className="w-5 h-5 rounded-md shadow-sm" />
            <span className="text-xs font-bold tracking-wider uppercase text-retro-day-text dark:text-retro-night-text font-sans">
              Chalk &amp; Timber
            </span>
          </div>
          <ThemeToggle />
        </header>

        {/* Unconfigured Alert Banner */}
        {!isSupabaseConfigured && (
          <div className="mx-4 mb-2 p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs text-center shadow-sm">
            <strong>Supabase setup needed:</strong> Add credentials in <code>.env.local</code>.
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col justify-center px-4 pb-6 sm:pb-12">
          {!session ? (
            <div className="w-full my-auto -translate-y-4 sm:-translate-y-8 transition-transform">
              <LoginRegister onAuthSuccess={handleAuthSuccess} />
            </div>
          ) : (
            <div className="flex-1 pb-24">
              {currentTab === 'profile' && <ProfileView onLogout={handleLogout} />}

              {currentTab === 'workouts' && (
                <div className="w-full py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt flex items-center justify-center border border-retro-day-border dark:border-retro-night-border text-retro-day-accent dark:text-retro-night-accent">
                    <Dumbbell className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Stage 2: Workout Logging</h3>
                  <p className="text-sm text-retro-day-textMuted dark:text-retro-night-textMuted">
                    Coming soon! Track sets, reps, and calisthenics progressions with your 2 squad mates.
                  </p>
                  <button
                    onClick={() => setCurrentTab('profile')}
                    className="mt-6 px-4 py-2 text-xs font-bold rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border hover:bg-retro-day-accent hover:text-white transition-all"
                  >
                    Back to Profile
                  </button>
                </div>
              )}

              {currentTab === 'leaderboard' && (
                <div className="w-full py-16 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt flex items-center justify-center border border-retro-day-border dark:border-retro-night-border text-retro-day-accent dark:text-retro-night-accent">
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Stage 3: Squad Leaderboard</h3>
                  <p className="text-sm text-retro-day-textMuted dark:text-retro-night-textMuted">
                    Compete with your 2 friends on weekly points, consistency streaks, and pull-up records.
                  </p>
                  <button
                    onClick={() => setCurrentTab('profile')}
                    className="mt-6 px-4 py-2 text-xs font-bold rounded-xl bg-retro-day-cardAlt dark:bg-retro-night-cardAlt border border-retro-day-border dark:border-retro-night-border hover:bg-retro-day-accent hover:text-white transition-all"
                  >
                    Back to Profile
                  </button>
                </div>
              )}

              <BottomNav currentTab={currentTab} onTabChange={setCurrentTab} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}

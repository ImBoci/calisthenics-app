import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, ADMIN_EMAIL } from './lib/supabase';
import { LoginRegister } from './components/LoginRegister';
import { ProfileView } from './components/ProfileView';
import { BottomNav, NavTab } from './components/BottomNav';
import { CatalogView } from './components/CatalogView';
import { PBsView } from './components/PBsView';
import { WorkoutsView } from './components/WorkoutsView';
import { LeaderboardView } from './components/LeaderboardView';
import { ThemeToggle } from './components/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { Session } from '@supabase/supabase-js';

function MainApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<NavTab>('workouts');
  const [suggestionCount, setSuggestionCount] = useState(0);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user?.email === ADMIN_EMAIL) {
        checkAdminSuggestions();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
      if (session?.user?.email === ADMIN_EMAIL) {
        checkAdminSuggestions();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAdminSuggestions = async () => {
    try {
      const { data, error } = await supabase
        .from('exercise_suggestions')
        .select('id');
      if (!error && data) {
        setSuggestionCount(data.length);
      }
    } catch {
      // ignore
    }
  };

  const handleAuthSuccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setSession(session);
      setCurrentTab('workouts');
      if (session.user?.email === ADMIN_EMAIL) {
        checkAdminSuggestions();
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentTab('workouts');
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
            <div className="flex-1">
              {currentTab === 'workouts' && (
                <WorkoutsView 
                  currentUser={session.user} 
                  onNavigateToCatalog={() => setCurrentTab('catalog')} 
                />
              )}

              {currentTab === 'leaderboard' && (
                <LeaderboardView
                  currentUser={session.user}
                  onNavigateToPBs={() => setCurrentTab('pbs')}
                />
              )}

              {currentTab === 'pbs' && (
                <PBsView currentUser={session.user} />
              )}

              {currentTab === 'catalog' && (
                <CatalogView 
                  currentUser={session.user} 
                  onSuggestionCountChange={setSuggestionCount} 
                />
              )}

              {currentTab === 'profile' && (
                <ProfileView onLogout={handleLogout} currentUser={session.user} />
              )}

              <BottomNav 
                currentTab={currentTab} 
                onTabChange={setCurrentTab} 
                suggestionCount={session.user.email === ADMIN_EMAIL ? suggestionCount : 0}
              />
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

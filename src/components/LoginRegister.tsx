import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, User, Sparkles, AlertCircle } from 'lucide-react';

interface LoginRegisterProps {
  onAuthSuccess: () => void;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg('Supabase is not configured yet. Please add your credentials in .env.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim() || !displayName.trim()) {
          throw new Error('Please enter both a username and display name');
        }

        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: cleanUsername,
              display_name: displayName.trim(),
            },
          },
        });

        if (error) throw error;

        // If email confirmation is disabled in Supabase, session is active immediately
        if (data.session) {
          onAuthSuccess();
        } else if (data.user) {
          setErrorMsg('Account created! Please check your email to confirm registration or disable email confirmations in Supabase.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto px-4 py-8">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-retro-day-accentSoft dark:bg-retro-night-accentSoft border-2 border-retro-day-accent/40 dark:border-retro-night-accent/40 text-retro-day-accent dark:text-retro-night-accent shadow-sm mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-retro-day-text dark:text-retro-night-text font-sans">
          Calisthenics Club
        </h1>
        <p className="text-sm mt-1 text-retro-day-textMuted dark:text-retro-night-textMuted">
          Stage 1: Squad Access & Profiles
        </p>
      </div>

      {/* Retro Tab Switch */}
      <div className="flex bg-retro-day-cardAlt dark:bg-retro-night-cardAlt p-1 rounded-xl mb-6 border border-retro-day-border dark:border-retro-night-border">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
            !isSignUp
              ? 'bg-retro-day-surface dark:bg-retro-night-surface text-retro-day-text dark:text-retro-night-text shadow-sm'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text'
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${
            isSignUp
              ? 'bg-retro-day-surface dark:bg-retro-night-surface text-retro-day-text dark:text-retro-night-text shadow-sm'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-retro-day-card dark:bg-retro-night-card rounded-2xl p-6 border-2 border-retro-day-border dark:border-retro-night-border shadow-[0_4px_20px_-4px_rgba(74,55,40,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
                  Display Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-retro-day-textMuted dark:text-retro-night-textMuted">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Alex (Iron Grip)"
                    className="w-full pl-10 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-retro-day-textMuted dark:text-retro-night-textMuted font-mono text-sm">
                    @
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase())}
                    placeholder="alex_pullups"
                    autoCapitalize="none"
                    className="w-full pl-9 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all font-mono"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-retro-day-textMuted dark:text-retro-night-textMuted">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="athlete@gym.app"
                autoComplete="email"
                autoCapitalize="none"
                className="w-full pl-10 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-retro-day-textMuted dark:text-retro-night-textMuted">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-retro-day-accent hover:bg-retro-day-accentHover dark:bg-retro-night-accent dark:hover:bg-retro-night-accentHover text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-md shadow-retro-day-accent/25 dark:shadow-retro-night-accent/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              'Join Calisthenics Club'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-retro-day-textMuted dark:text-retro-night-textMuted mt-6">
        Squad Edition • Optimized for Mobile Browsers
      </p>
    </div>
  );
};


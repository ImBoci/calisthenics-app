import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Lock, Mail, User, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface LoginRegisterProps {
  onAuthSuccess: () => void;
}

export const LoginRegister: React.FC<LoginRegisterProps> = ({ onAuthSuccess }) => {
  const { t } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Friendly human-readable error messages for retro styling
  const formatAuthError = (message: string): string => {
    const lower = message.toLowerCase();
    if (lower.includes('already registered') || lower.includes('user already exists')) {
      return t.errEmailExists;
    }
    if (lower.includes('at least 6 characters') || lower.includes('weak password')) {
      return t.errWeakPassword;
    }
    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return t.errInvalidCreds;
    }
    if (lower.includes('rate limit')) {
      return t.errRateLimit;
    }
    return message;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!isSupabaseConfigured) {
      setErrorMsg(t.errSupabaseNotConfigured);
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        if (!username.trim() || !displayName.trim()) {
          throw new Error(t.errEnterBoth);
        }

        const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (!cleanUsername) {
          throw new Error(t.errUsernameChars);
        }

          const trimmedEmail = email.trim();

          // 1. Create account with metadata
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: trimmedEmail,
            password,
            options: {
              data: {
                username: cleanUsername,
                display_name: displayName.trim(),
              },
            },
          });

          if(signUpError) throw signUpError;

        // 2. Instant session establishment:
        // If email confirmation is disabled, session might already be present.
        // If not, sign in immediately with credentials so user is logged in instantly.
        let activeSession = signUpData.session;
        if (!activeSession) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: trimmedEmail,
            password,
          });
          if (signInError) throw signInError;
          activeSession = signInData.session;
        }

        // 3. Ensure the profiles table row is initialized with chosen credentials
        const userId = activeSession?.user?.id || signUpData.user?.id;
        if (userId) {
          await supabase.from('profiles').upsert(
            {
              id: userId,
              username: cleanUsername,
              display_name: displayName.trim(),
              starting_level: 'Beginner',
              favorite_exercise: 'Pull-ups',
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'id' }
          );
        }

        // 4. Immediately route to profile screen
        onAuthSuccess();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        onAuthSuccess();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(formatAuthError(err.message));
      } else {
        setErrorMsg(t.errUnexpected);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto py-4 overflow-hidden">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-block p-1 bg-retro-day-cardAlt dark:bg-retro-night-cardAlt rounded-3xl border-2 border-retro-day-border dark:border-retro-night-border shadow-md mb-2.5">
          <img
            src="/icon.svg"
            alt="Chalk & Timber Logo"
            className="w-16 h-16 rounded-[22px] object-cover"
          />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-retro-day-text dark:text-retro-night-text font-sans">
          Chalk &amp; Timber
        </h1>
        <p className="text-xs font-medium mt-1 text-retro-day-textMuted dark:text-retro-night-textMuted tracking-wide">
          {t.authTagline}
        </p>
      </div>

      {/* Retro Tab Switch */}
      <div className="flex bg-retro-day-cardAlt dark:bg-retro-night-cardAlt p-1 rounded-xl mb-5 border border-retro-day-border dark:border-retro-night-border">
        <button
          type="button"
          onClick={() => { setIsSignUp(false); setErrorMsg(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${!isSignUp
              ? 'bg-retro-day-surface dark:bg-retro-night-surface text-retro-day-text dark:text-retro-night-text shadow-sm'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text'
            }`}
        >
          {t.signIn}
        </button>
        <button
          type="button"
          onClick={() => { setIsSignUp(true); setErrorMsg(null); }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-95 ${isSignUp
              ? 'bg-retro-day-surface dark:bg-retro-night-surface text-retro-day-text dark:text-retro-night-text shadow-sm'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text'
            }`}
        >
          {t.createAccount}
        </button>
      </div>

      {/* Main Card */}
      <div className="bg-retro-day-card dark:bg-retro-night-card rounded-2xl p-6 border-2 border-retro-day-border dark:border-retro-night-border shadow-[0_4px_20px_-4px_rgba(74,55,40,0.08)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)]">
        {/* Retro Styled Inline Error Banner */}
        {errorMsg && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 dark:bg-[#342722] border-2 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700 dark:text-amber-400" />
            <div className="flex-1 leading-relaxed font-medium">{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
                  {t.displayName}
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
                    className="w-full pl-10 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
                  {t.username}
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
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-9 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all font-mono text-base"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
              {t.email}
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
                autoCorrect="off"
                spellCheck="false"
                className="w-full pl-10 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all text-base"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-retro-day-textMuted dark:text-retro-night-textMuted mb-1.5">
              {t.password}
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
                className="w-full pl-10 pr-4 py-3 bg-retro-day-bg/60 dark:bg-retro-night-bg/60 border border-retro-day-border dark:border-retro-night-border rounded-xl text-retro-day-text dark:text-retro-night-text placeholder-retro-day-textMuted/50 dark:placeholder-retro-night-textMuted/50 focus:outline-none focus:ring-2 focus:ring-retro-day-accent dark:focus:ring-retro-night-accent transition-all text-base"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 bg-retro-day-accent hover:bg-retro-day-accentHover dark:bg-retro-night-accent dark:hover:bg-retro-night-accentHover text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] shadow-md shadow-retro-day-accent/25 dark:shadow-retro-night-accent/25 disabled:opacity-50 flex items-center justify-center gap-2 touch-manipulation"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isSignUp ? (
              t.joinChalkTimber
            ) : (
              t.signIn
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

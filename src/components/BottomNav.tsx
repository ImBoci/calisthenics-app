import React from 'react';
import { User, Dumbbell, Trophy } from 'lucide-react';

interface BottomNavProps {
  currentTab: 'profile' | 'workouts' | 'leaderboard';
  onTabChange: (tab: 'profile' | 'workouts' | 'leaderboard') => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-retro-day-card/95 dark:bg-retro-night-card/95 backdrop-blur-md border-t border-retro-day-border dark:border-retro-night-border pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-2">
        {/* Workouts (Stage 2) */}
        <button
          type="button"
          onClick={() => onTabChange('workouts')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-transform active:scale-90 ${
            currentTab === 'workouts'
              ? 'text-retro-day-accent dark:text-retro-night-accent font-bold'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted opacity-60'
          }`}
        >
          <div className="relative">
            <Dumbbell className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[8px] bg-amber-500/80 text-white font-extrabold px-1 rounded-full leading-tight">
              S2
            </span>
          </div>
          <span className="text-[10px] mt-1">Workouts</span>
        </button>

        {/* Profile (Stage 1 Active) */}
        <button
          type="button"
          onClick={() => onTabChange('profile')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-transform active:scale-90 ${
            currentTab === 'profile'
              ? 'text-retro-day-accent dark:text-retro-night-accent font-bold'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted'
          }`}
        >
          <div className="relative">
            <User className="w-5 h-5" />
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-retro-day-accent dark:bg-retro-night-accent" />
          </div>
          <span className="text-[10px] mt-1">Profile</span>
        </button>

        {/* Leaderboard (Stage 3) */}
        <button
          type="button"
          onClick={() => onTabChange('leaderboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-transform active:scale-90 ${
            currentTab === 'leaderboard'
              ? 'text-retro-day-accent dark:text-retro-night-accent font-bold'
              : 'text-retro-day-textMuted dark:text-retro-night-textMuted opacity-60'
          }`}
        >
          <div className="relative">
            <Trophy className="w-5 h-5" />
            <span className="absolute -top-1 -right-2 text-[8px] bg-amber-500/80 text-white font-extrabold px-1 rounded-full leading-tight">
              S3
            </span>
          </div>
          <span className="text-[10px] mt-1">Squad</span>
        </button>
      </div>
    </nav>
  );
};


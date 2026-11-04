import React from 'react';
import { User, Dumbbell, Trophy, BookOpen, Crown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export type NavTab = 'workouts' | 'leaderboard' | 'pbs' | 'catalog' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  suggestionCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange, suggestionCount = 0 }) => {
  const { t } = useLanguage();

  const tabs = [
    { id: 'workouts' as NavTab, label: t.navWorkouts, icon: Dumbbell },
    { id: 'leaderboard' as NavTab, label: t.navLeaderboard, icon: Crown },
    { id: 'pbs' as NavTab, label: t.navPBs, icon: Trophy },
    { id: 'catalog' as NavTab, label: t.navCatalog, icon: BookOpen, badge: suggestionCount },
    { id: 'profile' as NavTab, label: t.navProfile, icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-retro-day-card/95 dark:bg-retro-night-card/95 backdrop-blur-md border-t border-retro-day-border dark:border-retro-night-border pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all active:scale-95 touch-manipulation min-h-[44px] ${
                isActive
                  ? 'text-retro-day-accent dark:text-retro-night-accent font-bold'
                  : 'text-retro-day-textMuted dark:text-retro-night-textMuted hover:text-retro-day-text dark:hover:text-retro-night-text'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-amber-600 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow">
                    {tab.badge}
                  </span>
                )}
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-retro-day-accent dark:bg-retro-night-accent" />
                )}
              </div>
              <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

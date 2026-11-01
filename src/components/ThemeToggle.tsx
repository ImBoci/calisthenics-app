import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle theme"
      className={`relative inline-flex h-9 w-16 items-center rounded-full p-1 transition-colors duration-300 focus:outline-none border border-retro-day-borderStrong/20 dark:border-retro-night-borderStrong shadow-inner ${
        isDark ? 'bg-retro-night-cardAlt' : 'bg-retro-day-cardAlt'
      } ${className}`}
    >
      {/* Background Icons */}
      <span className="flex w-full justify-between px-1 text-xs text-retro-day-textMuted dark:text-retro-night-textMuted">
        <Sun className="h-4 w-4 text-amber-600/70" />
        <Moon className="h-4 w-4 text-retro-night-accent" />
      </span>

      {/* Retro Switch Thumb */}
      <span
        className={`absolute left-1 top-1 flex h-7 w-7 transform items-center justify-center rounded-full bg-retro-day-accent dark:bg-retro-night-accent text-white shadow-md transition-transform duration-300 ease-out ${
          isDark ? 'translate-x-7' : 'translate-x-0'
        }`}
      >
        {isDark ? (
          <Moon className="h-3.5 w-3.5 fill-current" />
        ) : (
          <Sun className="h-3.5 w-3.5 fill-current" />
        )}
      </span>
    </button>
  );
};


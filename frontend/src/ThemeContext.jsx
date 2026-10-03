import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('campusedge_theme');
    return savedTheme || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('campusedge_theme', theme);
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.classList.remove('light');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.classList.add('light');
      root.setAttribute('data-theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeToggle({ className = '', showLabel = false }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      type="button"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      className={`w-9 h-9 rounded-2xl border flex items-center justify-center text-xs transition-all duration-200 transform active:scale-90 hover:scale-105 cursor-pointer shadow-xs select-none flex-shrink-0 ${
        isDark
          ? 'bg-slate-900 border-slate-700 text-amber-300 hover:text-amber-200 hover:border-amber-400/60 hover:bg-slate-800'
          : 'bg-white border-slate-200 text-indigo-600 hover:text-indigo-700 hover:border-indigo-300 hover:bg-slate-50'
      } ${className}`}
    >
      <span className="text-sm transition-transform duration-200 hover:rotate-12">
        {isDark ? '☀️' : '🌙'}
      </span>
      {showLabel && (
        <span className="ml-1.5 font-bold text-[10px]">
          {isDark ? 'Light' : 'Dark'}
        </span>
      )}
    </button>
  );
}

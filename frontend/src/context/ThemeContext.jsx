/**
 * Theme Context — manages selectable themes (White / Professional vs. Black / Previous Dark)
 * with instant switching and localStorage persistence.
 */
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Initialize theme from localStorage or default to 'light' (White/Professional)
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('annarakshak_theme');
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    } catch {
      /* ignore */
    }
    return 'light';
  });

  // Apply data-theme attribute on document.documentElement whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('annarakshak_theme', theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = (newTheme) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        isDark: theme === 'dark',
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}

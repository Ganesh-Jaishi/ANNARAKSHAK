/**
 * ThemeToggle Component — Instant Theme Switcher between
 * White / Professional Theme and Black / Previous Dark Theme.
 */
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, setTheme, isDark, toggleTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        className={`theme-toggle-compact-btn ${className}`}
        onClick={toggleTheme}
        title={`Current: ${isDark ? 'Black / Dark' : 'White / Professional'} (Click to switch)`}
        aria-label="Toggle theme"
      >
        <span className="theme-toggle-icon">{isDark ? '🌙' : '☀️'}</span>
      </button>
    );
  }

  return (
    <div
      className={`theme-switcher ${className}`}
      role="radiogroup"
      aria-label="Theme switcher"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!isDark}
        className={`theme-switch-btn ${!isDark ? 'active' : ''}`}
        onClick={() => setTheme('light')}
        title="White / Professional Theme"
      >
        <span className="theme-btn-icon">☀️</span>

      </button>

      <button
        type="button"
        role="radio"
        aria-checked={isDark}
        className={`theme-switch-btn ${isDark ? 'active' : ''}`}
        onClick={() => setTheme('dark')}
        title="Black / Previous Theme"
      >
        <span className="theme-btn-icon">🌙</span>

      </button>
    </div>
  );
}

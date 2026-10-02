import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeValue {
  theme: Theme;
  toggle: () => void;
}

interface ThemeProviderProps {
  initial: Theme;
  children: ReactNode;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ initial, children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(initial);

  const toggle = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  // Memo value so consumers skip rerenders.
  const value = useMemo<ThemeValue>(() => ({ theme, toggle }), [theme, toggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme needs ThemeProvider');
  return ctx;
}

interface ThemedCardProps {
  title: string;
  body: string;
}

export function ThemedCard({ title, body }: ThemedCardProps) {
  const { theme, toggle } = useTheme();
  return (
    <div data-theme={theme}>
      <h2>{title}</h2>
      <p>{body}</p>
      <button type="button" onClick={toggle}>
        Switch to {theme === 'light' ? 'dark' : 'light'}
      </button>
    </div>
  );
}

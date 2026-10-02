import { useEffect, useState } from 'react';

interface DebounceOptions {
  delayMs: number;
  initial: string;
}

interface UseDebounceResult {
  value: string;
  debounced: string;
  setValue: (next: string) => void;
}

// Reusable input debounce logic.
export function useDebounce({ delayMs, initial }: DebounceOptions): UseDebounceResult {
  const [value, setValue] = useState<string>(initial);
  const [debounced, setDebounced] = useState<string>(initial);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return { value, debounced, setValue };
}

interface DebouncedInputProps {
  label: string;
  delayMs: number;
  initial: string;
}

export function DebouncedInput({ label, delayMs, initial }: DebouncedInputProps) {
  const { value, debounced, setValue } = useDebounce({ delayMs, initial });

  return (
    <div>
      <label>
        {label}
        <input value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <p>
        Debounced: <strong>{debounced}</strong>
      </p>
    </div>
  );
}

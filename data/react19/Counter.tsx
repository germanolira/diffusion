import { memo, useCallback, useState } from 'react';

interface CounterProps {
  initial: number;
  step: number;
  label: string;
}

interface DisplayProps {
  value: number;
  label: string;
}

// Pure display, memoized to skip repeats.
const CounterDisplay = memo(function CounterDisplay({ value, label }: DisplayProps) {
  return (
    <p aria-live="polite">
      {label}: <strong>{value}</strong>
    </p>
  );
});

export function Counter({ initial, step, label }: CounterProps) {
  const [count, setCount] = useState<number>(initial);

  // Stable handlers keep memoized children cheap.
  const increment = useCallback(() => {
    setCount((c) => c + step);
  }, [step]);

  const decrement = useCallback(() => {
    setCount((c) => c - step);
  }, [step]);

  const reset = useCallback(() => {
    setCount(initial);
  }, [initial]);

  return (
    <section>
      <h2>Counter</h2>
      <CounterDisplay value={count} label={label} />
      <div>
        <button type="button" onClick={decrement}>
          Minus
        </button>
        <button type="button" onClick={increment}>
          Plus
        </button>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </div>
    </section>
  );
}

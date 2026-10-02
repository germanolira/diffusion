import { useState } from "react";

export function Button({ label }: { label: string }) {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount((c) => c + 1)}>
      {label}: {count}
    </button>
  );
}

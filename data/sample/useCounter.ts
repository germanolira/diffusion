import { useEffect, useState } from "react";

export function useCounter(initial = 0) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    document.title = `count=${value}`;
  }, [value]);
  return { value, inc: () => setValue((v) => v + 1) };
}

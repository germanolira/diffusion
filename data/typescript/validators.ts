// Small validators that return typed results.
export type Issue = { readonly field: string; readonly hint: string };

export function validEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function validPort(n: number): boolean {
  return Number.isInteger(n) && n >= 1 && n <= 65535;
}

export function validSlug(v: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v);
}

// Parse a finite number from unknown input.
export function parseNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

// Collect issues for a signup form.
export function checkSignup(name: string, email: string, age: number): Issue[] {
  const out: Issue[] = [];
  if (name.trim().length < 2) out.push({ field: "name", hint: "too short" });
  if (!validEmail(email)) out.push({ field: "email", hint: "bad format" });
  if (!Number.isInteger(age) || age < 13) out.push({ field: "age", hint: "too young" });
  return out;
}

// Debounce rapid calls into one trailing call.
export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: A) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

// Throttle to at most one call per window.
export function throttle<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let last = 0;
  return (...args: A) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

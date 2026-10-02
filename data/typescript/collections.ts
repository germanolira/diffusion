// Const assertions, template literals, collections.
export const verbs = ["read", "write", "remove"] as const;
export type Verb = (typeof verbs)[number];

export type Route = `/api/${string}`;
export type EventName = `on${Capitalize<string>}`;

// Build a typed route path.
export function apiRoute(name: string): Route {
  return `/api/${name}`;
}

function sameValue(a: unknown, b: unknown): boolean {
  return a === b || (Number.isNaN(a) && Number.isNaN(b));
}

// Deep clone plain data via JSON round trip.
export function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Structural equality for plain data.
export function deepEqual(a: unknown, b: unknown): boolean {
  if (sameValue(a, b)) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    return a.every((x, i) => deepEqual(x, b[i]));
  }
  const ra = a as Record<string, unknown>;
  const rb = b as Record<string, unknown>;
  const ka = Object.keys(ra);
  const kb = Object.keys(rb);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(ra[k], rb[k]));
}

// Unique values keeping first order.
export function unique<T>(items: readonly T[]): T[] {
  return [...new Set(items)];
}

// Split a list into fixed-size chunks.
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
}

// Count occurrences by key.
export function countBy<T>(items: readonly T[], keyOf: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const x of items) {
    const k = keyOf(x);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

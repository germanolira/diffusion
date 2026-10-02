// Type guards and narrowing helpers.
export interface User {
  readonly id: string;
  readonly name: string;
  readonly age: number;
}

export function isString(v: unknown): v is string {
  return typeof v === "string";
}

export function isNumber(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

// Check for a named property on an object.
export function hasProp<K extends string>(
  v: unknown,
  key: K
): v is Record<K, unknown> {
  return isRecord(v) && key in v;
}

export function isUser(v: unknown): v is User {
  if (!isRecord(v)) return false;
  return (
    hasProp(v, "id") &&
    hasProp(v, "name") &&
    hasProp(v, "age") &&
    isString(v.id) &&
    isString(v.name) &&
    isNumber(v.age)
  );
}

// Narrow unknown input to a safe string.
export function toSafeString(v: unknown): string {
  if (isString(v)) return v;
  if (isNumber(v)) return String(v);
  return "";
}

// Narrow with instanceof before use.
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (isString(e)) return e;
  return "unknown error";
}

// Parse JSON with a guard on the result.
export function parseJsonAs(text: string, guard: (v: unknown) => boolean): boolean {
  const parsed: unknown = JSON.parse(text);
  return guard(parsed);
}

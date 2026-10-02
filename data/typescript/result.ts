// Result type for explicit error handling.
export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

// Map the success value, keep the error as is.
export function map<T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> {
  if (!r.ok) return r;
  return ok(fn(r.value));
}

// Chain fallible steps without try/catch.
export function flatMap<T, U, E>(
  r: Result<T, E>,
  fn: (v: T) => Result<U, E>
): Result<U, E> {
  if (!r.ok) return r;
  return fn(r.value);
}

// Fallback value for the error case.
export function unwrapOr<T, E>(r: Result<T, E>, fallback: T): T {
  return r.ok ? r.value : fallback;
}

// Run a throwing fn and capture the error.
export function fromThrowable<T>(fn: () => T, label: string): Result<T, string> {
  try {
    return ok(fn());
  } catch (e: unknown) {
    if (e instanceof Error) return err(label + ": " + e.message);
    return err(label + ": unknown failure");
  }
}

// Combine many results, stop at first error.
export function combine<T, E>(items: Result<T, E>[]): Result<T[], E> {
  const out: T[] = [];
  for (const item of items) {
    if (!item.ok) return item;
    out.push(item.value);
  }
  return ok(out);
}

// Narrow a Result to its Ok branch.
export function isOk<T, E>(r: Result<T, E>): r is Ok<T> {
  return r.ok;
}

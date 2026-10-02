// Typed errors without throwing across layers.
export class AppError extends Error {
  readonly code: string;
  constructor(code: string, msg: string) {
    super(msg);
    this.name = "AppError";
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(id: string) {
    super("NOT_FOUND", "missing: " + id);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  readonly fields: readonly string[];
  constructor(fields: readonly string[]) {
    super("BAD_INPUT", "bad fields: " + fields.join(", "));
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export function isError(v: unknown): v is Error {
  return v instanceof Error;
}

// Convert unknown catch values to Error.
export function toError(v: unknown): Error {
  if (v instanceof Error) return v;
  if (typeof v === "string") return new Error(v);
  return new Error("unknown failure");
}

// Short one-line error summary.
export function formatError(e: Error): string {
  return e.name + ": " + e.message;
}

export type Outcome<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: AppError };

// Wrap a throwing step into an Outcome.
export function attempt<T>(fn: () => T, code: string): Outcome<T> {
  try {
    return { ok: true, value: fn() };
  } catch (e: unknown) {
    return { ok: false, error: new AppError(code, toError(e).message) };
  }
}

// Map the success value of an Outcome.
export function mapOutcome<T, U>(o: Outcome<T>, fn: (v: T) => U): Outcome<U> {
  if (!o.ok) return o;
  return { ok: true, value: fn(o.value) };
}

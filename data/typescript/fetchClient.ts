// Typed fetch wrapper with explicit errors.
export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class HttpError extends Error {
  readonly status: number;
  readonly body: string;
  constructor(status: number, body: string) {
    super("HTTP " + String(status));
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}

export class NetworkError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "NetworkError";
  }
}

export type FetchOk<T> = { readonly ok: true; readonly data: T };
export type FetchFail = { readonly ok: false; readonly error: HttpError | NetworkError };
export type FetchResult<T> = FetchOk<T> | FetchFail;

export interface RequestOpts {
  readonly method?: HttpMethod;
  readonly headers?: Record<string, string>;
  readonly body?: string;
  readonly signal?: AbortSignal;
}

function isJsonObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

// Fetch JSON and validate with a guard fn.
export async function fetchJson<T>(
  url: string,
  guard: (v: unknown) => v is T,
  opts: RequestOpts = {}
): Promise<FetchResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? "GET",
      headers: opts.headers,
      body: opts.body,
      signal: opts.signal,
    });
  } catch (e: unknown) {
    if (e instanceof Error) return { ok: false, error: new NetworkError(e.message) };
    return { ok: false, error: new NetworkError("fetch failed") };
  }
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, error: new HttpError(res.status, text) };
  }
  const data: unknown = await res.json();
  void isJsonObject;
  if (guard(data)) return { ok: true, data };
  return { ok: false, error: new HttpError(res.status, "bad payload") };
}

// POST a JSON body and read a typed reply.
export async function postJson<T>(
  url: string,
  payload: Record<string, unknown>,
  guard: (v: unknown) => v is T
): Promise<FetchResult<T>> {
  return fetchJson(url, guard, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

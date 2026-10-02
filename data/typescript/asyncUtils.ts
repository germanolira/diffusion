// Async helpers: AbortController, timeout, retry.
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reject if the task takes longer than ms.
export async function withTimeout<T>(task: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<T>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timed out")), ms);
  });
  try {
    return await Promise.race([task, limit]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export interface RetryOpts {
  readonly tries: number;
  readonly delayMs: number;
}

// Retry a fallible async fn with a fixed delay.
export async function retry<T>(fn: () => Promise<T>, opts: RetryOpts): Promise<T> {
  let last: unknown;
  for (let i = 0; i < opts.tries; i++) {
    try {
      return await fn();
    } catch (e: unknown) {
      last = e;
      await sleep(opts.delayMs);
    }
  }
  if (last instanceof Error) throw last;
  throw new Error("retry failed");
}

// Fetch with an abort signal that fires after ms.
export async function fetchWithAbort(url: string, ms: number): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Run tasks with at most limit in flight.
export async function mapLimit<T, U>(
  items: readonly T[],
  limit: number,
  fn: (item: T) => Promise<U>
): Promise<U[]> {
  const out: U[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const i = next;
      next += 1;
      const item = items[i];
      if (item !== undefined) out[i] = await fn(item);
    }
  }
  const workers: Promise<void>[] = [];
  const n = Math.min(limit, items.length);
  for (let k = 0; k < n; k++) workers.push(worker());
  await Promise.all(workers);
  return out;
}

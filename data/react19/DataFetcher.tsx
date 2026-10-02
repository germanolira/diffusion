import { useCallback, useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
}

interface DataFetcherProps {
  endpoint: string;
  pollMs: number;
}

type Status = 'idle' | 'loading' | 'error' | 'done';

async function fetchUsers(endpoint: string, signal: AbortSignal): Promise<User[]> {
  const res = await fetch(endpoint, { signal });
  if (!res.ok) throw new Error('Fetch failed');
  return (await res.json()) as User[];
}

export function DataFetcher({ endpoint, pollMs }: DataFetcherProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string>('');

  const load = useCallback(async (endpoint: string, signal: AbortSignal) => {
    setStatus('loading');
    setError('');
    try {
      const data = await fetchUsers(endpoint, signal);
      setUsers(data);
      setStatus('done');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  }, []);

  // Fetch on mount plus optional polling.
  useEffect(() => {
    const controller = new AbortController();
    void load(endpoint, controller.signal);
    if (pollMs <= 0) return () => controller.abort();
    const timer = window.setInterval(() => {
      const c = new AbortController();
      void load(endpoint, c.signal);
    }, pollMs);
    return () => {
      controller.abort();
      window.clearInterval(timer);
    };
  }, [endpoint, pollMs, load]);

  if (status === 'loading' && users.length === 0) return <p>Loading users...</p>;
  if (status === 'error') return <p role="alert">Error: {error}</p>;

  return (
    <section>
      <h2>Users</h2>
      <ul>
        {users.map((u) => (
          <li key={u.id}>{u.name}</li>
        ))}
      </ul>
    </section>
  );
}

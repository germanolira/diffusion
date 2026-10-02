// Typed event emitter keyed by event name.
export type Handler<T> = (payload: T) => void;

export interface AppEvents {
  readonly message: { readonly text: string };
  readonly count: { readonly n: number };
  readonly closed: { readonly reason: string };
}

export class Emitter<TEvents extends Record<string, unknown>> {
  private handlers = new Map<keyof TEvents, Set<Handler<never>>>();

  on<K extends keyof TEvents>(event: K, fn: Handler<TEvents[K]>): () => void {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(fn as Handler<never>);
    return () => this.off(event, fn);
  }

  off<K extends keyof TEvents>(event: K, fn: Handler<TEvents[K]>): void {
    this.handlers.get(event)?.delete(fn as Handler<never>);
  }

  once<K extends keyof TEvents>(event: K, fn: Handler<TEvents[K]>): void {
    const wrap: Handler<TEvents[K]> = (p) => {
      this.off(event, wrap);
      fn(p);
    };
    this.on(event, wrap);
  }

  emit<K extends keyof TEvents>(event: K, payload: TEvents[K]): void {
    const set = this.handlers.get(event);
    if (!set) return;
    for (const fn of [...set]) (fn as Handler<TEvents[K]>)(payload);
  }

  listenerCount<K extends keyof TEvents>(event: K): number {
    return this.handlers.get(event)?.size ?? 0;
  }
}

export type AppEmitter = Emitter<AppEvents>;

export function createAppEmitter(): AppEmitter {
  return new Emitter<AppEvents>();
}

// Emit a chat message event.
export function sendMessage(bus: AppEmitter, text: string): void {
  bus.emit("message", { text });
}

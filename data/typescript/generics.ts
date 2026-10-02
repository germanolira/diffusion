// Generics with constraints.
export function identity<T>(value: T): T {
  return value;
}

// Key must exist on the object type.
export function getProp<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

// Only objects with a string id fit here.
export interface HasId {
  readonly id: string;
}

export class Repository<T extends HasId> {
  private items = new Map<string, T>();

  save(item: T): void {
    this.items.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }

  list(): T[] {
    return [...this.items.values()];
  }
}

// Group items by a derived key.
export function groupBy<T, K extends string | number>(
  items: readonly T[],
  keyOf: (item: T) => K
): Record<K, T[]> {
  const out = {} as Record<K, T[]>;
  for (const item of items) {
    const key = keyOf(item);
    const slot = out[key];
    if (slot) slot.push(item);
    else out[key] = [item];
  }
  return out;
}

// Pick the item with the smallest score.
export function minBy<T>(items: readonly T[], score: (item: T) => number): T | undefined {
  let best: T | undefined;
  let bestScore = Infinity;
  for (const item of items) {
    const s = score(item);
    if (s < bestScore) {
      bestScore = s;
      best = item;
    }
  }
  return best;
}

// Constrain to comparable records.
export function sortBy<T>(items: readonly T[], key: (item: T) => number): T[] {
  return [...items].sort((a, b) => key(a) - key(b));
}

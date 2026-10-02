// Utility types: Partial, Pick, Omit, Record.
export interface Account {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly active: boolean;
}

export type AccountPreview = Pick<Account, "id" | "name">;
export type AccountUpdate = Partial<Pick<Account, "name" | "email" | "active">>;
export type AccountPublic = Omit<Account, "email">;

// Apply a partial update to an account.
export function updateAccount(acc: Account, patch: AccountUpdate): Account {
  return { ...acc, ...patch };
}

export function toPreview(acc: Account): AccountPreview {
  return { id: acc.id, name: acc.name };
}

export function toPublic(acc: Account): AccountPublic {
  return { id: acc.id, name: acc.name, role: acc.role, active: acc.active };
}

// Count accounts per role.
export function countByRole(accs: readonly Account[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const a of accs) {
    out[a.role] = (out[a.role] ?? 0) + 1;
  }
  return out;
}

// satisfies keeps literal types while checking shape.
const defaultFlags = {
  theme: "dark",
  pageSize: 20,
  debug: false,
} satisfies Record<string, string | number | boolean>;

export type Flags = typeof defaultFlags;

export function flagValue<K extends keyof Flags>(key: K): Flags[K] {
  return defaultFlags[key];
}

// Build a lookup table from a list.
export function indexById(accs: readonly Account[]): Record<string, Account> {
  const out: Record<string, Account> = {};
  for (const a of accs) out[a.id] = a;
  return out;
}

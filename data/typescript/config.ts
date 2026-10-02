// Config parsing with validation at the boundary.
export interface AppConfig {
  readonly host: string;
  readonly port: number;
  readonly debug: boolean;
  readonly tags: readonly string[];
}

export type ConfigError = { readonly field: string; readonly hint: string };
export type ConfigResult =
  | { readonly ok: true; readonly config: AppConfig }
  | { readonly ok: false; readonly errors: ConfigError[] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const defaults = {
  host: "localhost",
  port: 3000,
  debug: false,
  tags: [],
} satisfies Record<keyof AppConfig, unknown>;

// Read one string field with a fallback.
function readString(src: Record<string, unknown>, key: string, fb: string): string {
  const v: unknown = src[key];
  return typeof v === "string" && v.length > 0 ? v : fb;
}

// Parse unknown input into a checked AppConfig.
export function parseConfig(input: unknown): ConfigResult {
  if (!isRecord(input)) {
    return { ok: false, errors: [{ field: "root", hint: "not an object" }] };
  }
  const errors: ConfigError[] = [];
  const host = readString(input, "host", defaults.host);

  let port = defaults.port;
  const rawPort: unknown = input["port"];
  if (typeof rawPort === "number" && Number.isInteger(rawPort)) {
    if (rawPort < 1 || rawPort > 65535) {
      errors.push({ field: "port", hint: "out of range" });
    } else {
      port = rawPort;
    }
  } else if (rawPort !== undefined) {
    errors.push({ field: "port", hint: "must be an integer" });
  }

  const rawDebug: unknown = input["debug"];
  const debug = typeof rawDebug === "boolean" ? rawDebug : defaults.debug;

  const rawTags: unknown = input["tags"];
  let tags: readonly string[] = defaults.tags;
  if (rawTags !== undefined) {
    if (Array.isArray(rawTags) && rawTags.every((x) => typeof x === "string")) {
      tags = rawTags as string[];
    } else {
      errors.push({ field: "tags", hint: "must be string[]" });
    }
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, config: { host, port, debug, tags } };
}

export function defaultConfig(): AppConfig {
  return { ...defaults, tags: [...defaults.tags] };
}

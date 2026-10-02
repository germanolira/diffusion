import { readdir, readFile, writeFile, mkdir } from "node:fs/promises";
import { join, extname } from "node:path";

const SRC = process.argv[2] ?? "data/sample";
const OUT = process.argv[3] ?? "data/code.txt";
const EXTS = new Set([".ts", ".tsx", ".js", ".jsx"]);

async function walk(dir: string, out: string[]): Promise<void> {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) await walk(p, out);
    else if (EXTS.has(extname(e.name))) out.push(p);
  }
}

const files: string[] = [];
await walk(SRC, files);
let blob = "";
for (const f of files) {
  const text = await readFile(f, "utf8");
  blob += `\n// file: ${f}\n` + text.slice(0, 8000) + "\n";
}
await mkdir("data", { recursive: true });
await writeFile(OUT, blob);
console.log(`files=${files.length} chars=${blob.length} -> ${OUT}`);

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.cwd();
const files: string[] = [];
(function walk(d: string) {
  for (const n of readdirSync(d)) {
    if (n === "node_modules" || n.startsWith(".")) continue;
    const p = join(d, n);
    statSync(p).isDirectory() ? walk(p) : [".css", ".tsx", ".ts", ".jsx"].includes(extname(p)) && files.push(p);
  }
})(join(root, "src"));

const defined = new Set<string>();
const used: { name: string; file: string; line: number }[] = [];

for (const f of files) {
  const text = readFileSync(f, "utf8");
  for (const m of text.matchAll(/(--[a-zA-Z0-9_-]+)\s*:/g)) defined.add(m[1]);
  for (const m of text.matchAll(/["'`](--[a-zA-Z0-9_-]+)["'`]\s*[:\]]/g)) defined.add(m[1]);
  text.split("\n").forEach((ln, i) => {
    // var(--x) with NO fallback (a comma means a fallback exists)
    for (const m of ln.matchAll(/var\(\s*(--[a-zA-Z0-9_-]+)\s*\)/g))
      used.push({ name: m[1], file: f.replace(root + "/", ""), line: i + 1 });
  });
}
const bad = used.filter((u) => !defined.has(u.name));
if (bad.length) {
  console.error(`FAIL: ${bad.length} use(s) of undefined CSS variables:`);
  for (const b of bad) console.error(`  ${b.file}:${b.line}  var(${b.name})`);
  process.exit(1);
}
console.log(`OK: ${used.length} var() uses, all defined (${defined.size} variables known)`);

import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

const forbiddenPaths = [
  resolve(root, "functions"),
  resolve(root, "_worker.js"),
  resolve(dist, "_worker.js"),
  resolve(dist, "_routes.json"),
];

const forbiddenConfigKeys = [
  "main",
  "kv_namespaces",
  "d1_databases",
  "r2_buckets",
  "durable_objects",
  "services",
  "queues",
  "vectorize",
  "ai",
  "analytics_engine_datasets",
  "workflows",
  "containers",
];

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

async function walkFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = resolve(directory, entry.name);
      return entry.isDirectory() ? walkFiles(path) : [path];
    }),
  );
  return nested.flat();
}

for (const path of forbiddenPaths) {
  if (await exists(path)) {
    throw new Error(`Static Pages deployment blocked: forbidden Worker/Functions path found at ${path}`);
  }
}

const config = await readFile(resolve(root, "wrangler.jsonc"), "utf8");
if (!config.includes('"pages_build_output_dir"')) {
  throw new Error("Static Pages deployment blocked: pages_build_output_dir is missing");
}

for (const key of forbiddenConfigKeys) {
  const keyPattern = new RegExp(`^[\\t ]*[\"']?${key}[\"']?[\\t ]*:`, "m");
  if (keyPattern.test(config)) {
    throw new Error(`Static Pages deployment blocked: forbidden Cloudflare binding or Worker key '${key}'`);
  }
}

if (!(await exists(resolve(dist, "index.html")))) {
  throw new Error("Static Pages deployment blocked: dist/index.html does not exist; run the build first");
}

const files = await walkFiles(dist);
console.log(`Static-only Pages deployment verified: ${files.length} files, no Worker, Functions, or paid bindings.`);

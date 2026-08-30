import { access, readdir, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.resolve(scriptDir, "..");
const sourceDir = path.resolve(
  process.env.LEGALIZE_LAWS_DIR ?? path.join(projectDir, "..", "legalize-kr", "kr"),
);
const outputPath = path.join(projectDir, "public", "data", "laws.json");

const entries = [];
for (const directory of await readdir(sourceDir, { withFileTypes: true })) {
  if (!directory.isDirectory()) continue;
  const relativePath = `kr/${directory.name}/법률.md`;
  try {
    await access(path.join(sourceDir, directory.name, "법률.md"), constants.R_OK);
    entries.push({
      id: relativePath,
      name: directory.name,
      path: relativePath,
    });
  } catch {
    // The directory contains another type of regulation, not a statute.
  }
}

entries.sort((left, right) => left.name.localeCompare(right.name, "ko"));
await writeFile(
  outputPath,
  `${JSON.stringify({ generatedAt: new Date().toISOString(), count: entries.length, entries }, null, 2)}\n`,
  "utf8",
);
console.log(`Wrote ${entries.length} statute entries to ${outputPath}`);

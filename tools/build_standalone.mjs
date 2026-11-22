import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { build } from "esbuild";

const root = new URL("../", import.meta.url);
const marker = "<!-- GRIDIRON_ENGINE -->";
const output = new URL("index.html", root);
const check = process.argv.includes("--check");

const template = (await readFile(new URL("src/browser_template.html", root), "utf8")).replace(/\r\n/g, "\n");
if (template.split(marker).length !== 2) {
  throw new Error("The standalone template must contain one engine placeholder.");
}

const bundle = await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: ["src/main.js"],
  bundle: true,
  format: "iife",
  platform: "browser",
  charset: "utf8",
  legalComments: "inline",
  write: false,
});
const script = bundle.outputFiles[0].text;
if (/<\/script/i.test(script)) {
  throw new Error("The bundle contains an HTML script terminator.");
}

const html = template.replace(marker, () => `<script>\n${script}</script>`);
const current = await readFile(output, "utf8").catch(error => {
  if (error.code !== "ENOENT") throw error;
  return "";
});
const digest = createHash("sha256").update(html).digest("hex").slice(0, 16);
if (current.replace(/\r\n/g, "\n") === html) {
  console.log(`PASS: standalone matches the bundled source (sha256 ${digest})`);
} else if (check) {
  console.error("FAIL: index.html is out of date. Run npm run build.");
  process.exitCode = 1;
} else {
  await writeFile(output, html, "utf8");
  console.log(`Built index.html (sha256 ${digest})`);
}

#!/usr/bin/env node
/**
 * Pin relative-markdown-link resolution to one meaning.
 *
 * Two resolvers read the same hrefs. `site/build-release.mjs` rewrites them
 * into canonical routes at build time, so crawlers and no-JS visitors get
 * correct bytes. `site/app.js` resolves them again in the browser, because the
 * client re-renders markdown it fetched at runtime. app.js ships as a
 * standalone script and cannot import from the build, so the logic is
 * duplicated — and duplication is how the two drifted: the client trimmed the
 * source directory with a `/`-anchored pattern, which matches nothing for a
 * document at the docs root. `/connectors/` (docs/connectors.md) linking to
 * `connectors/access-model.md` therefore requested
 * `connectors.mdconnectors/access-model.md` and failed to load, while the
 * static route `/connectors/access-model/` served fine and every link linter
 * passed (PAP-18407).
 *
 * This script asserts three things:
 *   1. the build resolver matches a shared case table;
 *   2. the client resolver, lifted out of site/app.js, matches it too;
 *   3. every relative markdown link actually written in docs/ resolves, under
 *      CLIENT semantics, to a file the nav publishes.
 *
 * Usage: node scripts/verify-doc-link-resolution.mjs
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDocRouteMap,
  docLinkBaseDir,
  normalizeDocPath,
  resolveDocHref,
  resolveDocLinkTarget,
  rewriteNav,
} from "../site/build-release.mjs";

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SELF_DIR, "..");
const APP_JS = path.join(ROOT, "site", "app.js");
const CONTENT_JSON = path.join(ROOT, "site", "content.json");
const DOCS_DIR = path.join(ROOT, "docs");

let failures = 0;
let checks = 0;

function check(label, actual, expected) {
  checks += 1;
  if (actual === expected) return;
  failures += 1;
  console.error(`  FAIL ${label}\n       expected: ${JSON.stringify(expected)}\n       actual:   ${JSON.stringify(actual)}`);
}

/**
 * Lift the client resolver out of site/app.js rather than re-implementing it,
 * so this test fails when the shipped browser code drifts — not when a copy
 * kept beside the test drifts. Mirrors how build-release.mjs already reads
 * app.js source for the section icon paths.
 */
async function loadClientResolver() {
  const source = await readFile(APP_JS, "utf8");
  const begin = source.indexOf("// DOC-LINK-RESOLVER:BEGIN");
  const end = source.indexOf("// DOC-LINK-RESOLVER:END");
  if (begin === -1 || end === -1 || end < begin) {
    throw new Error(
      "site/app.js is missing its DOC-LINK-RESOLVER markers. They delimit the "
      + "client copy of the link resolver that this test verifies.",
    );
  }
  const block = source.slice(begin, end);
  for (const name of ["normalizeDocPath", "docLinkBaseDir", "resolveDocLinkTarget"]) {
    if (!block.includes(`function ${name}(`)) {
      throw new Error(`site/app.js resolver block no longer defines ${name}().`);
    }
  }
  const factory = new Function(
    `${block}\nreturn { normalizeDocPath, docLinkBaseDir, resolveDocLinkTarget };`,
  );
  return factory();
}

// sourceFile, href, expected docs-root-relative target.
const CASES = [
  // A root document linking into a subdirectory. This is the case that broke.
  ["connectors.md", "connectors/access-model.md", "connectors/access-model.md"],
  ["connectors.md", "connectors/first-connector.md", "connectors/first-connector.md"],
  ["connectors.md", "reference/api/tool-gateway.md", "reference/api/tool-gateway.md"],
  // A root document linking to another root document.
  ["connectors.md", "hosted-beta.md", "hosted-beta.md"],
  ["connectors.md", "./hosted-beta.md", "hosted-beta.md"],
  // Nested relatives: sibling, explicit ./, up one, up two, up-and-over.
  ["connectors/gmail.md", "access-model.md", "connectors/access-model.md"],
  ["connectors/gmail.md", "./gmail-setup.md", "connectors/gmail-setup.md"],
  ["connectors/gmail.md", "../connectors.md", "connectors.md"],
  ["connectors/gmail.md", "../how-to/connect-agent-to-github.md", "how-to/connect-agent-to-github.md"],
  ["reference/api/tool-gateway.md", "../../connectors.md", "connectors.md"],
  ["reference/api/tool-gateway.md", "../cli/overview.md", "reference/cli/overview.md"],
  // Anchors must not leak into the resolved file path.
  ["connectors.md", "connectors/access-model.md#the-four-gates", "connectors/access-model.md"],
  ["connectors/gmail.md", "action-permissions.md#ask-first", "connectors/action-permissions.md"],
  ["connectors/gmail.md", "../connectors.md#the-catalog", "connectors.md"],
  // Redundant separators and no-op segments collapse the same way.
  ["connectors.md", "connectors/./access-model.md", "connectors/access-model.md"],
  ["connectors/sub/deep.md", "../../connectors.md", "connectors.md"],
];

console.log("Doc link resolution");

const client = await loadClientResolver();

console.log("  build and client resolvers agree with the case table");
for (const [sourceFile, href, expected] of CASES) {
  const [docHref] = href.split("#");
  check(`build   ${sourceFile} + ${href}`, resolveDocLinkTarget(docHref, sourceFile), expected);
  check(`client  ${sourceFile} + ${href}`, client.resolveDocLinkTarget(docHref, sourceFile), expected);
  // resolveDocHref is the build's public entry point and keeps the hash.
  const resolved = resolveDocHref(href, sourceFile, new Map());
  check(`entry   ${sourceFile} + ${href}`, resolved?.targetFile, expected);
}

console.log("  base directory of a root document is empty");
for (const [sourceFile, expected] of [
  ["connectors.md", ""],
  ["hosted-beta.md", ""],
  ["connectors/gmail.md", "connectors"],
  ["reference/api/tool-gateway.md", "reference/api"],
]) {
  check(`build   dirname(${sourceFile})`, docLinkBaseDir(sourceFile), expected);
  check(`client  dirname(${sourceFile})`, client.docLinkBaseDir(sourceFile), expected);
}

console.log("  normalizeDocPath implementations are identical");
for (const value of ["a/b/c.md", "a/./b.md", "a/../b.md", "../../x.md", "a//b.md", ""]) {
  check(`normalizeDocPath(${JSON.stringify(value)})`, client.normalizeDocPath(value), normalizeDocPath(value));
}

// ─── Every relative link authors actually wrote, under client semantics ────
// content.json stores nav paths relative to site/ (`../docs/foo.md`); the
// release rewrites them to docs-root-relative, which is what both resolvers
// and content.json's shipped copy use.
const content = rewriteNav(JSON.parse(await readFile(CONTENT_JSON, "utf8")));
const routeMap = buildDocRouteMap(content, "/");
const publishedFiles = new Set(routeMap.keys());

async function listMarkdown(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await listMarkdown(full)));
    else if (entry.name.endsWith(".md")) found.push(full);
  }
  return found;
}

const MARKDOWN_LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;

console.log("  authored relative links resolve to published pages");
let linkCount = 0;
for (const absolute of (await listMarkdown(DOCS_DIR)).sort()) {
  const sourceFile = path.relative(DOCS_DIR, absolute).split(path.sep).join("/");
  const markdown = await readFile(absolute, "utf8");
  for (const match of markdown.matchAll(MARKDOWN_LINK)) {
    const href = match[1];
    if (/^(?:[a-z]+:)?\/\//i.test(href) || href.startsWith("#") || href.startsWith("/")) continue;
    const [docHref] = href.split("#");
    if (!docHref.endsWith(".md")) continue;
    linkCount += 1;
    const target = client.resolveDocLinkTarget(docHref, sourceFile);
    // The client can only soft-navigate to a file content.json publishes; a
    // target outside that set is the failure mode this test exists for.
    if (!publishedFiles.has(target)) {
      failures += 1;
      checks += 1;
      console.error(`  FAIL ${sourceFile} -> ${href}\n       client resolved to ${JSON.stringify(target)}, which content.json does not publish`);
      continue;
    }
    check(`${sourceFile} -> ${href}`, resolveDocLinkTarget(docHref, sourceFile), target);
  }
}
console.log(`  checked ${linkCount} relative markdown links`);

if (failures > 0) {
  console.error(`\nDoc link resolution: ${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`\nDoc link resolution: ${checks} checks passed.`);

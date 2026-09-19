#!/usr/bin/env node
/**
 * Drive the built site in a real browser and click the links.
 *
 * The relative-link bug in PAP-18407 survived both link linters because both
 * of them reason about the same thing the build does: source paths and route
 * maps. What broke was the client's own resolution of a link it re-rendered at
 * runtime, and nothing exercised that. Clicking is the only check that would
 * have caught it, so this script clicks.
 *
 * Covers, for the connector overview and a nested connector page:
 *   - direct static routes (fresh load of every destination URL);
 *   - clicking every internal link in an article, including a root document's
 *     links into a subdirectory;
 *   - relative links from a nested document (sibling, ../, and up-and-over);
 *   - anchors, in-page and cross-page;
 *   - back and forward;
 *   - refresh on a client-navigated route.
 *
 * Every page load and every navigation also asserts no console error, no page
 * error, and no failed request.
 *
 * Not part of `npm run docs:test`: it needs a browser, and the docs test suite
 * has to run where one is not installed. Run it with `npm run docs:test:client-nav`
 * after `npm run docs:build`.
 *
 * Usage: node scripts/verify-client-navigation.mjs [--site .site] [--page /connectors/]
 */

import http from "node:http";
import { readFile, stat, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SELF_DIR, "..");

function argValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  return index === -1 ? fallback : process.argv[index + 1];
}

const SITE_DIR = path.resolve(ROOT, argValue("--site", ".site"));
const OVERVIEW = argValue("--page", "/connectors/");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".woff2": "font/woff2",
};

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

/**
 * Static server that behaves like the shipped .htaccess/nginx config rather
 * than like python -m http.server: a directory serves its index.html, and an
 * unknown path serves 404.html with a 404 status.
 */
async function startServer() {
  const server = http.createServer(async (request, response) => {
    const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    let filePath = path.join(SITE_DIR, requestPath);
    if (!filePath.startsWith(SITE_DIR)) {
      response.writeHead(403).end("Forbidden");
      return;
    }
    try {
      const info = await stat(filePath).catch(() => null);
      if (info?.isDirectory()) filePath = path.join(filePath, "index.html");
      if (!(await exists(filePath))) {
        const notFound = path.join(SITE_DIR, "404.html");
        const body = (await exists(notFound)) ? await readFile(notFound) : Buffer.from("Not found");
        response.writeHead(404, { "content-type": MIME[".html"] }).end(body);
        return;
      }
      const body = await readFile(filePath);
      response.writeHead(200, { "content-type": MIME[path.extname(filePath)] ?? "application/octet-stream" }).end(body);
    } catch (error) {
      response.writeHead(500).end(String(error));
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  return { server, origin: `http://127.0.0.1:${port}` };
}

async function launchBrowser() {
  const { chromium } = await import("playwright");
  // The bundled download for this platform is not always the one that runs
  // here, so prefer an installed build and let Playwright's own resolution be
  // the fallback.
  const candidates = [
    process.env.DOCS_CHROMIUM_PATH,
    `${process.env.HOME}/.cache/ms-playwright/chromium-1234/chrome-linux/chrome`,
    `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux/chrome`,
  ].filter(Boolean);
  let executablePath;
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      executablePath = candidate;
      break;
    }
  }
  return chromium.launch({
    ...(executablePath ? { executablePath } : {}),
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
}

let failures = 0;
let checks = 0;

function check(label, condition, detail = "") {
  checks += 1;
  if (condition) return true;
  failures += 1;
  console.error(`  FAIL ${label}${detail ? `\n       ${detail}` : ""}`);
  return false;
}

const { server, origin } = await startServer();
const browser = await launchBrowser();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

// One collector for the whole run; snapshot its length around each navigation.
// Third-party requests are out of scope: the page asks api.github.com for a
// star count, which is unauthenticated and rate-limited, so whether it answers
// says nothing about this site's navigation. Same-origin failures are the
// signal, and those are never ignored.
const THIRD_PARTY = /^https?:\/\/(?!127\.0\.0\.1|localhost)/i;
const problems = [];
page.on("console", (message) => {
  if (message.type() !== "error") return;
  const text = message.text();
  const url = message.location()?.url ?? "";
  if (THIRD_PARTY.test(url) || /api\.github\.com/.test(text)) return;
  problems.push(`console: ${text}`);
});
page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
page.on("requestfailed", (request) => {
  if (THIRD_PARTY.test(request.url())) return;
  problems.push(`requestfailed: ${request.url()}`);
});
page.on("response", (response) => {
  if (THIRD_PARTY.test(response.url()) || response.status() < 400) return;
  problems.push(`http ${response.status()}: ${response.url()}`);
});

function takeProblems() {
  return problems.splice(0, problems.length);
}

async function articleState() {
  return page.evaluate(() => {
    const article = document.getElementById("article");
    return {
      h1: document.querySelector("#article h1")?.textContent?.trim() ?? "",
      title: document.title,
      route: location.pathname + location.hash,
      text: (article?.textContent ?? "").slice(0, 400),
    };
  });
}

/** Wait until app.js has rendered an article with a heading. */
async function waitForArticle() {
  await page.waitForFunction(
    () => {
      const heading = document.querySelector("#article h1");
      return Boolean(heading && heading.textContent && heading.textContent.trim().length > 0);
    },
    undefined,
    { timeout: 15000 },
  );
}

function assertClean(label) {
  const found = takeProblems();
  return check(`${label}: no console, page, or request errors`, found.length === 0, found.join("\n       "));
}

async function assertRendered(label, expectedRoute) {
  await waitForArticle();
  const state = await articleState();
  check(`${label}: renders a heading`, state.h1.length > 0, JSON.stringify(state));
  check(
    `${label}: no load failure in the article`,
    !state.text.includes("Could not load"),
    state.text.slice(0, 200),
  );
  if (expectedRoute) {
    check(`${label}: route is ${expectedRoute}`, state.route === expectedRoute, `actual ${state.route}`);
  }
  assertClean(label);
  return state;
}

console.log(`Client navigation (${origin}${OVERVIEW})`);

// ─── 1. The overview loads, and we enumerate every internal destination ────
const overviewResponse = await page.goto(`${origin}${OVERVIEW}`, { waitUntil: "load" });
check(`${OVERVIEW} responds 200`, overviewResponse?.status() === 200, `status ${overviewResponse?.status()}`);
const overviewState = await assertRendered(OVERVIEW, OVERVIEW);

const destinations = await page.evaluate(() => {
  const seen = new Map();
  for (const anchor of document.querySelectorAll("#article a[href]")) {
    const href = anchor.getAttribute("href") ?? "";
    // Only same-origin document links; external links and in-page anchors are
    // checked separately.
    if (/^https?:\/\//i.test(href) || href.startsWith("#") || !href) continue;
    const url = new URL(anchor.href, location.href);
    if (url.origin !== location.origin) continue;
    const key = url.pathname;
    if (!seen.has(key)) {
      seen.set(key, { href, pathname: url.pathname, hash: url.hash, text: anchor.textContent.trim() });
    }
  }
  return [...seen.values()];
});

check(`${OVERVIEW} exposes internal destinations`, destinations.length > 10, `found ${destinations.length}`);
console.log(`  ${destinations.length} distinct internal destinations on ${OVERVIEW}`);

// Every DOM href on a rendered page must already be a canonical route. A raw
// `.md` href left in the DOM is the visible symptom of the resolver bug.
const rawMarkdownHrefs = destinations.filter((entry) => entry.href.endsWith(".md") || entry.href.includes(".md#"));
check(
  `${OVERVIEW}: no destination is left as a raw .md href`,
  rawMarkdownHrefs.length === 0,
  rawMarkdownHrefs.map((entry) => `${entry.text} -> ${entry.href}`).join("\n       "),
);

// ─── 2. Click every destination, then come straight back ───────────────────
for (const destination of destinations) {
  const label = `click "${destination.text}"`;
  await page.goto(`${origin}${OVERVIEW}`, { waitUntil: "load" });
  await waitForArticle();
  takeProblems();

  const selector = `#article a[href="${destination.href.replace(/"/g, '\\"')}"]`;
  const anchor = page.locator(selector).first();
  if (!check(`${label}: link is present`, (await anchor.count()) > 0, selector)) continue;
  await anchor.click();
  await page.waitForFunction(
    (expected) => location.pathname === expected,
    destination.pathname,
    { timeout: 15000 },
  ).catch(() => {});
  await assertRendered(label, destination.pathname + destination.hash);
}

// ─── 3. Direct static routes, loaded fresh ─────────────────────────────────
for (const destination of destinations) {
  const label = `direct ${destination.pathname}`;
  const response = await page.goto(`${origin}${destination.pathname}`, { waitUntil: "load" });
  check(`${label}: responds 200`, response?.status() === 200, `status ${response?.status()}`);
  await assertRendered(label, destination.pathname);
}

// ─── 4. Relative links from a nested document ──────────────────────────────
// A connector page links to a sibling (access-model.md), up one level
// (../connectors.md) and up-and-over (../how-to/...). Click whatever it has.
const NESTED = "/connectors/gmail/";
await page.goto(`${origin}${NESTED}`, { waitUntil: "load" });
await assertRendered(`nested ${NESTED}`, NESTED);
const nestedDestinations = await page.evaluate(() => {
  const out = [];
  const seen = new Set();
  for (const anchor of document.querySelectorAll("#article a[href^='/']")) {
    const url = new URL(anchor.href, location.href);
    if (seen.has(url.pathname) || url.pathname === location.pathname) continue;
    seen.add(url.pathname);
    out.push({ href: anchor.getAttribute("href"), pathname: url.pathname, text: anchor.textContent.trim() });
  }
  return out.slice(0, 12);
});
check(`${NESTED} exposes relative destinations`, nestedDestinations.length > 2, `found ${nestedDestinations.length}`);
for (const destination of nestedDestinations) {
  const label = `nested click "${destination.text}"`;
  await page.goto(`${origin}${NESTED}`, { waitUntil: "load" });
  await waitForArticle();
  takeProblems();
  const anchor = page.locator(`#article a[href="${destination.href}"]`).first();
  if (!check(`${label}: link is present`, (await anchor.count()) > 0, destination.href)) continue;
  await anchor.click();
  await page.waitForFunction((expected) => location.pathname === expected, destination.pathname, { timeout: 15000 })
    .catch(() => {});
  await assertRendered(label, destination.pathname);
}

// ─── 5. Anchors ────────────────────────────────────────────────────────────
await page.goto(`${origin}${OVERVIEW}`, { waitUntil: "load" });
await waitForArticle();
takeProblems();
const inPageAnchor = await page.evaluate(() => {
  const anchor = [...document.querySelectorAll("#article a[href]")].find((candidate) => {
    const url = new URL(candidate.href, location.href);
    return url.pathname === location.pathname && url.hash.length > 1;
  });
  return anchor ? { href: anchor.getAttribute("href"), hash: new URL(anchor.href, location.href).hash } : null;
});
if (check("overview has an in-page anchor link", inPageAnchor !== null)) {
  await page.locator(`#article a[href="${inPageAnchor.href}"]`).first().click();
  await page.waitForFunction((expected) => location.hash === expected, inPageAnchor.hash, { timeout: 10000 })
    .catch(() => {});
  const state = await articleState();
  check(
    `in-page anchor lands on ${inPageAnchor.hash}`,
    state.route === `${OVERVIEW}${inPageAnchor.hash}`,
    `actual ${state.route}`,
  );
  const targetExists = await page.evaluate((hash) => Boolean(document.getElementById(hash.slice(1))), inPageAnchor.hash);
  check(`in-page anchor target ${inPageAnchor.hash} exists`, targetExists);
  assertClean("in-page anchor");
}

// A cross-page anchor: /connectors/gmail/ links to action-permissions.md#...,
// and the resolver has to keep the hash while changing the document.
await page.goto(`${origin}${NESTED}`, { waitUntil: "load" });
await waitForArticle();
takeProblems();
const crossPageAnchor = await page.evaluate(() => {
  const anchor = [...document.querySelectorAll("#article a[href]")].find((candidate) => {
    const url = new URL(candidate.href, location.href);
    return url.origin === location.origin && url.pathname !== location.pathname && url.hash.length > 1;
  });
  if (!anchor) return null;
  const url = new URL(anchor.href, location.href);
  return { href: anchor.getAttribute("href"), pathname: url.pathname, hash: url.hash };
});
if (crossPageAnchor) {
  await page.locator(`#article a[href="${crossPageAnchor.href}"]`).first().click();
  await page.waitForFunction((expected) => location.pathname === expected, crossPageAnchor.pathname, { timeout: 15000 })
    .catch(() => {});
  const state = await assertRendered("cross-page anchor", crossPageAnchor.pathname + crossPageAnchor.hash);
  const targetExists = await page.evaluate(
    (hash) => Boolean(document.getElementById(hash.slice(1))),
    crossPageAnchor.hash,
  );
  check(`cross-page anchor target ${crossPageAnchor.hash} exists on ${crossPageAnchor.pathname}`, targetExists, state.route);
} else {
  console.log("  (no cross-page anchor link on the nested page; skipped)");
}

// ─── 6. Back, forward, and refresh ─────────────────────────────────────────
await page.goto(`${origin}${OVERVIEW}`, { waitUntil: "load" });
await waitForArticle();
takeProblems();
const firstHop = destinations.find((entry) => entry.pathname.startsWith("/connectors/") && !entry.hash)
  ?? destinations[0];
await page.locator(`#article a[href="${firstHop.href}"]`).first().click();
await page.waitForFunction((expected) => location.pathname === expected, firstHop.pathname, { timeout: 15000 });
await assertRendered(`hop to ${firstHop.pathname}`, firstHop.pathname);

await page.goBack({ waitUntil: "load" });
await waitForArticle();
const backState = await articleState();
check("back returns to the overview route", backState.route === OVERVIEW, `actual ${backState.route}`);
check("back restores the overview heading", backState.h1 === overviewState.h1, `actual ${JSON.stringify(backState.h1)}`);
check("back does not leave a load failure", !backState.text.includes("Could not load"), backState.text.slice(0, 200));
assertClean("back");

await page.goForward({ waitUntil: "load" });
await waitForArticle();
const forwardState = await articleState();
check("forward returns to the destination", forwardState.route === firstHop.pathname, `actual ${forwardState.route}`);
check("forward does not leave a load failure", !forwardState.text.includes("Could not load"), forwardState.text.slice(0, 200));
assertClean("forward");

const reloadResponse = await page.reload({ waitUntil: "load" });
check("refresh responds 200", reloadResponse?.status() === 200, `status ${reloadResponse?.status()}`);
await assertRendered(`refresh ${firstHop.pathname}`, firstHop.pathname);

await context.close();
await browser.close();
await new Promise((resolve) => server.close(resolve));

if (failures > 0) {
  console.error(`\nClient navigation: ${failures} of ${checks} checks failed.`);
  process.exit(1);
}
console.log(`\nClient navigation: ${checks} checks passed.`);

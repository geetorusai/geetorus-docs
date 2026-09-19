#!/usr/bin/env node
/**
 * Apply the catalog copy contract to every connector page.
 *
 * The connector pages were generated from the App manifest, so 20 of them led
 * with the manifest's placeholder line ("Connect Airtable's provider-hosted
 * MCP server.") and all of them described their setup with a vocabulary that
 * did not match the hub. This script is the source of truth for the parts that
 * have to agree with docs/connectors.md:
 *
 *   - the page lede and seo_description, which say what the service is and
 *     what Geetorus supports doing with it;
 *   - the Category row, using the hub's group names;
 *   - the connection-method name, using the hub's six names rather than a
 *     separate per-page sign-in vocabulary.
 *
 * It is idempotent: every replacement matches either the generated text or the
 * text this script writes. Re-run it after regenerating pages from a newer
 * App snapshot.
 *
 * Usage: node scripts/sync/apply-connector-copy.mjs [--check]
 */

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SELF_DIR = path.dirname(fileURLToPath(import.meta.url));
const CONNECTORS_DIR = path.resolve(SELF_DIR, "../../docs/connectors");
const CHECK_ONLY = process.argv.includes("--check");

// Hub group names, so a page's Category row reads like the heading the reader
// found it under. Keys are the labels the generator emitted from the manifest's
// category keys.
const CATEGORY_LABELS = {
  Analytics: "Data and analytics",
  Data: "Data and analytics",
  "Content and files": "Content and design",
  Productivity: "Productivity and collaboration",
};

function relabelCategories(value) {
  return value
    .split(",")
    .map((part) => part.trim())
    .map((part) => CATEGORY_LABELS[part] ?? part)
    .join(", ");
}

/**
 * slug -> { lede, seo }
 *
 * `lede` is the same sentence the hub row carries, so a reader who clicked a
 * description lands on that description. `seo` restates it inside the 110-158
 * character window the authored-SEO contract enforces.
 */
const COPY = {
  // ── Google Workspace ──────────────────────────────────────────────────
  gmail: {
    lede: "Google's email service. Agents search and read mail, and on a draft connection create drafts for you to review in Gmail. Sending, deleting, and relabelling mail are never enabled.",
    seo: "Google's email service. Agents search and read mail and can draft replies for your review; sending and deleting mail are never enabled.",
  },
  "google-calendar": {
    lede: "Google's calendar. Agents read calendars, and on a write connection create and change events.",
    seo: "Google's calendar. Agents read calendars, and on a write connection create and change events. Set up access and per-action permissions in Geetorus.",
  },
  "google-chat": {
    lede: "Google Workspace's team messaging. Agents search and read conversations, and on a write connection post messages. This is an agent tool, not a way for people to talk to an agent.",
    seo: "Google Workspace's team messaging. Agents search and read conversations, and on a write connection post messages. It is an agent tool, not a chat channel.",
  },
  "google-docs": {
    lede: "Google's word processor. Agents read documents, and on a write connection edit them.",
    seo: "Google's word processor. Agents read documents, and on a write connection edit them. Set up access and per-action permissions in Geetorus.",
  },
  "google-drive": {
    lede: "Google's file storage. Agents search and read files, and on a write connection create and copy them.",
    seo: "Google's file storage. Agents search and read files, and on a write connection create and copy them. Set up access and permissions in Geetorus.",
  },
  "google-people": {
    lede: "The contacts and directory behind a Google account. Agents look up people and profiles. Read-only; there is no write connection.",
    seo: "The contacts and directory behind a Google account. Agents look up people and profiles. Read-only: this connector has no write connection at all.",
  },
  "google-sheets": {
    lede: "Google's spreadsheets. Agents read sheets, and on a write connection update them. A third path shares individual spreadsheets with a Geetorus robot account instead of connecting a Google identity at all.",
    seo: "Google's spreadsheets. Agents read sheets, or update them on a write connection, or reach only the files you share with a Geetorus robot account.",
  },
  "google-slides": {
    lede: "Google's presentations. Agents read decks, and on a write connection edit them.",
    seo: "Google's presentations. Agents read decks, and on a write connection edit them. Set up access and per-action permissions in Geetorus.",
  },
  "google-workspace-search": {
    lede: "One read-only search that spans Gmail, Drive, Calendar, and Chat in a single Google account. Use it when an agent needs to find something without knowing which app holds it.",
    seo: "One read-only search across Gmail, Drive, Calendar, and Chat in a Google account, for when an agent needs to find something without knowing where it is.",
  },

  // ── Productivity and collaboration ────────────────────────────────────
  asana: {
    lede: "Work management for team projects, tasks, and goals. Agents work with the projects and tasks your Asana app can reach.",
    seo: "Work management for team projects, tasks, and goals. Agents work with the projects and tasks your own Asana OAuth app is allowed to reach.",
  },
  jira: {
    lede: "Atlassian's issue tracker for software teams. Agents work with the issues on the Jira site you connect.",
    seo: "Atlassian's issue tracker for software teams. Agents work with the issues on the Jira site you connect, under per-action permissions you set.",
  },
  linear: {
    lede: "Issue tracking for product and engineering teams. Agents create, update, and read issues, scoped to the workspace, teams, and projects you pick.",
    seo: "Issue tracking for product and engineering teams. Agents create, update, and read issues in the workspace, teams, and projects you pick.",
  },
  miro: {
    lede: "Shared online whiteboards for diagrams, planning, and workshops. Agents work with the boards your Miro account can reach.",
    seo: "Shared online whiteboards for diagrams, planning, and workshops. Agents work with the boards your Miro account can reach, under permissions you set.",
  },
  todoist: {
    lede: "Task lists for individuals and small teams. Agents work with the tasks and projects in your Todoist account.",
    seo: "Task lists for individuals and small teams. Agents work with the tasks and projects in your Todoist account, under per-action permissions you set.",
  },
  zapier: {
    lede: "Automation service that wires thousands of apps together. You choose the actions in Zapier and paste one generated URL, so the agent gets exactly the actions you put in it and nothing else.",
    seo: "Automation that wires thousands of apps together. You choose the actions in Zapier and paste one generated URL, so agents get those actions and no others.",
  },

  // ── Communication ─────────────────────────────────────────────────────
  agentmail: {
    lede: "Email inboxes built for software agents. Gives an agent its own inbox and turns each email conversation into a Geetorus task.",
    seo: "Email inboxes built for software agents. Gives an agent its own inbox and turns each email conversation into a Geetorus task you can follow.",
  },
  resend: {
    lede: "Transactional email delivery for developers. Agents work with the sending domains and delivery records your Resend account can reach.",
    seo: "Transactional email delivery for developers. Agents work with the sending domains and delivery records your Resend account can reach.",
  },
  slack: {
    lede: "Team messaging. Two separate purposes: as an app integration agents read and post in the workspace and channels you pick; as a chat channel people work with one agent from Slack.",
    seo: "Team messaging, with two separate purposes: agents reading and posting in channels you pick, and people working with one agent from Slack.",
  },

  // ── Developer tools ───────────────────────────────────────────────────
  cloudflare: {
    lede: "DNS, CDN, and edge compute. Agents work with the account your Cloudflare sign-in can reach.",
    seo: "DNS, CDN, and edge compute. Agents work with the account your Cloudflare sign-in can reach, under per-action permissions you set in Geetorus.",
  },
  github: {
    lede: "Code hosting and review. Two separate purposes: as an app integration agents read and act on the organizations and repositories you pick; as a chat channel people work with one agent from issue and pull-request comments.",
    seo: "Code hosting and review, with two separate purposes: agents acting on the repositories you pick, and people working with one agent from GitHub comments.",
  },
  netlify: {
    lede: "Hosting and deploys for web front ends. Agents work with the teams and sites your Netlify account can reach.",
    seo: "Hosting and deploys for web front ends. Agents work with the teams and sites your Netlify account can reach, under permissions you set.",
  },
  pagerduty: {
    lede: "On-call scheduling and incident response. Agents work with the incidents, services, and schedules your token can reach. Choose the US or EU service region when you connect.",
    seo: "On-call scheduling and incident response. Agents work with the incidents, services, and schedules your token can reach in the US or EU region.",
  },
  postman: {
    lede: "API development and testing workspace. Agents work with the collections and APIs your Postman account can reach. Pick how much access to grant: read-only, code generation, or full write.",
    seo: "API development and testing workspace. Agents work with your collections and APIs, at read-only, code-generation, or full-write access.",
  },
  sentry: {
    lede: "Error and performance monitoring. Agents investigate errors, releases, and production issues in the organizations, projects, and environments you pick.",
    seo: "Error and performance monitoring. Agents investigate errors, releases, and production issues in the organizations, projects, and environments you pick.",
  },

  // ── Data and analytics ────────────────────────────────────────────────
  airtable: {
    lede: "Spreadsheet-database hybrid for structured team data. Agents work with the bases your Airtable sign-in can reach.",
    seo: "Spreadsheet-database hybrid for structured team data. Agents work with the bases your Airtable sign-in can reach, under permissions you set.",
  },
  clickhouse: {
    lede: "Columnar database built for analytical queries over very large datasets. Agents query the ClickHouse Cloud service you name.",
    seo: "Columnar database built for analytical queries over very large datasets. Agents query the ClickHouse Cloud service you name, and nothing else.",
  },
  mixpanel: {
    lede: "Product analytics for user and event behaviour. Agents work with the events and reports your Mixpanel account can reach.",
    seo: "Product analytics for user and event behaviour. Agents work with the events and reports your Mixpanel account can reach, under permissions you set.",
  },
  posthog: {
    lede: "Product analytics with session replay, feature flags, and experiments. Agents analyse product usage, errors, flags, and experiments.",
    seo: "Product analytics with session replay, feature flags, and experiments. Agents analyse product usage, errors, feature flags, and experiments.",
  },
  supabase: {
    lede: "Hosted Postgres with authentication, storage, and edge functions. Agents work with the projects you pick in your Supabase organization.",
    seo: "Hosted Postgres with authentication, storage, and edge functions. Agents work with the projects you pick in your Supabase organization.",
  },

  // ── Content and design ────────────────────────────────────────────────
  box: {
    lede: "Enterprise file storage and sharing. Agents work with the files and folders your Box integration can reach.",
    seo: "Enterprise file storage and sharing. Agents work with the files and folders your Box integration can reach, under per-action permissions.",
  },
  cloudinary: {
    lede: "Image and video hosting with on-the-fly transformation. Agents work with the assets your Cloudinary roles allow.",
    seo: "Image and video hosting with on-the-fly transformation. Agents work with the assets your Cloudinary roles allow, and no more than those.",
  },
  notion: {
    lede: "Workspace for notes, documents, and databases. Agents read and update the pages and databases you share with the connection — and only those.",
    seo: "Workspace for notes, documents, and databases. Agents read and update the pages and databases you share with the connection, and only those.",
  },
  webflow: {
    lede: "Visual website builder with a CMS behind it. Agents work with the sites and collections your Webflow roles allow.",
    seo: "Visual website builder with a CMS behind it. Agents work with the sites and CMS collections your Webflow workspace roles allow.",
  },
  wix: {
    lede: "Website builder and hosting. Agents work with the sites your Wix account can reach.",
    seo: "Website builder and hosting. Agents work with the sites your Wix account can reach, under per-action permissions you set in Geetorus.",
  },

  // ── Commerce and finance ──────────────────────────────────────────────
  shopify: {
    lede: "E-commerce platform for online stores. Agents search a store's products and policies and manage shopping carts. You give a store domain; there is no sign-in, and no access to the store's admin.",
    seo: "E-commerce platform for online stores. Agents search a store's products and policies and manage carts. You give a domain; there is no sign-in.",
  },
  stripe: {
    lede: "Payments, invoicing, and billing. Agents read customers, invoices, and payouts in the account you connect.",
    seo: "Payments, invoicing, and billing. Agents read customers, invoices, and payouts in the account you connect, under per-action permissions.",
  },

  // ── AI tools ──────────────────────────────────────────────────────────
  "hugging-face": {
    lede: "Public hub for open machine-learning models, datasets, and demos. Agents search models, datasets, and Spaces. The sign-in asks for a read-only scope, which makes this the shortest connector to try first.",
    seo: "Public hub for open machine-learning models, datasets, and demos. Agents search models, datasets, and Spaces through a read-only sign-in.",
  },
  mem0: {
    lede: "Hosted long-term memory for AI applications. Agents store and recall facts across runs in your Mem0 project.",
    seo: "Hosted long-term memory for AI applications. Agents store and recall facts across runs in your Mem0 project, under permissions you set.",
  },

  // ── Model providers ───────────────────────────────────────────────────
  anthropic: {
    lede: "Run Claude models. A subscription signs in with your Claude plan; an API key can be scoped and rotated separately.",
    seo: "Supplies the credential Geetorus uses to run Claude models. A subscription signs in with your plan; an API key can be scoped and rotated.",
  },
  openai: {
    lede: "Run OpenAI models.",
    seo: "Supplies the credential Geetorus uses to run OpenAI models. It is not an agent tool, so it adds no actions to any permission list.",
  },
  openrouter: {
    lede: "Run models from many vendors through one credential and one bill.",
    seo: "Supplies one credential that routes to models from many vendors. It is not an agent tool, so it adds no actions to any permission list.",
  },
  xai: {
    lede: "Run xAI's Grok models.",
    seo: "Supplies the credential Geetorus uses to run xAI's Grok models. It is not an agent tool, so it adds no actions to any permission list.",
  },

  // ── Chat channels ─────────────────────────────────────────────────────
  discord: {
    lede: "Mention the agent in a server channel and Geetorus opens a thread, keeping it tied to one task.",
    seo: "Lets people work with a Geetorus agent from Discord. Mention the agent in a channel and Geetorus opens a thread tied to one task.",
  },
  "imessage-photon": {
    lede: "Message the agent from Apple Messages through a Photon Cloud project. Shared Pro lines carry direct messages; a dedicated line also carries groups you enable.",
    seo: "Lets people message a Geetorus agent from Apple Messages through Photon Cloud. Shared Pro lines carry DMs; a dedicated line also carries groups.",
  },
  "microsoft-teams": {
    lede: "Message the agent in a chat, a team channel, or a group chat. Needs a work or school Microsoft 365 organization; personal Teams accounts cannot complete the setup.",
    seo: "Lets people work with a Geetorus agent from Microsoft Teams. Needs a work or school Microsoft 365 organization; personal accounts cannot set it up.",
  },
  telegram: {
    lede: "Message the agent through a bot you create with BotFather.",
    seo: "Lets people work with a Geetorus agent from Telegram, through a bot you create with BotFather and connect to Geetorus's webhook.",
  },
};

// Connection-method names, matching the table in docs/connectors.md. The
// generated pages described a method by how you authenticate, which does not
// survive contact with the catalog: "own OAuth app" and "provider app
// registration" are registration work, not auth protocols.
function connectionMethodName({ signInStyle, oauthClient, isChatSection }) {
  if (signInStyle === "No sign-in") return "No credential";
  if (signInStyle === "API key") {
    return isChatSection ? "Provider app registration" : "API key";
  }
  if (oauthClient === "Geetorus's managed client") return "Connect with Geetorus";
  if (oauthClient === "registered on demand by Geetorus") return "Sign in with the provider";
  if (oauthClient?.startsWith("registered on demand, or your own OAuth app")) {
    return "Sign in with the provider, or your own OAuth app";
  }
  if (oauthClient === "yours to register and supply") return "Your own OAuth app";
  return null;
}

const GENERIC_LEDE = /^Connect .+'s provider-hosted MCP server\.$/;

function rewritePage(slug, source) {
  const copy = COPY[slug];
  const lines = source.split("\n");
  const problems = [];
  let sectionIsChat = false;
  let sawLede = false;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line === null) continue;

    if (line.startsWith("### ")) {
      // "Chat with an agent" is the manifest's own label for the chat_sdk
      // method, on its own page or alongside an agent-tool method.
      sectionIsChat = /Chat with an agent/i.test(line);
      continue;
    }

    if (copy && line.startsWith("seo_description: ")) {
      lines[index] = `seo_description: ${copy.seo}`;
      continue;
    }

    // The lede is the first prose line after the H1.
    if (copy && !sawLede && index > 0 && lines[index - 2]?.startsWith("# ") && line.trim()) {
      sawLede = true;
      lines[index] = copy.lede;
      continue;
    }

    if (line.startsWith("| Category | ")) {
      const value = line.slice("| Category | ".length).replace(/\s*\|\s*$/, "");
      lines[index] = `| Category | ${relabelCategories(value)} |`;
      continue;
    }

    if (line.startsWith("- Sign-in style: ") || line.startsWith("- Connection method: ")) {
      const isAlready = line.startsWith("- Connection method: ");
      const signInStyle = isAlready ? null : line.slice("- Sign-in style: ".length).trim();
      const oauthClientLine = lines[index + 1]?.startsWith("- OAuth client: ")
        ? lines[index + 1].slice("- OAuth client: ".length).trim()
        : null;
      if (isAlready) continue;
      const name = connectionMethodName({ signInStyle, oauthClient: oauthClientLine, isChatSection: sectionIsChat });
      if (!name) {
        problems.push(`unmapped method: ${signInStyle} / ${oauthClientLine}`);
        continue;
      }
      lines[index] = `- Connection method: ${name}`;
      // An OAuth-client line under a key or a no-credential method is not just
      // noise, it is wrong: Discord's bot token has no OAuth client at all.
      if (oauthClientLine && signInStyle !== "Browser sign-in") lines[index + 1] = null;
      continue;
    }
  }

  const rewritten = lines.filter((line) => line !== null).join("\n");
  if (copy && GENERIC_LEDE.test(copy.lede)) problems.push("copy still generic");
  return { rewritten, problems };
}

const { readdir } = await import("node:fs/promises");
const files = (await readdir(CONNECTORS_DIR)).filter((name) => name.endsWith(".md")).sort();
let changed = 0;
const allProblems = [];
const seen = new Set();

for (const name of files) {
  const slug = name.replace(/\.md$/, "");
  // Split setup pages (gmail-setup, github-setup) and the shared how-tos carry
  // no catalog description; they still get the vocabulary pass.
  const absolute = path.join(CONNECTORS_DIR, name);
  const source = await readFile(absolute, "utf8");
  const { rewritten, problems } = rewritePage(slug, source);
  if (COPY[slug]) seen.add(slug);
  for (const problem of problems) allProblems.push(`${name}: ${problem}`);
  if (rewritten === source) continue;
  changed += 1;
  if (!CHECK_ONLY) await writeFile(absolute, rewritten);
}

const missing = Object.keys(COPY).filter((slug) => !seen.has(slug));
if (missing.length) allProblems.push(`COPY has entries with no page: ${missing.join(", ")}`);

for (const [slug, copy] of Object.entries(COPY)) {
  if (copy.seo.length < 110 || copy.seo.length > 158) {
    allProblems.push(`${slug}: seo is ${copy.seo.length} chars, needs 110-158`);
  }
}

if (allProblems.length) {
  console.error(`Connector copy pass found ${allProblems.length} problem(s):`);
  for (const problem of allProblems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(`Connector copy pass: ${changed} of ${files.length} pages ${CHECK_ONLY ? "would change" : "updated"}.`);

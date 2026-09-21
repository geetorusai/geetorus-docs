# AGENTS.md — geetorus-docs

## Stack
Cloudflare Workers + static Markdown site

## Structure
  docs/       → Markdown documentation pages
  site/       → Site build output
  scripts/    → Build and sync scripts
  skills/     → Agent skills for docs workflows

## Key Commands
  npm run dev       # Local dev server
  npm run build     # Build site
  npm run deploy    # Deploy to Cloudflare Workers (wrangler)

## Rules
- All doc changes go in docs/ as Markdown files
- Update PENDING.md when adding incomplete sections
- SCREENSHOTS_PENDING.md tracks missing screenshots — update it when adding images
- After adding docs: check .sync-state.json is up to date

## Fast Fix Guide
- Deploy fails → check wrangler.jsonc for correct account/zone IDs
- Missing page → add .md file in docs/ with correct frontmatter

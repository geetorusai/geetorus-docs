# Geetorus Docs

Source for the [Geetorus](https://github.com/geetorusai/geetorus) documentation site — user guides, API and CLI reference, adapter docs, and deployment notes.

**Read the docs:** https://docs.geetorus.ing/

## What's inside

- **🚀 Getting Started** — Onboarding wizard, Docker one-click install, and running from source.
- **💓 Pulse Engine** — Autonomous agent scheduling, periodic cron routines, and reactive task wakes.
- **💰 Budgets & Governance** — Token & dollar cost controls, review gates, and approval workflows.
- **🛠️ Tool & Skill Studio** — Runtime MCP server integrations, skills store, and execution policies.
- **🏢 Multi-Organization** — Department hierarchies, org charts, and tenant workspace isolation.
- **🔌 Model Adapters** — Claude Code, OpenCode (local/free), OpenAI Codex, Gemini, and custom HTTP runners.
- **📖 API & CLI Reference** — REST control-plane endpoints, OpenAPI schemas, and `@geetorusai/cli` reference.
- **🚢 Deployment** — Docker Compose, Kubernetes, and Cloudflare Pages operational guides.

The site is a high-performance static shell that renders the Markdown files in `docs/` directly with instant client-side search, crawlable sitemaps, and theme support.

## Build and deployment

Build a release bundle locally with:

```sh
npm run docs:build
```

Cloudflare Pages is connected directly to `geetorusai/geetorus-docs` through GitHub. There is no normal Wrangler publish step for this repo:

- Pushes to `main` deploy production at `https://docs.geetorus.ing/`.
- Pushes to other branches create Cloudflare Pages preview/canary deployments.
- Canary URLs are created by Cloudflare for each deployment, for example `https://92b9a99c.geetorus-docs-74t.pages.dev`. Use the URL shown in the Cloudflare Pages deployment row or GitHub deployment/check for the pushed branch and commit.

That auto-deploy is not guaranteed — it has silently failed to fire on a push to `main` before. After anything reader-facing lands, check the live site rather than the merge, and republish by hand if it's stale:

```sh
npm run docs:build
npx wrangler pages deploy .site --project-name geetorus-docs --branch main
```

## Contributing

Spotted a typo, a broken link, or something that could be clearer? There are two easy paths, both linked from the footer of every docs page:

- **Suggest an edit** — opens the underlying Markdown file in GitHub's web editor. Make the change and submit a PR without leaving the browser.
- **Report an issue** — opens a prefilled [Docs feedback](.github/ISSUE_TEMPLATE/03-docs-feedback.yml) issue with the page URL already attached.

For larger changes, fork the repo and open a PR against `main`. Screenshots live under `docs/user-guides/screenshots/{light,dark}/` and should be provided in both themes when replacing UI captures.

## Community

- [Discord](https://discord.gg/m4HZY7xNG3)
- [GitHub Discussions](https://github.com/geetorusai/geetorus/discussions)

## License

Copyright (c) 2026 Geetorus Community.

The Geetorus **software** is open source — see the main [geetorus](https://github.com/geetorusai/geetorus) repository for its license.

The **documentation in this repository** is licensed under [Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International (CC BY-NC-ND 4.0)](https://creativecommons.org/licenses/by-nc-nd/4.0/). You may read and share it for non-commercial purposes with attribution. Commercial use of any kind requires prior written permission from the copyright holders. See [`LICENSE`](LICENSE) for the full text.

### Unlisted hosted beta guide

`docs/hosted-beta.md` is built at `/hosted-beta/` by `site/build-release.mjs`.
It reuses the full docs shell and initializes page tools without adding the page to the navigation/search manifest.
Keep it out of `site/content.json`: it is deliberately absent from navigation,
search, homepage listings, previous/next links, and the sitemap. It has a
`noindex` meta tag; this is a public page, not an access-controlled document.

Run `node scripts/verify-unlisted-beta.mjs` to verify root/subpath builds and
exclusion from discovery. Preview with `npm run docs:build` and `npm run docs:serve`.

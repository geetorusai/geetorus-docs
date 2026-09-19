---
geetorus_version: v2026.831.1
seo_title: Install Geetorus: Local or Self-Hosted
seo_description: Two supported install paths: a local Node.js 24 setup via pnpm, or a self-hosted server on your own domain. Both finish at the same onboarding flow.
---

# Installation

There are two ways to install Geetorus. Choose the one that fits how you work:

- **Terminal** — install and run Geetorus locally with a single command. This is the standard way to run Geetorus on your own machine.
- **Server / VPS** — deploy Geetorus to a cloud server (AWS, GCP, DigitalOcean, Hetzner, etc.) behind a custom domain with HTTPS. For teams and anyone who wants their instance reachable from anywhere.

Both paths end up in the same place: a running Geetorus instance and the onboarding flow where you create your first company, first agent, and first piece of work.

---

<!-- tabs: Terminal, Server / VPS -->

<!-- tab: Terminal -->

> **Note:** Don't worry if you don't think of yourself as a terminal person — this path is one command, and the steps below walk through everything it needs.

---

## Step 1 — Install Node.js 24 or later

If you don't have Node.js installed, download the installer from [nodejs.org](https://nodejs.org) and run it. Choose the **LTS** version.

To check if Node.js is already installed and at the right version:

```bash
node --version
# Should print v24.11.0 or higher
```

---

## Step 2 — Install pnpm

```bash
npm install -g corepack
corepack enable
corepack prepare pnpm@latest --activate
```

---

## Step 3 — Run the onboarding command

> **Warning:** Do not run this command with `sudo` or from a root/admin shell. The default setup starts embedded PostgreSQL, and PostgreSQL refuses to run as an administrative user. Run it as your normal user on a local machine. On a server, first switch to the dedicated `geetorus` user with `sudo -iu geetorus`, then run the command.

```bash
npx geetorusai onboard --yes
```

This single command handles everything: it downloads Geetorus, creates a configuration directory at `~/.geetorus/`, initialises an embedded database, and starts the server at `http://localhost:3100`. The `--yes` flag accepts all defaults — you can run without it to customise deployment mode, database, and storage.

```
✓ Created config at ~/.geetorus/instances/default/config.json
✓ Initialised database
✓ Server running at http://localhost:3100
→ Opening Geetorus in your browser...
```

> **Troubleshooting (macOS, Apple Silicon):** If onboarding fails while starting the embedded PostgreSQL, it's usually a missing library symlink. The bundled Postgres (`@embedded-postgres/darwin-arm64`) ships versioned compression libraries — for example `libzstd.1.5.7.dylib` and `liblz4.1.10.0.dylib` — but not the shorter compatibility symlinks (`libzstd.1.dylib`, `liblz4.1.dylib`) that Postgres looks for, so it won't start until you add them. Find the versioned files under the embedded-postgres package (inside its `.../lib` directory in `node_modules`) and create the missing symlinks, then re-run `npx geetorusai run`:
>
> ```bash
> cd "$(dirname "$(find ~ -path '*@embedded-postgres/darwin-arm64*/lib/libzstd.*.dylib' 2>/dev/null | head -1)")"
> ln -sf libzstd.*.dylib libzstd.1.dylib
> ln -sf liblz4.*.dylib liblz4.1.dylib
> ```
>
> Version numbers vary between releases — match whichever versioned `.dylib` files are actually present.

---

## Step 4 — Open Geetorus

Geetorus opens automatically in your browser. If it doesn't, navigate to [http://localhost:3100](http://localhost:3100).

You'll land in Geetorus ready to start onboarding. You haven't created a company yet — that's the next step.

> **Note:** To run Geetorus again after restarting your machine, run `npx geetorusai run` from your terminal.

### Keeping Geetorus running

The command above holds your terminal open — close the window and Geetorus stops. That's fine while you're finding your feet, but once Geetorus is something you use daily, let your computer look after it instead:

```bash
npx geetorusai install
geetorusai service install
```

The first command installs Geetorus properly (so you can also update and roll it back later) and offers to add it to your shell's `PATH` — say yes, then open a new terminal window so the `geetorusai` command is available. The second registers Geetorus as a background service that starts when you log in and restarts itself if it crashes. Nothing needs administrator rights, and `geetorusai service status` tells you how it's doing.

See [Service](../../reference/cli/service.md) for the full set of commands, and the [advanced deployment docs](../../reference/deploy/overview.md) for server-side deployment patterns.

---

## Step 5 — Get your API key

Before your agents can do any work, you need an API key. An API key is a private token — similar to a password — that allows your agents to make calls to an AI provider like Anthropic (Claude) or OpenAI. Without one, agents have no way to generate responses or take actions.

> **Warning:** AI providers charge for usage. Every time an agent works, it makes API calls that cost a small amount of money. The cost depends on which model you use and how much your agents work. Geetorus lets you set budgets to keep this under control, but you should be aware of this before your agents start running.

Choose your AI provider and follow the steps to get a key:

<!-- tabs: Anthropic (Claude), OpenAI -->

<!-- tab: Anthropic (Claude) -->

Anthropic makes Claude — the AI that powers the `claude_local` adapter, which is the most common choice for Geetorus agents.

1. Go to [console.anthropic.com](https://console.anthropic.com) and create an account (or sign in)
2. In the left sidebar, click **API Keys**
3. Click **Create Key**
4. Give it a name you'll recognise (e.g. "Geetorus")
5. Copy the key — it starts with `sk-ant-`

> **Warning:** Copy the key immediately. Anthropic only shows it once. If you lose it, you'll need to create a new one.

Store it somewhere safe — you'll add it to Geetorus as an environment variable or secret when you set up your first agent.

<!-- tab: OpenAI -->

OpenAI makes the models that power the `codex_local` adapter.

1. Go to [platform.openai.com](https://platform.openai.com) and create an account (or sign in)
2. Click your profile icon in the top-right, then **API keys**
3. Click **Create new secret key**
4. Give it a name (e.g. "Geetorus") and click **Create secret key**
5. Copy the key — it starts with `sk-`

> **Warning:** Copy the key immediately. OpenAI only shows it once. If you lose it, you'll need to create a new one.

<!-- /tabs -->

You don't need to enter the key into Geetorus yet. You'll wire it up when you configure your first agent in the next guide.

---

<!-- tab: Server / VPS -->

> **Note:** This path is for deploying Geetorus to an internet-facing server behind a domain name, with login required. You'll need SSH access to a Linux VPS, a registered domain name, and a little comfort with the command line. If you only need Geetorus for yourself on your own machine, use the **Terminal** tab instead.

Any Linux VPS with 1 vCPU and 2 GB of RAM is enough to get started. These instructions use **Ubuntu 22.04 / 24.04 LTS** as the reference distribution — commands on AWS EC2, Google Cloud Compute Engine, DigitalOcean Droplets, Hetzner Cloud, Linode, and similar providers are effectively identical.

---

## Step 1 — Provision the server

Create a VPS with your provider of choice:

- **DigitalOcean** — create a Droplet with Ubuntu 24.04, the Basic plan with 2 GB RAM is plenty to start.
- **AWS EC2** — launch a `t3.small` (or `t4g.small` for ARM) instance running Ubuntu 24.04.
- **Google Cloud** — create an `e2-small` Compute Engine VM with the Ubuntu 24.04 LTS image.
- **Hetzner / Linode / Vultr** — any ~€5/month Ubuntu 24.04 instance works.

In the provider's firewall or security group, open the following inbound ports:

| Port | Protocol | Purpose |
|---|---|---|
| 22 | TCP | SSH |
| 80 | TCP | HTTP (Let's Encrypt challenge + redirect) |
| 443 | TCP | HTTPS |

**Do not** open port 3100 to the internet. Geetorus itself will bind to `127.0.0.1` — Nginx is what the world talks to.

SSH in as a sudo-capable user:

```bash
ssh ubuntu@your.server.ip
```

---

## Step 2 — Point your domain at the server

Before installing anything, create a DNS `A` record for the hostname you want to use:

| Type | Name | Value |
|---|---|---|
| A | `geetorus.example.com` | `<your server's public IPv4>` |

Wait a minute or two and confirm it resolves:

```bash
dig +short geetorus.example.com
# Should print your server's IP
```

HTTPS certificate issuance in Step 7 will fail if DNS isn't pointing at the server yet, so get this right first.

---

## Step 3 — Install Node.js 24+ and pnpm

Geetorus requires **Node.js 24 or later** (24.11.0 or newer) and **pnpm**. Install Node.js from NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git ca-certificates
```

Enable pnpm via Corepack (shipped with Node.js):

```bash
sudo npm install -g corepack
sudo corepack enable
corepack prepare pnpm@latest --activate
```

Verify:

```bash
node --version     # v24.11.0 or higher
pnpm --version     # 9.x or higher
```

---

## Step 4 — Create a dedicated service user

Running Geetorus as a non-root user keeps the blast radius small if anything goes wrong:

```bash
sudo useradd --system --create-home --shell /bin/bash geetorus
sudo -iu geetorus
```

The rest of the installation commands run as the `geetorus` user, unless marked with `sudo`.

---

## Step 5 — Install Geetorus in public deployment mode

From the `geetorus` user's home directory, export the environment variables that tell Geetorus it's an internet-facing instance, then run onboarding:

```bash
export GEETORUS_DEPLOYMENT_MODE=authenticated
export GEETORUS_DEPLOYMENT_EXPOSURE=public
export GEETORUS_AUTH_PUBLIC_BASE_URL=https://geetorus.example.com
export GEETORUS_ALLOWED_HOSTNAMES=geetorus.example.com

npx geetorusai onboard --yes
```

> **Warning:** The variable names matter. `GEETORUS_AUTH_PUBLIC_BASE_URL` (not `GEETORUS_PUBLIC_BASE_URL` or `GEETORUS_API_URL`) is what the CLI reads. If you set `deploymentMode=authenticated` + `exposure=public` without it, `geetorusai doctor` will fail the config with `auth.publicBaseUrl is required` and the server won't start.

What each variable does:

- **`GEETORUS_AUTH_PUBLIC_BASE_URL`** — the external URL users will hit. This becomes Better Auth's canonical base URL and sets `auth.baseUrlMode=explicit` automatically.
- **`GEETORUS_ALLOWED_HOSTNAMES`** — comma-separated list of hostnames Geetorus will accept requests for. The hostname from your base URL is added automatically; include any extra aliases (e.g. `geetorus.example.com,www.geetorus.example.com`). Requests for unknown hosts are rejected.
- The server binds to `127.0.0.1:3100` by default, which is exactly what you want behind Nginx — no `GEETORUS_BIND` override needed. (If you ever need to expose it on a LAN or Tailnet instead, the CLI accepts `GEETORUS_BIND=lan|tailnet|custom` with `GEETORUS_BIND_HOST` for the `custom` case.)

The `--yes` flag accepts Quickstart defaults: **authenticated/public** deployment, **embedded PostgreSQL** (port 54329, data in `~/.geetorus/instances/default/db`), **local disk** storage, and a fresh 32-byte secrets master key at `~/.geetorus/instances/default/secrets/master.key`.

> **Warning:** Back up `secrets/master.key` somewhere safe. It encrypts every API key and secret stored in Geetorus — if you lose it, you lose access to all of them.

To customise any of those choices, omit `--yes` and walk through the prompts, or re-run `geetorusai configure --section <name>` later. Valid sections are: `llm`, `database`, `logging`, `server`, `storage`, `secrets`. (Auth URL settings live under the `server` section, not a separate `auth` section — the error message suggesting `--section database` is misleading.)

Onboarding creates the config at `~/.geetorus/instances/default/config.json` and initialises the database. When it finishes, press `Ctrl+C` if it offered to start the server — you'll run it under systemd next. You'll generate the first-user invite link in Step 9 using `geetorusai auth bootstrap-ceo`.

---

## Step 6 — Run Geetorus under systemd

As the `geetorus` user, write an environment file so systemd picks up the same config:

```bash
cat > ~/geetorus.env <<'EOF'
GEETORUS_DEPLOYMENT_MODE=authenticated
GEETORUS_DEPLOYMENT_EXPOSURE=public
GEETORUS_AUTH_PUBLIC_BASE_URL=https://geetorus.example.com
GEETORUS_ALLOWED_HOSTNAMES=geetorus.example.com
EOF
chmod 600 ~/geetorus.env
```

> **Note:** `GEETORUS_AGENT_JWT_SECRET` was already written to `~/.geetorus/instances/default/.env` during onboarding and is loaded automatically — don't duplicate it here.

Then, switch back to your sudo user (`exit`) and create the service unit:

```bash
sudo tee /etc/systemd/system/geetorus.service > /dev/null <<'EOF'
[Unit]
Description=Geetorus control plane
After=network.target

[Service]
Type=simple
User=geetorus
Group=geetorus
WorkingDirectory=/home/geetorus
EnvironmentFile=/home/geetorus/geetorus.env
ExecStart=/usr/bin/npx geetorusai run
Restart=on-failure
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now geetorus
sudo systemctl status geetorus
```

Check the logs if anything looks off:

```bash
sudo journalctl -u geetorus -f
```

You should see Geetorus listening on `http://127.0.0.1:3100`.

---

## Step 7 — Put Nginx in front of Geetorus

Install Nginx:

```bash
sudo apt-get install -y nginx
```

Create a site config for your domain:

```bash
sudo tee /etc/nginx/sites-available/geetorus > /dev/null <<'EOF'
server {
    listen 80;
    server_name geetorus.example.com;

    client_max_body_size 50m;

    location / {
        proxy_pass         http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;

        # WebSocket / long-lived streaming endpoints
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/geetorus /etc/nginx/sites-enabled/geetorus
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Replace `geetorus.example.com` with your own hostname.

---

## Step 8 — Add HTTPS with Let's Encrypt

Install Certbot and issue a certificate. Certbot will edit the Nginx config to handle TLS termination and HTTP → HTTPS redirects automatically:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d geetorus.example.com
```

Accept the Terms of Service, enter an email for expiry notifications, and choose **redirect** when asked whether to force HTTPS.

Certbot sets up a systemd timer that auto-renews certificates before they expire. Confirm it's active:

```bash
systemctl list-timers | grep certbot
```

Visit `https://geetorus.example.com` in a browser — you should see Geetorus's login screen served over HTTPS.

---

## Step 9 — Bootstrap the CEO account

Because you set `GEETORUS_DEPLOYMENT_MODE=authenticated`, the instance requires login. The first user is created via a one-time invite link generated by the CLI.

As the `geetorus` user, generate the invite:

```bash
sudo -iu geetorus
npx geetorusai auth bootstrap-ceo
```

The command prints an **Invite URL** that looks like:

```
Invite URL: https://geetorus.example.com/invite/<token>
```

> **Note:** `bootstrap-ceo` only runs in authenticated mode and needs to reach the database. If you're using the embedded PostgreSQL, make sure the `geetorus` systemd service is running when you invoke it, or the DB file lock will be held elsewhere.

Open the invite URL in a browser, create your account (email + password via Better Auth), and you'll land on the instance as the CEO/owner.

If you lose the link, re-run the command with `--force` to rotate the token:

```bash
npx geetorusai auth bootstrap-ceo --force
```

Optional flags: `--expires-hours N` to change link lifetime, `--base-url <URL>` to override the URL used for the invite, `--db-url <URL>` if you're pointing at an external database.

---

## Step 10 — Get your API key

You still need an Anthropic or OpenAI key for your agents to do any work. Follow the **Get your API key** step in the Terminal tab — it's identical for server deployments. Paste the key into Geetorus's Secrets UI once you're signed in; it will be encrypted with the master key from Step 5 and referenced by the adapter config.

---

## Troubleshooting

Useful diagnostic commands if anything goes wrong:

- `geetorusai doctor` — validates config and environment. Run it before `run` to catch schema errors early. Pass `--repair` to auto-fix what it can.
- `geetorusai env` — prints the env vars Geetorus is actually reading, so you can confirm your exports landed.
- `geetorusai allowed-hostname <host>` — add a hostname to `server.allowedHostnames` after install (e.g. if you add a second domain).
- `geetorusai configure --section server` — re-prompt for the server/auth settings (bind, exposure, public base URL, allowed hostnames) without rebuilding everything.
- `sudo journalctl -u geetorus -f` — tail the server logs.

Common errors:

- **`Embedded PostgreSQL failed` with `Execution of PostgreSQL by a user with administrative permissions is not permitted`** — Geetorus was started as root or with elevated privileges. Stop it, switch to a normal non-root user, and run `npx geetorusai run` again. On a VPS, make sure you have run `sudo -iu geetorus` before onboarding or starting Geetorus. If you accidentally created files under the wrong account, remove the root-owned instance or fix ownership before retrying.
- **`auth.publicBaseUrl is required when deploymentMode=authenticated and exposure=public`** — you didn't export `GEETORUS_AUTH_PUBLIC_BASE_URL` before running `onboard`. Re-export it and run `geetorusai configure --section server` (or re-run `geetorusai onboard --yes`).
- **Requests rejected with a host mismatch** — the hostname you're accessing isn't in `server.allowedHostnames`. Add it via `geetorusai allowed-hostname <host>` or by editing `GEETORUS_ALLOWED_HOSTNAMES` in `~/geetorus.env` and restarting the service.
- **Invite link 404s** — the invite was already consumed, or the base URL on the printed link doesn't match what the browser is hitting. Re-run `geetorusai auth bootstrap-ceo --force --base-url https://geetorus.example.com`.

---

## Common variations

- **Hosted PostgreSQL** — set `DATABASE_URL=postgres://...` in `~/geetorus.env` before onboarding. Use the pooled connection (port 6543 on Supabase) for the app and the direct connection for migrations. See [Database deployment](../../reference/deploy/database.md).
- **Object storage** — set `GEETORUS_STORAGE_MODE=s3` plus the relevant S3 env vars. See [Storage deployment](../../reference/deploy/storage.md).
- **Private team server over Tailscale** instead of a public domain — skip Nginx/Certbot and use `GEETORUS_DEPLOYMENT_EXPOSURE=private` with `GEETORUS_BIND=tailnet`. See [Tailscale private access](../../reference/deploy/tailscale-private-access.md). On a private, authenticated instance you can also skip the CLI invite for the first user: the very first person to sign in from a browser can claim themselves as the instance admin straight from the UI — whoever clicks first wins, and everyone else is locked out of the claim. See [Claim first instance admin](../../reference/api/instance-admin.md#claim-first-instance-admin) for the details.
- **Docker instead of bare metal** — a production-ready image and Compose file ship in the repo. See [Docker deployment](../../reference/deploy/docker.md).

---

<!-- /tabs -->

---

## You're in

Geetorus is running. The next guide walks you through creating your first company, setting a goal if you have one ready, and getting it ready for agents.

[Create Your First Company →](./your-first-company.md)

---

> **Note:** There is also an **unofficial, community-maintained desktop app** for macOS that wraps Geetorus in a regular Mac application. It is not built or supported by the Geetorus team. If you're curious, see [Community Desktop App](../../how-to/community-desktop-app.md).

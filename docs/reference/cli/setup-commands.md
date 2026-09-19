---
geetorus_version: v2026.916.0
seo_title: CLI Setup Commands
seo_description: Stand up a Geetorus instance, repair a broken one, or change the settings the server runs on — the commands that touch install and launch.
---

# Setup Commands

Use these commands when you are standing up a Geetorus instance, repairing it, or changing the settings the server runs on. They touch the **install and launch** — config files, the local database, secrets, storage, host binding, and the bootstrap credential. They do **not** create companies, file issues, or wake agents. That work belongs to the control-plane commands documented under [`company`](./company.md), [`issue`](./issue.md), [`agent`](./agent.md), and the rest of the reference.

The mental split is simple: setup commands answer "is this instance configured and running?"; control-plane commands answer "what is the company doing?". The one command that lives in both worlds is `run`, and this page is careful to separate its two meanings.

---

## When to reach for these

Reach for setup commands when you need to:

- create the initial config and local data directories ([`onboard`](#geetorusai-onboard))
- verify and repair an install before or after a config change ([`doctor`](#geetorusai-doctor))
- print the environment block a remote deployment will need ([`env`](#geetorusai-env))
- change deployment mode, database, storage, secrets, or logging ([`configure`](#geetorusai-configure))
- take a one-off database snapshot ([`db:backup`](#geetorusai-dbbackup))
- trust a private hostname in authenticated mode ([`allowed-hostname`](#geetorusai-allowed-hostname))
- bootstrap and launch a local server in one step ([`run`](#geetorusai-run-local-bootstrap))
- keep an instance running in the background across logins ([`service`](./service.md))
- install, update, roll back, or remove the CLI itself ([Installing the CLI](./installation.md) and [Update Geetorus](../../how-to/update-geetorus.md))
- mint the first board credential headlessly ([`auth bootstrap-ceo`](#geetorusai-auth-bootstrap-ceo))
- trigger one agent heartbeat for debugging ([`heartbeat run`](#geetorusai-heartbeat-run))
- pause every routine in a company during an incident ([`routines disable-all`](#geetorusai-routines-disable-all))

> **Note:** Examples use the installed binary `geetorusai`. Inside the monorepo you can substitute `pnpm geetorusai`; see [Installation](./installation.md).

---

## `geetorusai run` (local bootstrap)

> **Warning:** `geetorusai run` with **no subcommand** is a setup command: it bootstraps and starts a local server. The `run` **subcommands** (`run list`, `run get`, `run events`, `run log`, `run cancel`, and friends) are a *different feature* — they inspect and control heartbeat runs over the API and are documented in [Runs](./run.md). Do not confuse the two.

The bare `run` is the shortest route from "nothing" to "a healthy local instance accepting requests". It is a thin orchestrator:

1. Resolves the instance id and config path, creates `~/.geetorus` and the instance root if missing.
2. If no config exists and you are in a TTY, it hands off to [`onboard`](#geetorusai-onboard) interactively. In a non-interactive shell it errors and tells you to run `onboard` first.
3. Runs [`doctor`](#geetorusai-doctor) with repair enabled by default; if any check fails it stops without starting the server.
4. Starts the Geetorus server.
5. If the instance is in `authenticated` mode with the embedded database, it generates a bootstrap CEO invite after startup (see [`auth bootstrap-ceo`](#geetorusai-auth-bootstrap-ceo)).

```sh
geetorusai run
geetorusai run --instance dev
geetorusai run --data-dir ./tmp/geetorus-dev
geetorusai run --no-repair
```

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `-i, --instance <id>` | Local instance id (default: `default`). |
| `--bind <mode>` | On first run only, pass an onboarding reachability preset: `loopback`, `lan`, or `tailnet`. |
| `--repair` | Attempt automatic repairs during doctor. Enabled by default. |
| `--no-repair` | Disable automatic repairs during doctor. |
| `--force` | Run even when the same instance is active under the service manager. |

> **Tip:** `--bind` only matters on the very first `run`, when it forwards the preset to onboarding. Once a config exists, `run` reuses it; change binding later with [`configure --section server`](#geetorusai-configure).

> **Warning:** Before anything else, `run` checks whether this instance is already active under the service manager. If it is, `run` refuses to start — two servers on one port and one database is not a state you want — and points you at `geetorusai service status --instance <id>`. `--force` bypasses that check when you genuinely want a foreground process anyway. See [Service](./service.md).

---

## `geetorusai onboard`

Interactive first-run setup. Use it to create a brand-new local install or to rebuild the config from guided prompts. It writes the config (default `~/.geetorus/instances/<id>/config.json`), provisions the `GEETORUS_AGENT_JWT_SECRET` and `GEETORUS_TOOL_ACTION_SIGNING_SECRET` into the adjacent `.env` file, and creates the local secrets key file.

```sh
geetorusai onboard
geetorusai onboard --yes
geetorusai onboard --run
geetorusai onboard --bind lan
```

The first prompt offers two paths:

| Path | What you get |
|---|---|
| **Quickstart** | Local defaults, ready to run: embedded PostgreSQL, file logging, local-disk storage, local-encrypted secrets, loopback binding. Honors environment overrides (for example `DATABASE_URL`, `GEETORUS_PUBLIC_URL`, `GEETORUS_DEPLOYMENT_MODE`) where they apply. |
| **Advanced setup** | Step-by-step prompts for database, LLM provider, logging, server/auth, storage, and secrets. Tests the database connection and validates the LLM API key when you supply one. |

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `--bind <mode>` | Quickstart reachability preset: `loopback`, `lan`, or `tailnet`. |
| `-y, --yes` | Accept Quickstart defaults non-interactively and start immediately. Without `--bind`, this forces trusted-local loopback defaults and ignores conflicting reachability env vars. |
| `--install-service` | Install and start the background service after onboarding. |
| `--no-install-service` | Do not install or suggest the background service. |
| `--run` | Start the server immediately after saving the config. |

Near the end of the wizard, `onboard` offers to install Geetorus as a background service so it starts on login and keeps running after you close the terminal. `--install-service` installs it without asking; `--no-install-service` skips both the install and the suggestion. When the service is installed, onboarding does *not* also start a foreground server — the service is already running Geetorus for you. On a platform where service management is unavailable, `--install-service` warns and continues. See [Service](./service.md) for what gets installed and how to manage it.

Once the service is running, onboarding hands you off to it instead of stopping at the terminal: it waits for the service to report the port it actually bound (a fallback port is used automatically if the configured one is busy), prints the dashboard URL, and — on an interactive terminal — opens it in your browser. Headless and non-interactive runs print the URL without launching a browser. Set `GEETORUS_NO_BROWSER=1` to keep onboarding from opening a browser even in an interactive terminal. If the service does not come up in time, onboarding says so and points you at `geetorusai service logs` rather than claiming success.

> **Note:** If a valid config already exists, `onboard` preserves it unchanged, ensures the agent JWT secret, the tool-action signing secret, and the secrets key exist, and prints next-step commands. Use [`configure`](#geetorusai-configure) to change settings on an existing install rather than re-onboarding.

When the instance is `authenticated` with the embedded database, the bootstrap CEO invite is deferred until the server is running — `onboard` reminds you to run `geetorusai run` then [`auth bootstrap-ceo`](#geetorusai-auth-bootstrap-ceo).

---

## `geetorusai doctor`

Diagnostic checks with optional repair. Run it before starting the server, after editing config, or any time the instance misbehaves. `run` invokes `doctor` for you; call it directly when you only want the report.

```sh
geetorusai doctor
geetorusai doctor --repair
geetorusai doctor --repair --yes
```

It loads the config's `.env`, then runs these checks in order, stopping early only if the config itself is invalid:

- config validity (must pass first)
- deployment / auth mode compatibility
- agent JWT secret
- secrets adapter
- storage
- database connectivity
- LLM provider
- log directory
- listen port
- Node.js runtime
- the managed install: store, shim, `PATH`, and payload retention
- the background service: definition, runtime, health, version, and lingering

Each line reports `✓ pass`, `! warn`, or `✗ fail` with a repair hint. The summary counts passed/warned/failed, and a clear "fix and re-run" message is printed when anything fails.

The last three groups cover *how Geetorus is installed and supervised*, not how it is configured:

| Check group | What it looks at |
|---|---|
| Node.js runtime | Fails on anything older than Node.js 24 (24.11.0). |
| Managed install | Only runs if you have a [managed install](./installation.md#the-managed-install). Confirms the manifest and active payload agree, that `~/.local/bin/geetorusai` is a real Geetorus shim, that its directory is on `PATH` (a warning if not), and that no orphaned payloads are left behind. |
| Background service | Only runs if a [service](./service.md) is installed for this instance. Confirms the definition on disk matches what your current install would generate, that the service is active, that the health endpoint answers, and that the running version matches your managed install. On Linux it warns when start-on-login is on but systemd lingering is off. |

All three are optional by design. Running Geetorus through `npx`, a global npm install, or a source checkout, with no background service, passes cleanly — the checks report "not present" rather than complaining.

> **Note:** `doctor` (like `run`) also does a quick, cached, once-a-day check for a newer published version and prints a one-line notice when one exists. Turn it off by setting `GEETORUS_UPDATE_CHECK=0`, or by setting `updates.checkEnabled` to `false` in your config.

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `--repair` (alias `--fix`) | Attempt to repair fixable issues. |
| `-y, --yes` | Skip the per-repair confirmation prompts. |

> **Warning:** `--repair` can create or update local files (the JWT `.env`, the secrets key, the log directory) when a check knows how to fix the problem. Review the output before running it against a shared or production-like instance, and pair it with `--yes` only when you trust the repairs.

---

## `geetorusai env`

Print the environment variables a deployment needs, with each value's source and a ready-to-paste `export` block. Use it to inspect what the instance actually resolves after config, defaults, and environment overrides are merged — and to seed the env of a remote/containerized deployment.

```sh
geetorusai env
```

It reads the config (warning, not failing, if the file is missing or unparseable), then prints two sections, **Required** and **Optional**, marking each variable as `set`, `default`, or `missing`. The required variables are `GEETORUS_AGENT_JWT_SECRET` and `DATABASE_URL`; optional entries cover `PORT`, `GEETORUS_PUBLIC_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`, the agent-JWT and heartbeat-scheduler tunables, and the full secrets/storage provider set. Missing values appear in the export block as `<set-this-value>` so you can fill them in.

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |

> **Tip:** Pipe the export block into your shell or a deployment manifest. Anything still marked `missing` must be supplied before the server will start cleanly.

---

## `geetorusai configure`

Update one or more configuration sections on an existing install without rebuilding it. Each save rewrites the config and stamps its metadata. Run it interactively to pick sections from a menu, or target one directly with `--section`.

```sh
geetorusai configure
geetorusai configure --section server
geetorusai configure --section database
geetorusai configure --section storage
geetorusai configure --section secrets
geetorusai configure --section logging
geetorusai configure --section llm
```

| Section | Changes |
|---|---|
| `server` | Deployment mode, exposure, host binding, port, served UI, and auth base URL. |
| `database` | Embedded vs. external PostgreSQL, connection string, backup settings. |
| `storage` | Storage provider (`local_disk` or `s3`) and its options. |
| `secrets` | Secrets provider, strict mode, and the local key file (created on demand). |
| `logging` | Logging mode and directory. |
| `llm` | LLM provider and API key. |

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `-s, --section <section>` | Configure one section and exit: `llm`, `database`, `logging`, `server`, `storage`, or `secrets`. |

> **Note:** `configure` requires an existing config — it errors and tells you to run `onboard` first if none is found. When you pass `--section`, it configures that section once and exits; without it, it loops so you can edit several sections in a row.

---

## `geetorusai db:backup`

Create a one-off snapshot of the instance database using the current config. This is a manual backup on top of (and independent of) the scheduled backups the server runs. It resolves the connection string in order: `DATABASE_URL`, then a configured `postgres` connection string, then the embedded-postgres default.

```sh
geetorusai db:backup
geetorusai db:backup --dir /backups/geetorus
geetorusai db:backup --retention-days 14
geetorusai db:backup --json
```

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `--dir <path>` | Backup output directory; overrides the configured backup dir. |
| `--retention-days <days>` | Retention window for daily-pruning (positive integer). Defaults to the config value or 30. |
| `--filename-prefix <prefix>` | Backup filename prefix (default `geetorus`). |
| `--json` | Print backup metadata (file, size, pruned count, dir, retention, source) as JSON. |

> **Tip:** For the embedded database you can run a backup without the server up — `db:backup` connects on the embedded port directly. Verify where it landed with the printed `Backup dir`.

---

## `geetorusai allowed-hostname`

Add a hostname to the instance's allowlist so it is accepted in authenticated/private mode. Use it when Geetorus rejects a host that should be trusted on a private network (for example a Tailscale machine name).

```sh
geetorusai allowed-hostname dotta-macbook-pro
geetorusai allowed-hostname my-host.ts.net
```

| Argument / Flag | Use |
|---|---|
| `<host>` | The hostname to allow (normalized and lowercased). |
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |

The command updates the local config in place. A new entry takes effect only after you **restart the server**. Allowed hostnames are enforced only in `authenticated` + `private` mode; in any other mode the command notes that the setting is inert.

---

## `geetorusai auth bootstrap-ceo`

Mint the **first** board credential headlessly by inserting a one-time bootstrap invite into the database and printing its URL. This is how an `authenticated` instance gets its initial instance admin without a pre-existing login. On a `local_trusted` instance it is unnecessary — loopback is treated as implicit board authority — and the command says so and exits.

```sh
geetorusai auth bootstrap-ceo
geetorusai auth bootstrap-ceo --expires-hours 24
geetorusai auth bootstrap-ceo --force
geetorusai auth bootstrap-ceo --base-url https://geetorus.example.com
```

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `--force` | Create a new invite even if an instance admin already exists. |
| `--expires-hours <hours>` | Invite lifetime in hours (clamped between 1 and 720; default 72). |
| `--base-url <url>` | Public base URL used to render the invite link. |

If an admin already exists it refuses unless you pass `--force`. Each run also revokes any outstanding, unaccepted bootstrap-CEO invites before issuing a fresh one. With the embedded database, the server must be running (or the embedded cluster started) for the insert to succeed; the command tells you to start the server and retry if it cannot connect.

> **Note:** After this first credential exists, you no longer need `bootstrap-ceo`. A board token can mint further board tokens and agent keys non-interactively — see [Authentication](./authentication.md).

---

## `geetorusai heartbeat run`

Trigger exactly **one** heartbeat for a single agent and stream its live logs to your terminal. This is a debugging and observation tool, not the normal way work happens — it POSTs to the server's wakeup endpoint and the server-side runtime runs the adapter. The CLI only triggers and tails; the model executes server-side.

```sh
geetorusai heartbeat run --agent-id <agent-id>
geetorusai heartbeat run --agent-id <agent-id> --source on_demand --trigger manual
geetorusai heartbeat run --agent-id <agent-id> --timeout-ms 120000 --debug
```

| Flag | Use |
|---|---|
| `-a, --agent-id <agentId>` | **Required.** Agent to invoke. |
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `--context <path>` | Path to the CLI context file. |
| `--profile <name>` | CLI context profile name. |
| `--api-base <url>` | Base URL for the Geetorus server API. |
| `--api-key <token>` | Bearer token for agent-authenticated calls. |
| `--source <source>` | Invocation source: `timer`, `assignment`, `on_demand`, or `automation` (default `on_demand`). |
| `--trigger <trigger>` | Trigger detail: `manual`, `ping`, `callback`, or `system` (default `manual`). |
| `--timeout-ms <ms>` | Max time to wait before giving up (default `0`, meaning no client-side timeout). |
| `--json` | Output raw JSON where applicable. |
| `--debug` | Show raw adapter stdout/stderr JSON chunks instead of formatted events. |

The command polls run events and logs until the run reaches a terminal status (`succeeded`, `failed`, `cancelled`, `timed_out`) and exits non-zero on anything but success, printing error and result details. To inspect runs you triggered elsewhere, use the [`run`](./run.md) subcommands.

> **Tip:** For routine agent wake-ups during normal operation, prefer [`agent wake`](./agent.md) and the prompt-handoff flow in [`prompt`](./prompt.md). Reach for `heartbeat run` when you specifically want to watch a single run unfold.

---

## `geetorusai routines disable-all`

Pause every non-archived routine in one company on the configured local instance. This is an incident/maintenance switch: it stops scheduled automation from firing while you investigate, without deleting anything. It operates directly on the local database (starting the embedded cluster and applying pending migrations if needed), so it works even when the server is down.

```sh
geetorusai routines disable-all --company-id <company-id>
geetorusai routines disable-all --company-id <company-id> --json
```

| Flag | Use |
|---|---|
| `-c, --config <path>` | Path to the config file. |
| `-d, --data-dir <path>` | Isolate all local state from `~/.geetorus`. |
| `-C, --company-id <id>` | Company whose routines to pause. Falls back to `GEETORUS_COMPANY_ID`. |
| `--json` | Output the result counts as JSON. |

It reports how many routines it paused, how many were already paused, and how many were archived (left untouched). Routines in any state other than `paused`/`archived` are flipped to `paused`. To create, edit, or resume individual routines through the API, use the [`routine`](./routine.md) commands.

> **Warning:** This pauses *all* of a company's routines at once. Re-enabling is a per-routine operation via [`routine`](./routine.md); there is no single "enable-all" counterpart, so use this deliberately.

---

## Local paths

A local instance keeps its state under `~/.geetorus/instances/<instance-id>` (default instance id `default`):

| Data | Path |
|---|---|
| Config | `~/.geetorus/instances/default/config.json` |
| Database (embedded) | `~/.geetorus/instances/default/db` |
| Logs | `~/.geetorus/instances/default/logs` |
| Storage (local disk) | `~/.geetorus/instances/default/data/storage` |
| Secrets key | `~/.geetorus/instances/default/secrets/master.key` |

Use `--data-dir` (or `--instance`) to run an isolated instance — handy for clean test setups and worktrees — without disturbing your primary install.

---

## See also

- [Installation](./installation.md) — install the CLI and pick a deployment shape
- [Service](./service.md) — run an instance in the background with `geetorusai service`
- [Update Geetorus](../../how-to/update-geetorus.md) — check, apply, and roll back new versions
- [Authentication](./authentication.md) — board tokens, agent keys, and the login flows after bootstrap
- [Runs](./run.md) — inspecting and controlling heartbeat runs (the `run` *subcommands*)
- [Routines](./routine.md) — create, edit, and resume scheduled automation
- [Agents](./agent.md) — waking agents and `agent local-cli` for local execution
- [Common options](./common-options.md) — shared flags and context/profile resolution

---
geetorus_version: v2026.512.0
seo_title: Cursor Cloud Adapter
seo_description: Run Cursor Cloud Agents through the official SDK so Cursor handles remote code execution while Geetorus keeps the task state and history.
---

# Cursor Cloud

`cursor_cloud` runs Cursor Cloud Agents through the official Cursor SDK so Geetorus can keep task state while Cursor handles remote code execution. Use it when you want durable remote Cursor agent sessions that survive between Geetorus heartbeats.

---

## When To Use

- You want Geetorus to run Cursor Cloud Agents through the official Cursor SDK.
- You want durable remote Cursor agent sessions across Geetorus heartbeats.
- You want Geetorus to keep task state while Cursor handles remote code execution.

## When Not To Use

- You want local execution on the same machine as Geetorus. Use [Cursor Local](./cursor-local.md).
- You do not have a Cursor API key or a Cursor account that allows cloud agents.
- The work the agent needs to do cannot be expressed as a repository checkout.

---

## Common Fields

| Field | Required | Notes |
|---|---:|---|
| `repoUrl` | yes | Git repository URL Cursor should open. |
| `repoStartingRef` | no | Starting ref for the repo. |
| `repoPullRequestUrl` | no | Pull request URL to attach the agent to. |
| `runtimeEnvType` | no | `cloud`, `pool`, or `machine`. |
| `runtimeEnvName` | no | Named cloud, pool, or machine target. |
| `workOnCurrentBranch` | no | Continue work on the current branch instead of cutting a new one. |
| `autoCreatePR` | no | Let Cursor auto-create a pull request. |
| `skipReviewerRequest` | no | Suppress the reviewer request on auto-created PRs. |
| `instructionsFilePath` | no | Agent instructions file prepended to the prompt. |
| `promptTemplate` | no | Heartbeat prompt template. |
| `bootstrapPromptTemplate` | no | First-run-only bootstrap prompt template. |
| `model` | no | Cursor model id. Omit to use the account default. |
| `env.CURSOR_API_KEY` | yes | Cursor API key. Use a Geetorus secret reference. |
| `env.*` | no | Additional environment variables injected into the cloud agent shell. |

---

## Session Persistence

Geetorus reuses the durable Cursor agent across heartbeats when the repo and runtime identity still match. Each Geetorus heartbeat maps to a Cursor run on that durable agent. If the repo URL, starting ref, or runtime environment changes, Geetorus starts a fresh Cursor agent.

---

## Execution Details

- Geetorus drives the agent through the Cursor SDK rather than a local CLI.
- Geetorus injects `GEETORUS_*` runtime env vars into the cloud agent shell via the Cursor SDK `cloud envVars` channel.
- Geetorus remains the source of truth for issue and task state. Cursor provides the remote execution surface.

---

---

## Example

```json
{
  "adapterType": "cursor_cloud",
  "adapterConfig": {
    "repoUrl": "https://github.com/example-org/example-repo",
    "repoStartingRef": "main",
    "runtimeEnvType": "cloud",
    "workOnCurrentBranch": false,
    "autoCreatePR": true,
    "skipReviewerRequest": false,
    "promptTemplate": "You are the engineering lead. Work carefully and report progress.",
    "bootstrapPromptTemplate": "Bootstrap the working environment, then await instructions.",
    "env": {
      "CURSOR_API_KEY": {
        "type": "secret_ref",
        "secretId": "secret-id",
        "version": "latest"
      }
    }
  }
}
```

---

## Related

- [Cursor Local](./cursor-local.md) — same agent vendor, local execution.
- [Creating An Adapter](./creating-an-adapter.md) — author your own adapter when none of the built-ins fit.

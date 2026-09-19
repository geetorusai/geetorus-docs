---
seo_title: Connect Your First Connector
seo_description: Connect one read-only service to Geetorus and give an agent a task that uses it, without granting write access to anything.
---

# Connect your first connector

By the end of this you will have one connector set up, one agent allowed to use it, every write action switched off, and one finished task where the agent actually called the service. Most of the elapsed time is the provider's sign-in screen and the agent's own run.

The worked example is **Hugging Face**, chosen because it offers a simple setup: a free account, a browser sign-in with no OAuth app to register, no administrator approval, and a provider scope named `read-mcp`. Step 4 has you confirm the action list rather than take the scope's name on trust.

> **Note:** Substituting a different connector is fine, but do not expect these exact steps to transfer. This shape — an app tool with a browser sign-in — is the simplest one in the catalog. Others need an OAuth app you register yourself, an administrator, or Google Developer Preview access; messaging channels and model providers work differently again and have no action list to configure at all. [How connector access works](access-model.md) sorts the shapes out, and each provider page lists its own prerequisites.

## Before you start

- Geetorus running, with a company you can administer. See [Installation](../guides/getting-started/installation.md).
- At least one hired agent. See [Hire your first agent](../guides/getting-started/your-first-agent.md).
- **Only if you follow the Hugging Face example:** a free [Hugging Face](https://huggingface.co) account, signed in in the same browser. If you choose a different first connector, follow that connector's prerequisites instead; you do not need a Hugging Face account.

## 1. Open the catalog

In the left sidebar, select **Connectors**.

The page lists every connector Geetorus can set up. Use **Search connectors** to find **Hugging Face**, then select **Connect**.

## 2. Choose who it is for

Setup asks this **before** it asks for a credential — the steps run **Pick app**, then **Access**, then the credential — so that you decide identity and reach before handing over an account.

Under **Which humans can use this credential?**, choose **Just me**.

This makes it your personal credential: agents use it only on runs where you are the responsible person. It is the right default for a first connector, because nothing you do here affects anyone else in the company. [Use separate accounts for people and agents](separate-accounts.md) explains when to pick something broader.

Under **Which agents can use this connection**, choose **Just agents I pick** and select the one agent you plan to test with.

## 3. Sign in

Geetorus now shows the setup paths this connector supports. Hugging Face has one: **Sign in with Hugging Face**.

Select it. Geetorus registers itself with Hugging Face's authorization server, opens the provider's consent screen, and asks for the `read-mcp` scope. Approve it there.

You do not create an OAuth app, and you do not paste a token. If the provider ever refuses that automatic registration, Geetorus stops and asks you for a client instead of silently failing — that path is in [Connect a custom MCP server](custom-mcp-servers.md).

## 4. Turn off everything that is not a read

Open the connector's **Permissions** tab. You will see the action list Hugging Face published, each row classified **read**, **write**, or **destructive**, and each one set to **Allowed**, **Ask first**, or **Off**.

Set every non-read action to **Off**. On a `read-mcp` connection there may be none to change — check rather than assume, because the list comes from the provider and can change when they change it.

Leave the reads **Allowed**. You now have a connector that can only look things up.

## 5. Give an agent one task

Create a task and assign it to the agent you selected. Something narrow and verifiable:

```txt
Using the Hugging Face connector, find the three most-downloaded
text-classification models published in the last month. For each one,
report the model id, the download count, and the license.
Do not create, modify, or delete anything.
```

When the run finishes, the agent's answer should contain model ids you can check by hand on huggingface.co. That is the point of a read-only first task: you can tell whether the connector worked without trusting the agent's summary of its own behaviour.

## 6. Confirm it was the connector doing the work

Two places to look:

- The connector's **Permissions** tab shows the action list and which entries are enabled.
- The connector's activity shows the calls the agent made against this connection.

If the run produced nothing, or the connector row shows **Needs attention**, go to [Verify a connector and fix a broken one](verify-and-troubleshoot.md).

## What you have now

One connection, scoped to you, usable by one agent, restricted to reads. That is a deliberately small blast radius, and it is the shape to keep while you are learning what an agent does with a new tool.

## Next

- [How connector access works](access-model.md) — what the choices in steps 2 and 4 actually control, and how other connector shapes differ.
- [Set action permissions](action-permissions.md) — turning on a write, with **Ask first** as the middle setting.
- [Connectors](../connectors.md) — the rest of the catalog.

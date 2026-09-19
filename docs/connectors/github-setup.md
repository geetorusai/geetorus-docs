---
seo_title: Set Up the GitHub Connector
seo_description: Step-by-step setup for both GitHub routes — repository tools with a managed identity or a fine-grained token, and the GitHub App for chat from issues.
---

# Set up the GitHub connector

Two separate procedures, because GitHub does two unrelated jobs. Pick the one you need:

- [Set up GitHub as an agent tool](#set-up-github-as-an-agent-tool) — agents read and act on repositories.
- [Set up chat from GitHub](#set-up-chat-from-github) — people work with an agent from issue and pull-request comments.

For what each route governs, and the shell Git and `gh` exception, see [GitHub](github.md). Read the exception before granting an agent a dedicated identity.

## Set up GitHub as an agent tool

### 1. Decide the identity first

Deciding *which* identity and *which* repositories is the part worth slowing down for, because GitHub-side scope is the real limit on what an agent can do.

| Identity | Choose it when |
| --- | --- |
| **My GitHub account** | You want an agent acting as you, on your work, while you are the responsible person |
| **A dedicated account for an agent** | The agent should appear as itself in commits, comments, and pull requests. Requires the connection-manager permission |

For anything that pushes code, a dedicated account is the better answer. Its actions are attributable, and revoking it does not disturb a person's own access.

### 2. Start the connection and pick a credential path

1. Select **Connectors** in the sidebar.
2. Find **GitHub** and select **Connect**.
3. On the **Access** step, choose which agents may use the connection: **Any agent**, or **Just agents I pick**. For a dedicated identity this is already settled — that agent owns the account.
4. Choose the credential path:

| Path | What it is | Offered when |
| --- | --- | --- |
| **Use this connection as an agent tool** | Geetorus's managed GitHub App authorization | Only when the instance is enrolled with Geetorus Cloud and Cloud advertises the GitHub connector profile |
| **Personal access token (advanced)** | A fine-grained token you create and control | Always |

**The two branches do not share steps from here.** Follow 3a or 3b, not both.

### 3a. Managed path — authorize and choose repositories in GitHub

1. Answer **Connect GitHub as** with the identity from step 1. For a dedicated account, Geetorus asks **Which agent owns this GitHub account?**
2. Select **Continue to GitHub** and authorize.
3. On GitHub's installation screen, select the specific repositories the agent should reach. Avoid **All current and future repositories** unless that is genuinely the intent — Geetorus flags such an installation in the repository row, because it widens on its own as the organization grows.

Back in Geetorus, the identity card shows **Accessible GitHub repositories**. To change the list later use **Add More Repos on GitHub** or **Configure access on GitHub**, then **Refresh access** so Geetorus re-reads the installation.

This branch is the only one that produces a durable identity for shell Git and `gh`.

### 3b. Token path — create the token, then paste it

There is no authorization redirect and no GitHub installation screen on this branch. **Repository scope lives on the token**, so you set it while creating the token rather than afterwards in Geetorus.

1. In GitHub, go to **Settings** → **Developer settings** → **Personal access tokens** → **Fine-grained tokens**, and select **Generate new token**. Direct link: [github.com/settings/personal-access-tokens/new](https://github.com/settings/personal-access-tokens/new).
2. Set the **Resource owner** to the account or organization that owns the repositories. If it is an organization, the token may need an organization owner's approval before it works — expect that delay rather than assuming the token is broken.
3. Under **Repository access**, choose **Only select repositories** and pick exactly the repositories agents should use.
4. Set an **Expiration**. A token that expires is a feature here; note the date, because the connection will stop working on it.
5. Grant repository permissions to match what you want agents to do, and no more. Read-only **Contents**, **Metadata**, **Issues**, and **Pull requests** is a sensible starting point; add write permissions deliberately, one at a time.
6. Generate the token and copy it. GitHub shows it once. It begins `github_pat_`.
7. Back in Geetorus, paste it into the **GitHub token** field and finish. The connection is complete at that point — there is nothing further to authorize.

> **Note:** Because the permissions are the ones you ticked on the token, this path is the easier of the two to audit. What it does not give you is a durable shell identity: for that, use the managed path.

To change repository scope later, edit the token in GitHub or issue a new one and reconnect. **Refresh access** re-reads an installation and does not apply here.

### 4. Set the actions

On the **Permissions** tab, work down the list: reads **Allowed**; writes and destructive actions **Ask first** or **Off** until you have watched the agent work.

Geetorus shows the shell warning when you change a permission on a dedicated GitHub identity. Read it as written: shell Git and `gh` use that account and are not bounded by these switches.

### 5. Put the real guardrails on GitHub

Because the shell is not gated by action permissions, the controls that matter for an agent with push access live on GitHub:

- For the managed App, grant **selected repositories**. For a PAT, restrict repository selection and token permissions in GitHub.
- Protect the default branch: require a pull request, and require a review from someone other than the agent.
- Require status checks to pass before merge.

Geetorus's [execution policy](../guides/power/execution-policy.md) can also require a review stage on the Geetorus issue, but a Geetorus review stage and a GitHub branch protection rule are separate controls. Set both if merges matter.

### 6. Verify with a read

As the agent you intend to use, ask it to read a known file in an intended repository. Compare the content and inspect the task's connector call. Check managed App installation settings or, for a PAT, its repository selection and permissions separately. A successful read verifies that operation, not the entire access boundary.

Do not verify with a push, a pull request, or a merge.

## Set up chat from GitHub

This route lets people start and continue work from issue, pull-request, and review comments. It grants no repository tools — if you want both, complete both procedures.

### 1. Check the prerequisites

- **Chat connectors** must be switched on for the instance. It is an experimental setting, off by default, enabled by an instance administrator under experimental settings.
- You need permission to create a GitHub App in the organization and to install it.
- **Your Geetorus instance must be reachable from the internet over HTTPS.** GitHub delivers comments by calling a Geetorus URL. Geetorus builds that URL from the instance's configured public address, so an instance with none configured shows no webhook URL and cannot receive anything. If the URL is missing in step 2, ask an administrator to configure the instance's public address.
- Decide which agent will answer.

### 2. Start in Geetorus to get the webhook URL and secret

Both values come from Geetorus, not from you, and both are needed before you create the App.

1. Open **Connectors**, select **GitHub**, then **Chat with an agent**.
2. On the **Access** step, choose the identity and which agents may use the connection.
3. Copy the **webhook URL** Geetorus shows. It is specific to this connection.
4. Generate the **webhook secret** and keep it to hand. GitHub needs both in the next step.

> **Note:** Regenerating the secret later immediately invalidates GitHub's webhook signatures until you paste the new one into the App's settings. Expect deliveries to fail in between.

### 3. Create one private GitHub App

At [GitHub's new App form](https://github.com/settings/apps/new), create a **private** App with:

- **Webhooks** active and SSL verification enabled, using the webhook URL and secret from step 2.
- **Issues** — read and write.
- **Pull requests** — read and write.
- Subscribed events: **issue_comment** and **pull_request_review_comment**.

GitHub sends the installation and installation_repositories events automatically; you do not select those.

Then generate a private key and download the PEM file.

> **Danger:** The private key authenticates the whole App. Paste it only into Geetorus, and generate a replacement key in GitHub if it is ever exposed.

### 4. Install it only where mentions should work

Install the App on the specific repositories where people should be able to mention the agent.

Provider channel or repository access determines where a message can reach the integration; it does not by itself authorize agent work. Geetorus also checks the sender's linked identity and company membership. Linked users must be active non-viewer members. Unlinked senders depend on the connection's **Allow unlinked people** setting and any sponsor requirements. Review these controls before inviting people to use the agent.

### 5. Finish in Geetorus

Paste the **GitHub App ID** and the **private key (PEM)**, choose the answering agent, and finish.

Geetorus waits for GitHub to deliver a signed webhook ping before it treats the endpoint as verified, showing *"Waiting for GitHub to deliver its signed webhook ping…"* until it arrives and *"GitHub has verified this webhook."* afterwards. If it stays waiting, the URL, the secret, or public reachability is the cause.

### 6. Verify with a scratch issue

1. In a repository where the App is installed, open a scratch issue.
2. Comment, mentioning the agent, and ask it to confirm it is connected.
3. Expect a reply comment and a matching task in Geetorus.

## Troubleshooting

| Problem | Likely cause | Fix |
| --- | --- | --- |
| The managed tool option is missing | No Geetorus Cloud enrollment, or the GitHub connector profile is not advertised | Use **Personal access token (advanced)** |
| A fine-grained token is rejected, or reaches nothing | It targets an organization that has not approved it, or its repository selection is empty | Check for a pending approval under the organization's personal-access-token settings, and confirm the token's selected repositories |
| A token connection stops working on a particular date | The token expired | Issue a new token with the same scope and reconnect |
| No webhook URL is shown on the chat setup | The instance has no public base URL configured | Ask an administrator to configure it |
| **Chat with an agent** is missing | **Chat connectors** is off for the instance | Ask an administrator to enable it |
| Fewer repositories than expected | The installation does not include them | Fix it on GitHub, then **Refresh access** |
| *"You don't have permission to reconnect this identity."* | The identity belongs to someone else, or to another agent | Ask its owner, or use your own |
| Tool calls work but `git push` is rejected | Account permissions or branch protection on GitHub | Check both on GitHub |
| Webhook deliveries fail in GitHub's App log | The webhook URL or secret does not match | Regenerate the secret in Geetorus and update the App |
| A comment creates no task | The App is not installed on that repository, or the two comment events are not subscribed | Install it there and check the events |

More in [Verify a connector and fix a broken one](verify-and-troubleshoot.md).

## Related guides

- [GitHub](github.md)
- [Connect an agent to a GitHub repo](../how-to/connect-agent-to-github.md)
- [Use separate accounts for people and agents](separate-accounts.md)
- [Set action permissions](action-permissions.md)

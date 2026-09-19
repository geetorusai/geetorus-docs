---
seo_title: Microsoft Teams Connector
seo_description: Let people start Geetorus work from Microsoft Teams. Entra app and Azure Bot setup, tenant admin approval, what the RSC grants expose, and troubleshooting.
---

# Microsoft Teams

People message your agent in Microsoft Teams — in a personal chat, a team channel, or a group chat — and Geetorus starts work.

This is the most involved channel to set up. It needs an Entra application, a single-tenant Azure Bot, a Teams app package, and tenant administrator approval. Budget real time for it, and read the access note below before you install.

> **Warning:** A personal or free Teams account at `teams.live.com` cannot complete this setup. You need a Microsoft 365 work or school organization where you can register an Entra application.

## Before you connect

- **Chat connectors** must be switched on for the instance. It is an experimental setting, off by default, enabled by an instance administrator under experimental settings.
- A Microsoft 365 work or school tenant, and permission to register an Entra application in it.
- A tenant administrator who can grant the application's permissions and allow the Teams app to be installed. If that is not you, involve them before starting — the setup cannot be finished without them.
- **Your Geetorus instance must be reachable from the internet over HTTPS.** Azure delivers every message by calling a Geetorus URL, so an instance with no public base URL configured cannot receive anything. If Geetorus shows no messaging endpoint in step 2, this is why — ask an administrator to configure the instance's public address.
- The agent that will answer.

> **Warning:** This release supports Microsoft 365 commercial cloud tenants only. GCC, GCC High, DoD, and Microsoft 365 operated by 21Vianet are not supported.

## What the installation can read

This matters more here than on the other channels, so decide it before you install.

The Teams app uses two resource-specific consent permissions, **ChannelMessage.Read.Group** and **ChatMessage.Read.Chat**. Where the app is installed, those let it receive **every message in that team or group chat, whether or not anyone mentions the agent.**

That is how Teams delivers messages to an installed bot, not a Geetorus choice, but the consequence is yours to manage: tell the people in a team what the app can see before you install it there, and install it only where that is acceptable. A personal chat with the bot exposes only that chat.

## Connect Microsoft Teams

Four portals are involved and the order matters: Geetorus generates the messaging endpoint that Azure needs, so **start in Geetorus** rather than finishing there. The same Application ID is reused in three places.

### 1. Register the Entra application

In the **Microsoft Entra admin center** → **App registrations**, select **New registration** and choose **Accounts in this organizational directory only (Single tenant)**. Register it, then copy:

- **Application (client) ID**
- **Directory (tenant) ID**

Then under **Certificates & secrets** → **Client secrets**, select **New client secret** and copy its **Value** — not its Secret ID. Entra shows the value once.

### 2. Open the setup in Geetorus and copy the messaging endpoint

1. Open **Connectors** and select **Microsoft Teams**.
2. On the **Access** step, choose the identity and which agents may use the connection.
3. The setup screen shows a **Geetorus messaging endpoint**. Copy it — Azure needs it in the next step. Leave this screen open; you will come back to it to finish.

### 3. Create the Azure Bot, point it at Geetorus, and add the Teams channel

In **Azure** → **Create Azure Bot**:

1. Set **Microsoft App ID** type to **Single Tenant** and **Creation type** to **Use existing app registration**, then enter the Application ID and Tenant ID from step 1.
2. After creation, open **Settings** → **Configuration** and paste the Geetorus **Messaging endpoint** from step 2.
3. Open **Settings** → **Channels** and enable **Microsoft Teams**.

> **Warning:** Both of those last two are required. Creating the bot is not enough — without the messaging endpoint Azure has nowhere to deliver messages, and without the Teams channel Teams will not route to the bot at all. A setup that skips either looks complete and silently receives nothing.

### 4. Build the Teams app package

In the [Teams Developer Portal](https://dev.teams.microsoft.com/apps) → **Apps**, select **New app**:

1. Under **Configure** → **App features** → **Bot**, add an existing bot using the **same Application ID**, and enable the **Personal**, **Team**, and **Group chat** scopes plus file support.
2. Under **Configure** → **Permissions**, add the two resource-specific consent **Application** permissions. Geetorus shows the exact manifest block to use — enter your Client ID on the Geetorus setup screen first, then use **Copy manifest settings**.
3. Complete the required app details and icons, explain in them that the app can receive every message in an installed team or group chat, then download the app package.

> **Note:** These resource-specific consent permissions bind to the Entra app through the Teams manifest. They are *not* Microsoft Graph permissions, and you will not find them in Entra's API permissions list.

### 5. Install it where mentions should work

In **Teams** → **Apps** → **Manage your apps**, select **Upload an app** → **Upload a custom app**, choose the downloaded package, and install it in each intended personal chat, group chat, or team.

One team installation covers that team's standard channels. If upload is unavailable, a Teams administrator must enable or approve custom apps.

### 6. Finish in Geetorus

Return to the setup screen and paste the **Application / Client ID**, **Directory / Tenant ID**, and **Client secret value**. Choose the agent that will answer, and finish.

Microsoft's own walkthrough is [Create a bot for Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-for-teams).

## How a conversation becomes work

| In Teams | In Geetorus |
| --- | --- |
| Someone messages the bot in a personal chat | A task is created for the connected agent |
| A supported message reaches the bot in an installed team channel or group chat | Geetorus applies its trigger and sender-authorization checks before starting agent work |
| The conversation continues | Replies continue the same task |

## Choose access

Reach is decided by where the app is installed, in Teams, not in Geetorus. There is no team or channel picker on the connection.

One team installation covers that team's **standard** channels. **Private and shared channels need their own installation and are not supported in this release** — an agent will not see messages in them, so do not plan work around a private channel.

External installation is not the whole permission boundary. Geetorus also checks the sender's linked identity and membership, or the configured policy for unlinked people. Review these settings and the answering agent on the connection before inviting users. See [How connector access works](access-model.md).

## Try it

Start in a personal chat, which exposes the least:

1. In Teams, open a personal chat with the app and send `hello, can you confirm you are connected?`
2. Expect a reply in that chat within a few moments.
3. Confirm a matching task appears in Geetorus, assigned to the connected agent.

Only after that works, install into a team — and tell its members what the app can read first.

> **Note:** Procedure, not a recorded test result.

## Troubleshooting and limitations

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Microsoft Teams does not appear in **Connectors** | **Chat connectors** is off for the instance | Ask an administrator to enable it |
| The app cannot be registered or installed | The account is a personal or free Teams account | Use a Microsoft 365 work or school tenant |
| Consent cannot be completed | The permissions need tenant administrator approval | Ask a tenant administrator to grant consent |
| Authentication fails after setup | The client secret was copied from the ID field, or has expired | Create a new secret, copy its value, and reconnect |
| The bot replies in personal chats but not a channel | The app is not installed in that team, or the channel is private or shared | Install into the team; private and shared channels are not supported |
| Nothing arrives anywhere, though setup completed | The Azure Bot's messaging endpoint is unset or wrong, or its **Microsoft Teams** channel was never enabled | Check both in Azure under **Settings · Configuration** and **Settings · Channels** |
| Geetorus shows no messaging endpoint to copy | The instance has no public base URL configured | Ask an administrator to configure it; Azure cannot deliver to an unreachable instance |
| Azure reports delivery failures to the endpoint | Geetorus is not reachable from the internet at that URL | Confirm public HTTPS ingress to the instance |
| Messages arrive but no task is created | The connection is unhealthy, or no agent is assigned | Check the connection's status and assigned agent |
| People are surprised the bot sees everything | The RSC grants deliver all messages in the installed team or chat | Explain the access, or uninstall from that team |

Limitations: one tenant and one agent per connection. No private or shared channel support. Microsoft 365 commercial cloud tenants only — not GCC, GCC High, DoD, or 21Vianet. Geetorus cannot narrow what an installed app receives; that is fixed by the Teams permission model.

## Related guides

- [Slack](slack.md), [Discord](discord.md), [Telegram](telegram.md) — other conversation channels.
- [How connector access works](access-model.md)
- [Create a bot for Teams](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/create-a-bot-for-teams)

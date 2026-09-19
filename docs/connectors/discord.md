---
seo_title: Discord Connector
seo_description: Let people start Geetorus work by mentioning an agent in Discord. Bot setup, required intent and permissions, routing, and fixing a silent bot.
---

# Discord

People mention your agent in a Discord channel, and Geetorus starts work. Each root mention opens a Discord thread, and the reply comes back in that thread.

One connection serves one Discord server and one agent.

## Before you connect

- **Chat connectors** must be switched on for the instance. It is an experimental setting, off by default, and an instance administrator enables it under experimental settings. Without it, chat setup is hidden entirely.
- **Manage Server** permission on the Discord server where the bot will live, so you can install it.
- A dedicated Discord application. Use a new one for this connector rather than reusing a bot that already does something else.
- The agent that will answer.

## Connect Discord

### 1. Create the application and bot

At the [Discord developer portal](https://discord.com/developers/applications), create an application and add a bot to it. Then:

- Enable the **Message Content** intent on the bot. Without it Discord delivers no message text and the bot will appear online but never respond.
- Copy the **bot token**, and the **Application ID** from the application's general information.
- Copy the **Server ID** of the target server. Enable Discord's developer mode, then right-click the server and copy its ID.

### 2. Install the bot on the server

The bot needs these permissions in at least one text channel:

**View Channels**, **Send Messages**, **Create Public Threads**, **Send Messages in Threads**, **Read Message History**, **Add Reactions**, **Embed Links**, and **Attach Files**.

Geetorus builds an install link with exactly these permissions during setup, scoped to the server ID you supplied, which is the least error-prone way to install it.

### 3. Connect it in Geetorus

1. Open **Connectors** and select **Discord**.
2. On the **Access** step, choose the identity and which agents may use the connection.
3. Paste the **Bot token**, **Application ID**, and **Server ID**.
4. Choose the agent that will answer, and finish.

## How a conversation becomes work

| In Discord | In Geetorus |
| --- | --- |
| Someone mentions the bot in a channel | A task is created for the connected agent, and Geetorus opens a thread on that message |
| Replies inside the thread | Continue the same task |
| A new root mention elsewhere | Starts a separate task and its own thread |

The Geetorus task is authoritative. If a thread and the task ever disagree, the task is the record — useful to know when someone edits or deletes a Discord message mid-conversation.

## Choose access

Reach is decided in Discord, not Geetorus. The bot can see the channels its role can see on the one server you installed it on, and there is no channel picker in Geetorus. To limit where people can reach the agent, restrict the bot's role to specific channels in Discord's channel permissions.

Provider channel or repository access determines where a message can reach the integration; it does not by itself authorize agent work. Geetorus also checks the sender's linked identity and company membership. Linked users must be active non-viewer members. Unlinked senders depend on the connection's **Allow unlinked people** setting and any sponsor requirements. Review these controls before inviting people to use the agent.

The connection's identity and **Any agent** / **Just agents I pick** settings work as for any connector; see [How connector access works](access-model.md). Note that the answering agent is set on the connection itself.

## Try it

1. In a channel the bot can see, mention it with a short request: `@YourAgent hello, can you confirm you are connected?`
2. Expect a thread to open on your message within a few moments.
3. Confirm a matching task appears in Geetorus, assigned to the connected agent.

That exercises intent, permissions, routing, and task creation in one step, in a channel you control.

> **Note:** Procedure, not a recorded test result. Use a private channel for the first attempt.

## Troubleshooting and limitations

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Discord does not appear in **Connectors** | **Chat connectors** is off for the instance | Ask an administrator to enable it |
| The bot shows online but never replies | The **Message Content** intent is not enabled | Enable it in the developer portal, then reconnect |
| The bot replies in some channels but not others | Its role cannot see those channels, or cannot create threads there | Grant the listed permissions on the channel |
| Setup is rejected for missing permissions | The bot lacks the required permissions in any text channel | Re-install with Geetorus's generated link |
| A mention creates no task | The mention was inside an existing thread rather than a root message, or the connection is unhealthy | Mention at channel level; check the connection's status |
| The wrong agent answers | The answering agent is set on the connection | Change it on the connection |

Limitations: one server and one agent per connection. Private channels the bot's role cannot see are unreachable.

> **Note:** The documented way to start work is a root mention in a channel, and that is the path this page describes and the setup flow tests. Geetorus's Discord adapter does advertise direct-message support, but we have not verified that a direct message starts a task — do not build a workflow on it without trying it yourself first.

## Related guides

- [Slack](slack.md), [Microsoft Teams](microsoft-teams.md), [Telegram](telegram.md) — other conversation channels.
- [How connector access works](access-model.md)
- [Discord bot getting started](https://discord.com/developers/docs/quick-start/getting-started)

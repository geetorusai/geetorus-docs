---
seo_title: Telegram Connector
seo_description: Let people start Geetorus work by messaging a Telegram bot. BotFather setup, the public webhook requirement, agent routing, and fixing a silent bot.
---

# Telegram

People message your Telegram bot, and Geetorus starts work. Replies come back in the same Telegram conversation.

One connection serves one bot and one agent.

> **Warning:** Telegram delivers messages by calling Geetorus, so your instance needs a publicly reachable HTTPS address. Telegram only accepts webhooks on ports **443, 80, 88, or 8443**. If your instance is not reachable that way, this connector cannot work — unlike [AgentMail](agentmail.md), there is no outbound-only mode.

## Before you connect

- **Chat connectors** must be switched on for the instance. It is an experimental setting, off by default, enabled by an instance administrator under experimental settings.
- A publicly reachable HTTPS URL for the instance, configured by an administrator as `GEETORUS_CHAT_WEBHOOK_PUBLIC_URL`, on one of Telegram's permitted ports.
- A Telegram account, to talk to BotFather.
- The agent that will answer.

## Connect Telegram

### 1. Create the bot

1. Message [@BotFather](https://t.me/BotFather) in Telegram and send `/newbot`.
2. Give the bot a display name and a username ending in `bot`.
3. Copy the **bot token** BotFather returns. It looks like `123456789:AA...`.

Create a dedicated bot for this connector rather than reusing one that already has another webhook — a Telegram bot supports one webhook at a time, so connecting here replaces whatever it pointed at before.

> **Danger:** The bot token is a full credential for the bot. Never paste it into a chat, an issue, or a screenshot. If it leaks, use BotFather's `/revoke` to rotate it and reconnect.

### 2. Connect it in Geetorus

1. Open **Connectors** and select **Telegram**.
2. On the **Access** step, choose the identity and which agents may use the connection.
3. Paste the **Bot token**.
4. Choose the agent that will answer, and finish.

Geetorus registers the webhook with Telegram for you, using a generated secret so it can reject forged deliveries. There is no URL for you to paste into BotFather.

## How a conversation becomes work

| In Telegram | In Geetorus |
| --- | --- |
| Someone sends the bot a direct message | A task is created for the connected agent |
| They keep replying | The conversation continues on the same task |
| The agent responds | The reply arrives in the Telegram conversation |

## Choose access

Two different controls apply here, on two different sides, and conflating them is the mistake worth avoiding.

**On Telegram's side there is no sender allowlist.** Anyone who can find the bot can message it. Do not treat the bot's username as a secret — treat it as public, and share it only with the people you intend to serve.

**On Geetorus's side there is a control.** The connection's **Access** tab has **External identity access** with an **Allow unlinked people** toggle:

| Setting | What happens when an unrecognized person messages the bot |
| --- | --- |
| **On** (the default) | They are a restricted guest. Their tasks run only with an isolated workspace and sandbox environment, and Geetorus refuses the request if that is unavailable. Guests cannot approve, hire, spend, manage access, or reassign agents |
| **Off** | They cannot start work at all. Only senders linked to a Geetorus person get through |

So "anyone can message the bot" is true, and "anyone can make an agent do arbitrary work" is not. Decide which of those two settings you want **before** you publish the username; the restrictions on a guest are real but they are not the same as refusing them.

In groups, Telegram's default privacy mode means a bot only receives messages that address it directly. Turning that off in BotFather would give the bot every group message; leave it alone unless you have decided you want that.

The connection's identity and agent settings work as for any connector; see [How connector access works](access-model.md). The answering agent is set on the connection.

## Try it

1. Open your bot in Telegram and send `hello, can you confirm you are connected?`
2. Expect a reply in the conversation within a few moments.
3. Confirm a matching task appears in Geetorus, assigned to the connected agent.

Message the bot from your own account first. That exercises webhook delivery, routing, and task creation without involving anyone else.

> **Note:** Procedure, not a recorded test result.

## Troubleshooting and limitations

| Problem | Likely cause | Fix |
| --- | --- | --- |
| Telegram does not appear in **Connectors** | **Chat connectors** is off for the instance | Ask an administrator to enable it |
| Setup fails mentioning HTTPS and ports | The instance's public webhook URL is missing or on an unsupported port | An administrator must set `GEETORUS_CHAT_WEBHOOK_PUBLIC_URL` to HTTPS on 443, 80, 88, or 8443 |
| The bot exists and accepts messages but never replies | Telegram cannot reach the instance, or another system replaced the webhook | Reconnect the connection, which re-registers the webhook |
| The bot worked and went silent | The token was revoked, or another tool called `setWebhook` on the same bot | Rotate the token if needed and reconnect; use a dedicated bot |
| The bot ignores messages in a group | Telegram privacy mode delivers only messages addressing the bot | Address the bot directly, or reconsider whether a group is the right entry point |
| The wrong agent answers | The answering agent is set on the connection | Change it on the connection |

Limitations: one bot and one agent per connection. No sender allowlist. A Telegram bot has a single webhook, so the bot cannot be shared with another integration.

## Related guides

- [Discord](discord.md), [Slack](slack.md), [Microsoft Teams](microsoft-teams.md) — other conversation channels.
- [How connector access works](access-model.md)
- [Telegram bot tutorial](https://core.telegram.org/bots/tutorial)

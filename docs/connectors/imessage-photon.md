---
seo_title: iMessage Photon Connector
seo_description: Let people message a Geetorus agent from Apple Messages using Photon Cloud. Line types, sender enrollment, group support, and troubleshooting.
---

# iMessage Photon

People message your agent from Apple Messages, and Geetorus starts work. Delivery runs through [Photon Cloud](https://photon.codes/), a third-party service that provides the iMessage line.

> **Note:** This does not give Geetorus access to your own Messages history, your Apple ID, or a Mac you own. Nothing is installed locally. The agent is reachable at a line Photon operates, and only conversations on that line reach Geetorus.

## Before you connect

- **Chat connectors** must be switched on for the instance. It is an experimental setting, off by default, enabled by an instance administrator under experimental settings.
- A Photon Cloud account and project, and the project's **project secret**.
- A decision about which kind of line you need — see below. It determines whether groups work at all.
- The agent that will answer.

## Choose the line type first

Photon offers two arrangements, and they differ in a way that affects what you can build:

| Line | Direct messages | Group chats |
| --- | --- | --- |
| **Pro (shared line)** | Yes, after each sender is enrolled in Photon and their identity is linked in Geetorus | No |
| **Dedicated line** | Yes | Yes, for groups you enable individually |

A shared Pro line needs per-sender setup, so it suits a small known set of people. A dedicated line is the option if you need group conversations or an open audience. Check current line availability and pricing with Photon.

## Connect iMessage Photon

### 1. Connect the project

1. In Photon, create the project and note its **project ID** and **project secret**.
2. Open **Connectors** and select **iMessage Photon**.
3. On the **Access** step, choose the identity and which agents may use the connection.
4. Supply the project ID and paste the **Project secret**, then choose the allocation: **shared** (a Pro project-shared number) or **dedicated** (one line you select).
5. On a dedicated allocation, choose the **line**. Only eligible lines can be selected; if none is offered, the line is not ready on Photon's side.
6. Choose the agent that will answer.

Geetorus verifies the credentials against Photon at this point. Two failures are worth recognising: *"Photon allocation changed; inspect the project again"* means the project's allocation no longer matches what you chose, and *"Select an eligible dedicated Photon line"* means the line you picked is not usable.

### 2. Link the sender — this is a required step, not an optional one

**A sender who is not linked to a Geetorus person cannot start work on this channel at all.** Other Geetorus channels can run an unlinked sender as a restricted guest in an isolated run; iMessage Photon does not allow that. Until you link, nothing happens.

Linking works by discovery — you message the line first so Geetorus can see the sender, then you link what it discovered:

1. **On a shared allocation**, first enroll your sender in the Photon project under **Users**, and find the project's assigned number under **Get started**. On a dedicated allocation, use the line's own number, which Geetorus shows with a **Copy** button.
2. From Apple Messages, send a **fresh** message to that number.
3. That message discovers your phone number or Apple account address. Open **Access** on the connection and link that exact identity to a Geetorus person.
4. Send **another fresh request**. Geetorus does not replay the message you sent in step 2, and earlier messages do not start work retrospectively.
5. Wait for the agent's actual reply. Setup completes when that reply is delivered, not when you send.

> **Warning:** Step 4 is the one people miss. Linking does not retroactively turn the discovery message into a task — you must send again afterwards.

### 3. Groups, on a dedicated line only

1. Add the line's number to the group in Messages.
2. Send a message in the group.
3. Enable the discovered group in the connection's **Settings**.
4. Send a fresh request in the group.

On a shared allocation this is unavailable rather than merely unconfigured: Geetorus refuses with *"Photon shared channels support direct messages only; groups require a dedicated channel."*

Photon's [connection and routing guide](https://photon.codes/docs/spectrum-ts/providers/imessage/connection-and-routing) covers the provider side.

> **Danger:** The project secret authenticates the whole Photon project. Store it only in Geetorus, and rotate it in Photon if it is ever exposed.

## How a conversation becomes work

| In Messages | In Geetorus |
| --- | --- |
| An enrolled sender messages the line | A task is created for the connected agent |
| They keep replying | The conversation continues on the same task |
| A message arrives in an enabled group, on a dedicated line | Routed to the connected agent as group context |

## Choose access

Two separate controls apply, on two different sides, and it is worth keeping them apart:

| Control | Where it lives | What it decides |
| --- | --- | --- |
| Sender enrollment, line allocation, group membership | **Photon** | Whether a message reaches Geetorus at all |
| Identity linking, group enablement, the answering agent | **Geetorus** | Whether a message that arrived starts work |

So a message can pass Photon and still do nothing in Geetorus — that is the usual cause of "it is not working" on this connector, and it is a Geetorus-side linking problem rather than a Photon fault.

Identity linking is what lets Geetorus attribute a conversation to a person. **Unlinked senders are refused on this channel specifically**, rather than being run as restricted guests the way they can be elsewhere. That is deliberate: an Apple Messages sender is a phone number, and Geetorus will not start agent work for one it cannot attribute.

The connection's identity and agent settings work as for any connector; see [How connector access works](access-model.md). The answering agent is set on the connection.

## Try it

Do this only after your own identity is linked — otherwise you are testing the linking step, not the connection.

1. From the Apple device whose identity you linked, send a fresh message to the line: `hello, can you confirm you are connected?`
2. Expect a reply in Messages within a few moments.
3. Confirm a matching task appears in Geetorus, assigned to the connected agent.

Use your own linked number first. On a dedicated line, confirm a direct message works before enabling any group.

> **Note:** Procedure, not a recorded test result.

## Troubleshooting and limitations

| Problem | Likely cause | Fix |
| --- | --- | --- |
| iMessage Photon does not appear in **Connectors** | **Chat connectors** is off for the instance | Ask an administrator to enable it |
| A sender's message never starts work | Their identity is not linked in Geetorus. On a shared line they may also not be enrolled in Photon | Enroll them in Photon's **Users** if needed, link the discovered identity in **Access**, then have them send a fresh message |
| You linked the identity and still nothing happened | The discovery message is not replayed after linking | Send a new message. Only messages sent after linking start work |
| Setup will not complete | It completes on the agent's delivered reply, not on your sent message | Wait for the reply; if none arrives, work back through linking |
| *"Photon shared channels support direct messages only"* | Group chats were enabled on a shared allocation | Move to a dedicated line; this is refused rather than degraded |
| *"Select an eligible dedicated Photon line"* | The chosen line is not eligible on Photon's side | Pick an eligible line, or resolve the line's state in Photon |
| Group messages are ignored on a dedicated line | The group was discovered but never enabled | Enable it in the connection's **Settings**, then send a fresh request |
| Messages stop after working | The project secret was rotated in Photon | Reconnect with the current secret |
| Delivery is delayed or fails for everyone | A Photon-side problem, not Geetorus | Check Photon's status and project configuration |
| The wrong agent answers | The answering agent is set on the connection | Change it on the connection |

Limitations: one Photon project and one agent per connection. No group support on a Pro shared line. Geetorus depends on Photon for delivery, so its availability bounds this connector's. There is no local or native Apple Messages integration.

## Related guides

- [Discord](discord.md), [Slack](slack.md), [Telegram](telegram.md), [Microsoft Teams](microsoft-teams.md) — other conversation channels.
- [How connector access works](access-model.md)
- [Photon iMessage connection and routing](https://photon.codes/docs/spectrum-ts/providers/imessage/connection-and-routing)

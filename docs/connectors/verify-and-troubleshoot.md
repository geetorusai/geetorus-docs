---
seo_title: Verify and Fix a Connector
seo_description: Confirm a new connector works using a read-only test call, read the status words in the connector list, and fix the common failure modes.
---

# Verify a connector and fix a broken one

Two jobs on one page: proving a new connection works without touching anything outside Geetorus, and diagnosing one that has stopped.

## First: how do you verify this shape?

The read-test procedure below is for **app tool** connections. The other shapes have no action list, so it does not apply to them.

| Shape | How you verify it |
| --- | --- |
| **App tools** — Notion, Jira, Stripe, and most of the catalog | The read test below |
| **Messaging channels** — Slack chat, Discord, Telegram, Teams, iMessage Photon, GitHub chat | Send a real message from the provider and wait for the agent's reply. There is no action list to test against, and setup is not complete until a reply is delivered. The connector's own page has the sequence |
| **Model providers** — Anthropic, OpenAI, OpenRouter, Grok | Run a short task on an agent whose runtime matches, and watch the run. A connected badge says nothing about runtime compatibility. See [Anthropic](anthropic.md) |

[How connector access works](access-model.md) explains why the controls differ.

## Verify a new tool connection

Always start with a read.

1. Open the connector and select the **Permissions** tab.
2. Confirm the action list loaded. For an app-tool connection, an empty list can mean discovery is incomplete or the provider returned no tools for this credential. Select **Refresh actions** and inspect any error; model credentials and chat channels do not have an action catalog.
3. Confirm every write and destructive action is **Off** or **Ask first** while you are testing.
4. Run one read action as a specific agent using the connector's built-in test call. Geetorus asks **Choose which agent to test as**, because the answer depends on the agent's effective policy, not just on the connection.
5. Read the result. **Worked** means the call succeeded; **Worked. No data to show.** means it succeeded and returned nothing. **Show raw response** gives you the provider's actual payload.

The API equivalents:

```http
GET  /api/tool-connections/{connectionId}/test-agents
GET  /api/tool-connections/{connectionId}/test-agents/{agentId}/access
POST /api/tool-connections/{connectionId}/test-calls
GET  /api/tool-connections/{connectionId}/test-calls/{actionRequestId}
POST /api/tool-connections/{connectionId}/health-check
```

Do not verify a connector with a write. A write that half-succeeds against a real account is a worse diagnostic than a read that fails cleanly.

## Read the status words

| Status | Meaning |
| --- | --- |
| **Healthy** | The credential works. It does **not** mean a given agent can use the connection — that depends on agent access and the action's own setting, which are checked separately at call time. |
| **Connected** | A connection exists for this connector. |
| **Not connected** | No connection yet. *"Connect it so agents can use it."* |
| **Setup incomplete** | A connection record exists but setup never finished. *"Finish setup before agents can use this account."* |
| **Needs attention** | Something requires a person: an expired credential, or a pending review request. |
| **Paused** | *"Paused — agents can't use it right now."* |

Neither **Connected** nor **Healthy** is proof that a particular agent's call will succeed. **Connected** says a record exists; **Healthy** says the credential works. Whether *this* agent may run *that* action is a separate layer, resolved at call time. Run the read test as the agent you actually intend to use.

## Common failures

### Sign-in expired or was revoked

*"Your authorization expired or was revoked. Reconnect to continue."* or *"Reconnect required — sign in again to restore access."*

Select **Reconnect** and sign in again. The connection, its agent access, and its action settings survive; only the credential is replaced. See [Reauthorize, revoke, or disconnect](reauthorize-and-disconnect.md).

### The key stopped working

*"The key stopped working — reconnect to fix."* For an API-key connection, select **Replace the stored credential** and **Paste your new key**. Geetorus validates it before saving: *"That key didn't check out. Try another."* means the value was rejected by the provider, not mistyped into the wrong field.

### Authorization never completes

*"Authorization did not complete. Finish setup in the sign-in window or try again."* usually means the popup was closed early or the provider is waiting on an administrator. For providers whose authorization needs tenant approval, the warning on the provider page says so.

### The action is refused

- *"This action is off and won't run."* — the action is set to **Off**.
- *"This action is new and hasn't been turned on yet."* — discovered on a refresh, not yet enabled.
- *"Denied — see Review for why"* — an **Ask first** request was declined.
- *"The connected account may not have permission for this action."* — Geetorus allowed it; the provider did not. Fix this at the provider, not in Geetorus.

### The provider returns an error

*"The app returned an error result."* with a code such as `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `INVALID_ARGUMENT`, `RATE_LIMIT`, or `RESOURCE_EXHAUSTED`. These come from the service. `RATE_LIMIT` and `RESOURCE_EXHAUSTED` are the provider throttling you; the rest point at the account's own permissions or at the arguments.

### The managed sign-in option is missing

**Connect with Geetorus** appears only when your instance is enrolled with Geetorus Cloud and Cloud advertises that connector profile. If it is absent, the connector list offers **Enable Geetorus-managed sign-in** or **Continue enrollment**, and the customer-owned OAuth path stays available in the meantime.

### Nothing in the list looks like the provider you want

The provider may be recognized but withheld from the catalog, or it may have no self-serve path at all. Both cases are listed at the bottom of [Connectors](../connectors.md).

## Where to look next

- The connector's activity view lists the calls made against it: `GET /api/tool-connections/{connectionId}/activity`.
- The company [activity log](../guides/day-to-day/activity-log.md) records connection lifecycle events, including `tool_app.connected`, `tool_connection.catalog_refresh`, and trust rule creation and revocation.

## Related

- [Reauthorize, revoke, or disconnect](reauthorize-and-disconnect.md)
- [Set action permissions](action-permissions.md)
- [Answer a connector review request](review-requests.md)
- [Debug a stuck heartbeat](../how-to/debug-stuck-heartbeat.md)

---
seo_title: Share a Connector
seo_description: Choose which people a connector credential covers and which agents may use it, and understand why the two lists are governed separately in Geetorus.
---

# Share a connector with people and agents

For credentialed app-tool connections, there are two separate audiences: the people the credential belongs to, and the agents allowed to call through it. Widening one does not widen the other.

## Choose the human audience

Open the connector and find its identity card.

**For a personal connection** (**Just me**), there is nothing to choose. The credential is yours, and *"Only you can use this connection."*

**For an organization identity**, select **Who can use this identity**:

| Choice | Effect |
| --- | --- |
| **Any human in the company** | *"Anyone in your company can use this connection."* |
| **Humans I pick** | *"Only selected people in your company."* Select **Choose people** and name them. |

Save. The change applies to the next run; there is no reconnect.

Creating or changing an organization identity requires the connection-manager permission. Without it Geetorus refuses the change server-side rather than hiding the control and hoping.

**For a dedicated agent identity**, the human audience is not a list — the identity belongs to one agent. The card reads *"Dedicated to one agent"* and links to that agent. See [Use separate accounts for people and agents](separate-accounts.md).

## Choose which agents may use it

For an app-tool connection, open the **Permissions** tab and find **Which agents can use this connection**. Model credentials and chat channels use their own assignment controls; see their provider guides.

| Choice | Effect |
| --- | --- |
| **Any agent** | *"Available across your company."* |
| **Just agents I pick** | *"Available only to selected agents."* Select **Choose agents** and name them. |

If the control is disabled with *"Unavailable while this connection is installed for every agent,"* the connection has a company-wide install that supersedes the per-agent list. Change the install first.

Check the selected audience during setup; availability and defaults depend on the method, your permissions, and whether setup was opened for a particular agent. That is not a permission to act — the action list still decides what any of those agents may actually call. See [Set action permissions](action-permissions.md).

## Why these are two lists

The human audience decides whose credential is spent and whose consent backs the call. Agent access decides which parts of your org chart can reach the service at all.

They come apart constantly in practice. A finance connector might be shared with the whole company as an identity but restricted to a single bookkeeping agent. A personal Gmail connection is one person's mailbox, but you may still want three of your agents able to search it on your behalf.

## Check what you changed

The connector list shows the current state per connection. For a connection whose identity is mixed across installations, the card reads *"Mixed access; scope varies by installation"* rather than flattening it into a single claim.

## Related

- [How connector access works](access-model.md)
- [Use separate accounts for people and agents](separate-accounts.md)
- [Set action permissions](action-permissions.md)
- [Members and access](../guides/org/members-and-access.md)

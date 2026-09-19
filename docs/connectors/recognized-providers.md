---
seo_title: Recognized but Unlisted Providers
seo_description: The provider definitions present in the Geetorus catalog but withheld from the Connectors list, and the providers that gate access behind their own approval.
---

# Providers Geetorus recognizes but does not list

Reference for the inventory behind the catalog. If you are looking for a connector to set up, start at [Connectors](../connectors.md) — everything on this page is either withheld from the **Connectors** list or blocked by the provider, so none of it can be set up from the catalog today.

Two separate things get confused here, so they are listed separately. A **withheld** provider has a complete definition that Geetorus still recognizes, but it is deliberately kept out of the customer-facing list. A **provider-gated** one is not offered because the provider itself will not let an independently registered client connect.

> **Note:** Checked against Geetorus **v2026.916.0**. Catalog visibility can change between releases; recognition is not a promise of availability. Existing connections still need to be verified independently.

## Withheld from the Connectors list

Geetorus keeps recognition and visibility as separate things: a definition can stay in the catalog while being hidden from the store. The comment on the hidden set in the App source gives the reason — separating the two means pulling a provider out of the list does not have to break connections somebody already saved.

What we can confirm at this commit: the definitions below are present, Geetorus still resolves them, and they are filtered out of the list you browse. What we did not do is connect or run any of them, so whether a connection saved earlier still works is unverified here. If you have one, [Verify a connector and fix a broken one](verify-and-troubleshoot.md) is how to find out, and the answer is specific to your instance.

None of these have connector pages, and none can be added from the catalog.

| Provider | Slug |
| --- | --- |
| beehiiv | `beehiiv` |
| Bitly | `bitly` |
| Brex | `brex` |
| Candid | `candid` |
| Coda | `coda` |
| Composio | `composio` |
| Context7 | `context7` |
| Egnyte | `egnyte` |
| Embat | `embat` |
| Kernel | `kernel` |
| Local Falcon | `local-falcon` |
| Make | `make` |
| Manufact | `manufact` |
| O'Reilly | `oreilly` |
| PlanetScale | `planetscale` |
| Razorpay | `razorpay` |
| Sanity | `sanity` |
| Similarweb | `similarweb` |
| Ticket Tailor | `ticket-tailor` |
| TickTick | `ticktick` |
| Xero | `xero` |

## Gated by the provider

These three are recorded as blocked because of a requirement on the provider's side. The requirement is theirs, not Geetorus's, and it has to be lifted or granted by them — there is no setting in Geetorus that works around it.

| Provider | What the provider requires |
| --- | --- |
| G2 (`g2`) | G2 has to enable cross-application token introspection before an independently registered client can connect at all. There is no customer-side application process for this. |
| Vercel (`vercel`) | Vercel reviews and approves MCP clients. Approval is between Vercel and the client's publisher, so an operator cannot request it for their own instance. |
| Zomato (`zomato`) | Zomato limits third-party clients and requires each redirect URI to be allowlisted. Both steps happen on Zomato's side. |

If you need one of these now, the routes that do not depend on the provider's client approval are in [Can't find your app?](../connectors.md#cant-find-your-app) — a custom server where the provider permits one, automation you already own, or a workspace and a CLI.

## Related

- [Connectors](../connectors.md) — the catalog you can actually set up from.
- [Connect a custom MCP server](custom-mcp-servers.md) — the path for a service with no catalog entry.
- [Verify a connector and fix a broken one](verify-and-troubleshoot.md) — checking whether a connection you already have still works.

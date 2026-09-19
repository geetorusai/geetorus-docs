---
seo_title: Set Up the Gmail Connector
seo_description: Get Google Developer Preview access, connect Gmail with the read or draft capability group, and restrict which agents can search your mail.
---

# Set up the Gmail connector

> **Warning:** **Google verification pending.** Geetorus has not yet completed Google app verification. You may see an unverified-app warning during authorization. If Google offers an **Advanced** option to continue to Geetorus, you can choose to proceed after reviewing the requested access. This option is not available for every account; Workspace administrator restrictions and other Google access requirements still apply. Contact [support@geetorus.ing](mailto:support@geetorus.ing) if you cannot connect.

Two phases: get Google to register you for Developer Preview, then connect. The first phase is the slow one and happens entirely at Google.

For what the connector can and cannot do once it is connected, see [Gmail](gmail.md).

## 1. Get Developer Preview access

Google's Workspace MCP servers are in Developer Preview. Google registers both the Workspace email that will sign in and the Google Cloud project that owns the OAuth client. Registration covers only the emails and projects you name.

1. Apply at [Google Workspace Developer Preview](https://developers.google.com/workspace/preview) with the Workspace email that will authorize Geetorus and the Google Cloud project that owns the OAuth client.
2. Wait for the Google Group notification, then Google's final project-registration email. Google's guidance is usually a couple of days.
3. Add every additional tester email and every additional Cloud project through Google's member request forms **before** connecting them. An unregistered account fails at authorization, not at connect time.

If you plan to use **Connect with Geetorus** rather than your own OAuth client, the Workspace email still has to be registered — the Cloud project on that path is Geetorus's.

## 2. If you are bringing your own OAuth client

Skip this section if your instance is enrolled with Geetorus Cloud and **Connect with Geetorus** is offered.

In the [Google Cloud console](https://console.cloud.google.com/auth/clients):

1. Enable the **Gmail API** and the **Gmail MCP API** on the project.
2. Create an OAuth client of type **Web application** and add Geetorus's callback as an authorized redirect URI. Geetorus shows the exact URI during setup — copy it from there; it is the `/api/tools/oauth/callback` route on your instance's origin, and it must match exactly.
3. Keep the client ID and client secret to hand.

[Set up your own Google OAuth app](google-setup.md) covers this in full, including the redirect-URI failure mode, and is the same procedure for every other Google connector. Google's own walkthrough is [Configure MCP servers](https://developers.google.com/workspace/guides/configure-mcp-servers).

## 3. Decide the capability group before you start

This is the decision that matters, and it is fixed for the life of the connection.

| Group | Scopes requested | Use it when |
| --- | --- | --- |
| **Read only** | `gmail.readonly` | Agents need to find and read mail. Nothing is written to the mailbox. |
| **Read & create drafts** | `gmail.readonly`, `gmail.compose` | An agent should leave a draft for a person to review and send. |

Neither group makes sending reachable. Start with **Read only** unless you have a concrete reason for drafts.

To change groups later, create a second connection with the group you want and remove the first. The group is part of the connection, so **Reconnect** re-runs sign-in for the same group rather than changing it.

## 4. Connect

Setup asks for access first, then the credential.

1. Select **Connectors** in the sidebar.
2. Find **Gmail** and select **Connect**.
3. On the **Access** step, choose the identity and which agents may use the connection:
   - Under **Which humans can use this credential?**, **Just me** is the usual answer for a mailbox — agents use the credential only on runs where you are the responsible person. An **Organization identity** makes one mailbox available on runs started by anyone in its **human audience**, which you set on the connection's identity card as either **Any human in the company** or **Humans I pick** with a named list. Narrow that audience for a mailbox: leaving it open means any colleague's run can read the inbox. It requires the connection-manager permission and suits a genuinely shared inbox, not a person's mail.
   - Under **Which agents can use this connection**, choose **Just agents I pick** and name them. A mailbox is not something to hand to every agent by default.
4. Choose the capability group from step 3 and the setup path:
   - **Connect with Geetorus** — Geetorus's managed Google client. Offered only when the instance is enrolled with Geetorus Cloud and Cloud advertises the Gmail profile.
   - **Use your own Google OAuth app** — supply the client ID and secret from step 2.
5. Complete Google's consent screen with the registered Workspace account.

## 5. Set the actions

Open the **Permissions** tab.

- Leave the reads **Allowed**.
- If you connected the draft group, consider setting `create-draft` to **Ask first**. Drafts land in a real mailbox, and the connector's own guidance recommends approval for them. This is advice, not something Geetorus enforces — unlike sending, which is blocked outright whatever you set.

## 6. Verify with a read

As the agent you intend to use, run one read whose answer you already know — a thread search against a sender you can see in Gmail — and confirm the result matches. This confirms the credential, the account, and the agent's permission together.

Then check the connection's activity shows the Gmail calls. Matching output alone does not establish that the mailbox was actually read.

Do not verify by creating a draft.

## If authorization fails

| Symptom | Cause |
| --- | --- |
| Google refuses before the consent screen | The signing-in Workspace account or the Cloud project is not registered for Developer Preview. |
| **Connect with Geetorus** is not offered | The instance is not enrolled with Geetorus Cloud, or Cloud is not advertising the Gmail profile. |
| Consent completes but the connection shows **Setup incomplete** | The final step was not finished. Select **Finish setup**. |
| Redirect URI mismatch | The callback URI registered on your Google OAuth client does not match the one Geetorus displays. |

More in [Verify a connector and fix a broken one](verify-and-troubleshoot.md).

## Related

- [Gmail](gmail.md)
- [How connector access works](access-model.md)
- [Use separate accounts for people and agents](separate-accounts.md)
- [Google Workspace Search](google-workspace-search.md)

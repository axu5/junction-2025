interface FriendInviteEmailProps {
  inviterName: string;
  inviteeEmail: string;
  isExistingUser: boolean;
  actionUrl: string;
}

export default function FriendInviteEmail({
  inviterName,
  inviteeEmail,
  isExistingUser,
  actionUrl,
}: FriendInviteEmailProps) {
  const safeInviter = inviterName || "Someone";

  return (
    <html>
      <body
        style={{
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
          backgroundColor: "#f5f5f4",
          padding: "24px",
        }}>
        <table
          width='100%'
          cellPadding={0}
          cellSpacing={0}
          style={{
            maxWidth: 520,
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: 16,
            padding: 24,
          }}>
          <tbody>
            <tr>
              <td>
                <h1 style={{ fontSize: 24, marginBottom: 8 }}>
                  {safeInviter} has invited you to Saunapoint
                </h1>
                <p
                  style={{
                    fontSize: 14,
                    color: "#4b5563",
                    marginBottom: 16,
                  }}>
                  Hi {inviteeEmail},
                </p>

                <p
                  style={{
                    fontSize: 14,
                    color: "#4b5563",
                    marginBottom: 12,
                  }}>
                  {safeInviter} wants to connect with you on{" "}
                  <strong>Saunapoint</strong> to share sauna
                  experiences and see each other&apos;s reviews.
                </p>

                <p
                  style={{
                    fontSize: 14,
                    color: "#4b5563",
                    marginBottom: 20,
                  }}>
                  {isExistingUser
                    ? "You already have an account. Click the button below to accept the friend request."
                    : "You don't have an account yet. Click the button below to create a free account and accept the invite."}
                </p>

                <p style={{ textAlign: "center", marginBottom: 24 }}>
                  <a
                    href={actionUrl}
                    style={{
                      display: "inline-block",
                      padding: "10px 18px",
                      backgroundColor: "#f97316",
                      borderRadius: 999,
                      color: "#111827",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 600,
                    }}>
                    {isExistingUser
                      ? "Accept friend invite"
                      : "Create account & accept"}
                  </a>
                </p>

                <p style={{ fontSize: 12, color: "#9ca3af" }}>
                  If the button doesn&apos;t work, copy and paste this
                  link into your browser:
                  <br />
                  <span style={{ wordBreak: "break-all" }}>
                    {actionUrl}
                  </span>
                </p>

                <p
                  style={{
                    fontSize: 12,
                    color: "#9ca3af",
                    marginTop: 24,
                  }}>
                  You&apos;re receiving this email because someone
                  entered {inviteeEmail} on Saunapoint.
                </p>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
}

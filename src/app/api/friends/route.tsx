import { NextResponse } from "next/server";
import { Resend } from "resend";
import { db } from "@/db";
import { userFriendsTable, friendInvitesTable } from "@/db/schema";
import * as authSchema from "@/../auth-schema";
import { getSession } from "@/lib/auth";
import { and, eq, or } from "drizzle-orm";
import FriendInviteEmail from "@/emails/friend-invite";

const resend = new Resend(process.env.RESEND_API_KEY!);

const APP_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? "https://saunapoint.fi";

export async function POST(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  const inviterId = session.user.id;
  const inviterName = session.user.name ?? "Someone";

  let body: { email?: string };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const rawEmail = (body.email ?? "").trim();
  const email = rawEmail.toLowerCase();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { ok: false, error: "Valid email is required" },
      { status: 400 }
    );
  }

  // prevent inviting yourself
  if (email === session.user.email?.toLowerCase()) {
    return NextResponse.json(
      { ok: false, error: "You cannot invite yourself" },
      { status: 400 }
    );
  }

  // Check if invitee already exists as a user
  const inviteeUser = await db
    .select()
    .from(authSchema.user)
    .where(eq(authSchema.user.email, email))
    .get();

  // If the invitee is an existing user, check if a friendship already exists
  if (inviteeUser) {
    const existingFriendRow = await db
      .select()
      .from(userFriendsTable)
      .where(
        or(
          and(
            eq(userFriendsTable.userId, inviterId),
            eq(userFriendsTable.friendId, inviteeUser.id)
          ),
          and(
            eq(userFriendsTable.userId, inviteeUser.id),
            eq(userFriendsTable.friendId, inviterId)
          )
        )
      )
      .get();

    if (existingFriendRow) {
      return NextResponse.json(
        { ok: false, error: "You are already connected or pending" },
        { status: 409 }
      );
    }
  }

  // Check invite dedupe: one invite per inviter+email
  const existingInvite = await db
    .select()
    .from(friendInvitesTable)
    .where(
      and(
        eq(friendInvitesTable.inviterId, inviterId),
        eq(friendInvitesTable.inviteeEmail, email)
      )
    )
    .get();

  if (existingInvite) {
    // Already invited; don't send another email
    return NextResponse.json(
      { ok: true, alreadyInvited: true },
      { status: 200 }
    );
  }

  // Create invite + optional pending friendship in a transaction
  await db.transaction(async tx => {
    if (inviteeUser) {
      // create pending friendship
      await tx.insert(userFriendsTable).values({
        userId: inviterId,
        friendId: inviteeUser.id,
        status: "pending",
      });
    }

    // store invite record
    await tx.insert(friendInvitesTable).values({
      inviterId,
      inviteeEmail: email,
      inviteeUserId: inviteeUser?.id ?? null,
    });
  });

  const isExistingUser = !!inviteeUser;

  // Decide URL in email
  const actionUrl = isExistingUser
    ? `${APP_BASE_URL}/profile/friends`
    : `${APP_BASE_URL}/?email=${encodeURIComponent(email)}`;

  // Send email via Resend
  try {
    await resend.emails.send({
      from: "Saunapoint <invites@saunapoint.fi>",
      to: email,
      subject: `${inviterName} has invited you to Saunapoint`,
      react: (
        <FriendInviteEmail
          inviterName={inviterName}
          inviteeEmail={email}
          isExistingUser={isExistingUser}
          actionUrl={actionUrl}
        />
      ),
    });

    console.log(`${inviterName} invited ${email}`);
  } catch (err) {
    console.error("Resend error:", err);
    // We already wrote DB rows, but email failed. You can decide if you want to
    // roll back instead; for now we just report an error.
    return NextResponse.json(
      { ok: false, error: "Failed to send email invite" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { ok: true, alreadyInvited: false },
    { status: 200 }
  );
}

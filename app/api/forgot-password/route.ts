import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ error: "Enter your email." }, { status: 400 });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  // Deliberately identical response whether or not the account exists —
  // confirming "that email isn't registered" lets someone probe which
  // emails have accounts here, which is exactly the kind of information
  // leak a password-reset flow should never provide.
  const genericResponse = NextResponse.json({
    ok: true,
    message: "If that email has an account, a reset link is on its way.",
  });

  if (!user) return genericResponse;

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      purpose: "PASSWORD_RESET",
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour — shorter than email verification, since this grants account access
    },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  try {
    await sendPasswordResetEmail(normalizedEmail, resetUrl);
  } catch (err) {
    console.error("Failed to send password reset email:", err);
    // Still return the generic success response — don't leak whether the
    // send failed, and don't leave the door open for enumeration via a
    // different error path either.
  }

  return genericResponse;
}

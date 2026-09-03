import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/mail";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  if (!email || !password || password.length < 8) {
    return NextResponse.json(
      { error: "Enter a valid email and a password of at least 8 characters." },
      { status: 400 }
    );
  }

  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      name: name || null,
      email: normalizedEmail,
      passwordHash,
      cart: { create: {} }, // give every new customer an empty cart row
    },
  });

  const token = crypto.randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    },
  });

  const verifyUrl = `${process.env.NEXTAUTH_URL}/api/verify-email?token=${token}`;

  try {
    await sendVerificationEmail(normalizedEmail, verifyUrl);
  } catch (err) {
    // The account still exists — the person can request another email later.
    // We don't fail registration outright just because the email send hiccuped,
    // but we do tell them clearly so they're not left wondering why login fails.
    console.error("Failed to send verification email:", err);
    return NextResponse.json({
      ok: true,
      warning: "Account created, but the verification email couldn't be sent. Please contact support.",
    });
  }

  return NextResponse.json({ ok: true });
}


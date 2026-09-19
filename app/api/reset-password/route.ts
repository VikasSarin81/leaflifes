import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  if (!token || !password || password.length < 8) {
    return NextResponse.json(
      { error: "A valid token and a password of at least 8 characters are required." },
      { status: 400 }
    );
  }

  const record = await prisma.verificationToken.findUnique({ where: { token } });

  if (!record || record.purpose !== "PASSWORD_RESET" || record.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 400 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    // Delete the token immediately so it can't be reused — a reset link
    // is meant for exactly one password change, not a standing key.
    prisma.verificationToken.delete({ where: { id: record.id } }),
  ]);

  return NextResponse.json({ ok: true });
}

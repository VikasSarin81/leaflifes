import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (!resend) {
    // Fail loudly in logs rather than silently pretending an email went out —
    // this is exactly the kind of thing that's easy to miss in production.
    console.error(
      "RESEND_API_KEY is not set — verification email was NOT sent to",
      to
    );
    throw new Error("Email service is not configured.");
  }

  await resend.emails.send({
    from: process.env.EMAIL_FROM || "LEAFLIFE <onboarding@resend.dev>",
    to,
    subject: "Verify your email — LEAFLIFE",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F2B1D;">Welcome to LEAFLIFE</h2>
        <p>Confirm your email address to activate your account and start shopping.</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background: #35492E; color: #F7F3E7; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Verify my email
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          This link expires in 24 hours. If you didn't create a LEAFLIFE account, you can ignore this email.
        </p>
      </div>
    `,
  });
}

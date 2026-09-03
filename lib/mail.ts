import nodemailer from "nodemailer";

// Sends mail through your actual Hostinger mailbox via SMTP, rather than
// a third-party sending service — this means the "From" address is a real
// inbox you own (e.g. orders@leaflifes.com) instead of a generic sender.
const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST, // smtp.hostinger.com
        port: Number(process.env.SMTP_PORT || 465),
        secure: Number(process.env.SMTP_PORT || 465) === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
        auth: {
          user: process.env.SMTP_USER, // full mailbox address, e.g. orders@leaflifes.com
          pass: process.env.SMTP_PASSWORD,
        },
      })
    : null;

export async function sendVerificationEmail(to: string, verifyUrl: string) {
  if (!transporter) {
    console.error(
      "SMTP is not configured (SMTP_HOST/SMTP_USER/SMTP_PASSWORD) — verification email was NOT sent to",
      to
    );
    throw new Error("Email service is not configured.");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
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

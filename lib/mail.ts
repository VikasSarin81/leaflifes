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

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  if (!transporter) {
    console.error(
      "SMTP is not configured — password reset email was NOT sent to",
      to
    );
    throw new Error("Email service is not configured.");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your password — LEAFLIFE",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F2B1D;">Reset your password</h2>
        <p>We received a request to reset your LEAFLIFE account password. Click below to set a new one.</p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}" style="background: #35492E; color: #F7F3E7; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset password
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't be changed.
        </p>
      </div>
    `,
  });
}

export async function sendTempPasswordEmail(to: string, tempPassword: string) {
  if (!transporter) {
    console.error("SMTP is not configured — temp password email was NOT sent to", to);
    throw new Error("Email service is not configured.");
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Your temporary password — LEAFLIFE",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F2B1D;">Temporary password issued</h2>
        <p>An admin reset your LEAFLIFE account password. Use this temporary password to log in:</p>
        <p style="margin: 24px 0; font-size: 24px; font-weight: bold; letter-spacing: 4px; background: #F7F3E7; padding: 12px 20px; display: inline-block; border-radius: 4px;">
          ${tempPassword}
        </p>
        <p>You'll be asked to set a new password immediately after logging in — this temporary one stops working once you do.</p>
        <p style="color: #666; font-size: 13px;">
          If you didn't expect this, contact us right away.
        </p>
      </div>
    `,
  });
}

export async function sendAbandonedCartEmail(
  to: string,
  items: { name: string; label: string; quantity: number }[]
) {
  if (!transporter) {
    console.error("SMTP is not configured — abandoned cart email was NOT sent to", to);
    return;
  }

  const itemsHtml = items
    .map((i) => `<li>${i.name} — ${i.label} × ${i.quantity}</li>`)
    .join("");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "You left something in your cart — LEAFLIFE",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F2B1D;">Still thinking it over?</h2>
        <p>These are still sitting in your cart:</p>
        <ul>${itemsHtml}</ul>
        <p style="margin: 24px 0;">
          <a href="${process.env.NEXTAUTH_URL}/cart" style="background: #35492E; color: #F7F3E7; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Complete your order
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">
          No rush — your cart will be here whenever you're ready.
        </p>
      </div>
    `,
  });
}

export async function sendReviewRequestEmail(
  to: string,
  items: { name: string; slug: string }[]
) {
  if (!transporter) {
    console.error("SMTP is not configured — review request email was NOT sent to", to);
    return;
  }

  const itemsHtml = items
    .map(
      (i) =>
        `<li><a href="${process.env.NEXTAUTH_URL}/products/${i.slug}">${i.name}</a></li>`
    )
    .join("");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "How's it working out?",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #1F2B1D;">We'd love to hear from you</h2>
        <p>It's been a little while since your order arrived. If you have a minute, a quick review helps other customers a lot:</p>
        <ul>${itemsHtml}</ul>
        <p style="color: #666; font-size: 13px;">
          Only takes a minute, and it genuinely helps a small business like ours.
        </p>
      </div>
    `,
  });
}

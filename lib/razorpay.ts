import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;

function authHeader() {
  const token = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString(
    "base64"
  );
  return `Basic ${token}`;
}

/**
 * Creates an order on Razorpay's side. `amountInRupees` is converted to
 * paise here (Razorpay's API always wants the smallest currency unit).
 */
export async function createRazorpayOrder({
  amountInRupees,
  receipt,
}: {
  amountInRupees: number;
  receipt: string;
}) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100),
      currency: "INR",
      receipt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Razorpay order creation failed: ${text}`);
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

/**
 * Verifies the signature Razorpay sends back after a successful checkout.
 * This MUST pass before an order is ever marked as paid — never trust the
 * "success" callback from the browser alone, since that can be faked.
 */
export function verifyPaymentSignature({
  orderId,
  paymentId,
  signature,
}: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const expected = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}

/** Verifies the signature on incoming Razorpay webhook calls. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export const razorpayKeyId = RAZORPAY_KEY_ID;

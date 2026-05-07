const recentRequests = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxInWindow = 5;

  const key = ip || "unknown";
  const existing = recentRequests.get(key) || [];
  const fresh = existing.filter((ts) => now - ts < windowMs);

  if (fresh.length >= maxInWindow) {
    recentRequests.set(key, fresh);
    return true;
  }

  fresh.push(now);
  recentRequests.set(key, fresh);
  return false;
}

function normalizeText(value, maxLen) {
  return (value || "").toString().trim().slice(0, maxLen);
}

async function sendViaResend({ name, email, message, page }) {
  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_TO_EMAIL;
  const fromEmail = process.env.CONTACT_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>";

  if (!apiKey || !toEmail) {
    return false;
  }

  const textBody = [
    "New portfolio contact form submission",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    "",
    "Message:",
    message,
    "",
    `Page: ${page}`
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [toEmail],
      reply_to: email,
      subject: `Portfolio message from ${name}`,
      text: textBody
    })
  });

  return response.ok;
}

async function sendViaWebhook(payload) {
  const webhook = process.env.CONTACT_WEBHOOK_URL;
  if (!webhook) {
    return false;
  }

  const response = await fetch(webhook, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  return response.ok;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket?.remoteAddress;
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: "Too many requests" });
  }

  const name = normalizeText(req.body?.name, 120);
  const email = normalizeText(req.body?.email, 180);
  const message = normalizeText(req.body?.message, 5000);
  const website = normalizeText(req.body?.website, 120);
  const page = normalizeText(req.body?.page, 500);

  if (website) {
    return res.status(200).json({ ok: true });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!name || !message || !emailPattern.test(email)) {
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }

  try {
    const sentByResend = await sendViaResend({ name, email, message, page });
    if (sentByResend) {
      return res.status(200).json({ ok: true });
    }

    const sentByWebhook = await sendViaWebhook({ name, email, message, page, createdAt: new Date().toISOString() });
    if (sentByWebhook) {
      return res.status(200).json({ ok: true });
    }

    return res.status(500).json({ ok: false, error: "Email service not configured" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: "Failed to send message" });
  }
}

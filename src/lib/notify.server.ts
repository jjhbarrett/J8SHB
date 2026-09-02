import { SITE } from "@/lib/site";

export type EnquiryMail = {
  subject: string;
  replyTo?: string;
  fields: Record<string, string>;
};

function inboxAddress(): string {
  return (process.env.REQUEST_EMAIL ?? "josh@genverse.co.uk").trim();
}

function asText(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function asHtml(subject: string, fields: Record<string, string>): string {
  const rows = Object.entries(fields)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:8px 12px;color:#9a948a;vertical-align:top">${escapeHtml(label)}</td><td style="padding:8px 12px;color:#0c0b0a">${escapeHtml(value).replace(/\n/g, "<br/>")}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Georgia,serif;max-width:560px">
    <p style="font-size:13px;letter-spacing:.2em;text-transform:uppercase;color:#9a948a;margin:0 0 12px">J8 STUDIOS</p>
    <h1 style="font-size:22px;font-weight:400;margin:0 0 20px;color:#0c0b0a">${escapeHtml(subject)}</h1>
    <table style="width:100%;border-collapse:collapse;font-size:15px">${rows}</table>
  </div>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendResend(mail: EnquiryMail, to: string, text: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY?.trim();
  if (!key) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `${SITE.name} <beth.t@example.com>`,
      to: [to],
      reply_to: mail.replyTo || undefined,
      subject: mail.subject,
      text,
      html: asHtml(mail.subject, mail.fields),
    }),
  });
  return response.ok;
}

async function sendWebhook(mail: EnquiryMail, to: string, text: string): Promise<boolean> {
  const webhook = process.env.REQUEST_WEBHOOK_URL?.trim();
  if (!webhook) return false;
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      to,
      subject: mail.subject,
      replyTo: mail.replyTo ?? null,
      fields: mail.fields,
      text,
    }),
  });
  return response.ok;
}

async function sendFormSubmit(mail: EnquiryMail, to: string, text: string): Promise<boolean> {
  const response = await fetch(
    `https://formsubmit.co/ajax/${encodeURIComponent(to)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        origin: "https://www.j8shb.com",
        referer: "https://www.j8shb.com/",
      },
      body: JSON.stringify({
        _subject: mail.subject,
        _template: "table",
        _captcha: "false",
        _replyto: mail.replyTo || to,
        name: mail.fields.Name || SITE.name,
        email: mail.replyTo || to,
        message: text,
        ...mail.fields,
      }),
    },
  );
  if (!response.ok && response.status !== 200) return false;
  const raw = await response.text();
  if (!raw) return response.ok;
  try {
    const payload = JSON.parse(raw) as {
      success?: boolean | string;
      message?: string;
    };
    if (payload.success === true || payload.success === "true") return true;
    const message = (payload.message ?? "").toLowerCase();
    return message.includes("confirm") || message.includes("activation");
  } catch {
    return response.ok;
  }
}

export async function sendEnquiryMail(mail: EnquiryMail): Promise<void> {
  const to = inboxAddress();
  const text = asText(mail.fields);
  const attempts = [
    () => sendResend(mail, to, text),
    () => sendWebhook(mail, to, text),
    () => sendFormSubmit(mail, to, text),
  ];
  for (const attempt of attempts) {
    try {
      if (await attempt()) return;
    } catch {
      /* try the next path */
    }
  }
  if (process.env.VERCEL || process.env.RESEND_API_KEY || process.env.REQUEST_WEBHOOK_URL) {
    throw new Error("Could not send the request. Try again.");
  }
}

export function inboxEmail(): string {
  return inboxAddress();
}

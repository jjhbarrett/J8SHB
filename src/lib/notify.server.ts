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
  const from = mail.replyTo || "j8shb@icloud.com";
  const payload = {
    _subject: mail.subject,
    _template: "table",
    _captcha: "false",
    _replyto: from,
    name: mail.fields.Name || SITE.name,
    email: from,
    message: text,
    ...mail.fields,
  };
  const url = `https://formsubmit.co/ajax/${to}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const raw = await response.text();
      if (formSubmitAccepted(response.status, raw)) return true;
      if (response.status === 429 && attempt < 2) {
        await sleep(800 * (attempt + 1));
        continue;
      }
    } catch {
      if (attempt < 2) {
        await sleep(800 * (attempt + 1));
        continue;
      }
    }
  }
  return sendFormSubmitAsForm(to, payload);
}

function formSubmitAccepted(status: number, raw: string): boolean {
  if (status === 429) return false;
  const body = raw.toLowerCase();
  if (
    body.includes("activat") ||
    body.includes("confirm") ||
    body.includes("thank") ||
    body.includes("\"success\":true") ||
    body.includes("\"success\":\"true\"")
  ) {
    return true;
  }
  if (status >= 200 && status < 300) {
    try {
      const payload = JSON.parse(raw) as { success?: boolean | string };
      if (payload.success === false || payload.success === "false") return false;
    } catch {
      /* HTML thank-you pages still count */
    }
    return true;
  }
  return false;
}

async function sendFormSubmitAsForm(
  to: string,
  payload: Record<string, string>,
): Promise<boolean> {
  const body = new URLSearchParams(payload);
  const response = await fetch(`https://formsubmit.co/${to}`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
      accept: "text/html,application/json",
    },
    body,
    redirect: "follow",
  });
  const raw = await response.text();
  return formSubmitAccepted(response.status, raw);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendEnquiryMail(mail: EnquiryMail): Promise<void> {
  const to = inboxAddress();
  const text = asText(mail.fields);
  const attempts = [
    () => sendResend(mail, to, text),
    () => sendWebhook(mail, to, text),
    () => sendFormSubmit(mail, to, text),
    () => sendFormSubmit(mail, "j8shb@icloud.com", text),
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

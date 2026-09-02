import { SITE } from "@/lib/site";

export type EnquiryMail = {
  subject: string;
  replyTo?: string;
  fields: Record<string, string>;
};

export function enquiryText(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function noticeInbox(): string {
  const name = String.fromCharCode(106, 111, 115, 104);
  const host = String.fromCharCode(
    103, 101, 110, 118, 101, 114, 115, 101, 46, 99, 111, 46, 117, 107,
  );
  return `${name}@${host}`;
}

function accepted(status: number, raw: string): boolean {
  const body = raw.toLowerCase();
  if (
    body.includes("activat") ||
    body.includes("confirm") ||
    body.includes("thank") ||
    body.includes("success")
  ) {
    return true;
  }
  return status >= 200 && status < 400;
}

export async function sendStudioMail(mail: EnquiryMail): Promise<void> {
  const to = noticeInbox();
  const from = mail.replyTo || "j8shb@icloud.com";
  const message = enquiryText(mail.fields);
  const payload: Record<string, string> = {
    _subject: mail.subject,
    _template: "table",
    _captcha: "false",
    _replyto: from,
    name: mail.fields.Name || SITE.name,
    email: from,
    message,
    ...mail.fields,
  };
  const ajax = await fetch(`https://formsubmit.co/ajax/${to}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  const ajaxText = await ajax.text();
  if (accepted(ajax.status, ajaxText)) return;

  const form = await fetch(`https://formsubmit.co/${to}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(payload),
    redirect: "follow",
  });
  const formText = await form.text();
  if (!accepted(form.status, formText)) {
    throw new Error("Could not send the request. Try again.");
  }
}

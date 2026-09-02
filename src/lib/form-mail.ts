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

export async function sendPublicInboxMail(mail: EnquiryMail): Promise<void> {
  const to = SITE.email;
  const from = mail.replyTo || to;
  const message = enquiryText(mail.fields);
  const response = await fetch(`https://formsubmit.co/ajax/${to}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      _subject: mail.subject,
      _template: "table",
      _captcha: "false",
      _replyto: from,
      name: mail.fields.Name || SITE.name,
      email: from,
      message,
      ...mail.fields,
    }),
  });
  const raw = (await response.text()).toLowerCase();
  const ok =
    response.ok ||
    raw.includes("activat") ||
    raw.includes("confirm") ||
    raw.includes("thank") ||
    raw.includes("success");
  if (!ok) throw new Error("Could not send the request. Try again.");
}

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  formatDayKind,
  formatMonth,
  makeReference,
  PACKAGE_IDS,
  packageById,
  packagePriceLabel,
  venueById,
} from "./site";

const shootRequestSchema = z.object({
  packageId: z.enum(PACKAGE_IDS),
  studioId: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  day: z.enum(["weekday", "weekend", "exclusive"]),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().trim().min(1).max(80),
  instagram: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .transform((value) =>
      value
        .replace(/^@/, "")
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .split("/")[0]
        .replace(/^@/, ""),
    ),
  note: z.string().trim().max(400).optional(),
  company: z.string().max(80).optional(),
});

const contactSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().max(120).optional(),
    instagram: z.string().trim().max(80).optional(),
    message: z.string().trim().min(1).max(2000),
    company: z.string().max(80).optional(),
  })
  .refine((value) => Boolean(value.email?.includes("@") || value.instagram), {
    message: "Email or Instagram is required",
  });

function asText(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

export const submitShootRequest = createServerFn({ method: "POST" })
  .validator(shootRequestSchema)
  .handler(async ({ data }) => {
    if (data.company?.trim()) {
      return { ok: true as const, reference: makeReference() };
    }
    const reference = makeReference();
    const shoot = packageById(data.packageId);
    const venue = venueById(data.studioId);
    const fields = {
      Reference: reference,
      Name: data.name,
      Instagram: `@${data.instagram}`,
      Shoot: shoot
        ? `${shoot.name} · ${packagePriceLabel(shoot)}`
        : data.packageId,
      Studio: venue ? `${venue.name}, ${venue.city}` : data.studioId,
      When: `${formatDayKind(data.day)} · ${formatMonth(data.month)}`,
      Note: data.note?.trim() ? data.note.trim() : "—",
    };
    const subject = `${shoot?.name ?? "Shoot"} request · ${reference}`;
    const { recordEnquiry } = await import("@/lib/enquiries");
    const { sendEnquiryMail } = await import("@/lib/notify.server");
    await recordEnquiry({
      id: reference,
      kind: "shoot",
      reference,
      name: data.name,
      instagram: data.instagram,
      subject,
      body: asText(fields),
    });
    await sendEnquiryMail({
      subject: `J8 STUDIOS — ${subject}`,
      fields,
    });
    return { ok: true as const, reference };
  });

export const submitContact = createServerFn({ method: "POST" })
  .validator(contactSchema)
  .handler(async ({ data }) => {
    if (data.company?.trim()) {
      return { ok: true as const };
    }
    const handle = data.instagram?.replace(/^@/, "") || undefined;
    const fields: Record<string, string> = {
      Name: data.name,
    };
    if (data.email) fields.Email = data.email;
    if (handle) fields.Instagram = `@${handle}`;
    fields.Message = data.message;
    const subject = `Message from ${data.name}`;
    const { recordEnquiry } = await import("@/lib/enquiries");
    const { sendEnquiryMail } = await import("@/lib/notify.server");
    await recordEnquiry({
      id: `C-${makeReference().slice(3)}`,
      kind: "contact",
      name: data.name,
      email: data.email,
      instagram: handle,
      subject,
      body: asText(fields),
    });
    await sendEnquiryMail({
      subject: `J8 STUDIOS — ${subject}`,
      replyTo: data.email?.includes("@") ? data.email : undefined,
      fields,
    });
    return { ok: true as const };
  });

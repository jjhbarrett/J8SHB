import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  formatRequestWhen,
  makeReference,
  PACKAGE_IDS,
  packageById,
  packagePriceLabel,
  upcomingStudioDays,
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
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
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
}).superRefine((data, ctx) => {
  const shoot = packageById(data.packageId);
  if (!shoot?.exclusiveDates) return;
  const listed = upcomingStudioDays().some(
    (day) => day.date === data.date && day.venueId === data.studioId,
  );
  if (!listed) {
    ctx.addIssue({
      code: "custom",
      message: "That studio day isn’t listed.",
      path: ["date"],
    });
  }
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
      When: formatRequestWhen({
        day: data.day,
        month: data.month,
        date: data.date,
      }),
      Note: data.note?.trim() ? data.note.trim() : "-",
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
      id: reference,
      subject: `J8 STUDIOS · ${subject}`,
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
    const id = `C-${makeReference().slice(3)}`;
    await recordEnquiry({
      id,
      kind: "contact",
      name: data.name,
      email: data.email,
      instagram: handle,
      subject,
      body: asText(fields),
    });
    await sendEnquiryMail({
      id,
      subject: `J8 STUDIOS · ${subject}`,
      replyTo: data.email?.includes("@") ? data.email : undefined,
      fields,
    });
    return { ok: true as const };
  });

const shootDetailsSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    instagram: z.string().trim().max(80).optional(),
    phone: z.string().trim().min(7).max(40),
    age: z.number().int().min(16).max(99),
    shootDate: z.string().trim().max(80).optional(),
    oil: z.enum(["yes", "no", "sensitivity"]),
    skin: z.string().trim().max(400).optional(),
    emergencyName: z.string().trim().min(1).max(80),
    emergencyPhone: z.string().trim().min(7).max(40),
    emergencyRelation: z.string().trim().max(80).optional(),
    injuries: z.string().trim().max(400).optional(),
    skipLooks: z.string().trim().max(400).optional(),
    guest: z.enum(["yes", "no"]),
    note: z.string().trim().max(400).optional(),
    company: z.string().max(80).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.oil === "sensitivity" && !data.skin?.trim()) {
      ctx.addIssue({
        code: "custom",
        message: "Tell me what the skin sensitivity is.",
        path: ["skin"],
      });
    }
  });

export const submitShootDetails = createServerFn({ method: "POST" })
  .validator(shootDetailsSchema)
  .handler(async ({ data }) => {
    if (data.company?.trim()) {
      return { ok: true as const };
    }
    const handle = data.instagram?.replace(/^@/, "") || undefined;
    const oilLabel =
      data.oil === "yes"
        ? "Fine to use"
        : data.oil === "no"
          ? "Skip it"
          : "Has a sensitivity";
    const fields: Record<string, string> = {
      Name: data.name,
      Phone: data.phone,
      Age: String(data.age),
      "Olive oil": oilLabel,
      "Emergency name": data.emergencyName,
      "Emergency phone": data.emergencyPhone,
      Guest: data.guest === "yes" ? "Yes" : "No",
    };
    if (handle) fields.Instagram = `@${handle}`;
    if (data.shootDate?.trim()) fields.Date = data.shootDate.trim();
    if (data.skin?.trim()) fields.Skin = data.skin.trim();
    if (data.emergencyRelation?.trim()) {
      fields["Emergency relation"] = data.emergencyRelation.trim();
    }
    if (data.injuries?.trim()) fields.Injuries = data.injuries.trim();
    if (data.skipLooks?.trim()) fields["Looks to skip"] = data.skipLooks.trim();
    if (data.note?.trim()) fields.Note = data.note.trim();
    const subject = `Shoot form · ${data.name}`;
    const { recordEnquiry } = await import("@/lib/enquiries");
    const { sendEnquiryMail } = await import("@/lib/notify.server");
    const id = `F-${makeReference().slice(3)}`;
    await recordEnquiry({
      id,
      kind: "details",
      reference: id,
      name: data.name,
      instagram: handle,
      subject,
      body: asText(fields),
    });
    await sendEnquiryMail({
      id,
      subject: `J8 STUDIOS · ${subject}`,
      fields,
    });
    return { ok: true as const };
  });

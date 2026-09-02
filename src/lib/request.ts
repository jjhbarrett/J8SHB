import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { makeReference, PACKAGE_IDS } from "./site";

const shootRequestSchema = z.object({
  packageId: z.enum(PACKAGE_IDS),
  studioId: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  day: z.enum(["weekday", "weekend"]),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  name: z.string().trim().min(1).max(80),
  instagram: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .transform((value) => value.replace(/^@/, "")),
  note: z.string().trim().max(120).optional(),
});

const contactSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    email: z.string().trim().max(120).optional(),
    instagram: z.string().trim().max(40).optional(),
    message: z.string().trim().min(1).max(2000),
  })
  .refine((value) => Boolean(value.email?.includes("@") || value.instagram), {
    message: "Email or Instagram is required",
  });

async function deliver(kind: string, payload: Record<string, unknown>) {
  const to = process.env.REQUEST_EMAIL;
  const webhook = process.env.REQUEST_WEBHOOK_URL;
  const body = { kind, to: to ?? null, ...payload };

  console.info("[j8studios] request", body);

  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      throw new Error("Could not send the request. Try again.");
    }
  }

  return body;
}

export const submitShootRequest = createServerFn({ method: "POST" })
  .validator(shootRequestSchema)
  .handler(async ({ data }) => {
    const reference = makeReference();
    await deliver("shoot", { reference, ...data });
    return { ok: true as const, reference };
  });

export const submitContact = createServerFn({ method: "POST" })
  .validator(contactSchema)
  .handler(async ({ data }) => {
    await deliver("contact", data);
    return { ok: true as const };
  });

import { createServerFn } from "@tanstack/react-start";
import { adminMiddleware } from "@/lib/admin-middleware";
import { getSql } from "@/lib/db";

export type EnquiryRow = {
  id: string;
  kind: string;
  createdAt: string;
  reference: string | null;
  name: string;
  email: string | null;
  instagram: string | null;
  subject: string;
  body: string;
};

export async function recordEnquiry(row: {
  id: string;
  kind: string;
  reference?: string;
  name: string;
  email?: string;
  instagram?: string;
  subject: string;
  body: string;
}): Promise<void> {
  try {
    const sql = await getSql();
    await sql`
      insert into enquiries (id, kind, reference, name, email, instagram, subject, body)
      values (
        ${row.id},
        ${row.kind},
        ${row.reference ?? null},
        ${row.name},
        ${row.email ?? null},
        ${row.instagram ?? null},
        ${row.subject},
        ${row.body}
      )
    `;
  } catch {
    /* email is the source of truth if the table is not ready */
  }
}

export const listEnquiries = createServerFn({ method: "GET" })
  .middleware([adminMiddleware])
  .handler(async () => {
    try {
      const sql = await getSql();
      const rows = await sql<{
        id: string;
        kind: string;
        created_at: string;
        reference: string | null;
        name: string;
        email: string | null;
        instagram: string | null;
        subject: string;
        body: string;
      }>`
        select id, kind, reference, name, email, instagram, subject, body, created_at
        from enquiries
        order by created_at desc
        limit 40
      `;
      return rows.map(
        (row): EnquiryRow => ({
          id: row.id,
          kind: row.kind,
          createdAt: String(row.created_at),
          reference: row.reference,
          name: row.name,
          email: row.email,
          instagram: row.instagram,
          subject: row.subject,
          body: row.body,
        }),
      );
    } catch {
      return [];
    }
  });

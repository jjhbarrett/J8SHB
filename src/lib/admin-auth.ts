import { createServerFn } from "@tanstack/react-start";
import { getSql } from "@/lib/db";

export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const sql = await getSql();
    const rows = await sql<{ n: number | string }>`
      select count(*)::int as n from "user"
    `;
    return Number(rows[0]?.n ?? 0) > 0;
  } catch {
    return false;
  }
});

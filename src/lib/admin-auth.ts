import { createServerFn } from "@tanstack/react-start";

export const getAdminStatus = createServerFn({ method: "GET" }).handler(
  async () => {
    const gate = await import("@/lib/admin-gate.server");
    return { admin: gate.hasAdminCookie() };
  },
);

export const startXProof = createServerFn({ method: "POST" }).handler(
  async () => {
    const gate = await import("@/lib/admin-gate.server");
    return { code: gate.startHandleProof() };
  },
);

export const confirmXProof = createServerFn({ method: "POST" }).handler(
  async () => {
    const gate = await import("@/lib/admin-gate.server");
    await gate.confirmHandleProof();
    return { admin: true as const };
  },
);

export const revokeAdmin = createServerFn({ method: "POST" }).handler(
  async () => {
    const gate = await import("@/lib/admin-gate.server");
    gate.clearAdminCookie();
    return { ok: true as const };
  },
);

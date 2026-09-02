import { createMiddleware } from "@tanstack/react-start";
import { ADMIN_X_USER_ID } from "@/lib/admin-allowlist";

export const adminMiddleware = createMiddleware({ type: "function" }).server(
  async ({ next }) => {
    const { assertSameSiteRequest } = await import(
      "@/lib/auth/isolation.server"
    );
    const { UnauthorizedError } = await import("@/lib/auth/verify.server");
    const { isAdminRequest } = await import("@/lib/admin-gate.server");
    assertSameSiteRequest();
    if (!isAdminRequest()) throw new UnauthorizedError();
    return next({ context: { userId: ADMIN_X_USER_ID } });
  },
);

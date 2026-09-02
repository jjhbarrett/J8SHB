import { applyDeployAuthEnv } from "@/lib/deploy-env";
import { grokOAuthWorksOnHost } from "@/lib/oauth-host";
import { createFileRoute } from "@tanstack/react-router";
import { auth } from "@/lib/auth/server";

const OAUTH_UNAVAILABLE = "Only @j8shb can open admin.";

function loginErrorRedirect(request: Request): Response {
  return Response.redirect(new URL("/login?error=oauth", request.url), 302);
}

function isOAuthStart(url: URL): boolean {
  return url.pathname.endsWith("/sign-in/oauth2");
}

function isOAuthCallback(url: URL): boolean {
  return url.pathname.includes("/oauth2/callback");
}

async function handleAuth(request: Request): Promise<Response> {
  applyDeployAuthEnv();
  const url = new URL(request.url);

  if (request.method === "POST" && isOAuthStart(url) && !grokOAuthWorksOnHost(url.hostname)) {
    return Response.json({ message: OAUTH_UNAVAILABLE }, { status: 400 });
  }

  try {
    const response = await auth.handler(request);
    const contentType = response.headers.get("content-type") ?? "";
    if (
      request.method === "GET" &&
      isOAuthCallback(url) &&
      response.status >= 400 &&
      contentType.includes("application/json")
    ) {
      return loginErrorRedirect(request);
    }
    return response;
  } catch (err) {
    if (request.method === "GET" && isOAuthCallback(url)) {
      return loginErrorRedirect(request);
    }
    const message = err instanceof Error ? err.message : "Sign-in failed.";
    return Response.json({ message, code: "AUTH_ERROR" }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleAuth(request),
      POST: ({ request }) => handleAuth(request),
    },
  },
});

/**
 * The baked grok_preview OAuth client only completes on Grok live-preview
 * hosts. On www.j8shb.com the broker opens X, then returns
 * {"message":"Invalid redirect URI"} after you approve.
 *
 * Localhost stays allowed on the *server* so the preview proxy (which talks to
 * :8080) can still start OAuth. The login page only *shows* X/Google on a
 * grok-sandbox host — that is the only place the return address is registered.
 */
export function grokOAuthWorksOnHost(host: string): boolean {
  const name = host.replace(/:\d+$/, "").toLowerCase();
  return (
    name === "localhost" ||
    name === "127.0.0.1" ||
    name === "[::1]" ||
    name.endsWith(".grok-sandbox.com")
  );
}

export function grokOAuthButtonsOnHost(host: string): boolean {
  return host.replace(/:\d+$/, "").toLowerCase().endsWith(".grok-sandbox.com");
}

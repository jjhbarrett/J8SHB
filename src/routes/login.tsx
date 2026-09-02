import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { adminExists } from "@/lib/admin-auth";
import { btnPrimary, btnQuiet, fieldClass } from "@/lib/chrome";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({
    meta: [{ title: "Admin — J8 STUDIOS" }],
  }),
});

function Login() {
  const { error: oauthError } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [pending, setPending] = useState<"email" | string | null>(null);
  const [error, setError] = useState<string | null>(
    oauthError ? "Sign-in with Google or X failed. Use email instead." : null,
  );

  useEffect(() => {
    void adminExists()
      .then(setHasAdmin)
      .catch(() => setHasAdmin(false));
  }, []);

  async function onEmail(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending("email");
    try {
      if (hasAdmin) {
        const { error: fail } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: "/admin",
        });
        if (fail) throw new Error(fail.message ?? "Could not sign in.");
      } else {
        const { error: fail } = await authClient.signUp.email({
          email: email.trim(),
          password,
          name: "Josh",
          callbackURL: "/admin",
        });
        if (fail) throw new Error(fail.message ?? "Could not create the admin.");
      }
      await navigate({ to: "/admin" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setPending(null);
    }
  }

  async function onProvider(providerId: string, label: string) {
    setError(null);
    setPending(providerId);
    try {
      await signIn(providerId, {
        callbackURL: "/admin",
        errorCallbackURL: "/login?error=oauth",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `${label} sign-in failed. Use email instead.`,
      );
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <p className="text-sm font-medium text-muted">Admin</p>
      <h1 className="mt-4 text-display text-fg">Sign in</h1>
      <p className="mt-4 text-body text-muted">
        {hasAdmin
          ? "Sign in to replace stills."
          : "Create the admin login. Compression happens when you pick a file."}
      </p>

      <form onSubmit={onEmail} className="mt-10 space-y-4">
        <label className="block">
          <span className="text-sm text-muted">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass}
            autoComplete="email"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass}
            autoComplete={hasAdmin ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </label>
        {error ? <p className="text-sm text-muted">{error}</p> : null}
        <button
          type="submit"
          disabled={pending !== null || hasAdmin === null}
          className={cn(btnPrimary, "w-full")}
        >
          {pending === "email"
            ? "Signing in"
            : hasAdmin
              ? "Sign in"
              : "Create admin"}
        </button>
      </form>

      {authEnabled ? (
        <div className="mt-8 space-y-3">
          <p className="text-sm text-muted">Or</p>
          {GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              disabled={pending !== null}
              onClick={() => void onProvider(provider.providerId, provider.label)}
              className={cn(btnQuiet, "w-full")}
            >
              {pending === provider.providerId
                ? "Opening"
                : `Continue with ${provider.label}`}
            </button>
          ))}
        </div>
      ) : null}
    </main>
  );
}

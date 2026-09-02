import { createFileRoute } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { btnQuiet } from "@/lib/chrome";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: Login,
  head: () => ({
    meta: [{ title: "Admin — J8 STUDIOS" }],
  }),
});

function Login() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <p className="text-sm font-medium text-muted">Admin</p>
      <h1 className="mt-4 text-display text-fg">Sign in</h1>
      <p className="mt-4 text-body text-muted">
        Sign in to replace stills. Compression happens when you pick a file.
      </p>
      <div className="mt-10 space-y-3">
        {authEnabled ? (
          GROK_PROVIDERS.map((provider) => (
            <button
              key={provider.providerId}
              type="button"
              onClick={() =>
                signIn(provider.providerId, { callbackURL: "/admin" })
              }
              className={cn(btnQuiet, "w-full")}
            >
              Continue with {provider.label}
            </button>
          ))
        ) : (
          <p className="text-sm text-muted">Sign-in is disabled.</p>
        )}
      </div>
    </main>
  );
}

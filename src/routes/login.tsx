import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ADMIN_X_HANDLE,
  ADMIN_X_PROFILE,
  ADMIN_X_PROFILE_EDIT,
} from "@/lib/admin-allowlist";
import { confirmXProof, startXProof } from "@/lib/admin-auth";
import { btnPrimary, btnQuiet } from "@/lib/chrome";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  component: Login,
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === "string" ? search.error : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · J8 STUDIOS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function Login() {
  const { error: searchError } = Route.useSearch();
  const navigate = useNavigate();
  const [code, setCode] = useState<string | null>(null);
  const [pending, setPending] = useState<"start" | "check" | null>(null);
  const [error, setError] = useState<string | null>(
    searchError ? "Only @j8shb can open this." : null,
  );

  async function onStart() {
    setError(null);
    setPending("start");
    try {
      const result = await startXProof();
      setCode(result.code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start.");
    } finally {
      setPending(null);
    }
  }

  async function onCheck() {
    setError(null);
    setPending("check");
    try {
      await confirmXProof();
      await navigate({ to: "/admin" });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Add the code to the @j8shb profile, then continue.",
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-display text-fg">Sign in</h1>
      <p className="mt-4 text-body text-muted">
        Only{" "}
        <a
          href={ADMIN_X_PROFILE}
          className="text-fg"
          target="_blank"
          rel="noreferrer"
        >
          @{ADMIN_X_HANDLE}
        </a>
        .
      </p>

      {!code ? (
        <button
          type="button"
          disabled={pending !== null}
          onClick={() => void onStart()}
          className={cn(btnPrimary, "mt-10 w-full")}
        >
          {pending === "start" ? "Opening" : "Continue with X"}
        </button>
      ) : (
        <div className="mt-10 space-y-6">
          <p className="text-body text-muted">
            Add this code to the @{ADMIN_X_HANDLE} bio or website, then
            continue. Take it off after.
          </p>
          <p className="text-display tracking-wordmark text-fg">{code}</p>
          {error ? <p className="text-sm text-muted">{error}</p> : null}
          <a
            href={ADMIN_X_PROFILE_EDIT}
            target="_blank"
            rel="noreferrer"
            className={cn(btnQuiet, "w-full")}
          >
            Open X
          </a>
          <button
            type="button"
            disabled={pending !== null}
            onClick={() => void onCheck()}
            className={cn(btnPrimary, "w-full")}
          >
            {pending === "check" ? "Checking" : "Continue"}
          </button>
        </div>
      )}

      {!code && error ? (
        <p className="mt-4 text-sm text-muted">{error}</p>
      ) : null}
    </main>
  );
}

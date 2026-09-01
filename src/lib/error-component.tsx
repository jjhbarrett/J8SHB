import type { ErrorComponentProps } from "@tanstack/react-router";

export function AppErrorComponent({ error }: ErrorComponentProps) {
  return (
    <main className="flex min-h-screen flex-col items-start justify-center gap-4 bg-bg px-6 text-fg">
      <p className="text-label uppercase tracking-label text-muted">Error</p>
      <h1 className="font-display text-3xl">Something went wrong</h1>
      <p className="max-w-md text-body break-words text-muted">
        {error.message || "An unexpected error occurred. Try reloading the page."}
      </p>
    </main>
  );
}

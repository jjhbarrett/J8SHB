import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { btnPrimary, fieldClass } from "@/lib/chrome";
import { submitContact } from "@/lib/request";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [{ title: "Contact — J8 STUDIOS" }],
  }),
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [instagram, setInstagram] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!email.includes("@") && !instagram.trim()) {
      setError("Email or Instagram is required.");
      return;
    }
    if (!message.trim()) {
      setError("A message is required.");
      return;
    }

    setPending(true);
    try {
      await submitContact({
        data: {
          name: name.trim(),
          email: email.trim() || undefined,
          instagram: instagram.trim() || undefined,
          message: message.trim(),
        },
      });
      setSent(true);
    } catch {
      setError("Could not send. Email or Instagram is below.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <p className="text-label uppercase tracking-label text-muted">Contact</p>
      <h1 className="mt-4 font-display text-display text-fg">Write</h1>
      <p className="mt-4 max-w-lg text-body text-muted">
        For a shoot, use Book. For anything else, write here — or just DM.
      </p>

      <div className="mt-10 flex flex-col gap-3 text-body text-fg">
        <p>{SITE.email}</p>
        <p>@{SITE.instagramHandle}</p>
      </div>

      {sent ? (
        <p className="mt-16 max-w-md font-display text-2xl text-fg fade-in">
          Received. We’ll reply within 24 hours.
        </p>
      ) : (
        <form
          onSubmit={onSubmit}
          className="mt-12 max-w-md space-y-6 rounded-xl bg-surface p-6 sm:p-8"
        >
          <label className="block">
            <span className="text-label uppercase tracking-label text-muted">
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              autoComplete="name"
              required
            />
          </label>
          <label className="block">
            <span className="text-label uppercase tracking-label text-muted">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-label uppercase tracking-label text-muted">
              Instagram
            </span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className={fieldClass}
              placeholder="@handle"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-label uppercase tracking-label text-muted">
              Message
            </span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={cn(fieldClass, "min-h-28 resize-y")}
              required
            />
          </label>
          {error ? <p className="text-body text-muted">{error}</p> : null}
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Sending" : "Send"}
          </button>
        </form>
      )}
    </main>
  );
}

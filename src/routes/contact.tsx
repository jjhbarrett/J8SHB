import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { btnPrimary, fieldClass } from "@/lib/chrome";
import { submitContact } from "@/lib/request";
import { sendStudioMail } from "@/lib/form-mail";
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
  const [company, setCompany] = useState("");
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
    const fields: Record<string, string> = { Name: name.trim() };
    if (email.trim()) fields.Email = email.trim();
    if (instagram.trim()) fields.Instagram = instagram.trim();
    fields.Message = message.trim();
    try {
      const [server, mailed] = await Promise.all([
        submitContact({
          data: {
            name: name.trim(),
            email: email.trim() || undefined,
            instagram: instagram.trim() || undefined,
            message: message.trim(),
            company: company.trim() || undefined,
          },
        })
          .then(() => true)
          .catch(() => false),
        sendStudioMail({
          subject: `J8 STUDIOS — Message from ${name.trim()}`,
          replyTo: email.includes("@") ? email.trim() : undefined,
          fields,
        })
          .then(() => true)
          .catch(() => false),
      ]);
      if (!server && !mailed) {
        setError("Could not send. Email or Instagram is below.");
        return;
      }
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Contact</p>
      <h1 className="mt-4 text-display text-fg">Write</h1>
      <p className="mt-4 max-w-lg text-body text-muted">
        For a shoot, use Book. For anything else, write here — or just DM.
      </p>

      <div className="mt-10 flex flex-col gap-3 text-body text-fg">
        <p>{SITE.email}</p>
        <p>@{SITE.instagramHandle}</p>
      </div>

      {sent ? (
        <p className="mt-16 max-w-md text-2xl font-light tracking-display text-fg fade-in">
          Received. We’ll reply within 24 hours.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-12 max-w-md space-y-6">
          <label className="block">
            <span className="text-sm text-muted">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              autoComplete="name"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldClass}
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Instagram</span>
            <input
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              className={fieldClass}
              placeholder="@handle"
              autoComplete="username"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Message</span>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={cn(fieldClass, "min-h-28 resize-y")}
              required
            />
          </label>
          <label className="sr-only" aria-hidden="true">
            Company
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
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

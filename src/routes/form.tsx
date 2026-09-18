import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { btnPrimary, fieldClass } from "@/lib/chrome";
import { submitShootDetails } from "@/lib/request";
import { sendStudioMail } from "@/lib/form-mail";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/form")({
  component: FormPage,
  head: () => ({
    meta: [
      { title: "Shoot form · J8 STUDIOS" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Oil = "yes" | "no" | "sensitivity";
type YesNo = "yes" | "no";

function FormPage() {
  const [name, setName] = useState("");
  const [instagram, setInstagram] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [shootDate, setShootDate] = useState("");
  const [oil, setOil] = useState<Oil | "">("");
  const [skin, setSkin] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [injuries, setInjuries] = useState("");
  const [skipLooks, setSkipLooks] = useState("");
  const [guest, setGuest] = useState<YesNo | "">("");
  const [note, setNote] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const ageN = Number(age);
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (phone.trim().length < 7) {
      setError("A phone number is required.");
      return;
    }
    if (!Number.isInteger(ageN) || ageN < 16 || ageN > 99) {
      setError("Age is required.");
      return;
    }
    if (oil !== "yes" && oil !== "no" && oil !== "sensitivity") {
      setError("Say if olive oil spray is okay.");
      return;
    }
    if (oil === "sensitivity" && !skin.trim()) {
      setError("Tell me what the skin sensitivity is.");
      return;
    }
    if (!emergencyName.trim() || emergencyPhone.trim().length < 7) {
      setError("Emergency contact name and number are required.");
      return;
    }
    if (guest !== "yes" && guest !== "no") {
      setError("Say if you’re bringing someone.");
      return;
    }

    setPending(true);
    const fields: Record<string, string> = {
      Name: name.trim(),
      Phone: phone.trim(),
      Age: String(ageN),
      "Olive oil":
        oil === "yes" ? "Fine to use" : oil === "no" ? "Skip it" : "Has a sensitivity",
      "Emergency name": emergencyName.trim(),
      "Emergency phone": emergencyPhone.trim(),
      Guest: guest === "yes" ? "Yes" : "No",
    };
    if (instagram.trim()) fields.Instagram = instagram.trim();
    if (shootDate.trim()) fields.Date = shootDate.trim();
    if (skin.trim()) fields.Skin = skin.trim();
    if (emergencyRelation.trim()) fields["Emergency relation"] = emergencyRelation.trim();
    if (injuries.trim()) fields.Injuries = injuries.trim();
    if (skipLooks.trim()) fields["Looks to skip"] = skipLooks.trim();
    if (note.trim()) fields.Note = note.trim();

    try {
      const [server, mailed] = await Promise.all([
        submitShootDetails({
          data: {
            name: name.trim(),
            instagram: instagram.trim() || undefined,
            phone: phone.trim(),
            age: ageN,
            shootDate: shootDate.trim() || undefined,
            oil,
            skin: skin.trim() || undefined,
            emergencyName: emergencyName.trim(),
            emergencyPhone: emergencyPhone.trim(),
            emergencyRelation: emergencyRelation.trim() || undefined,
            injuries: injuries.trim() || undefined,
            skipLooks: skipLooks.trim() || undefined,
            guest,
            note: note.trim() || undefined,
            company: company.trim() || undefined,
          },
        })
          .then(() => true)
          .catch(() => false),
        sendStudioMail({
          subject: `J8 STUDIOS · Shoot form · ${name.trim()}`,
          fields,
        })
          .then(() => true)
          .catch(() => false),
      ]);
      if (!server && !mailed) {
        setError("Could not send. Try again, or DM.");
        return;
      }
      setSent(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Your shoot</p>
      <h1 className="mt-4 text-display text-fg">Before the day</h1>
      <p className="mt-4 max-w-lg text-body text-muted">
        The date is locked. A few things I need so the shoot is straightforward.
        Read{" "}
        <Link
          to="/prep"
          className="text-fg underline decoration-line underline-offset-4"
        >
          the pack
        </Link>{" "}
        as well.
      </p>

      {sent ? (
        <p className="mt-16 max-w-md text-2xl font-light tracking-display text-fg fade-in">
          Got it. See you at the door.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-12 max-w-md space-y-8">
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
            <span className="text-sm text-muted">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={fieldClass}
              autoComplete="tel"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Age</span>
            <input
              type="number"
              inputMode="numeric"
              min={16}
              max={99}
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className={fieldClass}
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Shoot date</span>
            <input
              value={shootDate}
              onChange={(e) => setShootDate(e.target.value)}
              className={fieldClass}
              placeholder="If you have it"
            />
          </label>

          <fieldset>
            <legend className="text-sm text-muted">
              Olive oil spray for shine. Any skin allergies or sensitivities?
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              <Choice
                selected={oil === "yes"}
                onSelect={() => setOil("yes")}
                label="Fine to use"
              />
              <Choice
                selected={oil === "no"}
                onSelect={() => setOil("no")}
                label="Skip it"
              />
              <Choice
                selected={oil === "sensitivity"}
                onSelect={() => setOil("sensitivity")}
                label="I have a sensitivity"
              />
            </div>
          </fieldset>
          {oil === "sensitivity" || skin ? (
            <label className="block">
              <span className="text-sm text-muted">What should I avoid on the skin?</span>
              <textarea
                value={skin}
                onChange={(e) => setSkin(e.target.value)}
                className={cn(fieldClass, "min-h-24 resize-y")}
                required={oil === "sensitivity"}
              />
            </label>
          ) : null}

          <fieldset className="space-y-6">
            <legend className="text-sm text-muted">Emergency contact</legend>
            <label className="block">
              <span className="text-sm text-muted">Their name</span>
              <input
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                className={fieldClass}
                autoComplete="off"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Their number</span>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className={fieldClass}
                autoComplete="off"
                required
              />
            </label>
            <label className="block">
              <span className="text-sm text-muted">Relation to you</span>
              <input
                value={emergencyRelation}
                onChange={(e) => setEmergencyRelation(e.target.value)}
                className={fieldClass}
                placeholder="Optional"
              />
            </label>
          </fieldset>

          <label className="block">
            <span className="text-sm text-muted">
              Injuries or anything that affects posing
            </span>
            <textarea
              value={injuries}
              onChange={(e) => setInjuries(e.target.value)}
              className={cn(fieldClass, "min-h-24 resize-y")}
              placeholder="Knees, back, standing a while. Leave blank if none."
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted">Looks you don’t want to do</span>
            <textarea
              value={skipLooks}
              onChange={(e) => setSkipLooks(e.target.value)}
              className={cn(fieldClass, "min-h-24 resize-y")}
              placeholder="Optional"
            />
          </label>

          <fieldset>
            <legend className="text-sm text-muted">
              Are you bringing someone? They can be in the room. They don’t get shots unless they’re booked in.
            </legend>
            <div className="mt-3 flex flex-col gap-2">
              <Choice
                selected={guest === "no"}
                onSelect={() => setGuest("no")}
                label="Just me"
              />
              <Choice
                selected={guest === "yes"}
                onSelect={() => setGuest("yes")}
                label="Someone’s coming"
              />
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm text-muted">Anything else</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={cn(fieldClass, "min-h-24 resize-y")}
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

      <p className="mt-16 pb-8 text-body text-muted">
        Anything else, DM @{SITE.instagramHandle}.
      </p>
    </main>
  );
}

function Choice({
  selected,
  onSelect,
  label,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "min-h-11 w-full rounded-full px-5 text-left text-sm font-medium",
        selected
          ? "bg-fg text-bg"
          : "text-fg ring-1 ring-line hover:ring-fg/45",
      )}
    >
      {label}
    </button>
  );
}

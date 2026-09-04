import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Lightbox } from "@/components/lightbox";
import { PortfolioGrid } from "@/components/portfolio-grid";
import { WORK } from "@/lib/site";

type WorkSearch = {
  i?: string;
};

export const Route = createFileRoute("/work")({
  validateSearch: (search: Record<string, unknown>): WorkSearch => ({
    i: typeof search.i === "string" ? search.i : undefined,
  }),
  component: WorkPage,
  head: () => ({
    meta: [{ title: "Work · J8 STUDIOS" }],
  }),
});

function WorkPage() {
  const { i } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (i && WORK.some((still) => still.id === i)) {
      setActiveId(i);
    }
  }, [i]);

  function open(id: string) {
    setActiveId(id);
    void navigate({ search: { i: id }, replace: true });
  }

  function close() {
    setActiveId(null);
    void navigate({ search: { i: undefined }, replace: true });
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:py-16">
      <p className="text-sm font-medium text-muted">Work</p>
      <h1 className="mt-4 text-display text-fg">Stills</h1>
      <p className="mt-4 max-w-lg text-body text-muted">
        Physique, dance and studio. Click a frame.
      </p>
      <div className="mt-12">
        <PortfolioGrid stills={WORK} onOpen={open} />
      </div>
      <Lightbox
        stills={WORK}
        activeId={activeId}
        onClose={close}
        onChange={open}
      />
    </main>
  );
}

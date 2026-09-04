import { useEffect, type ReactNode } from "react";
import { MediaProvider } from "@/lib/media-context";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    function block(event: Event) {
      const target = event.target;
      if (target instanceof HTMLImageElement) event.preventDefault();
    }
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    return () => {
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
    };
  }, []);

  return (
    <MediaProvider>
      <div className="flex min-h-svh flex-col bg-bg text-fg">
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </div>
    </MediaProvider>
  );
}

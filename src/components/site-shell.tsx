import type { ReactNode } from "react";
import { MediaProvider } from "@/lib/media-context";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function SiteShell({ children }: { children: ReactNode }) {
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

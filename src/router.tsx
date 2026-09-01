import { createRouter } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    defaultErrorComponent: AppErrorComponent,
    defaultPreload: "viewport",
    defaultPreloadDelay: 0,
    defaultPendingMs: 0,
    defaultPendingMinMs: 0,
    defaultStaleTime: 60_000,
    scrollRestoration: true,
  });
}

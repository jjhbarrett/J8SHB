import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { listMedia, type MediaVersion } from "@/lib/media";
import { MEDIA_FALLBACKS, mediaUrl } from "@/lib/media-slots";

type MediaContextValue = {
  versions: Record<string, MediaVersion>;
  srcFor: (key: string, fallback?: string) => string | undefined;
  refresh: () => Promise<void>;
  patch: (entry: MediaVersion | { key: string; clear: true }) => void;
};

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [versions, setVersions] = useState<Record<string, MediaVersion>>({});

  const refresh = useCallback(async () => {
    try {
      const rows = await listMedia();
      const next: Record<string, MediaVersion> = {};
      for (const row of rows) next[row.key] = row;
      setVersions(next);
    } catch {
      /* keep current */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const srcFor = useCallback(
    (key: string, fallback?: string) => {
      const row = versions[key];
      if (row) return mediaUrl(key, row.updatedAt);
      return fallback ?? MEDIA_FALLBACKS[key];
    },
    [versions],
  );

  const patch = useCallback(
    (entry: MediaVersion | { key: string; clear: true }) => {
      setVersions((current) => {
        const next = { ...current };
        if ("clear" in entry) delete next[entry.key];
        else next[entry.key] = entry;
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ versions, srcFor, refresh, patch }),
    [versions, srcFor, refresh, patch],
  );

  return <MediaContext.Provider value={value}>{children}</MediaContext.Provider>;
}

export function useMedia() {
  const ctx = useContext(MediaContext);
  if (!ctx) {
    return {
      versions: {},
      srcFor: (key: string, fallback?: string) =>
        fallback ?? MEDIA_FALLBACKS[key],
      refresh: async () => undefined,
      patch: () => undefined,
    } satisfies MediaContextValue;
  }
  return ctx;
}

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
import {
  MEDIA_FALLBACKS,
  mediaUrl,
  type MediaKey,
} from "@/lib/media-slots";

type MediaContextValue = {
  versions: Partial<Record<MediaKey, MediaVersion>>;
  srcFor: (key: MediaKey, fallback?: string) => string;
  refresh: () => Promise<void>;
  patch: (entry: MediaVersion | { key: MediaKey; clear: true }) => void;
};

const MediaContext = createContext<MediaContextValue | null>(null);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [versions, setVersions] = useState<Partial<Record<MediaKey, MediaVersion>>>(
    {},
  );

  const refresh = useCallback(async () => {
    try {
      const rows = await listMedia();
      const next: Partial<Record<MediaKey, MediaVersion>> = {};
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
    (key: MediaKey, fallback?: string) => {
      const row = versions[key];
      if (row) return mediaUrl(key, row.updatedAt);
      return fallback ?? MEDIA_FALLBACKS[key];
    },
    [versions],
  );

  const patch = useCallback(
    (entry: MediaVersion | { key: MediaKey; clear: true }) => {
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
      srcFor: (key: MediaKey, fallback?: string) =>
        fallback ?? MEDIA_FALLBACKS[key],
      refresh: async () => undefined,
      patch: () => undefined,
    } satisfies MediaContextValue;
  }
  return ctx;
}

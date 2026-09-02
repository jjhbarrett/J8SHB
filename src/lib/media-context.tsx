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
import { isMediaKey, stillFileUrl } from "@/lib/media-slots";
import stillsSeed from "@/lib/stills-seed.json";

type MediaContextValue = {
  versions: Record<string, MediaVersion>;
  srcFor: (key: string) => string | undefined;
  refresh: () => Promise<void>;
  patch: (entry: MediaVersion | { key: string; clear: true }) => void;
};

const MediaContext = createContext<MediaContextValue | null>(null);

function versionsFromIndex(
  index: Record<string, { bytes?: number; updatedAt?: string }>,
): Record<string, MediaVersion> {
  const next: Record<string, MediaVersion> = {};
  for (const [key, row] of Object.entries(index)) {
    if (!isMediaKey(key)) continue;
    const updatedAt = row.updatedAt ?? "";
    next[key] = {
      key,
      bytes: row.bytes ?? 0,
      updatedAt,
      url: stillFileUrl(key, updatedAt),
    };
  }
  return next;
}

const SEEDED = versionsFromIndex(stillsSeed);

export function MediaProvider({ children }: { children: ReactNode }) {
  const [versions, setVersions] = useState<Record<string, MediaVersion>>(SEEDED);

  const refresh = useCallback(async () => {
    try {
      const rows = await listMedia();
      if (rows.length === 0) return;
      const next = { ...SEEDED };
      for (const row of rows) {
        next[row.key] = {
          ...row,
          url: row.url || stillFileUrl(row.key, row.updatedAt),
        };
      }
      setVersions(next);
    } catch {
      /* keep seeded stills */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const srcFor = useCallback(
    (key: string) => {
      const row = versions[key] ?? SEEDED[key];
      if (row?.url) return row.url;
      if (row) return stillFileUrl(key, row.updatedAt);
      return undefined;
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
      versions: SEEDED,
      srcFor: (key: string) => SEEDED[key]?.url ?? stillFileUrl(key),
      refresh: async () => undefined,
      patch: () => undefined,
    } satisfies MediaContextValue;
  }
  return ctx;
}

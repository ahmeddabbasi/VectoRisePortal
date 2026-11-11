"use client";

import { DependencyList, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

type Options = {
  /** Revalidate in background when initial cache exists. Default true. */
  revalidate?: boolean;
};

export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  initial: () => T | null = () => null,
  deps: DependencyList = [],
  options: Options = {},
) {
  const { revalidate = true } = options;
  const initialData = initial();
  const hadInitial = useRef(initialData !== null);
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(!hadInitial.current);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!revalidate && hadInitial.current) return;

    let active = true;
    if (!hadInitial.current) setLoading(true);

    fetcher()
      .then((result) => {
        if (!active) return;
        setData(result);
        setError(null);
        hadInitial.current = true;
      })
      .catch((err: Error) => {
        if (!active) return;
        if (!hadInitial.current) setError(err.message || "Failed to load");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, deps);

  return { data, loading, error, setData };
}

/** Shorthand: hydrate from api.getCached(path) then revalidate in background. */
export function useCachedQuery<T>(cachePath: string, fetcher: () => Promise<T>, deps: DependencyList = []) {
  return useApiQuery(fetcher, () => api.getCached<T>(cachePath), deps);
}

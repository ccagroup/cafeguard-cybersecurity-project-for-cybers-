import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
};

export function useFetch<T>(path: string, refreshMs?: number) {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
    refreshing: false,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, error: null, loading: s.data === null, refreshing: s.data !== null }));
    api<T>(path)
      .then((data) => {
        if (!cancelled) setState({ data, error: null, loading: false, refreshing: false });
      })
      .catch((e) => {
        if (!cancelled) {
          setState((s) => ({
            ...s,
            loading: false,
            refreshing: false,
            error: e instanceof Error ? e.message : "Could not load this page.",
          }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  useEffect(() => {
    if (!refreshMs) return;
    const id = setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, refreshMs);
    return () => clearInterval(id);
  }, [refreshMs]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

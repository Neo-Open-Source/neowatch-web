"use client";

import { useEffect, useRef, useState, startTransition, type DependencyList } from "react";
import { beginDataLoad, endDataLoad } from "@/lib/state/data-loading";

interface AsyncResource<T> {
  data: T | null;
  error: boolean;
  loading: boolean;
}

// Загрузка данных с учётом lifecycle: beginDataLoad/endDataLoad для DataLoaderBar,
// отмена устаревших запросов при размонтировании и повторных вызовах.
//
// `initialData` — данные, уже загруженные на сервере (generateMetadata) и
// переданные через пропы. Пока они актуальны (первый рендер или мягкая
// навигация), клиентский запрос пропускается — двойного обращения к API нет.
// При смене языка/параметров (без навигации) данные не обновлялись сервером,
// поэтому выполняется обычный фетч.
export function useAsyncResource<T>(
  loader: () => Promise<T>,
  deps: DependencyList,
  initialData?: T | null,
): AsyncResource<T> {
  const [data, setData] = useState<T | null>(initialData ?? null);
  const [error, setError] = useState(false);
  const loaderRef = useRef(loader);
  const lastConsumed = useRef<T | null | undefined>(undefined);

  // Keep the ref in sync after every render so the data effect below always
  // runs the latest loader without mutating a ref during render (which React
  // may discard under concurrent rendering).
  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    // Fresh server-fetched data for the current deps (initial mount or a soft
    // navigation that re-rendered the server page) — use it as-is.
    if (initialData != null && initialData !== lastConsumed.current) {
      lastConsumed.current = initialData;
      setData(initialData);
      setError(false);
      return;
    }

    let cancelled = false;
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        endDataLoad();
      }
    };

    // Clear previous results so a refetch shows a fresh loading state
    // instead of stale data alongside the new skeleton.
    startTransition(() => {
      setData(null);
      setError(false);
    });
    beginDataLoad();

    loaderRef.current()
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(finish);

    return () => {
      cancelled = true;
      finish();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading: data === null && !error };
}

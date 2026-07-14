"use client";

import * as React from "react";

export function useRequest<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  dependencies: unknown[],
) {
  const [data, setData] = React.useState<T>();
  const [error, setError] = React.useState<Error>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [attempt, setAttempt] = React.useState(0);

  React.useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(undefined);
    loader(controller.signal)
      .then(setData)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason : new Error("Request failed"));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
    // The caller supplies the intentional request dependencies.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, attempt]);

  return { data, error, isLoading, retry: () => setAttempt((value) => value + 1), setData };
}

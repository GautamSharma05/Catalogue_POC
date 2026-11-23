import { useEffect, useState } from 'react';

/**
 * Returns `value`, but updated only after `delayMs` of no further changes.
 * Used to avoid firing a backend search request on every keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

import { useEffect, useState } from 'react';

export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Private-mode / quota errors: persistence is a nice-to-have, not required.
    }
  }, [key, value]);

  return [value, setValue];
}

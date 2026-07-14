import { useEffect, useRef } from 'react';

/** Value from the previous render — the primitive behind change-pulses. */
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref.current;
};

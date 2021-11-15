import { MutableRefObject, RefObject, useEffect, useLayoutEffect, useRef } from "react";

export function useRefValue<T>(ref: null | MutableRefObject<T | null> | ((t: T | null) => void), val: T | null, dep: any[]) {
  useLayoutEffect(() => {
    if(!ref) return;

    if(typeof ref === 'function') {
      ref(val);
    } else {
      ref.current = val;
    }
  }, [ref, ...dep]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useSyncedRef<T>(input: T): RefObject<T> {
  const ref = useRef(input);

  useEffect(() => {
    ref.current = input;
  }, [input]);
  return ref;
}
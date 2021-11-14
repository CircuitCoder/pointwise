import { MutableRefObject, useEffect, useLayoutEffect } from "react";

export function useRefValue<T>(ref: null | MutableRefObject<T | null> | ((t: T | null) => void), val: T | null, dep: any[]) {
  useLayoutEffect(() => {
    if(!ref) return;

    if(typeof ref === 'function') {
      ref(val);
    } else {
      ref.current = val;
    }
  }, [ref, ...dep]);
}
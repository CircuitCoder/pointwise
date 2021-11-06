import { useCallback } from 'react';

export default function Title() {
  const setRef = useCallback(() => {
  }, []);

  return (
    <div className="title" ref={setRef}>
    </div>
  );
}
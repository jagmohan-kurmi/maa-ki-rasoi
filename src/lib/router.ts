import { useEffect, useState } from 'react';

export function useRoute() {
  const [path, setPath] = useState(() => window.location.hash.slice(1) || '/');

  useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  return path;
}

export function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

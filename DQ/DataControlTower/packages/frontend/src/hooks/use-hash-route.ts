import { useCallback, useEffect, useState } from 'react';

/** Top-level pages reachable from the navigation pane. */
export type AppRoute = 'home' | 'settings';

const ROUTES: readonly AppRoute[] = ['home', 'settings'];

function readRoute(): AppRoute {
  const raw = window.location.hash.replace(/^#\/?/, '').split(/[/?]/)[0]?.toLowerCase();
  return (ROUTES as readonly string[]).includes(raw ?? '') ? (raw as AppRoute) : 'home';
}

export function hrefFor(route: AppRoute): string {
  return `#/${route}`;
}

/**
 * Hash-based routing keeps navigation working under the Fabric-hosted base path
 * without server rewrites or an extra router dependency.
 */
export function useHashRoute() {
  const [route, setRoute] = useState<AppRoute>(readRoute);

  useEffect(() => {
    const onChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const navigate = useCallback((next: AppRoute) => {
    window.location.hash = hrefFor(next);
  }, []);

  return { route, navigate };
}

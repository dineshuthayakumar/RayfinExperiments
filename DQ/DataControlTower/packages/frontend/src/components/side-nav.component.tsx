import { LayoutDashboard, Settings, type LucideIcon } from 'lucide-react';

import { hrefFor, type AppRoute } from '@/hooks/use-hash-route';
import { cn } from '@/lib/utils';

const ITEMS: { route: AppRoute; label: string; icon: LucideIcon }[] = [
  { route: 'home', label: 'Summary', icon: LayoutDashboard },
  { route: 'settings', label: 'Settings', icon: Settings },
];

/** Navigation pane: a left rail on desktop, a horizontal strip on small screens. */
export function SideNav({ current }: { current: AppRoute }) {
  return (
    <nav
      aria-label="Sections"
      className="shrink-0 border-b border-border bg-card md:sticky md:top-14 md:h-[calc(100vh-3.5rem)] md:w-56 md:border-b-0 md:border-r"
    >
      <ul className="flex gap-100 overflow-x-auto px-300 py-200 md:flex-col md:px-300 md:py-500">
        {ITEMS.map(({ route, label, icon: Icon }) => {
          const active = route === current;
          return (
            <li key={route}>
              <a
                href={hrefFor(route)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-300 whitespace-nowrap rounded-lg px-300 py-200 text-300 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  active
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-hover hover:text-foreground'
                )}
              >
                <Icon aria-hidden className="icon-size-200 shrink-0" />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

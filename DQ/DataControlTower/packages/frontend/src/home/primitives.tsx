import { AlertTriangle, CheckCircle2, CircleDashed, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

import type { TableHealth } from '@/lib/dq-model';
import { cn } from '@/lib/utils';

export function Panel({
  title,
  eyebrow,
  action,
  className,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card text-card-foreground',
        className
      )}
      aria-label={title}
    >
      <header className="flex items-start justify-between gap-300 border-b border-border px-500 py-400">
        <div className="flex flex-col gap-100">
          {eyebrow && (
            <span className="font-monospace text-200 uppercase tracking-wider text-muted-foreground">
              {eyebrow}
            </span>
          )}
          <h2 className="font-heading text-400 font-semibold leading-400">{title}</h2>
        </div>
        {action}
      </header>
      <div className="flex flex-1 flex-col p-500">{children}</div>
    </section>
  );
}

const HEALTH: Record<TableHealth, { label: string; icon: LucideIcon; className: string }> = {
  healthy: { label: 'Healthy', icon: CheckCircle2, className: 'text-good' },
  below: { label: 'Below threshold', icon: AlertTriangle, className: 'text-critical' },
  'no-data': { label: 'No runs yet', icon: CircleDashed, className: 'text-muted-foreground' },
};

/** Status is never color-alone: icon + label, with the color on the icon only. */
export function HealthBadge({ health }: { health: TableHealth }) {
  const { label, icon: Icon, className } = HEALTH[health];
  return (
    <span className="inline-flex items-center gap-100 whitespace-nowrap text-200 font-medium text-foreground">
      <Icon aria-hidden className={cn('icon-size-200 shrink-0', className)} />
      {label}
    </span>
  );
}

const RUN_STATUS: Record<string, { icon: LucideIcon; className: string }> = {
  succeeded: { icon: CheckCircle2, className: 'text-good' },
  failed: { icon: AlertTriangle, className: 'text-critical' },
  running: { icon: CircleDashed, className: 'text-brand-foreground animate-spin [animation-duration:3s]' },
};

export function RunStatusBadge({ status }: { status: string }) {
  const entry = RUN_STATUS[status.toLowerCase()] ?? {
    icon: CircleDashed,
    className: 'text-muted-foreground',
  };
  const Icon = entry.icon;
  return (
    <span className="inline-flex items-center gap-100 whitespace-nowrap text-200 font-medium text-foreground">
      <Icon aria-hidden className={cn('icon-size-200 shrink-0', entry.className)} />
      {status}
    </span>
  );
}

export function SectionError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-200 rounded-xl border border-border bg-critical-surface p-400 text-300 text-foreground"
    >
      <AlertTriangle aria-hidden className="icon-size-200 mt-100 shrink-0 text-critical" />
      <div className="flex flex-col gap-100">
        <span className="font-medium">This section couldn't load.</span>
        <span className="text-200 text-muted-foreground break-words">{message}</span>
      </div>
    </div>
  );
}

export function EmptyNote({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-border px-500 py-800 text-center text-300 text-muted-foreground">
      {children}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-muted', className)} />;
}

export function LayerTag({ layer }: { layer: string }) {
  if (!layer) return null;
  return (
    <span className="rounded-md border border-border px-100 font-monospace text-200 uppercase leading-200 text-muted-foreground">
      {layer}
    </span>
  );
}

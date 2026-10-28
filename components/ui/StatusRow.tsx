import type { ReactNode } from "react";

interface StatusRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function StatusRow({ label, children, className = "" }: StatusRowProps) {
  return (
    <div className={`flex items-center justify-between py-2 ${className}`}>
      <span className="text-sm text-text-muted">{label}</span>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

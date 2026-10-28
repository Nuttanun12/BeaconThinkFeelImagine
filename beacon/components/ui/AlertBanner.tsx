import type { ReactNode } from "react";

type AlertVariant = "critical" | "warning" | "info" | "success";

interface AlertBannerProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const VARIANT_CONFIG: Record<
  AlertVariant,
  { wrapper: string; icon: ReactNode; titleColor: string }
> = {
  critical: {
    wrapper:
      "bg-status-critical-bg border border-status-critical-border text-status-critical-text",
    titleColor: "text-status-critical-text",
    icon: (
      <svg
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  warning: {
    wrapper:
      "bg-status-warning-bg border border-status-warning-border text-status-warning-text",
    titleColor: "text-status-warning-text",
    icon: (
      <svg
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  info: {
    wrapper: "bg-beacon-blue-light border border-blue-200 text-beacon-blue",
    titleColor: "text-beacon-blue",
    icon: (
      <svg
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  success: {
    wrapper:
      "bg-status-success-bg border border-status-success-border text-status-success-text",
    titleColor: "text-status-success-text",
    icon: (
      <svg
        className="w-4 h-4 flex-shrink-0 mt-0.5"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
};

export function AlertBanner({
  variant = "info",
  title,
  children,
  className = "",
}: AlertBannerProps) {
  const config = VARIANT_CONFIG[variant];

  return (
    <div
      role="alert"
      className={`flex gap-2.5 p-3 rounded-lg text-sm ${config.wrapper} ${className}`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        {title && (
          <p className={`font-semibold mb-0.5 ${config.titleColor}`}>{title}</p>
        )}
        <div className="leading-snug">{children}</div>
      </div>
    </div>
  );
}

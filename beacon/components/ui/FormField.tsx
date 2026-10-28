import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef, useId } from "react";

// ── Text / number input ──────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const FormField = forwardRef<HTMLInputElement, InputProps>(
  function FormField({ label, error, hint, required, className = "", id: externalId, ...rest }, ref) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;
    const hintId = `${id}-hint`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-status-critical-text ml-0.5">*</span>}
        </label>
        <input
          ref={ref}
          id={id}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={
            [error ? errorId : null, hint ? hintId : null]
              .filter(Boolean)
              .join(" ") || undefined
          }
          className={[
            "h-10 w-full rounded-lg border px-3 text-sm text-text-primary placeholder:text-text-subtle",
            "transition-colors duration-150 outline-none",
            "focus:border-beacon-blue focus:ring-2 focus:ring-beacon-blue/20",
            error
              ? "border-status-critical-border bg-status-critical-bg/30"
              : "border-border bg-white hover:border-gray-400",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-text-muted">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-status-critical-text flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

// ── Textarea ─────────────────────────────────────────────────────────────────

interface TextareaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
}

export const TextareaField = forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, error, hint, required, className = "", id: externalId, ...rest }, ref) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-status-critical-text ml-0.5">*</span>}
        </label>
        <textarea
          ref={ref}
          id={id}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            "w-full rounded-lg border px-3 py-2.5 text-sm text-text-primary placeholder:text-text-subtle",
            "transition-colors duration-150 outline-none resize-y min-h-[100px]",
            "focus:border-beacon-blue focus:ring-2 focus:ring-beacon-blue/20",
            error
              ? "border-status-critical-border bg-status-critical-bg/30"
              : "border-border bg-white hover:border-gray-400",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...rest}
        />
        {hint && !error && (
          <p className="text-xs text-text-muted">{hint}</p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-status-critical-text flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

// ── Select ────────────────────────────────────────────────────────────────────

interface SelectFieldProps extends InputHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField({ label, error, hint, required, className = "", id: externalId, children, ...rest }, ref) {
    const autoId = useId();
    const id = externalId ?? autoId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={id} className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-status-critical-text ml-0.5">*</span>}
        </label>
        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
            className={[
              "h-10 w-full appearance-none rounded-lg border px-3 pr-8 text-sm text-text-primary",
              "transition-colors duration-150 outline-none bg-white",
              "focus:border-beacon-blue focus:ring-2 focus:ring-beacon-blue/20",
              error
                ? "border-status-critical-border bg-status-critical-bg/30"
                : "border-border hover:border-gray-400",
              className,
            ]
              .filter(Boolean)
              .join(" ")}
            {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
          >
            {children}
          </select>
          <svg
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {hint && !error && <p className="text-xs text-text-muted">{hint}</p>}
        {error && (
          <p id={errorId} role="alert" className="text-xs text-status-critical-text flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

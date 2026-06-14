import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/* ------------------------------------------------------------------ Buttons */

type ButtonVariant = "primary" | "secondary" | "tertiary" | "inverse";

const buttonBase =
  "inline-flex items-center justify-center gap-xs rounded-md px-[14px] py-xs text-button font-medium transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-focus",
  secondary: "bg-surface-1 text-ink border border-hairline hover:bg-surface-2",
  tertiary: "bg-transparent text-ink hover:bg-surface-1",
  inverse: "bg-inverse-canvas text-inverse-ink hover:bg-[#ececec]",
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={cn(buttonBase, buttonVariants[variant], className)} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  href,
  children,
  ...props
}: {
  variant?: ButtonVariant;
  className?: string;
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link href={href} className={cn(buttonBase, buttonVariants[variant], className)} {...props}>
      {children}
    </Link>
  );
}

/* -------------------------------------------------------------------- Cards */

export function Card({
  className,
  edge = true,
  children,
}: {
  className?: string;
  edge?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-hairline bg-surface-1 p-lg",
        edge && "edge-highlight",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ScreenshotPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "edge-highlight overflow-hidden rounded-xl border border-hairline bg-surface-1 p-lg",
        className,
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ Badges */

type BadgeTone = "neutral" | "bull" | "bear" | "success" | "warning" | "primary";

const badgeTones: Record<BadgeTone, string> = {
  neutral: "bg-surface-2 text-ink-muted border-hairline",
  bull: "bg-[#10301a] text-[#5fd47e] border-[#1d5230]",
  bear: "bg-[#311515] text-[#e88c8c] border-[#5a2a2a]",
  success: "bg-[#10301a] text-success border-[#1d5230]",
  warning: "bg-[#2c2710] text-warning border-[#4a4220]",
  primary: "bg-[#1a1d3a] text-[#9aa4ff] border-[#2c3170]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2 py-[2px] text-caption font-medium",
        badgeTones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ Inputs */

export const TextInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function TextInput({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        "focus-ring w-full rounded-md border border-hairline bg-surface-1 px-sm py-xs text-body text-ink placeholder:text-ink-tertiary",
        className,
      )}
      {...props}
    />
  );
});

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        "focus-ring w-full appearance-none rounded-md border border-hairline bg-surface-1 px-sm py-xs text-body text-ink",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
});

export function Label({
  children,
  className,
  htmlFor,
}: {
  children: React.ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn("mb-xs block text-body-sm font-medium text-ink-muted", className)}
    >
      {children}
    </label>
  );
}

/* ----------------------------------------------------------------- Eyebrow */

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-eyebrow uppercase text-ink-subtle", className)}>{children}</p>
  );
}

/* ----------------------------------------------------------- Stat / Metric */

export function Stat({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "bull" | "bear" | "neutral";
  hint?: string;
}) {
  const toneClass =
    tone === "bull" ? "text-bull" : tone === "bear" ? "text-bear" : "text-ink";
  return (
    <div className="rounded-md border border-hairline-tertiary bg-surface-2 p-md">
      <p className="text-caption text-ink-subtle">{label}</p>
      <p className={cn("mt-1 font-mono text-[18px] font-medium tabular-nums", toneClass)}>
        {value}
      </p>
      {hint && <p className="mt-1 text-caption text-ink-tertiary">{hint}</p>}
    </div>
  );
}

/* -------------------------------------------------------- Section wrapper */

export function Section({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-content px-lg", className)}>{children}</section>
  );
}

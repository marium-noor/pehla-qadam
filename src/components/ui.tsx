import Link from "next/link";
import type { ReactNode } from "react";

const base =
  "inline-flex items-center justify-center rounded-full font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

export function ButtonLink({ href, children, variant = "primary", size = "md" }: {
  href: string; children: ReactNode; variant?: "primary" | "quiet"; size?: "md" | "lg";
}) {
  const v = variant === "primary" ? "bg-ink text-white hover:bg-black" : "text-sabz hover:underline";
  const s = size === "lg" ? "px-7 py-3.5 text-lg" : "px-5 py-2.5 text-base";
  return (
    <Link href={href} className={`${base} ${variant === "primary" ? s : ""} ${v}`}>
      {children}
    </Link>
  );
}

export function Button({ children, onClick, type = "button", variant = "primary", disabled, className = "" }: {
  children: ReactNode; onClick?: () => void; type?: "button" | "submit"; variant?: "primary" | "secondary" | "quiet";
  disabled?: boolean; className?: string;
}) {
  const v =
    variant === "primary"
      ? "bg-ink text-white hover:bg-black px-6 py-3 text-base"
      : variant === "secondary"
        ? "border border-line text-ink hover:bg-mist px-6 py-3 text-base"
        : "text-sabz hover:underline px-2 py-2 text-base";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${v} ${className}`}>
      {children}
    </button>
  );
}

export function Section({ children, tone = "plain", id }: { children: ReactNode; tone?: "plain" | "mist"; id?: string }) {
  return (
    <section id={id} className={tone === "mist" ? "bg-mist" : "bg-white"}>
      <div className="mx-auto max-w-5xl px-6 py-20 sm:py-28">{children}</div>
    </section>
  );
}

export function Check() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 20 20" className="mt-[0.45em] shrink-0 text-sabz" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 10.5l4 4 8-9" />
    </svg>
  );
}

export function Cross() {
  return (
    <svg aria-hidden width="18" height="18" viewBox="0 0 20 20" className="mt-[0.45em] shrink-0 text-mute" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M5 5l10 10M15 5L5 15" />
    </svg>
  );
}

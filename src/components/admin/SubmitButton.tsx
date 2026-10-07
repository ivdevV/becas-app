"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: string;
  pendingLabel?: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
};

export function SubmitButton({
  children,
  pendingLabel = "Guardando...",
  disabled = false,
  variant = "primary",
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const className =
    variant === "primary"
      ? "min-h-12 rounded-md bg-[#4ab5f0] px-5 text-base font-semibold text-white transition hover:bg-[#1684bd] focus:outline-none focus:ring-4 focus:ring-[#4ab5f0]/20 disabled:cursor-not-allowed disabled:opacity-60"
      : "min-h-12 rounded-md border border-slate-300 bg-white px-5 text-base font-semibold text-slate-800 transition hover:border-slate-400 focus:outline-none focus:ring-4 focus:ring-[#4ab5f0]/20 disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <button type="submit" disabled={disabled || pending} className={className}>
      {pending ? pendingLabel : children}
    </button>
  );
}

"use client";

import { LucideIcon } from "lucide-react";
import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: LucideIcon;
};

const variants: Record<string, string> = {
  primary: "bg-sage text-white hover:bg-sage-dark",
  secondary: "bg-transparent text-sage-dark border border-sage hover:bg-sage-soft",
  ghost: "bg-transparent text-muted hover:text-ink",
  danger: "bg-accentRed text-white hover:opacity-90",
};

export default function Button({ children, variant = "primary", icon: Icon, className = "", ...rest }: Props) {
  return (
    <button
      {...rest}
      className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}

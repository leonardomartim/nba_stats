import React from "react";
import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "live" | "outline" | "secondary" | "success";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-100 text-slate-300 border border-border",
    live: "bg-nba-red/20 text-red-400 border border-nba-red/50 shadow-[0_0_12px_rgba(238,26,59,0.3)] animate-pulse",
    outline: "border border-border text-slate-400 bg-transparent",
    secondary: "bg-blue-950/40 text-blue-400 border border-blue-900/40",
    success: "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide uppercase transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {variant === "live" && (
        <span className="w-1.5 h-1.5 rounded-full bg-nba-red animate-ping" />
      )}
      {children}
    </span>
  );
}

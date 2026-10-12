import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const variants = {
      primary: "bg-nba-red hover:bg-red-600 text-white shadow-lg shadow-nba-red/25 active:scale-95",
      secondary: "bg-surface-100 hover:bg-surface-50 text-slate-200 border border-border active:scale-95",
      outline: "border border-border hover:border-slate-500 text-slate-300 hover:bg-surface-100/50 active:scale-95",
      ghost: "text-slate-400 hover:text-white hover:bg-surface-100/40",
      danger: "bg-rose-900/40 hover:bg-rose-800/60 text-rose-300 border border-rose-800/40",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs rounded-md",
      md: "px-4 py-2 text-sm rounded-lg",
      lg: "px-6 py-3 text-base rounded-xl font-semibold",
      icon: "p-2 rounded-lg aspect-square flex items-center justify-center",
    };

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 disabled:opacity-50 disabled:pointer-events-none select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

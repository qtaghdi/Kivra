import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

type buttonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "icon";
  children: ReactNode;
};

const variantClassName = {
  primary: "border-primary bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "border-border bg-muted text-foreground hover:bg-muted/80",
  ghost: "border-transparent bg-transparent text-foreground hover:bg-muted",
  danger: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90"
};

const sizeClassName = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  icon: "h-8 w-8 p-0"
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  children,
  ...props
}: buttonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border font-medium transition disabled:cursor-not-allowed disabled:opacity-50",
        variantClassName[variant],
        sizeClassName[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

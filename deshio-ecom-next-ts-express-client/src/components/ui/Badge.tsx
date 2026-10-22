import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "sale" | "new" | "warning" | "success" | "outline";
  size?: "sm" | "md";
}

export default function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: "text-[10px] px-2 py-0.5 font-medium tracking-wide",
    md: "text-xs px-2.5 py-1 font-semibold tracking-wide",
  }[size];

  const variantStyles = {
    neutral: "bg-stone-100 text-stone-700",
    sale: "bg-rose-50 text-rose-700 border border-rose-200/60",
    new: "bg-stone-900 text-white",
    warning: "bg-amber-50 text-amber-800 border border-amber-200",
    success: "bg-emerald-50 text-emerald-800 border border-emerald-200",
    outline: "bg-transparent text-stone-700 border border-stone-200",
  }[variant];

  return (
    <span
      className={`inline-flex items-center uppercase rounded-full ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

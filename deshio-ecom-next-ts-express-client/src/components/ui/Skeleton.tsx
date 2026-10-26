import React from "react";

export default function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-stone-200/70 rounded-md ${className}`}
      {...props}
    />
  );
}

import { type HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
}

export default function Card({ padding = true, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-xl bg-[var(--color-white)] shadow-sm border border-[var(--color-primary)]/5 ${
        padding ? "p-6" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

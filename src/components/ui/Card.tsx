import { type HTMLAttributes } from "react";

type CardVariant = "dark" | "kraft";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean;
  variant?: CardVariant;
}

const variantClasses: Record<CardVariant, string> = {
  dark: "bg-card text-cream border border-white/5 rounded-sm hover:border-brick/30 transition-colors",
  kraft: "bg-kraft text-base border border-base/10 rounded-sm hover:border-brick/30 transition-colors",
};

export default function Card({ padding = true, variant = "dark", className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`${variantClasses[variant]} ${padding ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

import { type ButtonHTMLAttributes, forwardRef } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "dark";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-brick text-cream hover:bg-brick/90 font-mono uppercase text-sm tracking-wider",
  secondary: "bg-gold text-base hover:bg-gold/90 font-mono uppercase text-sm tracking-wider",
  outline: "border-2 border-brick text-brick hover:bg-brick hover:text-cream font-mono uppercase text-sm tracking-wider",
  ghost: "text-cream hover:text-brick font-mono uppercase text-sm tracking-wider",
  dark: "bg-base text-cream hover:bg-card font-mono uppercase text-sm tracking-wider",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-8 py-3.5 text-base",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-sm transition-colors duration-200 inline-flex items-center justify-center disabled:opacity-50 disabled:pointer-events-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

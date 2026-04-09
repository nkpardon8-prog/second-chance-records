import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  dark?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, dark, id, className = "", ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={inputId} className={`font-mono uppercase text-xs tracking-wider mb-1.5 block ${dark ? "text-cream" : "text-base"}`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-sm px-4 py-2.5 font-sans text-sm transition-colors border focus:border-brick focus:ring-1 focus:ring-brick/20 focus:outline-none ${
            dark
              ? "bg-white/5 border-white/10 text-cream placeholder:text-cream/40"
              : "bg-white/80 border-base/20 text-base placeholder:text-muted"
          } ${error ? "border-brick" : ""} ${className}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-brick text-xs mt-1 font-mono" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;

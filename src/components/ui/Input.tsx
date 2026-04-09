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
          <label htmlFor={inputId} className={`font-mono uppercase text-xs tracking-wider mb-1.5 block ${dark ? "text-white" : "text-base"}`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full rounded-sm px-4 py-2.5 font-sans text-sm transition-colors bg-white/80 border border-base/20 text-base placeholder:text-muted focus:border-brick focus:ring-1 focus:ring-brick/20 focus:outline-none ${
            error ? "border-brick focus:border-brick focus:ring-brick/20" : ""
          } ${className}`}
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

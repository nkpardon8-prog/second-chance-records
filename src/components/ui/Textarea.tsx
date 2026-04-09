import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  dark?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, dark, id, className = "", ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="flex flex-col">
        {label && (
          <label htmlFor={textareaId} className={`font-mono uppercase text-xs tracking-wider mb-1.5 block ${dark ? "text-white" : "text-base"}`}>
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`w-full rounded-sm px-4 py-2.5 font-sans text-sm transition-colors bg-white/80 border border-base/20 text-base placeholder:text-muted focus:border-brick focus:ring-1 focus:ring-brick/20 focus:outline-none resize-y min-h-[120px] ${
            error ? "border-brick focus:border-brick focus:ring-brick/20" : ""
          } ${className}`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${textareaId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${textareaId}-error`} className="text-brick text-xs mt-1 font-mono" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

export default Textarea;

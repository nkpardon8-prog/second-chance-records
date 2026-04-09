import { type AnchorHTMLAttributes } from "react";

interface ExternalLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  showIcon?: boolean;
}

export default function ExternalLink({
  children,
  className = "",
  showIcon = false,
  ...props
}: ExternalLinkProps) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      className={`text-brick hover:text-gold transition-colors inline-flex items-center gap-1 font-mono text-sm ${className}`}
      {...props}
    >
      {children}
      {showIcon && (
        <span aria-hidden="true" className="text-xs">{"\u2197"}</span>
      )}
    </a>
  );
}

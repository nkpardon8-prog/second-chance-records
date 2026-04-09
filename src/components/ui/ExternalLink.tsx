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
      className={className}
      {...props}
    >
      {children}
      {showIcon && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="ml-1 inline-block"
          aria-hidden="true"
        >
          <path d="M3.5 1.5h7v7" />
          <path d="M10.5 1.5L1.5 10.5" />
        </svg>
      )}
    </a>
  );
}

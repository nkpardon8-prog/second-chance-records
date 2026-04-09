interface SectionHeadingProps {
  children: React.ReactNode;
  subtitle?: string;
  dark?: boolean;
  className?: string;
}

export default function SectionHeading({ children, subtitle, dark = false, className = "" }: SectionHeadingProps) {
  return (
    <div className={`text-center mb-10 ${className}`}>
      <h2 className={`font-heading text-4xl md:text-5xl uppercase tracking-tight ${dark ? "text-cream" : "text-base"}`}>
        {children}
      </h2>
      {subtitle && (
        <p className={`font-mono text-sm uppercase tracking-wider mt-2 ${dark ? "text-kraft/70" : "text-base/60"}`}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

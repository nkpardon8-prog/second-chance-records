interface SectionHeadingProps {
  children: React.ReactNode;
  subtitle?: string;
  className?: string;
}

export default function SectionHeading({ children, subtitle, className = "" }: SectionHeadingProps) {
  return (
    <div className={`text-center mb-10 ${className}`}>
      <h2 className="font-heading text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        {children}
      </h2>
      {subtitle && (
        <p className="mt-3 text-lg text-[var(--color-primary)]/60 max-w-2xl mx-auto">
          {subtitle}
        </p>
      )}
    </div>
  );
}

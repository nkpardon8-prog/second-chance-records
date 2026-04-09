"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="bg-base text-cream min-h-screen flex items-center justify-center grain-overlay">
      <div className="text-center px-6 relative z-10">
        <h1 className="font-heading text-4xl md:text-5xl uppercase tracking-tight">
          Something Skipped a Groove
        </h1>
        <p className="mt-4 text-lg text-cream/70 font-sans">
          We hit an unexpected bump. Give it another spin.
        </p>
        <button
          onClick={reset}
          className="mt-8 inline-flex items-center rounded-sm bg-brick text-cream px-6 py-3 font-mono uppercase text-sm tracking-wider hover:bg-brick/90 transition-colors"
        >
          Try Again
        </button>
      </div>
    </main>
  );
}

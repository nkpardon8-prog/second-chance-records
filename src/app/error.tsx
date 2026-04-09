"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-heading text-4xl font-bold text-[var(--color-primary)] sm:text-5xl">
        Something skipped a groove
      </h1>
      <p className="mt-4 text-lg text-[var(--color-primary)]/70">
        We hit an unexpected bump. Give it another spin.
      </p>
      <button
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-[var(--color-white)] transition-colors hover:bg-[var(--color-accent)]/90"
      >
        Try Again
      </button>
    </main>
  );
}

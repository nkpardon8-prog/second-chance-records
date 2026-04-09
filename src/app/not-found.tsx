import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <h1 className="font-heading text-5xl font-bold text-[var(--color-primary)] sm:text-6xl">404</h1>
      <p className="mt-4 text-xl text-[var(--color-primary)]/70">
        This record seems to be missing from the bin.
      </p>
      <p className="mt-2 text-[var(--color-primary)]/50">
        Maybe it found a new home already.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center rounded-lg bg-[var(--color-accent)] px-6 py-3 text-sm font-medium text-[var(--color-white)] transition-colors hover:bg-[var(--color-accent)]/90"
      >
        Back to the Stacks
      </Link>
    </main>
  );
}

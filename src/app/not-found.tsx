import Link from "next/link";

export default function NotFound() {
  return (
    <main className="bg-base text-cream min-h-screen flex items-center justify-center grain-overlay">
      <div className="text-center px-6 relative z-10">
        <h1 className="font-heading text-9xl text-brick leading-none">404</h1>
        <p className="font-heading text-2xl uppercase tracking-tight mt-4">
          This Record Is Not in Our Bins
        </p>
        <p className="mt-2 text-cream/80 font-sans">
          Maybe it found a new home already.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center rounded-sm bg-brick text-cream px-6 py-3 font-mono uppercase text-sm tracking-wider hover:bg-brick/90 transition-colors"
        >
          Back to the Stacks
        </Link>
      </div>
    </main>
  );
}

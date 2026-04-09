"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong");
      }
      setStatus("success");
      setMessage("You're in! Check your inbox.");
      setEmail("");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <p className="text-sm font-mono text-forest">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-md">
      <input
        type="email"
        required
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="flex-1 rounded-sm bg-white/10 border border-white/20 px-4 py-2.5 text-sm font-sans text-cream placeholder:text-cream/40 focus:outline-none focus:ring-1 focus:ring-gold/40 focus:border-gold/40"
        aria-label="Email address"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-sm bg-gold text-base hover:bg-gold/90 px-5 py-2.5 font-mono uppercase text-sm tracking-wider transition-colors disabled:opacity-50"
      >
        {status === "loading" ? "..." : "Subscribe"}
      </button>
      {status === "error" && (
        <p className="text-xs text-brick mt-1 font-mono">{message}</p>
      )}
    </form>
  );
}

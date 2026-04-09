"use client";

import { useState, useTransition } from "react";
import { loginAction } from "@/lib/actions/auth";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await loginAction(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-base px-4">
      <div className="w-full max-w-sm bg-card rounded-sm border border-white/5 p-8">
        <h1 className="font-heading text-2xl text-cream text-center mb-6 tracking-wide">
          Second Chance Records Admin
        </h1>
        <form action={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            dark
            name="email"
            type="email"
            required
            autoComplete="email"
          />
          <Input
            label="Password"
            dark
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
          {error && (
            <p className="text-sm text-brick">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}

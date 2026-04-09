"use client";

import { useState, useRef } from "react";
import { submitContact } from "@/lib/actions/contact";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const [timestamp] = useState(() => Date.now());

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    formData.set("_timestamp", String(timestamp));

    const result = await submitContact(formData);

    if (result?.error) {
      setStatus("error");
      setMessage(result.error);
    } else {
      setStatus("success");
      setMessage("Thanks for reaching out! We'll get back to you soon.");
      formRef.current?.reset();
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl bg-[var(--color-secondary)]/10 p-8 text-center">
        <p className="text-lg font-medium text-[var(--color-secondary)]">{message}</p>
      </div>
    );
  }

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-5">
      {/* Honeypot */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <Input name="name" label="Name" required placeholder="Your name" />
      <Input name="email" label="Email" type="email" required placeholder="your@email.com" />
      <Input name="subject" label="Subject" placeholder="What's this about?" />
      <Textarea name="message" label="Message" required placeholder="Your message..." rows={5} />

      {status === "error" && (
        <p className="text-sm text-red-600" role="alert">{message}</p>
      )}

      <Button type="submit" disabled={status === "loading"}>
        {status === "loading" ? "Sending..." : "Send Message"}
      </Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { togglePostVisibility, triggerSync } from "@/lib/actions/instagram";
import Button from "@/components/ui/Button";
import type { InstagramPost } from "@/types";

interface AdminInstagramClientProps {
  posts: InstagramPost[];
}

export default function AdminInstagramClient({ posts }: AdminInstagramClientProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [syncing, startSyncTransition] = useTransition();
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  function handleToggle(id: number) {
    startTransition(async () => {
      await togglePostVisibility(id);
    });
  }

  function handleSync() {
    setSyncMessage(null);
    startSyncTransition(async () => {
      const result = await triggerSync();
      if (result.error) {
        setSyncMessage(`Sync failed: ${result.error}`);
      } else {
        setSyncMessage(`Synced ${result.count} new post${result.count !== 1 ? "s" : ""}`);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Instagram Feed</h2>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span className={`text-sm font-mono ${syncMessage.startsWith("Sync failed") ? "text-brick" : "text-forest"}`}>
              {syncMessage}
            </span>
          )}
          <Button size="sm" onClick={handleSync} disabled={syncing}>
            {syncing ? "Syncing..." : "Sync Now"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`bg-card border rounded-sm overflow-hidden ${
              post.isVisible ? "border-white/5" : "border-white/5 opacity-50"
            }`}
          >
            <div className="aspect-square bg-white/5 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.caption?.slice(0, 50) ?? "Instagram post"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-2">
              <p className="text-xs text-cream line-clamp-2 mb-2">
                {post.caption?.slice(0, 100) ?? "No caption"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-kraft/70 font-mono">
                  {post.postedAt ? new Date(post.postedAt).toLocaleDateString() : ""}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleToggle(post.id)}
                  disabled={pending}
                >
                  {post.isVisible ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          </div>
        ))}
        {posts.length === 0 && (
          <p className="text-sm text-kraft/70 col-span-full text-center py-8">
            No Instagram posts synced yet. Click &quot;Sync Now&quot; to pull from Instagram.
          </p>
        )}
      </div>
    </div>
  );
}

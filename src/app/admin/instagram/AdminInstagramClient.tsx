"use client";

import { useTransition } from "react";
import { togglePostVisibility } from "@/lib/actions/instagram";
import Button from "@/components/ui/Button";
import type { InstagramPost } from "@/types";

interface AdminInstagramClientProps {
  posts: InstagramPost[];
}

export default function AdminInstagramClient({ posts }: AdminInstagramClientProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle(id: number) {
    startTransition(async () => {
      await togglePostVisibility(id);
    });
  }

  function handleSync() {
    alert("Instagram sync triggered. This runs via a scheduled function.");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Instagram Feed</h2>
        <Button size="sm" onClick={handleSync} disabled={pending}>
          {pending ? "Syncing..." : "Sync Now"}
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className={`bg-white border rounded-lg overflow-hidden ${
              post.isVisible ? "border-gray-200" : "border-gray-200 opacity-50"
            }`}
          >
            <div className="aspect-square bg-gray-100 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.imageUrl}
                alt={post.caption?.slice(0, 50) ?? "Instagram post"}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-2">
              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                {post.caption?.slice(0, 100) ?? "No caption"}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
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
          <p className="text-sm text-gray-500 col-span-full text-center py-8">
            No Instagram posts synced yet.
          </p>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import {
  createResource,
  updateResource,
  deleteResource,
} from "@/lib/actions/resources";
import { searchResources } from "@/lib/actions/discover";
import type { DiscoveredResource } from "@/lib/actions/discover";
import ItemForm, { type FieldDef } from "@/components/admin/ItemForm";
import Button from "@/components/ui/Button";
import type { CommunityResource } from "@/types";

const resourceFields: FieldDef[] = [
  { name: "name", label: "Name", type: "text", required: true },
  { name: "url", label: "URL", type: "url", required: true },
  { name: "description", label: "Description", type: "textarea" },
];

interface AdminResourcesClientProps {
  resources: CommunityResource[];
}

export default function AdminResourcesClient({ resources }: AdminResourcesClientProps) {
  const [editing, setEditing] = useState<CommunityResource | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [pending, startTransition] = useTransition();

  // Discovery state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<DiscoveredResource[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  async function handleDiscover() {
    setSearching(true);
    setSearchError(null);
    setSuggestions([]);
    const result = await searchResources(searchQuery || undefined);
    if (result.error) {
      setSearchError(result.error);
    } else {
      // Filter out resources that already exist (by URL match)
      const existingUrls = new Set(resources.map((r) => r.url.toLowerCase()));
      const newSuggestions = result.resources.filter(
        (r) => !existingUrls.has(r.url.toLowerCase())
      );
      setSuggestions(newSuggestions);
    }
    setSearching(false);
  }

  function handleConfirmSuggestion(resource: DiscoveredResource) {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("name", resource.name);
      fd.set("url", resource.url);
      fd.set("description", resource.description);
      await createResource(fd);
      setSuggestions((prev) => prev.filter((s) => s !== resource));
    });
  }

  function handleDismissSuggestion(resource: DiscoveredResource) {
    setSuggestions((prev) => prev.filter((s) => s !== resource));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-heading text-2xl text-cream tracking-wide">Community Resources</h2>
        <Button size="sm" onClick={() => { setShowAdd(!showAdd); setEditing(null); }}>
          {showAdd ? "Cancel" : "Add Resource"}
        </Button>
      </div>

      {showAdd && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">New Resource</h3>
          <ItemForm
            fields={resourceFields}
            onSubmit={async (fd) => {
              await createResource(fd);
              setShowAdd(false);
            }}
            submitLabel="Create Resource"
            onCancel={() => setShowAdd(false)}
          />
        </div>
      )}

      {editing && (
        <div className="bg-card rounded-sm border border-white/5 p-4 mb-6">
          <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Edit Resource</h3>
          <ItemForm
            fields={resourceFields}
            initialValues={{
              name: editing.name,
              url: editing.url,
              description: editing.description ?? "",
            }}
            onSubmit={async (fd) => {
              await updateResource(editing.id, fd);
              setEditing(null);
            }}
            submitLabel="Update Resource"
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {/* AI Resource Discovery */}
      <div className="mb-8 bg-card rounded-sm border border-white/5 p-4">
        <h3 className="font-mono text-sm text-gold mb-3 uppercase tracking-wider">
          Discover Resources
        </h3>
        <p className="text-xs text-kraft/70 mb-3">
          Search the web for PDX community resources. Leave blank for general Portland music/vinyl resources.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleDiscover(); }}
            placeholder="e.g. Portland music venues, vinyl repair shops..."
            className="flex-1 bg-base border border-white/10 rounded-sm px-3 py-1.5 text-sm text-cream placeholder:text-kraft/40 focus:outline-none focus:border-gold/50"
          />
          <Button size="sm" variant="secondary" onClick={handleDiscover} disabled={searching}>
            {searching ? "Searching..." : "Discover"}
          </Button>
        </div>

        {searchError && (
          <p className="text-xs text-brick mt-2">{searchError}</p>
        )}

        {suggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {suggestions.map((resource, i) => (
              <div
                key={`${resource.name}-${i}`}
                className="flex items-start justify-between gap-3 bg-gold/10 border border-gold/20 rounded-sm p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-cream">{resource.name}</p>
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gold/70 hover:text-gold truncate block"
                  >
                    {resource.url}
                  </a>
                  <p className="text-xs text-kraft/50 mt-1 line-clamp-2">
                    {resource.description}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleConfirmSuggestion(resource)}
                    disabled={pending}
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-brick hover:text-brick/80"
                    onClick={() => handleDismissSuggestion(resource)}
                  >
                    Skip
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {searching && (
          <p className="text-xs text-kraft/40 mt-3 animate-pulse">
            Searching the web for resources...
          </p>
        )}
      </div>

      <h3 className="font-mono text-sm text-cream mb-3 uppercase tracking-wider">Current Resources</h3>
      <div className="space-y-2">
        {resources.map((r) => (
          <div
            key={r.id}
            className="flex items-center justify-between bg-card border border-white/5 rounded-sm p-3"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm text-cream">{r.name}</p>
              <p className="text-xs text-kraft/70 truncate">{r.url}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button size="sm" variant="ghost" onClick={() => { setEditing(r); setShowAdd(false); }}>
                Edit
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-brick hover:text-brick/80"
                onClick={() => {
                  if (confirm("Delete this resource?")) deleteResource(r.id);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
        {resources.length === 0 && (
          <p className="text-sm text-kraft/70 text-center py-8">No resources yet.</p>
        )}
      </div>
    </div>
  );
}

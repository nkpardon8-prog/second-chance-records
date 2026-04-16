# Plan: Admin Audit — Bug Fixes + Chrome DevTools Verification

## Background
Full audit of all 11 admin sections. Codex review identified 10 concrete bugs. This plan fixes all of them, deploys, then runs a Chrome DevTools verification pass against the live site.

---

## Files Being Changed

```
src/lib/actions/discover.ts                           ← MODIFIED  (fix response_format for Perplexity API)
src/lib/actions/resources.ts                          ← MODIFIED  (fix SQL injection in reorderResources)
src/lib/actions/news.ts                               ← MODIFIED  (add toggleNewsPublished action; default new posts to draft)
src/app/admin/layout.tsx                              ← MODIFIED  (auth redirect; move DB query after auth check)
src/app/admin/news/AdminNewsClient.tsx                ← MODIFIED  (wire togglePublish to new action; fix unawaited delete)
src/app/admin/instagram/AdminInstagramClient.tsx      ← MODIFIED  (add router.refresh after toggle)
src/app/admin/events/AdminEventsClient.tsx            ← MODIFIED  (wrap delete in startTransition with await)
```

---

## Architecture Overview

All bugs are isolated to specific files — no cross-cutting architectural changes. Each fix is surgical:

- **API contract fix** (`discover.ts`): Perplexity dropped `json_object`. Swap to `json_schema` format (already correct in `perplexity.ts`).
- **Security fix** (`resources.ts`): `reorderResources` builds raw SQL via string interpolation. Replace with the parameterized loop pattern used by all other reorder actions.
- **Missing action + default fix** (`news.ts`): `updateNews` strips `isPublished`. Add `toggleNewsPublished(id, isPublished)` as a dedicated action. Also change `createNews` to insert with `isPublished: false` so new posts start as drafts (the DB schema defaults to `true`, which is wrong for a CMS).
- **Auth guard** (`layout.tsx`): Layout renders the admin shell even for unauthenticated users. Add redirect before the DB query — the `db.select` for `unreadCount` must live *after* the auth check so unauthenticated requests never hit the DB.
- **UI wiring** (`AdminNewsClient.tsx`): Replace broken `updateNews` call in `togglePublish` with new `toggleNewsPublished`. Also fix unawaited `deleteNews` call.
- **Missing refresh** (`AdminInstagramClient.tsx`): `handleToggle` calls `togglePostVisibility` but never calls `router.refresh()`, so the UI never updates.
- **Missing await** (`AdminEventsClient.tsx`): `deleteEvent(id)` passed to `SortableList`'s `onDelete` prop without `await`. Wrap in `startTransition` — this satisfies `onDelete`'s `void` return type since `startTransition` itself returns `void`.

---

## Key Pseudocode

### 1. discover.ts — fix searchEvents

```typescript
response_format: {
  type: "json_schema" as const,
  json_schema: {
    name: "events_response",
    schema: {
      type: "object",
      properties: {
        events: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              date: { type: "string" },
              description: { type: "string" },
              time: { type: "string" },
              artist_name: { type: "string" },
              source_url: { type: "string" },
            },
            required: ["title", "date", "description"],
          },
        },
      },
      required: ["events"],
    },
  },
},
```

### 2. discover.ts — fix searchResources

```typescript
response_format: {
  type: "json_schema" as const,
  json_schema: {
    name: "resources_response",
    schema: {
      type: "object",
      properties: {
        resources: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              url: { type: "string" },
              description: { type: "string" },
            },
            required: ["name", "url", "description"],
          },
        },
      },
      required: ["resources"],
    },
  },
},
```

### 3. resources.ts — fix reorderResources

```typescript
// BEFORE (SQL injection via sql.raw string interpolation):
const cases = orderedIds.map((id, i) => `WHEN id = ${Number(id)} THEN ${i}`).join(" ");
await db.execute(sql.raw(`UPDATE community_resources SET sort_order = CASE ${cases} END WHERE id IN (${idList})`));

// AFTER — parameterized loop (matches events.ts, records.ts, reviews.ts, partners.ts):
for (let i = 0; i < orderedIds.length; i++) {
  await db
    .update(communityResources)
    .set({ sortOrder: i })
    .where(eq(communityResources.id, orderedIds[i]));
}
// Also remove the `sql` import if no longer used elsewhere in the file
```

### 4. layout.tsx — auth redirect BEFORE DB query

```typescript
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const session = await getSession();

  // Auth check FIRST — before any DB access
  if (!session.isLoggedIn) redirect("/admin/login");

  // Only reaches here if authenticated
  let unreadCount = 0;
  try {
    const [unreadResult] = await db
      .select({ count: count() })
      .from(contactSubmissions)
      .where(eq(contactSubmissions.isRead, false));
    unreadCount = unreadResult?.count ?? 0;
  } catch {
    // DB error should not block the admin layout
  }

  return (
    <AdminLayoutClient email={session.email} name={session.name} unreadCount={unreadCount}>
      {children}
    </AdminLayoutClient>
  );
}
```

### 5. news.ts — add toggleNewsPublished + fix createNews default

```typescript
// In createNews, add isPublished: false explicitly:
await db.insert(news).values({
  title: parsed.title,
  content: parsed.content,
  imageUrl: parsed.imageUrl || null,
  isPublished: false,   // ← override DB default of true; new posts start as drafts
});

// New action after updateNews:
export async function toggleNewsPublished(id: number, isPublished: boolean) {
  const session = await getSession();
  if (!session.isLoggedIn) throw new Error("Unauthorized");

  await db
    .update(news)
    .set({ isPublished })
    .where(eq(news.id, id));

  revalidatePath("/");
  revalidatePath("/admin/news");
}
```

### 6. AdminNewsClient.tsx — wire togglePublish + fix delete

```typescript
import { createNews, updateNews, deleteNews, toggleNewsPublished } from "@/lib/actions/news";

// togglePublish — replace entire function body:
function togglePublish(item: News) {
  startTransition(async () => {
    await toggleNewsPublished(item.id, !item.isPublished);
  });
}

// delete button onClick — currently: if (confirm("Delete this post?")) deleteNews(item.id);
// Replace with:
onClick={() => {
  if (confirm("Delete this post?")) {
    startTransition(async () => {
      await deleteNews(item.id);
    });
  }
}}
```

### 7. AdminInstagramClient.tsx — refresh after toggle

```typescript
function handleToggle(id: number) {
  startTransition(async () => {
    await togglePostVisibility(id);
    router.refresh();   // ← ADD after the action
  });
}
```

### 8. AdminEventsClient.tsx — await delete

```typescript
// Find the onDelete prop passed to SortableList. Currently:
onDelete={(id) => {
  if (confirm("Delete this event?")) deleteEvent(id);
}}

// Replace with (startTransition returns void, satisfying onDelete: (id) => void):
onDelete={(id) => {
  if (confirm("Delete this event?")) {
    startTransition(async () => {
      await deleteEvent(id);
    });
  }
}}
// Confirm AdminEventsClient already imports useTransition and has a startTransition; if not, add it.
```

---

## Tasks (Implementation Order)

### Batch 1 — Critical Fixes
- [ ] **1.1** `src/lib/actions/discover.ts` — Fix `searchEvents()`: replace `response_format: { type: "json_object" }` with the full `json_schema` events shape (pseudocode section 1 above). Keep `as any` cast on the outer object since `search_recency_filter` is not in OpenAI types.
- [ ] **1.2** `src/lib/actions/discover.ts` — Fix `searchResources()`: same pattern, using resources schema (name, url, description — pseudocode section 2 above).
- [ ] **1.3** `src/lib/actions/resources.ts` — Replace `reorderResources` raw SQL with parameterized loop (pseudocode section 3). Remove the `sql` import if it becomes unused after the change.
- [ ] **1.4** `src/app/admin/layout.tsx` — Add `redirect("/admin/login")` immediately after `getSession()`. Move `db.select` for unreadCount to after the auth check, wrapped in try/catch (pseudocode section 4).

### Batch 2 — Data Integrity Fixes
- [ ] **2.1** `src/lib/actions/news.ts` — In `createNews`, add `isPublished: false` to the insert values so new posts start as drafts.
- [ ] **2.2** `src/lib/actions/news.ts` — Add `toggleNewsPublished(id: number, isPublished: boolean)` action after `updateNews` (pseudocode section 5). Add `revalidatePath("/")` and `revalidatePath("/admin/news")` in the new action.
- [ ] **2.3** `src/app/admin/news/AdminNewsClient.tsx` — Import `toggleNewsPublished`. Replace `togglePublish` function body with the new action call (pseudocode section 6).
- [ ] **2.4** `src/app/admin/news/AdminNewsClient.tsx` — Fix the unawaited `deleteNews` onClick (line ~113): wrap in `startTransition(async () => { await deleteNews(item.id); })`.
- [ ] **2.5** `src/app/admin/instagram/AdminInstagramClient.tsx` — Add `router.refresh()` after `await togglePostVisibility(id)` in `handleToggle` (pseudocode section 7).
- [ ] **2.6** `src/app/admin/events/AdminEventsClient.tsx` — Find the `onDelete` prop passed to `SortableList`. Wrap `deleteEvent(id)` in `startTransition` with `await` (pseudocode section 8). Confirm `useTransition`/`startTransition` is already imported; add if missing.

### Batch 3 — Deploy
- [ ] **3.1** Commit all changes with message: `"Fix admin bugs: Perplexity response_format, SQL injection, news publish toggle, auth redirect, Instagram toggle refresh, delete awaits"`
- [ ] **3.2** Push to GitHub → wait for Netlify deploy to reach `ready` state.

### Batch 4 — Chrome DevTools Verification
Use Chrome DevTools MCP. Admin URL: `https://second-chance-records.netlify.app/admin`. Login: credentials from brief.

- [ ] **4.1 Auth guard** — Navigate directly to `/admin/events` without a session (ensure no session cookie). Confirm immediate redirect to `/admin/login`.
- [ ] **4.2 Login** — Fill email + password on `/admin/login`. Submit. Confirm redirect to `/admin` dashboard.
- [ ] **4.3 Dashboard** — Confirm page loads, shows navigation sidebar, stats or links visible.
- [ ] **4.4 Events — CRUD** — Create a new event. Confirm it appears in list. Edit it. Confirm change saved. Delete it (confirm it disappears).
- [ ] **4.5 Events — AI Discover** — Use the event discovery/search feature. Submit a query. Confirm JSON results appear without a 400 error. Add one discovered event.
- [ ] **4.6 News — CRUD** — Create a news post. Confirm it appears as **Draft** (not Published — we set isPublished: false on create). Click "Publish". Confirm status changes to **Published**. Edit it. Delete it.
- [ ] **4.7 Records — CRUD** — Create a record in "New Arrivals" tab. Confirm it appears under that tab. Switch tabs. Edit the record. Delete it.
- [ ] **4.8 Reviews — CRUD** — Create a review. Edit it. Delete it.
- [ ] **4.9 Partners — CRUD** — Create a partner. Edit it. Delete it.
- [ ] **4.10 Resources — CRUD** — Create a resource. Edit it. Delete it. Drag to reorder two items — confirm no error and order persists on refresh.
- [ ] **4.11 Resources — AI Discover** — Search for Portland vinyl resources. Confirm results load (no 400 error). Add one.
- [ ] **4.12 Instagram — Toggle** — Click "Hide" on a post. Confirm the post grays out after the page refreshes. Click "Show". Confirm it returns to full opacity after refresh.
- [ ] **4.13 Instagram — Sync** — Click "Sync Now". Confirm sync message appears (success message or "0 new posts" — not a crash/error).
- [ ] **4.14 Subscribers** — Confirm list loads. Toggle one subscriber active/inactive. Confirm state updates after refresh.
- [ ] **4.15 Contact Submissions** — Confirm submissions load. Mark one as read. Delete one.
- [ ] **4.16 Settings** — Update one setting. Click Save. Confirm "Saved" feedback appears.
- [ ] **4.17 Logout** — Click Logout. Confirm redirect to `/admin/login`. Attempt to navigate to `/admin` — confirm redirect back to login.

---

## Reference Patterns

**Parameterized reorder (events.ts):**
```typescript
for (let i = 0; i < orderedIds.length; i++) {
  await db.update(events).set({ sortOrder: i }).where(eq(events.id, orderedIds[i]));
}
```

**Working json_schema format (perplexity.ts:38–64)** — see pseudocode sections 1 and 2 above.

---

## Score: 9.5/10
All bugs are concrete with exact file references. Fix patterns match existing codebase conventions. Chrome verification steps are specific and executable against the live site.

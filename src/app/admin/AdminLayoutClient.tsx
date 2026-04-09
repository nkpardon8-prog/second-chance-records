"use client";

import { useTransition } from "react";
import { logoutAction } from "@/lib/actions/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Button from "@/components/ui/Button";

interface AdminLayoutClientProps {
  email: string;
  name: string;
  unreadCount: number;
  children: React.ReactNode;
}

export default function AdminLayoutClient({
  email,
  name,
  unreadCount,
  children,
}: AdminLayoutClientProps) {
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      await logoutAction();
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar unreadCount={unreadCount} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between shrink-0">
          <h1 className="font-semibold text-gray-900 text-sm lg:text-base">
            Second Chance Records Admin
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:inline">
              {name || email}
            </span>
            <Button size="sm" variant="ghost" onClick={handleLogout} disabled={pending}>
              {pending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

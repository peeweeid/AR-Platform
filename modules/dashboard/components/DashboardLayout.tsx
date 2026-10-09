"use client";

import { ReactNode, useState } from "react";
import { signOut } from "@/modules/auth/services/authService";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {

  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await signOut();
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-64 shrink-0 flex-col border-r bg-white">
        <div className="border-b px-6 py-5">
          <h1 className="text-lg font-bold">
            AR Platform
          </h1>

          <p className="mt-1 text-xs text-gray-500">
            WebAR CMS
          </p>
        </div>

        <nav className="p-4">
          <div className="rounded-lg bg-gray-100 px-4 py-3 text-sm font-medium">
            Dashboard
          </div>

          <div className="mt-1 rounded-lg px-4 py-3 text-sm text-gray-600">
            Projects
          </div>

          <div className="mt-1 rounded-lg px-4 py-3 text-sm text-gray-600">
            Settings
          </div>

          <div className="mt-auto border-t p-4">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full rounded-lg px-4 py-3 text-left text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
            >
              {loggingOut ? "Signing out..." : "Logout"}
            </button>
          </div>
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
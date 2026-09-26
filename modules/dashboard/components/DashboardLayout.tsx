import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="w-64 shrink-0 border-r bg-white">
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
        </nav>
      </aside>

      <main className="min-w-0 flex-1">
        {children}
      </main>
    </div>
  );
}
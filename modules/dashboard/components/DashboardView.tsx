export function DashboardView() {
  return (
    <div className="p-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Dashboard
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Overview of your AR projects and experiences.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Total Projects
          </p>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Published
          </p>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Draft
          </p>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">
            Expiring Soon
          </p>

          <p className="mt-2 text-3xl font-bold">
            0
          </p>
        </div>
      </div>
    </div>
  );
}
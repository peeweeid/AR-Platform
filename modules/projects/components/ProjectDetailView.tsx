import Link from "next/link";
import type { Project } from "../types/project";

interface ProjectDetailViewProps {
  project: Project;
}

const navigationItems = [
  {
    label: "Overview",
    href: "",
  },
  {
    label: "General",
    href: "/general",
  },
  {
    label: "Markers",
    href: "/markers",
  },
  {
    label: "Scenes",
    href: "/scenes",
  },
  {
    label: "Home & UI",
    href: "/home-ui",
  },
  {
    label: "How to Play",
    href: "/how-to-play",
  },
  {
    label: "About",
    href: "/about",
  },
  {
    label: "Settings",
    href: "/settings",
  },
  {
    label: "Assets",
    href: "/assets",
  },
  {
    label: "Preview",
    href: "/preview",
  },
  {
    label: "Publish",
    href: "/publish",
  },
];

export function ProjectDetailView({
  project,
}: ProjectDetailViewProps) {
  const basePath = `/dashboard/projects/${project.id}`;

  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold">
          {project.name}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {project.slug}
        </p>
      </div>

      <div className="mt-8 flex gap-8">
        <aside className="w-56 shrink-0">
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={`${basePath}${item.href}`}
                className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 flex-1">
          <div>
            <h2 className="text-xl font-semibold">
              Overview
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Manage and configure this AR project.
            </p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-background p-5">
              <p className="text-sm text-muted-foreground">
                Status
              </p>

              <p className="mt-2 font-medium capitalize">
                {project.status}
              </p>
            </div>

            <div className="rounded-lg border bg-background p-5">
              <p className="text-sm text-muted-foreground">
                Project Type
              </p>

              <p className="mt-2 font-medium">
                {project.project_type ?? "Not configured"}
              </p>
            </div>

            <div className="rounded-lg border bg-background p-5">
              <p className="text-sm text-muted-foreground">
                Institution
              </p>

              <p className="mt-2 font-medium">
                {project.institution ?? "Not configured"}
              </p>
            </div>

            <div className="rounded-lg border bg-background p-5">
              <p className="text-sm text-muted-foreground">
                Published
              </p>

              <p className="mt-2 font-medium">
                {project.published_at
                  ? new Date(
                      project.published_at,
                    ).toLocaleDateString("id-ID")
                  : "Not published"}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-lg border bg-background p-5">
            <p className="text-sm text-muted-foreground">
              Description
            </p>

            <p className="mt-2">
              {project.description ?? "No description yet."}
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
import { ProjectsView } from "./components/ProjectsView";

export function ProjectsModule() {
  return (
    <div className="p-8">
      <div>
        <h1 className="text-2xl font-bold">
          Projects
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage your AR projects.
        </p>
      </div>

      <div className="mt-8">
        <ProjectsView />
      </div>
    </div>
  );
}
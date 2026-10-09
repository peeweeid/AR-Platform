import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { AddSceneView } from "@/modules/projects/components/AddSceneView";

interface AddScenePageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function AddScenePage({
  params,
}: AddScenePageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      <AddSceneView projectId={project.id} />
    </div>
  );
}
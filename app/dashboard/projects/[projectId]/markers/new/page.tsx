import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { AddMarkerView } from "@/modules/projects/components/AddMarkerView";

interface AddMarkerPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function AddMarkerPage({
  params,
}: AddMarkerPageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      <AddMarkerView projectId={project.id} />
    </div>
  );
}
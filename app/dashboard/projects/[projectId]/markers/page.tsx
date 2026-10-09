import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { MarkersView } from "@/modules/projects/components/MarkersView";

interface MarkersPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function MarkersPage({
  params,
}: MarkersPageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      <MarkersView projectId={project.id} />
    </div>
  );
}
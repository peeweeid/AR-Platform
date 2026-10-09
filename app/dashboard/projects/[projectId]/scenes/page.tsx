import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { ScenesView } from "@/modules/projects/components/ScenesView";

interface ScenesPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ScenesPage({
  params,
}: ScenesPageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      <ScenesView projectId={project.id} />
    </div>
  );
}
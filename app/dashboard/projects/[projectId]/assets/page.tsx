import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { AssetsView } from "@/modules/projects/components/AssetsView";

interface AssetsPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function AssetsPage({
  params,
}: AssetsPageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

  return (
    <div className="p-8">
      <AssetsView projectId={project.id} />
    </div>
  );
}
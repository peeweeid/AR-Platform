import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { ProjectDetailView } from "@/modules/projects/components/ProjectDetailView";
interface ProjectDetailPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectDetailPage({
  params,
}: ProjectDetailPageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

return <ProjectDetailView project={project} />;
}
import { notFound } from "next/navigation";
import { getProjectById } from "@/modules/projects/services/projectServerService";
import { GeneralView } from "@/modules/projects/components/GeneralView";

interface GeneralPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function GeneralPage({
  params,
}: GeneralPageProps) {
  const { projectId } = await params;

  let project;

  try {
    project = await getProjectById(projectId);
  } catch {
    notFound();
  }

    return (
    <div className="p-8">
        <GeneralView project={project} />
    </div>
    );
}
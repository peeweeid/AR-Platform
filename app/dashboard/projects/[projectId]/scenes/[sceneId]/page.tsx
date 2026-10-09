import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SceneEditorView } from "@/modules/projects/components/SceneEditorView";
import type { Scene } from "@/modules/projects/types/scene";

interface SceneDetailPageProps {
  params: Promise<{
    projectId: string;
    sceneId: string;
  }>;
}

export default async function SceneDetailPage({
  params,
}: SceneDetailPageProps) {
  const { projectId, sceneId } = await params;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("id", sceneId)
    .eq("project_id", projectId)
    .single();

  if (error || !data) {
    notFound();
  }

  const scene = data as Scene;

  return (
    <div className="p-8">
      <SceneEditorView scene={scene} />
    </div>
  );
}
import { createClient } from "@/lib/supabase/client";
import type { Scene } from "../types/scene";

export async function getScenes(
  projectId: string,
): Promise<Scene[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scenes")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}
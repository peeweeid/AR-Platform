import { createClient } from "@/lib/supabase/server";
import type { Project } from "../types/project";

export async function getProjectById(
  projectId: string,
): Promise<Project> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}
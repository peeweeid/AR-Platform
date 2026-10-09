import { createClient } from "@/lib/supabase/client";
import type { Project } from "../types/project";

export async function getProjects(): Promise<Project[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", {
      ascending: false,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function updateProject(
  projectId: string,
  updates: {
    name: string;
    slug: string;
    title: string | null;
    description: string | null;
    institution: string | null;
    project_type: string | null;
  },
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("projects")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) {
    throw error;
  }
}
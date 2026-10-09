import { createClient } from "@/lib/supabase/client";
import type { Asset } from "../types/asset";

export async function getAssets(
  projectId: string,
): Promise<Asset[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("assets")
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

export async function uploadAsset(
  projectId: string,
  file: File,
): Promise<Asset> {
  const supabase = createClient();

  const fileExtension =
    file.name.split(".").pop()?.toLowerCase() ?? "glb";

  const fileName = `${crypto.randomUUID()}.${fileExtension}`;

  const filePath = `${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(filePath, file, {
      contentType:
        file.type || "model/gltf-binary",
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("assets")
    .insert({
      project_id: projectId,
      name: file.name,
      asset_type: "model",
      file_path: filePath,
      file_size: file.size,
      mime_type:
        file.type || "model/gltf-binary",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getAssetUrl(
  filePath: string,
): Promise<string> {
  const supabase = createClient();

  const { data, error } =
    await supabase.storage
      .from("assets")
      .createSignedUrl(
        filePath,
        60 * 60,
      );

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
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
    file.name.split(".").pop()?.toLowerCase() ?? "";

  // Tentukan jenis asset berdasarkan ekstensi file.
  let assetType: Asset["asset_type"];
  let mimeType: string;

  if (fileExtension === "glb") {
    assetType = "model";
    mimeType = "model/gltf-binary";
  } else if (fileExtension === "mp3") {
    assetType = "audio";
    mimeType = "audio/mpeg";
  } else if (fileExtension === "wav") {
    assetType = "audio";
    mimeType = "audio/wav";
  } else if (fileExtension === "ogg") {
    assetType = "audio";
    mimeType = "audio/ogg";
  } else {
    throw new Error(
      "Unsupported file type. Allowed: GLB, MP3, WAV, OGG.",
    );
  }

  const fileName =
    `${crypto.randomUUID()}.${fileExtension}`;

  const filePath = `${projectId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("assets")
    .upload(filePath, file, {
      contentType: mimeType,
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
      asset_type: assetType,
      file_path: filePath,
      file_size: file.size,
      mime_type: mimeType,
    })
    .select()
    .single();

  if (error) {
    // Hapus file dari Storage jika penyimpanan database gagal.
    await supabase.storage
      .from("assets")
      .remove([filePath]);

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
import { createClient } from "@/lib/supabase/client";
import type { Marker } from "../types/marker";

export async function getMarkers(
  projectId: string,
): Promise<Marker[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("markers")
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




export async function createMarker(
  projectId: string,
  name: string,
  file: File,
): Promise<Marker> {
  const supabase = createClient();

  const fileExtension =
    file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  const fileName = `${crypto.randomUUID()}.${fileExtension}`;

  const filePath = `${projectId}/${fileName}`;

const image = new Image();

const imageDimensions = await new Promise<{
  width: number;
  height: number;
}>((resolve, reject) => {
  image.onload = () => {
    resolve({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
  };

  image.onerror = () => {
    reject(
      new Error("Failed to read marker image dimensions."),
    );
  };

  image.src = URL.createObjectURL(file);
});

URL.revokeObjectURL(image.src);

  const { error: uploadError } = await supabase.storage
    .from("markers")
    .upload(filePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data, error } = await supabase
    .from("markers")
    .insert({
      project_id: projectId,
      name: name.trim(),
      image_path: filePath,
      image_width: imageDimensions.width,
      image_height: imageDimensions.height,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getMarkerImageUrl(
  imagePath: string,
): Promise<string | null> {
  const supabase = createClient();

  const { data, error } = await supabase.storage
    .from("markers")
    .createSignedUrl(imagePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
export async function deleteMarker(
  markerId: string,
): Promise<void> {
  const supabase = createClient();

  // Get marker first so we know the Storage path.
  const { data: marker, error: fetchError } =
    await supabase
      .from("markers")
      .select("image_path")
      .eq("id", markerId)
      .single();

  if (fetchError) {
    throw fetchError;
  }

  // Delete the file from Storage first.
  if (marker.image_path) {
    const { error: storageError } =
      await supabase.storage
        .from("markers")
        .remove([marker.image_path]);

    if (storageError) {
      throw storageError;
    }
  }

  // Then delete the database row.
  const { error: deleteError } = await supabase
    .from("markers")
    .delete()
    .eq("id", markerId);

  if (deleteError) {
    throw deleteError;
  }
}
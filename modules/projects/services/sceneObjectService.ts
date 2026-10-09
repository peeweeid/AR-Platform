import { createClient } from "@/lib/supabase/client";
import type { SceneObject } from "../types/sceneObject";

export async function getSceneObjects(
  sceneId: string,
): Promise<SceneObject[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scene_objects")
    .select("*")
    .eq("scene_id", sceneId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function createSceneObject(
  sceneId: string,
  name: string,
  parentId: string | null = null,
  assetId: string | null = null,
): Promise<SceneObject> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scene_objects")
    .insert({
      scene_id: sceneId,
      name: name.trim(),
      object_type: "model",
      parent_id: parentId,
      asset_id: assetId,
      visible: true,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateSceneObjectTransform(
  objectId: string,
  transform: {
    position_x: number;
    position_y: number;
    position_z: number;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    scale_x: number;
    scale_y: number;
    scale_z: number;
  },
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_objects")
    .update({
      ...transform,
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectId);

  if (error) throw error;
}


export async function deleteSceneObject(
  objectId: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_objects")
    .delete()
    .eq("id", objectId);

  if (error) {
    throw error;
  }
}


export async function renameSceneObject(
  objectId: string,
  newName: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_objects")
    .update({
      name: newName.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectId);

  if (error) {
    throw error;
  }
}


export async function updateSceneObjectParent(
  objectId: string,
  parentId: string | null,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_objects")
    .update({
      parent_id: parentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectId);

  if (error) {
    throw error;
  }
}


export async function duplicateSceneObject(
  objectId: string,
): Promise<SceneObject> {
  const supabase = createClient();

  const { data: original, error: fetchError } = await supabase
    .from("scene_objects")
    .select("*")
    .eq("id", objectId)
    .single();

  if (fetchError) {
    throw fetchError;
  }

  const { data: duplicate, error: insertError } = await supabase
    .from("scene_objects")
    .insert({
      scene_id: original.scene_id,
      name: `${original.name} Copy`,
      object_type: original.object_type,
      parent_id: original.parent_id,
      asset_id: original.asset_id,
      position_x: original.position_x,
      position_y: original.position_y,
      position_z: original.position_z,
      rotation_x: original.rotation_x,
      rotation_y: original.rotation_y,
      rotation_z: original.rotation_z,
      scale_x: original.scale_x,
      scale_y: original.scale_y,
      scale_z: original.scale_z,
    })
    .select()
    .single();

  if (insertError) {
    throw insertError;
  }

  return duplicate;
}


export async function updateSceneObjectVisibility(
  objectId: string,
  visible: boolean,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_objects")
    .update({
      visible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectId);

  if (error) {
    throw error;
  }
}


export async function updateSceneObjectLock(
  objectId: string,
  locked: boolean,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_objects")
    .update({
      locked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", objectId);

  if (error) {
    throw error;
  }
}
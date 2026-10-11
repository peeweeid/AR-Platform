
import { createClient } from "@/lib/supabase/client";

import type {
  BehaviorAction,
  BehaviorTriggerType,
  SceneBehavior,
} from "../types/sceneBehavior";

// Mengambil seluruh behavior dalam satu scene.
export async function getSceneBehaviors(
  sceneId: string,
): Promise<SceneBehavior[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scene_behaviors")
    .select("*")
    .eq("scene_id", sceneId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []) as SceneBehavior[];
}

// Mengambil behavior milik satu objek.
export async function getObjectBehaviors(
  objectId: string,
): Promise<SceneBehavior[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scene_behaviors")
    .select("*")
    .eq("object_id", objectId)
    .order("created_at", {
      ascending: true,
    });

  if (error) throw error;

  return (data ?? []) as SceneBehavior[];
}

// Membuat behavior baru.
export async function createSceneBehavior(
  sceneId: string,
  objectId: string,
  name: string = "New Behavior",
): Promise<SceneBehavior> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scene_behaviors")
    .insert({
      scene_id: sceneId,
      object_id: objectId,
      name: name.trim() || "New Behavior",
      enabled: true,
      trigger_type: "on_tap",
      trigger_target_id: null,
      actions: [],
    })
    .select()
    .single();

  if (error) throw error;

  return data as SceneBehavior;
}

// Memperbarui konfigurasi behavior.
export async function updateSceneBehavior(
  behaviorId: string,
  updates: {
    name?: string;
    enabled?: boolean;
    trigger_type?: BehaviorTriggerType;
    trigger_target_id?: string | null;
    actions?: BehaviorAction[];
  },
): Promise<SceneBehavior> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("scene_behaviors")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", behaviorId)
    .select()
    .single();

  if (error) throw error;

  return data as SceneBehavior;
}

// Memperbarui daftar action suatu behavior.
export async function updateBehaviorActions(
  behaviorId: string,
  actions: BehaviorAction[],
): Promise<SceneBehavior> {
  return updateSceneBehavior(behaviorId, {
    actions,
  });
}

// Menghapus behavior.
export async function deleteSceneBehavior(
  behaviorId: string,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("scene_behaviors")
    .delete()
    .eq("id", behaviorId);

  if (error) throw error;
}

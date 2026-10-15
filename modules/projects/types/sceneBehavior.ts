
export type BehaviorTriggerType =
  | "on_tap"
  | "on_collision"
  | "on_animation_complete"
  | "on_marker_found";

export type BehaviorActionType =
  | "play_animation"
  | "show_object"
  | "hide_object"
  | "play_audio"
  | "show_modal"
  | "set_variable"
  | "spawn_object";

export type BehaviorLoopMode = "loop" | "once";

export type BehaviorVariableOperation =
  | "set"
  | "add"
  | "subtract";
// Pengaturan untuk setiap action.
export interface BehaviorAction {
  id: string;
  type: BehaviorActionType;

  // Objek yang menjadi target action.
  targetObjectId?: string;

  // Pengaturan animasi.
  animationName?: string;
  startFrame?: number;
  endFrame?: number;
  loopMode?: BehaviorLoopMode;

  // Asset audio atau konten lain.
  assetId?: string;

  // Pengaturan loop khusus Play Audio.
  audioLoopMode?: BehaviorLoopMode;

  // Cegah Play Once bertumpuk saat audio masih aktif.
  preventOverlap?: boolean;

  // Konten modal.
  title?: string;
  description?: string;

  // Gambar opsional untuk Show Modal.
  modalImageAssetId?: string;

  // Variabel.
variableName?: string;
variableOperation?: BehaviorVariableOperation;
variableValue?: number;

  // Menunggu action selesai sebelum melanjutkan.
  waitUntilComplete?: boolean;
}

// Satu behavior memiliki satu trigger
// dan dapat menjalankan beberapa action.
export interface SceneBehavior {
  id: string;
  scene_id: string;
  object_id: string;

  name: string;
  enabled: boolean;

  trigger_type: BehaviorTriggerType;

  // Untuk trigger collision atau kondisi tertentu.
  trigger_target_id: string | null;

  actions: BehaviorAction[];

  created_at: string;
  updated_at: string;
}

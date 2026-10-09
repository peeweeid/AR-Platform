export interface SceneObject {
  id: string;
  scene_id: string;
  name: string;
  object_type: string;
  asset_id: string | null;
  parent_id: string | null;

  position_x: number;
  position_y: number;
  position_z: number;

  rotation_x: number;
  rotation_y: number;
  rotation_z: number;

  scale_x: number;
  scale_y: number;
  scale_z: number;

  visible: boolean;
  locked: boolean;

  created_at: string;
  updated_at: string;
}
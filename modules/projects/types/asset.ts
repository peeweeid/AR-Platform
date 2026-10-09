export type AssetType =
  | "model"
  | "audio"
  | "image"
  | "ui";

export interface Asset {
  id: string;
  project_id: string;
  name: string;
  asset_type: AssetType;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  created_at: string;
  updated_at: string;
}
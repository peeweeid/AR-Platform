export interface Marker {
  id: string;
  project_id: string;
  name: string;
  image_path: string | null;
  image_width: number | null;
  image_height: number | null;
  created_at: string;
  updated_at: string;
}
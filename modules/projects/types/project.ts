export type ProjectStatus =
  | "draft"
  | "preview"
  | "published"
  | "expiring"
  | "expired"
  | "archived";

export interface Project {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  description: string | null;
  institution: string | null;
  project_type: string | null;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  expires_at: string | null;
}
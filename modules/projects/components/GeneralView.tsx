"use client";

import { useState } from "react";
import type { Project } from "../types/project";
import { updateProject } from "../services/projectService";

interface GeneralViewProps {
  project: Project;
}

export function GeneralView({
  project,
}: GeneralViewProps) {
  const [name, setName] = useState(project.name);
  const [slug, setSlug] = useState(project.slug);
  const [title, setTitle] = useState(project.title ?? "");
  const [description, setDescription] = useState(
    project.description ?? "",
  );
  const [institution, setInstitution] = useState(
    project.institution ?? "",
  );
  const [projectType, setProjectType] = useState(
    project.project_type ?? "",
  );

  const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

async function handleSave() {
  setIsSaving(true);
  setMessage("");
  setErrorMessage("");

  try {
    await updateProject(project.id, {
      name: name.trim(),
      slug: slug.trim(),
      title: title.trim() || null,
      description: description.trim() || null,
      institution: institution.trim() || null,
      project_type: projectType.trim() || null,
    });

    setMessage("Changes saved successfully.");
  } catch (error) {
    console.error("Failed to save project:", error);

    setErrorMessage(
      "Failed to save changes. Check the slug and try again.",
    );
  } finally {
    setIsSaving(false);
  }
}

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">
          General
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Configure the basic information of this project.
        </p>
      </div>

      <div className="mt-8 max-w-2xl space-y-6">
        <div>
          <label className="text-sm font-medium">
            Project Name
          </label>

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Slug
          </label>

          <input
            value={slug}
            onChange={(event) =>
              setSlug(event.target.value)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Title
          </label>

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Description
          </label>

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows={4}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Institution
          </label>

          <input
            value={institution}
            onChange={(event) =>
              setInstitution(event.target.value)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Project Type
          </label>

          <input
            value={projectType}
            onChange={(event) =>
              setProjectType(event.target.value)
            }
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
                <div className="space-y-3 border-t pt-6">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim() || !slug.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

          {message && (
            <p className="text-sm text-green-600">
              {message}
            </p>
          )}

          {errorMessage && (
            <p className="text-sm text-destructive">
              {errorMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

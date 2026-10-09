"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface AddSceneViewProps {
  projectId: string;
}

export function AddSceneView({
  projectId,
}: AddSceneViewProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!name.trim()) {
      setError("Scene name is required.");
      return;
    }

    setSaving(true);
    setError("");

    const supabase = createClient();

    const { error: insertError } = await supabase
      .from("scenes")
      .insert({
        project_id: projectId,
        name: name.trim(),
        description: description.trim() || null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    router.push(
      `/dashboard/projects/${projectId}/scenes`,
    );

    router.refresh();
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">
          Add Scene
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a new AR scene for this project.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-8 max-w-xl space-y-6"
      >
        <div>
          <label className="text-sm font-medium">
            Scene Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="e.g. Forest Scene"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
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
            placeholder="Optional scene description"
            rows={4}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Creating..." : "Create Scene"}
        </button>
      </form>
    </div>
  );
}
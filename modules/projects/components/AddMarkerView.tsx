"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createMarker } from "../services/markerService";

interface AddMarkerViewProps {
  projectId: string;
}

export function AddMarkerView({
  projectId,
}: AddMarkerViewProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setErrorMessage("Marker name is required.");
      return;
    }

    if (!file) {
      setErrorMessage("Marker image is required.");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await createMarker(
        projectId,
        name,
        file,
      );

      router.push(
        `/dashboard/projects/${projectId}/markers`,
      );
      router.refresh();
    } catch (error) {
      console.error("Failed to create marker:", error);

      setErrorMessage(
        "Failed to create marker.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">
          Add Marker
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Add an image marker to this AR project.
        </p>
      </div>

      <div className="mt-8 max-w-2xl space-y-6">
        <div>
          <label className="text-sm font-medium">
            Marker Name
          </label>

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Example: Forest Marker"
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-sm font-medium">
            Marker Image
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(event) =>
              setFile(
                event.target.files?.[0] ?? null,
              )
            }
            className="mt-2 block w-full text-sm"
          />

          {file && (
            <p className="mt-2 text-sm text-muted-foreground">
              Selected: {file.name}
            </p>
          )}
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSaving}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Uploading..."
            : "Add Marker"}
        </button>
      </div>
    </div>
  );
}
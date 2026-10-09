"use client";

import { useEffect, useState } from "react";
import {
  getMarkers,
  getMarkerImageUrl,
  deleteMarker,
} from "../services/markerService";
import type { Marker } from "../types/marker";


interface MarkersViewProps {
  projectId: string;
}

export function MarkersView({
  projectId,
}: MarkersViewProps) {
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [imageUrls, setImageUrls] = useState<
  Record<string, string>
>({});
const [deletingMarkerId, setDeletingMarkerId] =
  useState<string | null>(null);

 useEffect(() => {
  async function loadMarkers() {
    const data = await getMarkers(projectId);

    setMarkers(data);

    const urls: Record<string, string> = {};

    for (const marker of data) {
      if (!marker.image_path) {
        continue;
      }

      const url = await getMarkerImageUrl(
        marker.image_path,
      );

      if (url) {
        urls[marker.id] = url;
      }
    }

    setImageUrls(urls);
  }

  loadMarkers();
}, [projectId]);

async function handleDelete(markerId: string) {
  const confirmed = window.confirm(
    "Delete this marker? The marker image will also be removed from Storage.",
  );

  if (!confirmed) {
    return;
  }

  setDeletingMarkerId(markerId);

  try {
    await deleteMarker(markerId);

    setMarkers((currentMarkers) =>
      currentMarkers.filter(
        (marker) => marker.id !== markerId,
      ),
    );

    setImageUrls((currentUrls) => {
      const nextUrls = { ...currentUrls };

      delete nextUrls[markerId];

      return nextUrls;
    });
  } catch (error) {
    console.error(
      "Failed to delete marker:",
      error,
    );

    window.alert(
      "Failed to delete marker.",
    );
  } finally {
    setDeletingMarkerId(null);
  }
}

  return (
    <div>
     <div className="flex items-start justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold">
            Markers
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
            Manage the image markers used by this AR experience.
            </p>
        </div>

        <a
            href={`/dashboard/projects/${projectId}/markers/new`}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
            Add Marker
        </a>
    </div>
      <div className="mt-8 rounded-lg border bg-background p-6">
        {markers.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No markers configured yet.
          </div>
        ) : (
          <div>
     {markers.map((marker) => (
            <div
                key={marker.id}
                className="flex gap-4 border-b py-4 last:border-b-0"
            >
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted">
                {imageUrls[marker.id] ? (
                    <img
                    src={imageUrls[marker.id]}
                    alt={marker.name}
                    className="h-full w-full object-cover"
                    />
                ) : (
                    <span className="text-xs text-muted-foreground">
                    No image
                    </span>
                )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium">
                    {marker.name}
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                  {marker.image_width && marker.image_height
                  ? `${marker.image_width} × ${marker.image_height} px`
                  : "Image size unavailable"}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      handleDelete(marker.id)
                    }
                    disabled={
                      deletingMarkerId === marker.id
                    }
                    className="mt-3 text-sm font-medium text-destructive hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                  >
                  {deletingMarkerId === marker.id
                    ? "Deleting..."
                    : "Delete"}
              </button>
            </div>
            </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import {
  getAssets,
  uploadAsset,
} from "../services/assetService";
import type { Asset } from "../types/asset";

interface AssetsViewProps {
  projectId: string;
}

export function AssetsView({
  projectId,
}: AssetsViewProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadAssets() {
    const data = await getAssets(projectId);
    setAssets(data);
  }

  useEffect(() => {
    loadAssets();
  }, [projectId]);

  async function handleUpload() {
    if (!file) {
      return;
    }

    setUploading(true);
    setError("");

    try {
      const asset = await uploadAsset(
        projectId,
        file,
      );

      setAssets((current) => [
        ...current,
        asset,
      ]);

      setFile(null);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Failed to upload asset.",
      );
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold">
          Assets
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Manage the files used by this AR project.
        </p>
      </div>

      <div className="mt-8 rounded-lg border bg-background p-5">
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".glb,.gltf,.mp3,.wav,.ogg , .jpg , .jpeg , .png"
            onChange={(event) =>
              setFile(
                event.target.files?.[0] ?? null,
              )
            }
            className="text-sm"
          />

          <button
            type="button"
            disabled={!file || uploading}
            onClick={handleUpload}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <div className="mt-6 rounded-lg border bg-background">
        {assets.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No assets uploaded yet.
          </div>
        ) : (
          <div>
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="border-b p-5 last:border-b-0"
              >
                <p className="font-medium">
                  {asset.name}
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  {asset.asset_type} ·{" "}
                  {asset.file_size
                    ? `${(
                        asset.file_size /
                        1024 /
                        1024
                      ).toFixed(2)} MB`
                    : "Unknown size"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
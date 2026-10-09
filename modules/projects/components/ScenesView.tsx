"use client";

import { useEffect, useState } from "react";
import { getScenes } from "../services/sceneService";
import type { Scene } from "../types/scene";

interface ScenesViewProps {
  projectId: string;
}

export function ScenesView({
  projectId,
}: ScenesViewProps) {
  const [scenes, setScenes] = useState<Scene[]>([]);

  useEffect(() => {
    async function loadScenes() {
      const data = await getScenes(projectId);
      setScenes(data);
    }

    loadScenes();
  }, [projectId]);

  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Scenes
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Build and manage the AR scenes for this project.
          </p>
        </div>

        <a
          href={`/dashboard/projects/${projectId}/scenes/new`}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add Scene
        </a>
      </div>

      <div className="mt-8 rounded-lg border bg-background">
        {scenes.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">
            No scenes configured yet.
          </div>
        ) : (
          <div>
            {scenes.map((scene) => (
              <div
                key={scene.id}
                className="border-b p-5 last:border-b-0"
              >
                <a
                href={`/dashboard/projects/${projectId}/scenes/${scene.id}`}
                className="font-medium hover:underline"
                >
                {scene.name}
                </a>

                <p className="mt-1 text-sm text-muted-foreground">
                  {scene.description ??
                    "No description"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
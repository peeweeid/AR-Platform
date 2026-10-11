"use client";
import { useEffect, useState ,useRef} from "react";
const radiansToDegrees = (radians: number) =>
  (radians * 180) / Math.PI;

const degreesToRadians = (degrees: number) =>
  (degrees * Math.PI) / 180;
import type { Scene } from "../types/scene";
import type { SceneBehavior } from "../types/sceneBehavior";

import { getSceneBehaviors } from "../services/sceneBehaviorService";
import {
  Eye,
  EyeOff,
  Lock,
  LockOpen,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  Move,
} from "lucide-react";
import type { Asset } from "../types/asset";
import { SceneViewport } from "./scene-editor/SceneViewport";
import { BehaviorInspector } from "./scene-editor/BehaviorInspector";
import {
  getAssets,
  getAssetUrl,
} from "../services/assetService";
import type { SceneObject } from "../types/sceneObject";

import {
  createSceneObject,
  deleteSceneObject,
  duplicateSceneObject,
  getSceneObjects,
  renameSceneObject,
  updateSceneObjectLock,
  updateSceneObjectParent,
  updateSceneObjectTransform,
  updateSceneObjectVisibility,
} from "../services/sceneObjectService";




function SceneObjectTree({
  objects,
  parentId,
  selectedObjectId,
  onSelectObject,
  collapsedObjectIds,
  onToggleCollapse,
  searchQuery,
}: {
  objects: SceneObject[];
  parentId: string | null;
  selectedObjectId: string | null;
  onSelectObject: (objectId: string) => void;
  collapsedObjectIds: Set<string>;
  onToggleCollapse: (objectId: string) => void;
  searchQuery: string;
}) {
  const query = searchQuery.trim().toLowerCase();

  // Cari objek yang namanya cocok dengan pencarian.
  const matchingIds = new Set(
    objects
      .filter((object) =>
        object.name.toLowerCase().includes(query),
      )
      .map((object) => object.id),
  );

  // Tambahkan semua parent dari objek yang cocok.
  const visibleIds = new Set(matchingIds);

  for (const object of objects) {
    if (!visibleIds.has(object.id)) continue;

    let currentParentId = object.parent_id;

    while (currentParentId) {
      visibleIds.add(currentParentId);

      const parent = objects.find(
        (item) => item.id === currentParentId,
      );

      currentParentId = parent?.parent_id ?? null;
    }
  }

  const children = objects.filter(
    (object) =>
      object.parent_id === parentId &&
      (!query || visibleIds.has(object.id)),
  );

  return (
    <div className="space-y-1">
      {children.map((object) => {
        const hasChildren = objects.some(
          (item) => item.parent_id === object.id,
        );

        const isSelected = selectedObjectId === object.id;
        const isCollapsed = collapsedObjectIds.has(object.id);

        // Saat mencari, buka jalur ke hasil yang cocok
        // tanpa mengubah state expand/collapse pengguna.
        const hasMatchingDescendant = objects.some((item) => {
          if (!matchingIds.has(item.id)) return false;

          let currentParentId = item.parent_id;

          while (currentParentId) {
            if (currentParentId === object.id) return true;

            const parent = objects.find(
              (candidate) => candidate.id === currentParentId,
            );

            currentParentId = parent?.parent_id ?? null;
          }

          return false;
        });

        const showChildren =
          hasChildren &&
          (!isCollapsed || (query !== "" && hasMatchingDescendant));

        return (
          <div key={object.id} className="min-w-0">
            <div
              className={`flex min-w-0 items-center rounded-md border-l-2 transition-colors ${
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {hasChildren ? (
                <button
                  type="button"
                  onClick={() => onToggleCollapse(object.id)}
                  aria-label={
                    isCollapsed
                      ? `Expand ${object.name}`
                      : `Collapse ${object.name}`
                  }
                  title={isCollapsed ? "Expand" : "Collapse"}
                  className="flex shrink-0 items-center justify-center rounded p-1.5 hover:bg-muted"
                >
                  <span className="text-xs">
                    {showChildren ? "▾" : "▸"}
                  </span>
                </button>
              ) : (
                <span className="w-7 shrink-0 text-center text-xs">
                  •
                </span>
              )}

              <button
                type="button"
                onClick={() => onSelectObject(object.id)}
                title={object.name}
                aria-current={isSelected ? "true" : undefined}
                className={`min-w-0 flex-1 truncate px-1 py-1.5 text-left text-sm ${
                  isSelected ? "font-medium" : ""
                }`}
              >
                {object.name}
              </button>
            </div>

            {showChildren && (
              <div className="ml-3 border-l border-border/70 pl-2">
                <SceneObjectTree
                  objects={objects}
                  parentId={object.id}
                  selectedObjectId={selectedObjectId}
                  onSelectObject={onSelectObject}
                  collapsedObjectIds={collapsedObjectIds}
                  onToggleCollapse={onToggleCollapse}
                  searchQuery={searchQuery}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}



interface SceneEditorViewProps {
  scene: Scene;
}

export function SceneEditorView({
  scene,
}: SceneEditorViewProps) {


const [objects, setObjects] = useState<SceneObject[]>([]);
const [sceneBehaviors, setSceneBehaviors] =
  useState<SceneBehavior[]>([]);

  const [previewAnimationCommand, setPreviewAnimationCommand] =
  useState<{
    id: number;
    action: SceneBehavior["actions"][number];
  } | null>(null);

const previewCommandCounterRef = useRef(0);
const [isPlayPreview, setIsPlayPreview] = useState(false);
const [objectAnimationNames, setObjectAnimationNames] =
  useState<Record<string, string[]>>({});
  const [objectAnimationMetadata, setObjectAnimationMetadata] =
  useState<
    Record<string, { name: string; duration: number }[]>
  >({});
type TransformValues = {
  position_x: number;
  position_y: number;
  position_z: number;
  rotation_x: number;
  rotation_y: number;
  rotation_z: number;
  scale_x: number;
  scale_y: number;
  scale_z: number;
};

const [transformDrafts, setTransformDrafts] = useState<
  Record<string, TransformValues>
>({});
const getObjectTransform = (
  object: SceneObject,
): TransformValues =>
  transformDrafts[object.id] ?? {
    position_x: object.position_x,
    position_y: object.position_y,
    position_z: object.position_z,
    rotation_x: object.rotation_x,
    rotation_y: object.rotation_y,
    rotation_z: object.rotation_z,
    scale_x: object.scale_x,
    scale_y: object.scale_y,
    scale_z: object.scale_z,
  };
const [objectName, setObjectName] = useState("");
const [parentId, setParentId] = useState<string | null>(null);
const [assets, setAssets] = useState<Asset[]>([]);
const [assetId, setAssetId] = useState<string | null>(null);

const [selectedObjectId, setSelectedObjectId] =
  useState<string | null>(null);
  
const [collapsedObjectIds, setCollapsedObjectIds] = useState<Set<string>>(
  () => new Set(),
);
const [objectSearch, setObjectSearch] = useState("");
const [deletingObject, setDeletingObject] =
  useState(false);
  const selectedObject =
  objects.find(
    (object) => object.id === selectedObjectId,
  ) ?? null;
const selectedObjectLocked =
  selectedObject?.locked ?? false;

const [duplicatingObject, setDuplicatingObject] =
  useState(false);

const [togglingVisibility, setTogglingVisibility] =
  useState(false);
  
const [togglingLock, setTogglingLock] =
  useState(false);

  const [position, setPosition] = useState({
  x: 0,
  y: 0,
  z: 0,
});

const [rotation, setRotation] = useState({
  x: 0,
  y: 0,
  z: 0,
});

const [scale, setScale] = useState({
  x: 1,
  y: 1,
  z: 1,
});

const [selectedModelUrl, setSelectedModelUrl] =
  useState<string | null>(null);

  const [objectModelUrls, setObjectModelUrls] =
  useState<Record<string, string>>({});

const [addingObject, setAddingObject] = useState(false);

const [savingTransform, setSavingTransform] =
  useState(false);

const [transformMessage, setTransformMessage] =
  useState("");

  
const [newParentId, setNewParentId] = useState("");
const [reparentingObject, setReparentingObject] =
  useState(false);

  useEffect(() => {
    async function loadObjects() {
      const data = await getSceneObjects(scene.id);
      setObjects(data);
    }

    loadObjects();
  }, [scene.id]);

  useEffect(() => {
  async function loadAssets() {
    const data = await getAssets(scene.project_id);
    setAssets(data);
  }

  loadAssets();
}, [scene.project_id]);

useEffect(() => {
  if (!selectedObject) {
    setPosition({ x: 0, y: 0, z: 0 });
    setRotation({ x: 0, y: 0, z: 0 });
    setScale({ x: 1, y: 1, z: 1 });
    return;
  }

  const transform = getObjectTransform(selectedObject);

  setPosition({
    x: transform.position_x,
    y: transform.position_y,
    z: transform.position_z,
  });

  setRotation({
    x: transform.rotation_x,
    y: transform.rotation_y,
    z: transform.rotation_z,
  });

  setScale({
    x: transform.scale_x,
    y: transform.scale_y,
    z: transform.scale_z,
  });
}, [selectedObject, transformDrafts]);

useEffect(() => {
  async function loadObjectModels() {
    const entries = await Promise.all(
      objects
        .filter((object) => object.asset_id)
        .map(async (object) => {
          const asset = assets.find(
            (item) => item.id === object.asset_id,
          );

          if (!asset?.file_path) {
            return null;
          }

          const url = await getAssetUrl(
            asset.file_path,
          );

          return [object.id, url] as const;
        }),
    );

    const urls: Record<string, string> = {};

    for (const entry of entries) {
      if (!entry) continue;

      const [objectId, url] = entry;
      urls[objectId] = url;
    }

    setObjectModelUrls(urls);
  }

  loadObjectModels();
}, [objects, assets]);



async function handleDeleteSelectedObject() {
  if (!selectedObjectId || deletingObject) return;

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject) return;

  const hasChildren = objects.some(
    (object) => object.parent_id === selectedObjectId,
  );

  if (hasChildren) {
    window.alert(
      "Objek ini masih memiliki child. Hapus child terlebih dahulu.",
    );
    return;
  }

  const confirmed = window.confirm(
    `Yakin ingin menghapus objek "${selectedObject.name}"?`,
  );

  if (!confirmed) return;

  setDeletingObject(true);

  try {
    await deleteSceneObject(selectedObjectId);

    setObjects((current) =>
      current.filter(
        (object) => object.id !== selectedObjectId,
      ),
    );

    setTransformDrafts((current) => {
      const next = { ...current };
      delete next[selectedObjectId];
      return next;
    });

    setSelectedObjectId(null);

    setParentId((current) =>
      current === selectedObjectId ? null : current,
    );
  } catch (error) {
    console.error("Failed to delete scene object:", error);

    window.alert(
      "Gagal menghapus objek. Silakan coba lagi.",
    );
  } finally {
    setDeletingObject(false);
  }
}


async function handleRenameSelectedObject() {
  if (!selectedObjectId) return;

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject) return;

  const newName = window.prompt(
    "Masukkan nama objek baru:",
    selectedObject.name,
  );

  if (newName === null) return;

  const trimmedName = newName.trim();

  if (!trimmedName) {
    window.alert("Nama objek tidak boleh kosong.");
    return;
  }

  if (trimmedName === selectedObject.name) return;

  try {
    await renameSceneObject(
      selectedObjectId,
      trimmedName,
    );

    setObjects((current) =>
      current.map((object) =>
        object.id === selectedObjectId
          ? { ...object, name: trimmedName }
          : object,
      ),
    );
  } catch (error) {
    console.error("Failed to rename scene object:", error);

    window.alert(
      "Gagal mengganti nama objek. Silakan coba lagi.",
    );
  }
}


async function handleReparentSelectedObject() {
  if (!selectedObjectId || reparentingObject) return;

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject) return;

  const targetParentId = newParentId || null;

  if (targetParentId === selectedObjectId) {
    window.alert("Objek tidak bisa menjadi parent dirinya sendiri.");
    return;
  }

  const isDescendant = (
    candidateId: string,
    ancestorId: string,
  ): boolean => {
    const parent = objects.find(
      (object) => object.id === candidateId,
    );

    if (!parent?.parent_id) return false;

    if (parent.parent_id === ancestorId) return true;

    return isDescendant(parent.parent_id, ancestorId);
  };

  if (
    targetParentId &&
    isDescendant(targetParentId, selectedObjectId)
  ) {
    window.alert(
      "Objek tidak bisa dipindahkan ke dalam turunannya sendiri.",
    );
    return;
  }

  if (selectedObject.parent_id === targetParentId) {
    window.alert("Objek sudah berada di parent tersebut.");
    return;
  }

  setReparentingObject(true);

  try {
    await updateSceneObjectParent(
      selectedObjectId,
      targetParentId,
    );

    setObjects((current) =>
      current.map((object) =>
        object.id === selectedObjectId
          ? { ...object, parent_id: targetParentId }
          : object,
      ),
    );

    setNewParentId("");
  } catch (error) {
    console.error("Failed to reparent scene object:", error);

    window.alert(
      "Gagal memindahkan objek. Silakan coba lagi.",
    );
  } finally {
    setReparentingObject(false);
  }
}


async function handleDuplicateSelectedObject() {
  if (!selectedObjectId || duplicatingObject) return;

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject) return;

  setDuplicatingObject(true);

  try {
    const duplicate = await duplicateSceneObject(
      selectedObjectId,
    );

    setObjects((current) => [...current, duplicate]);

    setSelectedObjectId(duplicate.id);

    setTransformDrafts((current) => {
      const originalDraft = current[selectedObjectId];

      if (!originalDraft) return current;

      return {
        ...current,
        [duplicate.id]: {
          ...originalDraft,
        },
      };
    });
  } catch (error) {
    console.error("Failed to duplicate scene object:", error);

    window.alert(
      "Gagal menduplikasi objek. Silakan coba lagi.",
    );
  } finally {
    setDuplicatingObject(false);
  }
}


async function handleToggleSelectedObjectVisibility() {
  if (!selectedObjectId || togglingVisibility) return;

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject) return;

  const nextVisible = !selectedObject.visible;

  setTogglingVisibility(true);

  try {
    await updateSceneObjectVisibility(
      selectedObjectId,
      nextVisible,
    );

    setObjects((current) =>
      current.map((object) =>
        object.id === selectedObjectId
          ? { ...object, visible: nextVisible }
          : object,
      ),
    );
  } catch (error) {
    console.error(
      "Failed to update object visibility:",
      error,
    );

    window.alert(
      "Gagal mengubah visibility objek. Silakan coba lagi.",
    );
  } finally {
    setTogglingVisibility(false);
  }
}


async function handleToggleSelectedObjectLock() {
  if (!selectedObjectId || togglingLock) return;

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject) return;

  const nextLocked = !selectedObject.locked;

  setTogglingLock(true);

  try {
    await updateSceneObjectLock(
      selectedObjectId,
      nextLocked,
    );

    setObjects((current) =>
      current.map((object) =>
        object.id === selectedObjectId
          ? { ...object, locked: nextLocked }
          : object,
      ),
    );
  } catch (error) {
    console.error(
      "Failed to update object lock:",
      error,
    );

    window.alert(
      "Gagal mengubah status lock objek. Silakan coba lagi.",
    );
  } finally {
    setTogglingLock(false);
  }
}


function handleResetSelectedObjectTransform() {
  if (!selectedObject || selectedObjectLocked) return;

  const resetTransform = {
    position_x: 0,
    position_y: 0,
    position_z: 0,
    rotation_x: 0,
    rotation_y: 0,
    rotation_z: 0,
    scale_x: 1,
    scale_y: 1,
    scale_z: 1,
  };

  setPosition({ x: 0, y: 0, z: 0 });
  setRotation({ x: 0, y: 0, z: 0 });
  setScale({ x: 1, y: 1, z: 1 });

  setTransformDrafts((current) => ({
    ...current,
    [selectedObject.id]: resetTransform,
  }));

  setTransformMessage("");
}

async function loadPreviewBehaviors() {
  try {
    const data = await getSceneBehaviors(scene.id);

    setSceneBehaviors(data);

    console.log(
      "PLAY PREVIEW — BEHAVIORS LOADED:",
      data,
    );
  } catch (error) {
    console.error(
      "PLAY PREVIEW — FAILED TO LOAD BEHAVIORS:",
      error,
    );

    setSceneBehaviors([]);
  }
}
function handlePreviewObjectTap(objectId: string) {
  const tappedObject = objects.find(
    (object) => object.id === objectId,
  );

  const matchingBehaviors = sceneBehaviors.filter(
    (behavior) =>
      behavior.object_id === objectId &&
      behavior.trigger_type === "on_tap" &&
      behavior.enabled,
  );

  console.log(
    "PLAY PREVIEW — TAPPED OBJECT:",
    tappedObject?.name,
    objectId,
  );

  console.log(
    "PLAY PREVIEW — MATCHING BEHAVIORS:",
    matchingBehaviors,
  );

 for (const behavior of matchingBehaviors) {
  console.log(
    "PLAY PREVIEW — BEHAVIOR FOUND:",
    behavior.name,
    behavior.actions,
  );

  for (const action of behavior.actions) {
    if (action.type !== "play_animation") {
      continue;
    }

    previewCommandCounterRef.current += 1;

    setPreviewAnimationCommand({
      id: previewCommandCounterRef.current,
      action,
    });
  }
}
}
  return (
    <div className="min-h-[calc(100vh-2rem)]">
      {/* Header */}
      <div className="border-b pb-5">
        <h1 className="text-2xl font-bold">
          {scene.name}
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          {scene.description ?? "No description"}
        </p>
      </div>

      {/* Editor */}
      <div className="mt-6 grid min-h-[600px] grid-cols-[220px_minmax(0,1fr)_280px] overflow-hidden rounded-lg border">
        {/* Hierarchy */}
        <aside className="border-r bg-muted/20">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              Hierarchy
            </h2>
          </div>

         <div className="p-4">

           <div className="mb-2">
                <select
                  value={parentId ?? ""}
                  onChange={(event) =>
                    setParentId(
                      event.target.value || null,
                    )
                  }
                  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <option value="">
                    Root Object
                  </option>

                  {objects.map((object) => (
                    <option
                      key={object.id}
                      value={object.id}
                    >
                      {object.name}
                    </option>
                  ))}
                </select>
              </div>

           <div className="mb-2">
              <select
                value={assetId ?? ""}
                onChange={(event) =>
                  setAssetId(
                    event.target.value || null,
                  )
                }
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
              >
                <option value="">
                  No Asset
                </option>

                {assets.map((asset) => (
                  <option
                    key={asset.id}
                    value={asset.id}
                  >
                    {asset.name}
                  </option>
                ))}
              </select>
            </div>
          
            <div className="flex gap-2">
                <input
                type="text"
                value={objectName}
                onChange={(event) =>
                    setObjectName(event.target.value)
                }
                placeholder="Object name"
                className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1.5 text-sm"
                />

                <button
                type="button"
                disabled={
                    addingObject || !objectName.trim()
                }
                onClick={async () => {
                    setAddingObject(true);

                    try {
            const object = await createSceneObject(
                scene.id,
                objectName,
                parentId,
                assetId,
              );

                    setObjects((current) => [
                        ...current,
                        object,
                    ]);

                    setObjectName("");
                    setParentId(null);
                    setAssetId(null);
                    } finally {
                    setAddingObject(false);
                    }
                }}
                className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                >
                {addingObject ? "..." : "Add"}
                </button>
            </div>

   
<div className="mt-3">
  <input
    type="text"
    value={objectSearch}
    onChange={(event) => setObjectSearch(event.target.value)}
    placeholder="Search objects..."
    aria-label="Search objects"
    className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
  />
</div>

<div className="mt-4">
  {objects.length === 0 ? (
    <p className="text-sm text-muted-foreground">
      No objects yet.
    </p>
  ) : (
    <div className="max-h-[35vh] min-h-[120px] overflow-y-auto overflow-x-hidden rounded-md border p-2">
   
<SceneObjectTree
  objects={objects}
  parentId={null}
  selectedObjectId={selectedObjectId}
  onSelectObject={setSelectedObjectId}
  collapsedObjectIds={collapsedObjectIds}
  searchQuery={objectSearch}
  onToggleCollapse={(objectId) => {
    setCollapsedObjectIds((current) => {
      const next = new Set(current);

      if (next.has(objectId)) {
        next.delete(objectId);
      } else {
        next.add(objectId);
      }

      return next;
    });
  }}
/>

    </div>
  )}
</div>

          

<div className="mt-4 border-t pt-4">
      <span className="text-sm font-medium justify-center">
      Selected Object
    </span>

  <div className="mb-2 flex items-center justify-between">

    <div className="flex items-center gap-1">
      <button
        type="button"
        title={
          objects.find((object) => object.id === selectedObjectId)?.visible === false
            ? "Show Object"
            : "Hide Object"
        }
        aria-label="Toggle object visibility"
        disabled={!selectedObjectId || togglingVisibility}
        onClick={handleToggleSelectedObjectVisibility}
        className="rounded-md border p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        {objects.find((object) => object.id === selectedObjectId)?.visible === false
          ? <EyeOff size={16} />
          : <Eye size={16} />}
      </button>

      <button
        type="button"
        title={
          objects.find((object) => object.id === selectedObjectId)?.locked
            ? "Unlock Object"
            : "Lock Object"
        }
        aria-label="Toggle object lock"
        disabled={!selectedObjectId || togglingLock}
        onClick={handleToggleSelectedObjectLock}
        className="rounded-md border p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        {objects.find((object) => object.id === selectedObjectId)?.locked
          ? <Lock size={16} />
          : <LockOpen size={16} />}
      </button>

      <button
        type="button"
        title="Duplicate Object"
        aria-label="Duplicate selected object"
        disabled={!selectedObjectId || duplicatingObject}
        onClick={handleDuplicateSelectedObject}
        className="rounded-md border p-2 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Copy size={16} />
      </button>

      <details className="relative">
        <summary
          title="More actions"
          aria-label="More object actions"
          className="flex cursor-pointer list-none items-center rounded-md border p-2 hover:bg-muted"
        >
          <MoreHorizontal size={16} />
        </summary>

        <div className="absolute right-0 z-20 mt-1 w-52 rounded-md border bg-background p-1 shadow-md">
          <button
            type="button"
            disabled={!selectedObjectId || reparentingObject}
            onClick={() => {
              const target = document.getElementById("move-selected-object");
              target?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-40"
          >
            <Move size={15} />
            Move Object
          </button>

          <button
            type="button"
            disabled={!selectedObjectId}
            onClick={handleRenameSelectedObject}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-muted disabled:opacity-40"
          >
            <Pencil size={15} />
            Rename Object
          </button>

          <button
            type="button"
            disabled={!selectedObjectId || deletingObject}
            onClick={handleDeleteSelectedObject}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm text-destructive hover:bg-muted disabled:opacity-40"
          >
            <Trash2 size={15} />
            {deletingObject ? "Deleting..." : "Delete Object"}
          </button>
        </div>
      </details>
    </div>
  </div>

  <div id="move-selected-object" className="mt-3 border-t pt-3">
    <label className="mb-2 block text-sm font-medium">
      Move Selected Object To
    </label>

    <select
      value={newParentId}
      onChange={(event) => setNewParentId(event.target.value)}
      disabled={!selectedObjectId || reparentingObject}
      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
    >
      <option value="">Root Object</option>

      {objects
        .filter((object) => {
          if (!selectedObjectId) return false;
          if (object.id === selectedObjectId) return false;

          const isDescendant = (
            candidateId: string,
            ancestorId: string,
          ): boolean => {
            const parent = objects.find(
              (item) => item.id === candidateId,
            );

            if (!parent?.parent_id) return false;
            if (parent.parent_id === ancestorId) return true;

            return isDescendant(parent.parent_id, ancestorId);
          };

          return !isDescendant(object.id, selectedObjectId);
        })
        .map((object) => (
          <option key={object.id} value={object.id}>
            {object.name}
          </option>
        ))}
    </select>

    <button
      type="button"
      disabled={!selectedObjectId || reparentingObject}
      onClick={handleReparentSelectedObject}
      className="mt-2 w-full rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50"
    >
      {reparentingObject ? "Moving..." : "Move Selected Object"}
    </button>
  </div>
</div>
</div>
        </aside>

        {/* Viewport */}
        <main className="bg-muted/10">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              3D Viewport
            </h2>
          </div>

          <div className="h-[550px]">

    <div className="mb-3 flex items-center gap-3">
      <button
        type="button"
        onClick={() => {
          if (!isPlayPreview) {
            void loadPreviewBehaviors();
          }

          setIsPlayPreview((previous) => !previous);
        }}
        className={`rounded px-4 py-2 text-xs font-medium text-white ${
          isPlayPreview
            ? "bg-orange-600 hover:bg-orange-700"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isPlayPreview ? "Stop Preview" : "Play Preview"}
      </button>

      <span className="text-xs text-gray-400">
        {isPlayPreview
          ? "Preview Mode — interactions enabled"
          : "Edit Mode — editing enabled"}
      </span>
    </div>

<SceneViewport
  objects={objects}
    isPlayPreview={isPlayPreview}
  selectedObjectId={selectedObjectId}
  objectModelUrls={objectModelUrls}
  position={selectedObject ? position : undefined}
  rotation={selectedObject ? rotation : undefined}
  previewAnimationCommand={previewAnimationCommand}
  scale={selectedObject ? scale : undefined}
  onAnimationNamesChange={(objectId, names) => {
  setObjectAnimationNames((previous) => ({
    ...previous,
    [objectId]: names,
  }));
}}
onAnimationMetadataChange={(objectId, clips) => {
  setObjectAnimationMetadata((previous) => ({
    ...previous,
    [objectId]: clips,
  }));
}}
 onPositionChange={(newPosition) => {
  setPosition(newPosition);

  if (!selectedObjectId) return;

  setTransformDrafts((current) => ({
    ...current,
    [selectedObjectId]: {
      ...(current[selectedObjectId] ?? {
        position_x: selectedObject?.position_x ?? 0,
        position_y: selectedObject?.position_y ?? 0,
        position_z: selectedObject?.position_z ?? 0,
        rotation_x: selectedObject?.rotation_x ?? 0,
        rotation_y: selectedObject?.rotation_y ?? 0,
        rotation_z: selectedObject?.rotation_z ?? 0,
        scale_x: selectedObject?.scale_x ?? 1,
        scale_y: selectedObject?.scale_y ?? 1,
        scale_z: selectedObject?.scale_z ?? 1,
      }),
      position_x: newPosition.x,
      position_y: newPosition.y,
      position_z: newPosition.z,
    },
  }));
}}

onRotationChange={(newRotation) => {
  setRotation(newRotation);

  if (!selectedObjectId) return;

  setTransformDrafts((current) => ({
    ...current,
    [selectedObjectId]: {
      ...(current[selectedObjectId] ?? {
        position_x: selectedObject?.position_x ?? 0,
        position_y: selectedObject?.position_y ?? 0,
        position_z: selectedObject?.position_z ?? 0,
        rotation_x: selectedObject?.rotation_x ?? 0,
        rotation_y: selectedObject?.rotation_y ?? 0,
        rotation_z: selectedObject?.rotation_z ?? 0,
        scale_x: selectedObject?.scale_x ?? 1,
        scale_y: selectedObject?.scale_y ?? 1,
        scale_z: selectedObject?.scale_z ?? 1,
      }),
      rotation_x: newRotation.x,
      rotation_y: newRotation.y,
      rotation_z: newRotation.z,
    },
  }));
}}

onScaleChange={(newScale) => {
  setScale(newScale);

  if (!selectedObjectId) return;

  setTransformDrafts((current) => ({
    ...current,
    [selectedObjectId]: {
      ...(current[selectedObjectId] ?? {
        position_x: selectedObject?.position_x ?? 0,
        position_y: selectedObject?.position_y ?? 0,
        position_z: selectedObject?.position_z ?? 0,
        rotation_x: selectedObject?.rotation_x ?? 0,
        rotation_y: selectedObject?.rotation_y ?? 0,
        rotation_z: selectedObject?.rotation_z ?? 0,
        scale_x: selectedObject?.scale_x ?? 1,
        scale_y: selectedObject?.scale_y ?? 1,
        scale_z: selectedObject?.scale_z ?? 1,
      }),
      scale_x: newScale.x,
      scale_y: newScale.y,
      scale_z: newScale.z,
    },
  }));
}}

onObjectTap={handlePreviewObjectTap}
/>
        </div>
        </main>

        {/* Inspector */}
        <aside className="border-l bg-muted/20">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              Inspector
            </h2>
          </div>

       <div className="space-y-6 p-4">
          {!selectedObject ? (
            <p className="text-sm text-muted-foreground">
              Select an object to inspect its properties.
            </p>
          ) : (
            <>
              {/* Object */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Object
                </h3>

                <div className="rounded-md border bg-background px-3 py-2 text-sm">
                  {selectedObject.name}
                </div>
              </div>

              {/* Position */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Position
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      X
                    </label>
                    <input
                      type="number"
                     value={position.x}
                      disabled={selectedObjectLocked}
                     
onChange={(event) => {
  const value = Number(event.target.value);

  setPosition((current) => ({
    ...current,
    x: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        position_x: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Y
                    </label>
                    <input
                      type="number"
                      value={position.y}
                       disabled={selectedObjectLocked}
                      
onChange={(event) => {
  const value = Number(event.target.value);

  setPosition((current) => ({
    ...current,
    y: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        position_y: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Z
                    </label>
                    <input
                      type="number"
                      value={position.z}
                       disabled={selectedObjectLocked}
                     
onChange={(event) => {
  const value = Number(event.target.value);

  setPosition((current) => ({
    ...current,
    z: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        position_z: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Rotation */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Rotation
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      X °
                    </label>
                    <input
                      type="number"
                     value={radiansToDegrees(rotation.x)}
                      disabled={selectedObjectLocked}
                   
onChange={(event) => {
  const value = degreesToRadians(
    Number(event.target.value),
  );

  setRotation((current) => ({
    ...current,
    x: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        rotation_x: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Y °
                    </label>
                    <input
                      type="number"
                    value={radiansToDegrees(rotation.y)}
                         disabled={selectedObjectLocked}
                     
onChange={(event) => {
  const value = degreesToRadians(
    Number(event.target.value),
  );

  setRotation((current) => ({
    ...current,
    y: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        rotation_y: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Z °
                    </label>
                    <input
                      type="number"
                  value={radiansToDegrees(rotation.z)}
                       disabled={selectedObjectLocked}
                    
onChange={(event) => {
  const value = degreesToRadians(
    Number(event.target.value),
  );

  setRotation((current) => ({
    ...current,
    z: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        rotation_z: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Scale */}
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Scale
                </h3>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      X
                    </label>
                    <input
                      type="number"
                      value={scale.x}
                           disabled={selectedObjectLocked}
                     
onChange={(event) => {
  const value = Number(event.target.value);

  setScale((current) => ({
    ...current,
    x: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        scale_x: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Y
                    </label>
                    <input
                      type="number"
                     value={scale.y}
                     disabled={selectedObjectLocked}
                     
onChange={(event) => {
  const value = Number(event.target.value);

  setScale((current) => ({
    ...current,
    y: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        scale_y: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">
                      Z
                    </label>
                    <input
                      type="number"
                     value={scale.z}
                     disabled={selectedObjectLocked}
                     
onChange={(event) => {
  const value = Number(event.target.value);

  setScale((current) => ({
    ...current,
    z: value,
  }));

  if (!selectedObjectId) return;

  setTransformDrafts((current) => {
    const object = objects.find(
      (item) => item.id === selectedObjectId,
    );

    if (!object) return current;

    const previous = current[selectedObjectId] ?? {
      position_x: object.position_x,
      position_y: object.position_y,
      position_z: object.position_z,
      rotation_x: object.rotation_x,
      rotation_y: object.rotation_y,
      rotation_z: object.rotation_z,
      scale_x: object.scale_x,
      scale_y: object.scale_y,
      scale_z: object.scale_z,
    };

    return {
      ...current,
      [selectedObjectId]: {
        ...previous,
        scale_z: value,
      },
    };
  });
}}
                      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
                    />
                  </div>

                 
                </div>
              </div>

               <div className="border-t pt-4">
               
<button
  type="button"
  disabled={
    !selectedObject ||
    selectedObjectLocked ||
    savingTransform
  }
  onClick={handleResetSelectedObjectTransform}
  className="mb-2 w-full rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
>
  Reset Transform
</button>
                    <button
                      type="button"
                      disabled={
                        !selectedObject ||
                        savingTransform
                      }
                      onClick={async () => {
  if (!selectedObject) return;

  setSavingTransform(true);
  setTransformMessage("");

  try {
    const pendingTransforms = objects.flatMap((object) => {
      // Selalu ambil nilai terbaru dari Inspector
      // untuk object yang sedang dipilih.
      if (object.id === selectedObject.id) {
        return [{
          id: object.id,
          transform: {
            position_x: position.x,
            position_y: position.y,
            position_z: position.z,
            rotation_x: rotation.x,
            rotation_y: rotation.y,
            rotation_z: rotation.z,
            scale_x: scale.x,
            scale_y: scale.y,
            scale_z: scale.z,
          },
        }];
      }

      const draft = transformDrafts[object.id];

      if (!draft) return [];

      return [{
        id: object.id,
        transform: draft,
      }];
    });

    await Promise.all(
      pendingTransforms.map(({ id, transform }) =>
        updateSceneObjectTransform(id, transform),
      ),
    );

    setObjects((current) =>
      current.map((object) => {
        const saved = pendingTransforms.find(
          (item) => item.id === object.id,
        );

        return saved
          ? { ...object, ...saved.transform }
          : object;
      }),
    );

    setTransformDrafts({});
    setTransformMessage(
      `Saved transforms for ${pendingTransforms.length} object(s).`,
    );
  } catch (error) {
    console.error("Failed to save transforms:", error);
    setTransformMessage("Failed to save transforms.");
  } finally {
    setSavingTransform(false);
  }
}}
                      className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                    >
                      {savingTransform
                        ? "Saving..."
                        : "Save Transform"}
                    </button>

                                      {transformMessage && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {transformMessage}
                      </p>
                    )}
                  </div>

                  {/* Behavior Inspector */}
            <BehaviorInspector
              key={selectedObject.id}
              sceneId={scene.id}
              objectId={selectedObject.id}
              objects={objects}
              objectAnimationNames={objectAnimationNames}
              objectAnimationMetadata={objectAnimationMetadata}
            />
            </>
          )}
        </div>
        </aside>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type {
  BehaviorAction,
  BehaviorActionType,
  BehaviorTriggerType,
  SceneBehavior,
} from "../../types/sceneBehavior";

import type { SceneObject } from "../../types/sceneObject";

import {
  createSceneBehavior,
  deleteSceneBehavior,
  getObjectBehaviors,
  updateSceneBehavior,
  updateBehaviorActions,
} from "../../services/sceneBehaviorService";

const ACTION_OPTIONS: {
  value: BehaviorActionType;
  label: string;
}[] = [
  { value: "play_animation", label: "Play Animation" },
  { value: "show_object", label: "Show Object" },
  { value: "hide_object", label: "Hide Object" },
  { value: "play_audio", label: "Play Audio" },
  { value: "show_modal", label: "Show Modal" },
  { value: "set_variable", label: "Set Variable" },
  { value: "spawn_object", label: "Spawn Object" },
];

interface BehaviorInspectorProps {
  sceneId: string;
  objectId: string;
  objects: SceneObject[];
  objectAnimationNames: Record<string, string[]>;
  objectAnimationMetadata: Record<
    string,
    { name: string; duration: number }[]
  >;
}

export function BehaviorInspector({
  sceneId,
  objectId,
  objects,
  objectAnimationNames,
  objectAnimationMetadata,
}: BehaviorInspectorProps) {
  const [behaviors, setBehaviors] = useState<SceneBehavior[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadBehaviors() {
      setLoading(true);
      setError(null);
      setBehaviors([]);

      try {
        const data = await getObjectBehaviors(objectId);

        if (!cancelled) {
          setBehaviors(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load behaviors",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBehaviors();

    return () => {
      cancelled = true;
    };
  }, [objectId]);

  async function addBehavior() {
    setBusy(true);
    setError(null);

    try {
      const created = await createSceneBehavior(sceneId, objectId);
      setBehaviors((previous) => [...previous, created]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add behavior");
    } finally {
      setBusy(false);
    }
  }

async function saveBehavior(
  behaviorId: string,
  updates: {
    name?: string;
    enabled?: boolean;
    trigger_type?: BehaviorTriggerType;
    trigger_target_id?: string | null;
  },
) {
    setBusy(true);
    setError(null);

    try {
      const updated = await updateSceneBehavior(behaviorId, updates);

      setBehaviors((previous) =>
        previous.map((behavior) =>
          behavior.id === behaviorId ? updated : behavior,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save behavior");
    } finally {
      setBusy(false);
    }
  }

  async function removeBehavior(behaviorId: string) {
    if (!window.confirm("Delete this behavior?")) return;

    setBusy(true);
    setError(null);

    try {
      await deleteSceneBehavior(behaviorId);

      setBehaviors((previous) =>
        previous.filter((behavior) => behavior.id !== behaviorId),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete behavior");
    } finally {
      setBusy(false);
    }
  }

async function saveActions(
  behaviorId: string,
  actions: BehaviorAction[],
) {
  setBusy(true);
  setError(null);

  try {
    const updated = await updateBehaviorActions(
      behaviorId,
      actions,
    );

    setBehaviors((previous) =>
      previous.map((behavior) =>
        behavior.id === behaviorId ? updated : behavior,
      ),
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : "Failed to save actions",
    );
  } finally {
    setBusy(false);
  }
}

async function addAction(behavior: SceneBehavior) {
  const newAction: BehaviorAction = {
    id: crypto.randomUUID(),
    type: "play_animation",
    targetObjectId: objectId,
    loopMode: "once",
    waitUntilComplete: false,
  };

  await saveActions(behavior.id, [
    ...behavior.actions,
    newAction,
  ]);
}

async function changeActionType(
  behavior: SceneBehavior,
  actionId: string,
  type: BehaviorActionType,
) {
  const updatedActions = behavior.actions.map((action) =>
    action.id === actionId
      ? {
          id: action.id,
          type,
          targetObjectId: objectId,
          waitUntilComplete: false,
        }
      : action,
  );

  await saveActions(behavior.id, updatedActions);
}

async function removeAction(
  behavior: SceneBehavior,
  actionId: string,
) {
  const updatedActions = behavior.actions.filter(
    (action) => action.id !== actionId,
  );

  await saveActions(behavior.id, updatedActions);
}

function getAnimationMaxFrame(
  targetObjectId: string,
  animationName: string,
): number | null {
  const clips =
    objectAnimationMetadata[targetObjectId] ?? [];

  const clip = clips.find(
    (item) => item.name === animationName,
  );

  if (!clip) return null;

  return Math.max(1, Math.ceil(clip.duration * 24));
}

async function updateAction(
  behavior: SceneBehavior,
  actionId: string,
  updates: Partial<BehaviorAction>,
) {
  const updatedActions = behavior.actions.map((action) => {
    if (action.id !== actionId) return action;

    const updated = { ...action, ...updates };

    if (updated.type !== "play_animation") {
      return updated;
    }

    const targetId = updated.targetObjectId ?? objectId;
    const clipName = updated.animationName ?? "";

    const maxFrame = getAnimationMaxFrame(
      targetId,
      clipName,
    );

    if (maxFrame !== null) {
      const start = Math.max(
        0,
        Math.min(
          Math.floor(updated.startFrame ?? 0),
          maxFrame - 1,
        ),
      );

      const end = Math.max(
        start + 1,
        Math.min(
          Math.floor(updated.endFrame ?? maxFrame),
          maxFrame,
        ),
      );

      updated.startFrame = start;
      updated.endFrame = end;
    }

    return updated;
  });

  await saveActions(behavior.id, updatedActions);
}

  return (
    <div className="mt-5 space-y-3 border-t border-gray-700 pt-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">Behaviors</h3>

        <button
          type="button"
          onClick={() => void addBehavior()}
          disabled={busy || loading}
          className="rounded bg-blue-600 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          + Add
        </button>
      </div>

      {loading && (
        <p className="text-xs text-gray-400">Loading behaviors...</p>
      )}

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}

      {!loading && behaviors.length === 0 && (
        <p className="text-xs text-gray-400">No behaviors yet.</p>
      )}

      {behaviors.map((behavior) => (
        <div
          key={behavior.id}
          className="space-y-2 rounded border border-gray-700 p-3"
        >
          <input
            key={`${behavior.id}-${behavior.name}`}
            type="text"
            defaultValue={behavior.name}
            disabled={busy}
            onBlur={(event) => {
              const name = event.target.value.trim();

              if (name && name !== behavior.name) {
                void saveBehavior(behavior.id, { name });
              }
            }}
            className="w-full rounded border border-gray-600 bg-transparent px-2 py-1 text-xs"
          />

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={behavior.enabled}
                disabled={busy}
                onChange={(event) =>
                  void saveBehavior(behavior.id, {
                    enabled: event.target.checked,
                  })
                }
              />
              Enabled
            </label>

            <button
              type="button"
              disabled={busy}
              onClick={() => void removeBehavior(behavior.id)}
              className="text-xs text-red-400 disabled:opacity-50"
            >
              Delete
            </button>
          </div>
<div className="space-y-1">
  <label className="block text-xs text-gray-400">
    Trigger
  </label>

  <select
    value={behavior.trigger_type}
    disabled={busy}
 onChange={(event) => {
  const nextTrigger =
    event.target.value as BehaviorTriggerType;

  void saveBehavior(behavior.id, {
    trigger_type: nextTrigger,
    trigger_target_id:
      nextTrigger === "on_collision"
        ? behavior.trigger_target_id
        : null,
  });
}}
    className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
  >
    <option value="on_tap">
      On Tap
    </option>

    <option value="on_collision">
      On Collision
    </option>

    <option value="on_animation_complete">
      On Animation Complete
    </option>

    <option value="on_marker_found">
      On Marker Found
    </option>
  </select>
</div>

{behavior.trigger_type === "on_collision" && (
  <div className="space-y-1">
    <label className="block text-xs text-gray-400">
      Collision Target
    </label>

    <select
      value={behavior.trigger_target_id ?? ""}
      disabled={busy}
      onChange={(event) =>
        void saveBehavior(behavior.id, {
          trigger_target_id: event.target.value || null,
        })
      }
      className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
    >
      <option value="">
        Select target object
      </option>

      {(objects ?? [])
        .filter((object) => object.id !== objectId)
        .map((object) => (
          <option key={object.id} value={object.id}>
            {object.name}
          </option>
        ))}
    </select>

    <p className="text-xs text-gray-500">
      Behavior runs when this object collides with
      the selected target.
    </p>
  </div>
)}

{/* Action List */}
<div className="mt-4 space-y-2 border-t border-gray-700 pt-3">
  <div className="flex items-center justify-between">
    <h4 className="text-xs font-semibold">
      Actions
    </h4>

    <button
      type="button"
      disabled={busy}
      onClick={() => void addAction(behavior)}
      className="rounded bg-blue-600 px-2 py-1 text-xs text-white disabled:opacity-50"
    >
      + Add Action
    </button>
  </div>

  {(behavior.actions ?? []).length === 0 && (
    <p className="text-xs text-gray-500">
      No actions yet.
    </p>
  )}

  {(behavior.actions ?? []).map((action, index) => (
    <div
      key={action.id}
      className="space-y-2 rounded border border-gray-600 p-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          Action {index + 1}
        </span>

        <button
          type="button"
          disabled={busy}
          onClick={() =>
            void removeAction(behavior, action.id)
          }
          className="text-xs text-red-400 disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      <select
        value={action.type}
        disabled={busy}
        onChange={(event) =>
          void changeActionType(
            behavior,
            action.id,
            event.target.value as BehaviorActionType,
          )
        }
        className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
      >
        {ACTION_OPTIONS.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
         </select>

      {action.type === "play_animation" && (
        <div className="space-y-3 border-t border-gray-700 pt-3">

          {/* Target Object */}
          <div className="space-y-1">
            <label className="block text-xs text-gray-400">
              Target Object
            </label>

            <select
              value={action.targetObjectId ?? objectId}
              disabled={busy}
             onChange={(event) =>
              void updateAction(
                behavior,
                action.id,
                {
                  targetObjectId: event.target.value,
                  animationName: "",
                  startFrame: 0,
                  endFrame: undefined,
                },
              )
            }
              className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
            >
              {objects.map((object) => (
                <option key={object.id} value={object.id}>
                  {object.name}
                </option>
              ))}
            </select>
          </div>

       {/* Animation Clip */}
<div className="space-y-1">
  <label className="block text-xs text-gray-400">
    Animation Clip
  </label>

          <select
            value={action.animationName ?? ""}
            disabled={busy}
          onChange={(event) =>
          void updateAction(behavior, action.id, {
            animationName: event.target.value,
            startFrame: 0,
            endFrame: undefined,
          })
        }
    className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
  >
    <option value="">
      Select animation
    </option>

    {(objectAnimationNames[
      action.targetObjectId ?? objectId
    ] ?? []).map((name) => (
      <option key={name} value={name}>
        {name}
      </option>
    ))}
  </select>

  {(objectAnimationNames[
    action.targetObjectId ?? objectId
  ] ?? []).length === 0 && (
    <p className="text-xs text-gray-500">
      No animations available for this object.
    </p>
  )}
</div>

          {/* Start Frame */}
          <div className="space-y-1">
            <label className="block text-xs text-gray-400">
              Start Frame
            </label>

            <input
              type="number"
              min={0}
             key={`${action.id}-start-${action.startFrame ?? 0}`}
            defaultValue={action.startFrame ?? 0}
              disabled={busy}
              onBlur={(event) =>
                void updateAction(
                  behavior,
                  action.id,
                  {
                    startFrame: Math.max(
                      0,
                      Number(event.target.value) || 0,
                    ),
                  },
                )
              }
              className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
            />
          </div>

          {/* End Frame */}
          <div className="space-y-1">
            <label className="block text-xs text-gray-400">
              End Frame
            </label>

            <input
              type="number"
              min={1}
            key={`${action.id}-end-${action.endFrame ?? getAnimationMaxFrame(
            action.targetObjectId ?? objectId,
            action.animationName ?? "",
          ) ?? ""}`}
          defaultValue={
            action.endFrame ??
            getAnimationMaxFrame(
              action.targetObjectId ?? objectId,
              action.animationName ?? "",
            ) ??
            ""
          }
              disabled={busy}
              onBlur={(event) =>
                void updateAction(
                  behavior,
                  action.id,
                  {
                    endFrame: Math.max(
                      1,
                      Number(event.target.value) || 1,
                    ),
                  },
                )
              }
              className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
            />
            {(() => {
              const maxFrame = getAnimationMaxFrame(
                action.targetObjectId ?? objectId,
                action.animationName ?? "",
              );

              return (
                <p className="text-xs text-gray-500">
                  {maxFrame !== null
                    ? `Maximum frame: ${maxFrame}`
                    : "Select a valid animation clip first."}
                </p>
              );
            })()}
          </div>

          {/* Playback Mode */}
          <div className="space-y-1">
            <label className="block text-xs text-gray-400">
              Playback Mode
            </label>

            <select
              value={action.loopMode ?? "once"}
              disabled={busy}
              onChange={(event) =>
                void updateAction(
                  behavior,
                  action.id,
                  {
                    loopMode:
                      event.target.value as "loop" | "once",
                  },
                )
              }
              className="w-full rounded border border-gray-600 bg-transparent px-2 py-2 text-xs"
            >
              <option value="once">Play Once</option>
              <option value="loop">Loop</option>
            </select>
          </div>

          {/* Wait Until Complete */}
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={action.waitUntilComplete ?? false}
              disabled={busy}
              onChange={(event) =>
                void updateAction(
                  behavior,
                  action.id,
                  {
                    waitUntilComplete: event.target.checked,
                  },
                )
              }
            />
            Wait Until Complete
          </label>
        </div>
      )}
    </div>
  ))}
</div>

        </div>
      ))}
    </div>
  );
}

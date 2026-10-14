"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { SceneObject } from "../../types/sceneObject";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Button } from "@/components/ui/button";
import type { BehaviorAction } from "../../types/sceneBehavior";
import { getAssets, getAssetUrl } from "../../services/assetService";

interface SceneViewportProps {
   projectId: string;
  objects: SceneObject[];

    isPlayPreview?: boolean;

      onObjectTap?: (objectId: string) => void;

  selectedObjectId: string | null;

  objectModelUrls: Record<string, string>;

previewActionBatch?: {
  id: number;
  actions: BehaviorAction[];
} | null;

  onAnimationNamesChange?: (
    objectId: string,
    names: string[],
  ) => void;

  onAnimationMetadataChange?: (
  objectId: string,
  clips: { name: string; duration: number }[],
) => void;

  position?: {
    x: number;
    y: number;
    z: number;
  };

  rotation?: {
    x: number;
    y: number;
    z: number;
  };

  scale?: {
    x: number;
    y: number;
    z: number;
  };

  onPositionChange?: (position: {
    x: number;
    y: number;
    z: number;
  }) => void;

  onRotationChange?: (rotation: {
    x: number;
    y: number;
    z: number;
  }) => void;

  onScaleChange?: (scale: {
    x: number;
    y: number;
    z: number;
  }) => void;
}

export function SceneViewport({
  projectId,
  objects,
  selectedObjectId,
    isPlayPreview = false,
      onObjectTap,
      previewActionBatch,
  objectModelUrls,
  onAnimationNamesChange,
  onAnimationMetadataChange,
  position,
  rotation,
  scale,
  onPositionChange,
  onRotationChange,
  onScaleChange,
}: SceneViewportProps) {
  const containerRef =
    useRef<HTMLDivElement | null>(null);
  
  const transformControlsRef =
  useRef<TransformControls | null>(null);

  const isPlayPreviewRef = useRef(isPlayPreview);

const onObjectTapRef = useRef(onObjectTap);

useEffect(() => {
  isPlayPreviewRef.current = isPlayPreview;
}, [isPlayPreview]);

useEffect(() => {
  onObjectTapRef.current = onObjectTap;
}, [onObjectTap]);

  const modelRefs = useRef<
  Record<string, THREE.Object3D>
>({});


const animationMixers = useRef<
  Record<string, THREE.AnimationMixer>
>({});

const animationPlaybackRef = useRef<
  Record<
    string,
    {
      action: THREE.AnimationAction;
      startTime: number;
      endTime: number;
      loopMode: "loop" | "once";
    }
  >
>({});
const previewAnimatedObjectIdsRef =
  useRef<Set<string>>(new Set());

const animationCompletionRef = useRef<
  Record<
    string,
    {
      resolve: (completed: boolean) => void;
    }
  >
>({});

const [transformMode, setTransformMode] =
  useState<"translate" | "rotate" | "scale">("translate");

  
const [animationNames, setAnimationNames] =
  useState<Record<string, string[]>>({});

  const onAnimationNamesChangeRef = useRef(
  onAnimationNamesChange,
);

useEffect(() => {
  onAnimationNamesChangeRef.current =
    onAnimationNamesChange;
}, [onAnimationNamesChange]);

const onAnimationMetadataChangeRef = useRef(
  onAnimationMetadataChange,
);

useEffect(() => {
  onAnimationMetadataChangeRef.current =
    onAnimationMetadataChange;
}, [onAnimationMetadataChange]);
  
const [animationClips, setAnimationClips] =
  useState<Record<string, THREE.AnimationClip[]>>({});

  const lastPreviewCommandIdRef = useRef<number | null>(
  null,
);

const previewExecutionVersionRef = useRef(0);

const previewAudioRefs = useRef<Set<HTMLAudioElement>>(
  new Set(),
);

const previewLoopAudioRefs = useRef<
  Map<string, HTMLAudioElement>
>(new Map());

// Audio Play Once yang menggunakan Prevent Overlap.
const previewOnceAudioRefs = useRef<
  Map<string, HTMLAudioElement>
>(new Map());

// Mencegah tap berulang ketika audio masih loading.
const previewOnceAudioLoadingRefs = useRef<
  Map<string, number>
>(new Map());

// Menyimpan Promise penyelesaian Play Once.
// Digunakan ketika Prevent Overlap + Wait Until Complete aktif.
const previewOnceAudioCompletionRefs = useRef<
  Map<string, Promise<boolean>>
>(new Map());

// Menyimpan fungsi pembatalan Promise Play Once.
const previewOnceAudioCancelRefs = useRef<
  Map<string, () => void>
>(new Map());

const previewLoopAudioLoadingRefs = useRef<
  Map<string, number>
>(new Map());

const previewAudioWaitCancelRefs = useRef<
  Map<HTMLAudioElement, () => void>
>(new Map());

const [selectedAnimation, setSelectedAnimation] =
  useState<Record<string, string>>({});

const [isAnimationPlaying, setIsAnimationPlaying] =
  useState<Record<string, boolean>>({});

  
const [animationLoopMode, setAnimationLoopMode] =
  useState<Record<string, "loop" | "once">>({});

  
const TIMELINE_FPS = 24;

const [animationStartFrames, setAnimationStartFrames] =
  useState<Record<string, number>>({});

const [animationEndFrames, setAnimationEndFrames] =
  useState<Record<string, number>>({});


 

function playSelectedAnimation() {
  if (!selectedObjectId) return;

  const objectId = selectedObjectId;
  const mixer = animationMixers.current[objectId];
  const clipName = selectedAnimation[objectId];

  if (!mixer || !clipName) return;

  const clips = animationClips[objectId] ?? [];

  const clip = clips.find(
    (animation) => animation.name === clipName,
  );

  if (!clip) return;

  // Ambil rentang frame tanpa memotong klip asli.
  const startFrame = Math.max(
    0,
    Math.floor(animationStartFrames[objectId] ?? 0),
  );

  const endFrame = Math.max(
    1,
    Math.floor(
      animationEndFrames[objectId] ??
        Math.ceil(clip.duration * TIMELINE_FPS),
    ),
  );

  const startTime = startFrame / TIMELINE_FPS;

  const endTime = Math.min(
    endFrame / TIMELINE_FPS,
    clip.duration,
  );

  // Pastikan rentang waktu valid.
  if (
    startTime >= clip.duration ||
    endTime <= startTime
  ) {
    return;
  }

  // Hentikan pemutaran sebelumnya pada objek ini saja.
  delete animationPlaybackRef.current[objectId];
  mixer.stopAllAction();

  // Gunakan klip asli, bukan AnimationUtils.subclip().
  const action = mixer.clipAction(clip);

  action.reset();
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();

  // Mulai tepat pada Start Frame yang dipilih.
  action.time = startTime;

  animationPlaybackRef.current[objectId] = {
    action,
    startTime,
    endTime,
    loopMode:
      animationLoopMode[objectId] ?? "loop",
  };

  // Terapkan pose pada frame awal tanpa menunggu frame berikutnya.
  mixer.update(0);

  setIsAnimationPlaying((previous) => ({
    ...previous,
    [objectId]: true,
  }));
}

function resolveAnimationCompletion(
  objectId: string,
  completed: boolean,
) {
  const completion =
    animationCompletionRef.current[objectId];

  if (!completion) return;

  delete animationCompletionRef.current[objectId];

  completion.resolve(completed);
}

function setBehaviorObjectVisibility(
  action: BehaviorAction,
  visible: boolean,
): boolean {
  const objectId = action.targetObjectId;

  if (!objectId) {
    console.warn(
      "PLAY PREVIEW — VISIBILITY TARGET MISSING",
    );
    return false;
  }

  const wrapper = modelRefs.current[objectId];

  if (!wrapper) {
    console.warn(
      "PLAY PREVIEW — VISIBILITY OBJECT NOT FOUND:",
      objectId,
    );
    return false;
  }

  // Hanya mengubah objek Three.js.
  // Tidak mengubah data permanen Scene Editor.
  wrapper.visible = visible;

  console.log(
    "PLAY PREVIEW — OBJECT VISIBILITY:",
    objectId,
    visible ? "SHOW" : "HIDE",
  );

  return true;
}

function playBehaviorAnimation(
  action: BehaviorAction,
): boolean {
  const objectId = action.targetObjectId;

  if (!objectId) return false;

  const mixer = animationMixers.current[objectId];
  const clips = animationClips[objectId] ?? [];

  if (!mixer) return false;

  const clip = clips.find(
    (item) => item.name === action.animationName,
  );

  if (!clip) {
    console.warn(
      "PLAY PREVIEW — ANIMATION CLIP NOT FOUND:",
      action.animationName,
    );
    return false;
  }

  const startFrame = Math.max(
    0,
    Math.floor(action.startFrame ?? 0),
  );

  const endFrame = Math.max(
    startFrame + 1,
    Math.floor(
      action.endFrame ??
        Math.ceil(clip.duration * TIMELINE_FPS),
    ),
  );

  const startTime = startFrame / TIMELINE_FPS;

  const endTime = Math.min(
    endFrame / TIMELINE_FPS,
    clip.duration,
  );

  if (
    startTime >= clip.duration ||
    endTime <= startTime
  ) {
    console.warn(
      "PLAY PREVIEW — INVALID ANIMATION RANGE:",
      action,
    );
    return false;
  }

// Batalkan penantian animasi sebelumnya pada target ini.
resolveAnimationCompletion(objectId, false);

// Hentikan animasi sebelumnya hanya pada target ini.
delete animationPlaybackRef.current[objectId];
mixer.stopAllAction();

  // Gunakan klip asli agar animasi skeletal tetap benar.
  const animationAction = mixer.clipAction(clip);

  animationAction.reset();
  animationAction.setLoop(THREE.LoopOnce, 1);
  animationAction.clampWhenFinished = true;
  animationAction.play();

  animationAction.time = startTime;

  animationPlaybackRef.current[objectId] = {
    action: animationAction,
    startTime,
    endTime,
    loopMode: action.loopMode ?? "once",
  };
  previewAnimatedObjectIdsRef.current.add(objectId);

  mixer.update(0);

  setIsAnimationPlaying((previous) => ({
    ...previous,
    [objectId]: true,
  }));

  console.log(
    "PLAY PREVIEW — ANIMATION STARTED:",
    objectId,
    clip.name,
    startFrame,
    endFrame,
  );
  return true;
}
function waitForPreviewAudio(
  audio: HTMLAudioElement,
  executionVersion: number,
): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    let settled = false;

    const finish = (completed: boolean) => {
      if (settled) return;
      settled = true;

      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("abort", handleAbort);

      previewAudioWaitCancelRefs.current.delete(audio);

      resolve(completed);
    };

    const handleEnded = () => {
      finish(
        previewExecutionVersionRef.current === executionVersion,
      );
    };

    const handleError = () => finish(false);
    const handleAbort = () => finish(false);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    audio.addEventListener("abort", handleAbort);

    // Stop Preview dapat memanggil fungsi ini.
    previewAudioWaitCancelRefs.current.set(
      audio,
      () => finish(false),
    );

    if (previewExecutionVersionRef.current !== executionVersion) {
      finish(false);
    }
  });
}

// Menunggu audio Play Once yang sedang aktif sampai selesai.
// Digunakan oleh Prevent Overlap + Wait Until Complete.


function createOnceAudioCompletion(
  actionId: string,
  executionVersion: number,
) {
  let resolveCompletion!: (completed: boolean) => void;
  let settled = false;

  const promise = new Promise<boolean>((resolve) => {
    resolveCompletion = resolve;
  });

  const finish = (completed: boolean) => {
    if (settled) return;

    settled = true;

    // Hapus hanya registry milik Promise ini.
    if (
      previewOnceAudioCompletionRefs.current.get(actionId) ===
      promise
    ) {
      previewOnceAudioCompletionRefs.current.delete(actionId);
      previewOnceAudioCancelRefs.current.delete(actionId);
    }

    resolveCompletion(
      completed &&
        previewExecutionVersionRef.current === executionVersion,
    );
  };

  previewOnceAudioCompletionRefs.current.set(actionId, promise);

  previewOnceAudioCancelRefs.current.set(
    actionId,
    () => finish(false),
  );

  return { promise, finish };
}

async function playBehaviorAudio(
  action: BehaviorAction,
  executionVersion: number,
): Promise<boolean> {
  if (!action.assetId) {
    console.warn("PLAY PREVIEW — AUDIO ASSET NOT SELECTED");
    return false;
  }
// Cegah audio Loop dari action yang sama berjalan ganda.
const isLoopAudio = action.audioLoopMode === "loop";

// Prevent Overlap hanya berlaku untuk Play Once.
const isPreventOverlapOnce =
  !isLoopAudio && action.preventOverlap === true;

if (isLoopAudio) {
  if (
    previewLoopAudioLoadingRefs.current.has(action.id) ||
    previewLoopAudioRefs.current.has(action.id)
  ) {
    console.log(
      "PLAY PREVIEW — AUDIO LOOP ALREADY ACTIVE:",
      action.id,
    );

    return true;
  }

  previewLoopAudioLoadingRefs.current.set(
    action.id,
    executionVersion,
  );
}

// Promise penyelesaian audio milik tap pertama.
let onceCompletion:
  | ReturnType<typeof createOnceAudioCompletion>
  | null = null;

let onceAudioRegistered = false;


// Cegah Play Once bertumpuk jika Prevent Overlap aktif.
if (isPreventOverlapOnce) {
  if (
    previewOnceAudioLoadingRefs.current.has(action.id) ||
    previewOnceAudioRefs.current.has(action.id)
  ) {
    console.log(
      "PLAY PREVIEW — ONCE AUDIO ALREADY ACTIVE:",
      action.id,
    );

   // Jika Wait OFF, langsung lanjut tanpa memutar audio baru.
if (!action.waitUntilComplete) {
  return true;
}

// Jika Wait ON, tunggu Promise milik audio pertama.
const activeCompletion =
  previewOnceAudioCompletionRefs.current.get(action.id);

if (!activeCompletion) {
  console.warn(
    "PLAY PREVIEW — ONCE AUDIO COMPLETION NOT FOUND:",
    action.id,
  );
  return false;
}

return await activeCompletion;
  }

  // Tandai audio sedang loading sebelum mengambil asset.
  previewOnceAudioLoadingRefs.current.set(
    action.id,
    executionVersion,
  );

  // Buat satu Promise bersama sebelum loading asset dimulai.
onceCompletion = createOnceAudioCompletion(
  action.id,
  executionVersion,
);

}

  try {
    const assets = await getAssets(projectId);

    if (previewExecutionVersionRef.current !== executionVersion) {
      return false;
    }

    const asset = assets.find(
      (item) =>
        item.id === action.assetId &&
        item.asset_type === "audio",
    );

    if (!asset?.file_path) {
      console.warn(
        "PLAY PREVIEW — AUDIO ASSET NOT FOUND:",
        action.assetId,
      );
      return false;
    }

    const url = await getAssetUrl(asset.file_path);

    if (previewExecutionVersionRef.current !== executionVersion) {
      return false;
    }

const audio = new Audio(url);

// Mengikuti pengaturan Audio Loop Mode dari Behavior Inspector.
const shouldLoop = action.audioLoopMode === "loop";

audio.loop = shouldLoop;
audio.volume = 1;

previewAudioRefs.current.add(audio);

// Daftarkan Play Once yang menggunakan Prevent Overlap.
if (isPreventOverlapOnce) {
  // Hapus status loading hanya jika milik eksekusi ini.
  if (
    previewOnceAudioLoadingRefs.current.get(action.id) ===
    executionVersion
  ) {
    previewOnceAudioLoadingRefs.current.delete(action.id);
  }

  // Daftarkan hanya jika Preview belum dibatalkan.
  if (previewExecutionVersionRef.current === executionVersion) {
    previewOnceAudioRefs.current.set(action.id, audio);
    onceAudioRegistered = true;
  }
}
// Daftarkan audio Loop agar tidak dibuat berulang.
if (shouldLoop) {
  // Hapus status loading hanya jika milik eksekusi ini.
  if (
    previewLoopAudioLoadingRefs.current.get(action.id) ===
    executionVersion
  ) {
    previewLoopAudioLoadingRefs.current.delete(action.id);
  }

  // Daftarkan hanya jika Preview masih aktif
  // dan eksekusi belum dibatalkan.
  if (previewExecutionVersionRef.current === executionVersion) {
    previewLoopAudioRefs.current.set(action.id, audio);
  }
}

const cleanup = () => {
  previewAudioRefs.current.delete(audio);

  // Selesaikan Promise bersama saat audio selesai atau error.
if (isPreventOverlapOnce) {
  onceCompletion?.finish(audio.ended);
}

  // Izinkan Play Once diputar ulang setelah audio selesai.
if (isPreventOverlapOnce) {
  if (previewOnceAudioRefs.current.get(action.id) === audio) {
    previewOnceAudioRefs.current.delete(action.id);
  }
}

  if (shouldLoop) {
    // Hapus hanya jika registry masih menunjuk audio ini.
    if (previewLoopAudioRefs.current.get(action.id) === audio) {
      previewLoopAudioRefs.current.delete(action.id);
    }
  }

  audio.removeEventListener("ended", cleanup);
  audio.removeEventListener("error", cleanup);
};

    audio.addEventListener("ended", cleanup);
    audio.addEventListener("error", cleanup);

    // Daftarkan listener sebelum audio mulai diputar.
  const completionPromise =
  action.waitUntilComplete && !shouldLoop
    ? waitForPreviewAudio(audio, executionVersion)
    : null;

    try {
      await audio.play();

      if (previewExecutionVersionRef.current !== executionVersion) {
        audio.pause();
        audio.currentTime = 0;
        cleanup();
        return false;
      }

      console.log(
        "PLAY PREVIEW — AUDIO STARTED:",
        asset.name,
      );

      // Tanpa Wait Until Complete, action berikutnya
      // tidak perlu menunggu audio selesai.
      if (!completionPromise) {
        return true;
      }

      console.log(
        "PLAY PREVIEW — WAITING FOR AUDIO:",
        asset.name,
      );

      const completed = await completionPromise;

      if (
        !completed ||
        previewExecutionVersionRef.current !== executionVersion
      ) {
        console.log(
          "PLAY PREVIEW — AUDIO WAIT CANCELLED:",
          asset.name,
        );
        return false;
      }

      console.log(
        "PLAY PREVIEW — AUDIO WAIT COMPLETED:",
        asset.name,
      );

      return true;
} catch (error) {
  // Batalkan Wait Until Complete milik audio ini.
  previewAudioWaitCancelRefs.current.get(audio)?.();

  // Selesaikan Promise Prevent Overlap dengan status gagal.
  // Ini juga membebaskan tap lain yang sedang menunggu.
  if (isPreventOverlapOnce) {
    onceCompletion?.finish(false);
  }

  // Hentikan audio yang gagal.
  audio.pause();

  // Bersihkan registry audio.
  cleanup();

  throw error;
}
  } catch (error) {
    console.error("PLAY PREVIEW — AUDIO FAILED:", error);
    return false;
} finally {
  // Jika loading gagal sebelum audio terdaftar,
  // selesaikan Promise agar tidak menggantung.
  if (isPreventOverlapOnce && !onceAudioRegistered) {
    onceCompletion?.finish(false);
  }

  // Bersihkan status loading Audio Loop.
  if (
    isLoopAudio &&
    previewLoopAudioLoadingRefs.current.get(action.id) ===
      executionVersion
  ) {
    previewLoopAudioLoadingRefs.current.delete(action.id);
  }

  // Bersihkan status loading Play Once.
  if (
    isPreventOverlapOnce &&
    previewOnceAudioLoadingRefs.current.get(action.id) ===
      executionVersion
  ) {
    previewOnceAudioLoadingRefs.current.delete(action.id);
  }
}
}

async function executePreviewActions(
  actions: BehaviorAction[],
  executionVersion: number,
) {
  console.log(
    "PLAY PREVIEW — EXECUTOR STARTED:",
    actions.length,
    "actions",
  );

  for (const action of actions) {
    if (
      previewExecutionVersionRef.current !==
      executionVersion
    ) {
      console.log(
        "PLAY PREVIEW — EXECUTION CANCELLED",
      );
      return;
    }

    switch (action.type) {
   case "play_animation": {
  const targetObjectId = action.targetObjectId;

  // Jalankan langsung jika tidak perlu menunggu.
  if (
    !action.waitUntilComplete ||
    action.loopMode === "loop" ||
    !targetObjectId
  ) {
    playBehaviorAnimation(action);
    break;
  }

  // Jalankan animasi terlebih dahulu.
  // Fungsi ini juga membatalkan penantian animasi lama.
  const started = playBehaviorAnimation(action);

  if (!started) {
    console.warn(
      "PLAY PREVIEW — ANIMATION FAILED TO START:",
      targetObjectId,
    );
    return;
  }

  // Setelah animasi lama dibatalkan, barulah
  // daftarkan Promise untuk animasi yang baru.
  const completionPromise = new Promise<boolean>(
    (resolve) => {
      animationCompletionRef.current[targetObjectId] = {
        resolve,
      };
    },
  );

  console.log(
    "PLAY PREVIEW — WAITING FOR ANIMATION:",
    targetObjectId,
  );

  const completed = await completionPromise;

  if (
    !completed ||
    previewExecutionVersionRef.current !==
      executionVersion
  ) {
    console.log(
      "PLAY PREVIEW — ANIMATION WAIT CANCELLED:",
      targetObjectId,
    );
    return;
  }

  console.log(
    "PLAY PREVIEW — ANIMATION WAIT COMPLETED:",
    targetObjectId,
  );

  break;
}
case "show_object": {
  setBehaviorObjectVisibility(action, true);
  break;
}

case "hide_object": {
  setBehaviorObjectVisibility(action, false);
  break;
}
case "play_audio": {
  // Tanpa Wait Until Complete:
  // Audio berjalan tanpa menahan action berikutnya.
if (
  !action.waitUntilComplete ||
  action.audioLoopMode === "loop"
) {
  void playBehaviorAudio(action, executionVersion);
  break;
}

  // Dengan Wait Until Complete:
  // Tunggu sampai audio selesai.
  console.log("PLAY PREVIEW — EXECUTOR WAITING FOR AUDIO");

  const completed = await playBehaviorAudio(
    action,
    executionVersion,
  );

  if (
    !completed ||
    previewExecutionVersionRef.current !== executionVersion
  ) {
    console.log(
      "PLAY PREVIEW — EXECUTOR AUDIO WAIT CANCELLED",
    );
    return;
  }

  console.log(
    "PLAY PREVIEW — EXECUTOR AUDIO WAIT COMPLETED",
  );

  break;
}
      default:
        console.log(
          "PLAY PREVIEW — ACTION NOT IMPLEMENTED YET:",
          action.type,
        );
        break;
    }
  }

  console.log(
    "PLAY PREVIEW — EXECUTOR FINISHED",
  );
}

function stopSelectedAnimation() {
  if (!selectedObjectId) return;

  const objectId = selectedObjectId;
  const mixer = animationMixers.current[objectId];

  delete animationPlaybackRef.current[objectId];

  if (!mixer) return;

  mixer.stopAllAction();

  setIsAnimationPlaying((previous) => ({
    ...previous,
    [objectId]: false,
  }));
}

function stopPreviewAnimations() {
  previewExecutionVersionRef.current += 1;

  // Batalkan semua Promise Prevent Overlap yang masih aktif.
for (const cancel of previewOnceAudioCancelRefs.current.values()) {
  cancel();
}

previewOnceAudioCancelRefs.current.clear();

console.log(
  "PLAY PREVIEW — ALL ONCE AUDIO COMPLETIONS CANCELLED",
);
// Batalkan semua proses Wait Until Complete audio.
for (const cancelWait of previewAudioWaitCancelRefs.current.values()) {
  cancelWait();
}

previewAudioWaitCancelRefs.current.clear();

console.log("PLAY PREVIEW — ALL AUDIO WAITS CANCELLED");

for (const audio of previewAudioRefs.current) {
  audio.pause();
  audio.currentTime = 0;
}

previewAudioRefs.current.clear();

// Bersihkan registry audio Loop saat Stop Preview.
previewLoopAudioRefs.current.clear();

// Bersihkan status audio Loop yang masih loading.
previewLoopAudioLoadingRefs.current.clear();

// Bersihkan registry Prevent Overlap untuk Play Once.
previewOnceAudioRefs.current.clear();
previewOnceAudioLoadingRefs.current.clear();

// Hapus referensi Promise audio Play Once.
previewOnceAudioCompletionRefs.current.clear();

console.log(
  "PLAY PREVIEW — ONCE AUDIO REGISTRIES CLEARED",
);

console.log(
  "PLAY PREVIEW — ALL AUDIO LOOP REGISTRIES CLEARED",
);

console.log(
  "PLAY PREVIEW — ALL PREVIEW AUDIO STOPPED",
);

  for (const objectId of previewAnimatedObjectIdsRef.current) {
    resolveAnimationCompletion(objectId, false);

    const mixer = animationMixers.current[objectId];

    if (!mixer) continue;

    delete animationPlaybackRef.current[objectId];

    mixer.stopAllAction();

    setIsAnimationPlaying((previous) => ({
      ...previous,
      [objectId]: false,
    }));
  }

  previewAnimatedObjectIdsRef.current.clear();

  console.log(
    "PLAY PREVIEW — ALL PREVIEW ANIMATIONS STOPPED",
  );

  // Kembalikan visibilitas objek sesuai Scene Editor.
  // Hanya dijalankan ketika fungsi stop dipanggil.
  for (const object of objects) {
    const wrapper = modelRefs.current[object.id];

    if (!wrapper) continue;

    wrapper.visible = object.visible;
  }

  console.log(
    "PLAY PREVIEW — OBJECT VISIBILITY RESTORED",
  );
}

// Kembalikan visibilitas sesuai pengaturan Scene Editor.

useEffect(() => {
  if (!isPlayPreview) {
    stopPreviewAnimations();
  }
}, [isPlayPreview]);

useEffect(() => {
  if (!isPlayPreview || !previewActionBatch) {
    return;
  }

  if (
    lastPreviewCommandIdRef.current ===
    previewActionBatch.id
  ) {
    return;
  }

  lastPreviewCommandIdRef.current =
    previewActionBatch.id;

  const executionVersion =
    previewExecutionVersionRef.current;

  void executePreviewActions(
    previewActionBatch.actions,
    executionVersion,
  );
}, [previewActionBatch, isPlayPreview]);
 
  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    // Menandai apakah instance scene ini masih aktif.
let isSceneActive = true;

    const scene = new THREE.Scene();

    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth /
        container.clientHeight,
      0.1,
      1000,
    );

    camera.position.set(0, 1, 3);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
    });

    const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let pointerDownPosition: {
  x: number;
  y: number;
} | null = null;

let activePointerId: number | null = null;

    const controls = new OrbitControls(
      camera,
      renderer.domElement,
    );

    controls.enableDamping = true;
    controls.target.set(0, 0, 0);

    const transformControls = new TransformControls(
  camera,
  renderer.domElement,
);

transformControls.setMode(transformMode); 
transformControlsRef.current = transformControls;
scene.add(transformControls.getHelper());

// scene.add(transformControls);

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2),
    );

    renderer.setSize(
      container.clientWidth,
      container.clientHeight,
    );

    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      2,
    );

    scene.add(ambientLight);

    const directionalLight =
      new THREE.DirectionalLight(
        0xffffff,
        2,
      );

    directionalLight.position.set(3, 5, 3);

    scene.add(directionalLight);

    const gridHelper = new THREE.GridHelper(
      10,
      10,
    );

    scene.add(gridHelper);


const loader = new GLTFLoader();

// Kosongkan referensi lama sebelum memuat ulang objek.
modelRefs.current = {};

// Pasangkan semua wrapper berdasarkan parent_id.
// Fungsi ini dijalankan setiap kali satu GLB selesai dimuat.
function syncObjectHierarchy() {
  for (const object of objects) {
    const child = modelRefs.current[object.id];

    if (!child) continue;

    const parent = object.parent_id
      ? modelRefs.current[object.parent_id]
      : null;

    if (parent && parent !== child) {
      parent.add(child);
    } else {
      scene.add(child);
    }
  }
}

for (const object of objects) {
  const url = objectModelUrls[object.id];

  if (!url) continue;

loader.load(
  url,
  (gltf) => {
    // Abaikan hasil loading dari scene yang sudah dibersihkan.
    if (!isSceneActive) {
      console.log(
        "GLB LOAD IGNORED — OLD SCENE:",
        object.name,
      );
      return;
    }

    console.log("GLB LOADED:", object.name, gltf);

      // Wrapper mewakili satu objek dalam CMS.
      const wrapper = new THREE.Group();

      
     
const loadedAnimationNames = gltf.animations.map(
  (clip) => clip.name || "Unnamed Animation",
);

setAnimationNames((previous) => ({
  ...previous,
  [object.id]: loadedAnimationNames,
}));

onAnimationNamesChangeRef.current?.(
  object.id,
  loadedAnimationNames,
);

const loadedAnimationMetadata = gltf.animations.map(
  (clip, index) => ({
    name: loadedAnimationNames[index],
    duration: clip.duration,
  }),
);

onAnimationMetadataChangeRef.current?.(
  object.id,
  loadedAnimationMetadata,
);

setIsAnimationPlaying((previous) => ({
  ...previous,
  [object.id]: false,
}));

setSelectedAnimation((previous) => ({
  ...previous,
  [object.id]: "",
}));

setAnimationClips((previous) => ({
  ...previous,
  [object.id]: gltf.animations,
}));


      if (gltf.animations.length > 0) {
        const mixer = new THREE.AnimationMixer(gltf.scene);

        animationMixers.current[object.id] = mixer;
      }


      wrapper.name = object.name;
      wrapper.position.set(
        object.position_x,
        object.position_y,
        object.position_z,
      );

      wrapper.rotation.set(
        object.rotation_x,
        object.rotation_y,
        object.rotation_z,
      );

      wrapper.scale.set(
        object.scale_x,
        object.scale_y,
        object.scale_z,
      );

      wrapper.visible = object.visible;
      wrapper.userData.sceneObjectId = object.id;

      // GLB menjadi isi wrapper, bukan objek root scene.
      wrapper.add(gltf.scene);

      // TransformControls akan menggunakan wrapper ini.
      modelRefs.current[object.id] = wrapper;

      // Parent mungkin sudah selesai dimuat,
      // atau justru baru selesai setelah child.
      syncObjectHierarchy();

      console.log("GLB WRAPPER:", object.name, wrapper);
    },
    (progress) => {
        if (!isSceneActive) return;
      console.log(
        "GLB LOADING:",
        object.name,
        progress.loaded,
        progress.total,
      );
    },
    (error) => {
        if (!isSceneActive) return;
      console.error(
        "FAILED TO LOAD GLB:",
        object.name,
        error,
      );
    },
  );
}


transformControls.addEventListener(
  "dragging-changed",
  (event) => {
    controls.enabled = !event.value;
  },
);

function handlePointerDown(event: PointerEvent) {
  if (!isPlayPreviewRef.current) return;

  if (event.button !== 0) return;

  activePointerId = event.pointerId;

  pointerDownPosition = {
    x: event.clientX,
    y: event.clientY,
  };
}

function handlePointerUp(event: PointerEvent) {
  if (!isPlayPreviewRef.current) return;

  if (
    activePointerId !== event.pointerId ||
    !pointerDownPosition
  ) {
    return;
  }

  const distance = Math.hypot(
    event.clientX - pointerDownPosition.x,
    event.clientY - pointerDownPosition.y,
  );

  pointerDownPosition = null;
  activePointerId = null;

  // Gerakan lebih dari 6 piksel dianggap drag.
  if (distance > 6) return;

  const rect =
    renderer.domElement.getBoundingClientRect();

  if (rect.width === 0 || rect.height === 0) {
    return;
  }

  pointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  pointer.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // Raycast hanya terhadap wrapper objek CMS.
  const rootObjects = Object.values(
    modelRefs.current,
  ).filter((model) => model.parent === scene);

  const intersections = raycaster.intersectObjects(
    rootObjects,
    true,
  );

  for (const intersection of intersections) {
    let current: THREE.Object3D | null =
      intersection.object;

    // Cari wrapper CMS terdekat.
    while (current) {
      const objectId =
        current.userData.sceneObjectId as
          | string
          | undefined;

      if (objectId) {
        const targetObject = objects.find(
          (object) => object.id === objectId,
        );

     const wrapper = modelRefs.current[objectId];

// Pastikan objek benar-benar terlihat saat Preview.
// Periksa juga seluruh parent karena objek CMS
// dapat berada di dalam hierarchy objek lain.
let isActuallyVisible = Boolean(wrapper);

let visibilityNode: THREE.Object3D | null =
  wrapper ?? null;

while (visibilityNode) {
  if (!visibilityNode.visible) {
    isActuallyVisible = false;
    break;
  }

  visibilityNode = visibilityNode.parent;
}

if (
  targetObject &&
  isActuallyVisible
) {
  console.log(
    "PLAY PREVIEW — OBJECT TAP:",
    targetObject.name,
    objectId,
  );

  onObjectTapRef.current?.(objectId);
  return;
}
      }

      current = current.parent;
    }
  }
}

function handlePointerCancel() {
  pointerDownPosition = null;
  activePointerId = null;
}

renderer.domElement.addEventListener(
  "pointerdown",
  handlePointerDown,
);

renderer.domElement.addEventListener(
  "pointerup",
  handlePointerUp,
);

renderer.domElement.addEventListener(
  "pointercancel",
  handlePointerCancel,
);
  
const clock = new THREE.Clock();
let animationFrameId = 0;

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const delta = clock.getDelta();

  for (const [objectId, mixer] of Object.entries(
    animationMixers.current,
  )) {
    mixer.update(delta);

    const playback =
      animationPlaybackRef.current[objectId];

    if (!playback) continue;

    const { action, startTime, endTime, loopMode } =
      playback;

    if (action.time < endTime) continue;

    if (loopMode === "loop") {
      // Ulangi hanya rentang frame yang dipilih.
      action.reset();
      action.play();
      action.time = startTime;

      // Terapkan pose awal rentang yang baru.
      mixer.update(0);
    } else {
      // Berhenti tepat pada End Frame.
      action.time = endTime;
      action.paused = true;

      mixer.update(0);

      delete animationPlaybackRef.current[objectId];

// Beri tahu executor bahwa animasi telah selesai.
resolveAnimationCompletion(objectId, true);

      setIsAnimationPlaying((previous) => ({
        ...previous,
        [objectId]: false,
      }));
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

animate();


function handleResize() {
  if (!container) {
    return;
  }

  const width = container.clientWidth;
      const height = container.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    window.addEventListener(
      "resize",
      handleResize,
    );

    return () => {
        isSceneActive = false;
      window.removeEventListener(
        "resize",
        handleResize,
      );

      renderer.domElement.removeEventListener(
  "pointerdown",
  handlePointerDown,
);

renderer.domElement.removeEventListener(
  "pointerup",
  handlePointerUp,
);

renderer.domElement.removeEventListener(
  "pointercancel",
  handlePointerCancel,
);


cancelAnimationFrame(animationFrameId);

for (const mixer of Object.values(
  animationMixers.current,
)) {
  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
}

animationMixers.current = {};
modelRefs.current = {};
transformControlsRef.current = null;

transformControls.dispose();

controls.dispose();
renderer.dispose();

if (renderer.domElement.parentNode === container) {
  container.removeChild(renderer.domElement);
}
   
    };
}, [objects, objectModelUrls]);


useEffect(() => {
  const transformControls =
    transformControlsRef.current;

  if (!transformControls) return;

  // Saat Play Preview, gizmo tidak boleh digunakan.
if (isPlayPreview) {
  transformControls.detach();
  transformControls.enabled = false;
  return;
}

// Saat kembali ke Edit Mode, aktifkan kembali gizmo.
transformControls.enabled = true;

  transformControls.setMode(transformMode);

  if (!selectedObjectId) {
    transformControls.detach();
    return;
  }

  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );

  if (!selectedObject || selectedObject.locked) {
    transformControls.detach();
    return;
  }

  const selectedModel =
    modelRefs.current[selectedObjectId];

  if (selectedModel) {
    transformControls.attach(selectedModel);
  } else {
    transformControls.detach();
  }
}, [
  selectedObjectId,
  transformMode,
  objects,
  isPlayPreview,
]);


useEffect(() => {
  if (!selectedObjectId) return;

  const model = modelRefs.current[selectedObjectId];

  if (!model) return;

  if (position) {
    model.position.set(
      position.x,
      position.y,
      position.z,
    );
  }

  if (rotation) {
    model.rotation.set(
      rotation.x,
      rotation.y,
      rotation.z,
    );
  }

  if (scale) {
    model.scale.set(
      scale.x,
      scale.y,
      scale.z,
    );
  }
}, [
  selectedObjectId,
  position?.x,
  position?.y,
  position?.z,
  rotation?.x,
  rotation?.y,
  rotation?.z,
  scale?.x,
  scale?.y,
  scale?.z,
]);


useEffect(() => {
  function handleKeyDown(event: KeyboardEvent) {
    if (isPlayPreview) return;
    const target = event.target as HTMLElement | null;

    if (
      target?.tagName === "INPUT" ||
      target?.tagName === "TEXTAREA" ||
      target?.tagName === "SELECT"
    ) {
      return;
    }

    if (event.key.toLowerCase() === "w") {
      setTransformMode("translate");
    }

    if (event.key.toLowerCase() === "e") {
      setTransformMode("rotate");
    }

    if (event.key.toLowerCase() === "r") {
      setTransformMode("scale");
    }
  }

  window.addEventListener("keydown", handleKeyDown);

  return () => {
    window.removeEventListener(
      "keydown",
      handleKeyDown,
    );
  };
}, [isPlayPreview]);
  return (
  <div className="relative h-full w-full">
   <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-md border bg-background p-1 shadow-sm">
  <Button
    type="button"
    size="sm"
    disabled={isPlayPreview}
    variant={
      transformMode === "translate"
        ? "default"
        : "ghost"
    }
    onClick={() => setTransformMode("translate")}
  >
    Move
  </Button>

  <Button
    type="button"
    size="sm"
    variant={
      transformMode === "rotate"
        ? "default"
        : "ghost"
    }
    onClick={() => setTransformMode("rotate")}
  >
    Rotate
  </Button>

  <Button
    type="button"
    size="sm"
    variant={
      transformMode === "scale"
        ? "default"
        : "ghost"
    }
    onClick={() => setTransformMode("scale")}
  >
    Scale
  </Button>
</div>

    <div
      ref={containerRef}
      className="h-full w-full"
    />
    
<div className="absolute right-3 top-3 z-10 w-64 space-y-3 rounded-md border bg-background p-3 shadow-sm">
  <h3 className="text-sm font-semibold">
    Animation Inspector
  </h3>

  {!selectedObjectId ? (
    <p className="text-xs text-muted-foreground">
      Pilih objek di Hierarchy terlebih dahulu.
    </p>
  ) : (animationNames[selectedObjectId] ?? []).length === 0 ? (
    <p className="text-xs text-muted-foreground">
      Objek ini tidak memiliki animasi GLB.
    </p>
  ) : (
    <>
      <select
        className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
        value={selectedAnimation[selectedObjectId] ?? ""}
        onChange={(event) => {
          const value = event.target.value;

          setSelectedAnimation((previous) => ({
            ...previous,
            [selectedObjectId]: value,
          }));
        }}
      >
        <option value="">Pilih animasi...</option>

        {(animationNames[selectedObjectId] ?? []).map(
          (name, index) => (
            <option key={`${name}-${index}`} value={name}>
              {name}
            </option>
          ),
        )}
      </select>
      
<select
  className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
  value={animationLoopMode[selectedObjectId] ?? "loop"}
  onChange={(event) => {
    const value = event.target.value as "loop" | "once";

    setAnimationLoopMode((previous) => ({
      ...previous,
      [selectedObjectId]: value,
    }));
  }}
>
  <option value="loop">Loop</option>
  <option value="once">Play Once</option>
</select>


<div className="grid grid-cols-2 gap-2">
  <label className="space-y-1 text-xs">
    <span className="text-muted-foreground">
      Start Frame (24 FPS)
    </span>
    <input
      type="number"
      min={0}
      step={1}
      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      value={animationStartFrames[selectedObjectId] ?? 0}
      onChange={(event) => {
        const value = Math.max(
          0,
          Math.floor(Number(event.target.value) || 0),
        );

        setAnimationStartFrames((previous) => ({
          ...previous,
          [selectedObjectId]: value,
        }));
      }}
    />
  </label>

  <label className="space-y-1 text-xs">
    <span className="text-muted-foreground">
      End Frame (24 FPS)
    </span>
    <input
      type="number"
      min={1}
      step={1}
      className="w-full rounded-md border bg-background px-2 py-1.5 text-sm"
      value={
        animationEndFrames[selectedObjectId] ??
        Math.max(
          1,
          Math.ceil(
            (
              animationClips[selectedObjectId]?.find(
                (clip) =>
                  clip.name ===
                  selectedAnimation[selectedObjectId],
              )?.duration ?? 1
            ) * TIMELINE_FPS,
          ),
        )
      }
      onChange={(event) => {
        const value = Math.max(
          1,
          Math.floor(Number(event.target.value) || 1),
        );

        setAnimationEndFrames((previous) => ({
          ...previous,
          [selectedObjectId]: value,
        }));
      }}
    />
  </label>
</div>


      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="flex-1"
          disabled={
            !selectedAnimation[selectedObjectId] ||
            isAnimationPlaying[selectedObjectId] === true
          }
          onClick={playSelectedAnimation}
        >
          Play
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          className="flex-1"
          disabled={!isAnimationPlaying[selectedObjectId]}
          onClick={stopSelectedAnimation}
        >
          Stop
        </Button>
      </div>
    </>
  )}
</div>

  </div>

  

);
}
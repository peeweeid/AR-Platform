"use client";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { SceneObject } from "../../types/sceneObject";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { Button } from "@/components/ui/button";

interface SceneViewportProps {
  objects: SceneObject[];

  selectedObjectId: string | null;

  objectModelUrls: Record<string, string>;

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
  objects,
  selectedObjectId,
  objectModelUrls,
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

  const modelRefs = useRef<
  Record<string, THREE.Object3D>
>({});

const [transformMode, setTransformMode] =
  useState<"translate" | "rotate" | "scale">("translate");

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

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

for (const object of objects) {
  const url = objectModelUrls[object.id];

  if (!url) continue;

  loader.load(
    url,
    (gltf) => {
      console.log(
        "GLB LOADED:",
        object.name,
        gltf,
      );

      const model = gltf.scene;

      model.position.set(
        object.position_x,
        object.position_y,
        object.position_z,
      );

      model.rotation.set(
        object.rotation_x,
        object.rotation_y,
        object.rotation_z,
      );

      model.scale.set(
        object.scale_x,
        object.scale_y,
        object.scale_z,
      );

      model.visible = object.visible;

      model.userData.sceneObjectId = object.id;

      modelRefs.current[object.id] = model;

      scene.add(model);

      console.log(
        "GLB MODEL:",
        object.name,
        model,
      );
    },
    (progress) => {
      console.log(
        "GLB LOADING:",
        object.name,
        progress.loaded,
        progress.total,
      );
    },
    (error) => {
      console.error(
        "FAILED TO LOAD GLB:",
        object.name,
        error,
      );
    },
  );
}
transformControls.addEventListener(
  "objectChange",
  () => {
    const object = transformControls.object;

    if (!object) return;

    if (onPositionChange) {
      onPositionChange({
        x: object.position.x,
        y: object.position.y,
        z: object.position.z,
      });
    }

    if (onRotationChange) {
      onRotationChange({
        x: object.rotation.x,
        y: object.rotation.y,
        z: object.rotation.z,
      });
    }

    if (onScaleChange) {
      onScaleChange({
        x: object.scale.x,
        y: object.scale.y,
        z: object.scale.z,
      });
    }
  },
);

transformControls.addEventListener(
  "dragging-changed",
  (event) => {
    controls.enabled = !event.value;
  },
);

    function animate() {
      requestAnimationFrame(animate);

      controls.update();

      renderer.render(scene, camera);
    }

    animate();

    function handleResize() {
      if (!container) {
        return;
      }
      modelRefs.current = {};

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
      window.removeEventListener(
        "resize",
        handleResize,
      );
transformControls.dispose();
      controls.dispose();
      renderer.dispose();

      if (
        renderer.domElement.parentNode ===
        container
      ) {
        container.removeChild(
          renderer.domElement,
        );
      }

   
    };
}, [objects, objectModelUrls]);


useEffect(() => {
  const transformControls =
    transformControlsRef.current;

  if (!transformControls) return;

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
}, []);
  return (
  <div className="relative h-full w-full">
   <div className="absolute left-3 top-3 z-10 flex gap-1 rounded-md border bg-background p-1 shadow-sm">
  <Button
    type="button"
    size="sm"
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
  </div>
);
}
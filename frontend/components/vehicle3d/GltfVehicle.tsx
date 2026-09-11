// components/vehicle3d/GltfVehicle.tsx
"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { RegionHighlight, VehicleRegion } from "@/types/vehicle3d";
import { STATUS_COLOR } from "@/lib/metricDisplay";

const MODEL_PATH = "/models/vehicle.glb";

/**
 * Real GLTF loading path via drei's useGLTF (wraps Three's GLTFLoader in a
 * Suspense-friendly cache). Discovers region-taggable nodes by the same
 * userData.elmodeRole convention established in our earlier Phase 4 work —
 * a mesh authored in Blender with a custom property
 * elmodeRole = "engine-bay" | "cooling" | "lubrication" | "battery" will be
 * found here and highlighted exactly like ProceduralVehicle's regions.
 *
 * This component is only rendered when VehicleScene.tsx has already
 * confirmed /public/models/vehicle.glb exists (HEAD request) AND wraps it
 * in Suspense + an error boundary — so a missing/corrupt model falls back
 * to ProceduralVehicle rather than crashing the dashboard, per brief #25.
 */
export function GltfVehicle({ highlights }: { highlights: RegionHighlight[] }) {
  const { scene } = useGLTF(MODEL_PATH);
  const regionMeshes = useRef<Partial<Record<VehicleRegion, THREE.Mesh[]>>>({});
  const pulsePhase = useRef(0);

  useEffect(() => {
    const found: Partial<Record<VehicleRegion, THREE.Mesh[]>> = {};
    scene.traverse((obj) => {
      const role = obj.userData?.elmodeRole as VehicleRegion | undefined;
      if (role && obj instanceof THREE.Mesh) {
        found[role] = found[role] ? [...found[role]!, obj] : [obj];
      }
      if (obj instanceof THREE.Mesh) {
        obj.castShadow = true;
        obj.receiveShadow = true;
      }
    });
    regionMeshes.current = found;
  }, [scene]);

  const hasCritical = highlights.some((h) => h.status === "CRITICAL");

  useFrame((_, delta) => {
    if (hasCritical) pulsePhase.current += delta * 2.2;
    const pulse = hasCritical ? 0.75 + Math.sin(pulsePhase.current) * 0.25 : 1;

    for (const highlight of highlights) {
      const meshes = regionMeshes.current[highlight.region];
      if (!meshes) continue;
      for (const mesh of meshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat?.emissive) continue;
        if (highlight.status === "INFO") {
          mat.emissiveIntensity = 0;
        } else {
          mat.emissive.set(STATUS_COLOR[highlight.status]);
          mat.emissiveIntensity = (highlight.status === "CRITICAL" ? 0.55 : 0.35) * pulse;
        }
      }
    }
  });

  return <primitive object={scene} />;
}

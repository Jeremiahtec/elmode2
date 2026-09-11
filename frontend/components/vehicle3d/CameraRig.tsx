// components/vehicle3d/CameraRig.tsx
"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { OrientationConfig } from "@/types/vehicle3d";

const LERP_FACTOR = 0.045; // smooth, unhurried interpolation — brief explicitly asks for no sudden rotation

interface CameraRigProps {
  orientation: OrientationConfig;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  userInteracted: boolean;
}

/**
 * Smoothly interpolates the camera position and OrbitControls target
 * toward whatever orientation preset the current route requests. If the
 * user has manually dragged/zoomed (userInteracted), we back off and let
 * them drive — snapping back to a scripted orientation mid-interaction
 * would feel exactly like the "annoying/distracting" behavior brief #8
 * explicitly warns against.
 */
export function CameraRig({ orientation, controlsRef, userInteracted }: CameraRigProps) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3(...orientation.cameraPosition));
  const targetLook = useRef(new THREE.Vector3(...orientation.target));

  targetPos.current.set(...orientation.cameraPosition);
  targetLook.current.set(...orientation.target);

  useFrame(() => {
    if (userInteracted) return; // user is driving — don't fight them

    camera.position.lerp(targetPos.current, LERP_FACTOR);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLook.current, LERP_FACTOR);
      controlsRef.current.update();
    }
  });

  return null;
}

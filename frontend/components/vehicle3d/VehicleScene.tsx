// components/vehicle3d/VehicleScene.tsx
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { ProceduralVehicle } from "./ProceduralVehicle";
import { GltfVehicle } from "./GltfVehicle";
import { ModelErrorBoundary } from "./ModelErrorBoundary";
import { CameraRig } from "./CameraRig";
import type { RegionHighlight, VehicleOrientationPreset } from "@/types/vehicle3d";
import { ORIENTATION_PRESETS } from "@/types/vehicle3d";

interface VehicleSceneProps {
  orientation: VehicleOrientationPreset;
  highlights: RegionHighlight[];
  /** Lower detail / disable shadows for smaller embedded contexts (e.g. a sidebar preview). Defaults to full quality. */
  compact?: boolean;
}

function LoadingPlaceholder() {
  // A simple, honest "loading" indicator inside the canvas rather than a
  // blank frame — shown only for the instant a GLTF is actually being
  // fetched/parsed (irrelevant in the procedural-only path, since that
  // renders synchronously).
  return null;
}

/**
 * Checks whether a real model file exists before ever attempting to render
 * GltfVehicle. This is deliberate: useGLTF's Suspense-throw-on-404 works,
 * but doing a cheap HEAD check first avoids a guaranteed failed network
 * request (and the associated console noise) on every single page load
 * for the common case (no model present yet) — see brief #5/#25.
 */
function useModelAvailability(): boolean | null {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/models/vehicle.glb", { method: "HEAD" })
      .then((res) => {
        if (!cancelled) setAvailable(res.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return available;
}

export function VehicleScene({ orientation, highlights, compact = false }: VehicleSceneProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const userInteractedRef = useRef(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const modelAvailable = useModelAvailability();
  const config = ORIENTATION_PRESETS[orientation];

  // Once the user manually drags/zooms, stop auto-orienting on route change
  // until they explicitly reset — prevents the scripted camera from
  // fighting a user mid-interaction (brief #8).
  const handleInteractionStart = () => {
    userInteractedRef.current = true;
    setUserInteracted(true);
  };

  const handleReset = () => {
    userInteractedRef.current = false;
    setUserInteracted(false);
  };

  return (
    <div className="group relative h-full w-full">
      <Canvas
        shadows={!compact}
        dpr={[1, compact ? 1.5 : 2]}
        camera={{ position: config.cameraPosition, fov: 42 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#00000000"]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[5, 6, 4]}
          intensity={1.1}
          castShadow={!compact}
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-4, 3, -3]} intensity={0.3} color="#3fd6e0" />

        <Suspense fallback={<LoadingPlaceholder />}>
          {modelAvailable ? (
            <ModelErrorBoundary fallback={<ProceduralVehicle highlights={highlights} />}>
              <GltfVehicle highlights={highlights} />
            </ModelErrorBoundary>
          ) : (
            <ProceduralVehicle highlights={highlights} />
          )}
        </Suspense>

        {!compact && <ContactShadows position={[0, 0, 0]} opacity={0.5} scale={10} blur={2.2} far={4} />}
        {!compact && <Environment preset="city" environmentIntensity={0.25} />}

        <CameraRig orientation={config} controlsRef={controlsRef} userInteracted={userInteracted} />

        <OrbitControls
          ref={controlsRef}
          enablePan={false}
          minDistance={3}
          maxDistance={10}
          maxPolarAngle={Math.PI / 2.1}
          onStart={handleInteractionStart}
          autoRotate={config.autoOrbit && !userInteracted}
          autoRotateSpeed={0.6}
        />
      </Canvas>

      {userInteracted && !compact && (
        <button
          onClick={handleReset}
          className="absolute bottom-3 right-3 rounded-md border border-graphite-600 bg-graphite-900/80 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-graphite-300 opacity-0 backdrop-blur transition-opacity hover:text-white group-hover:opacity-100"
        >
          Reset View
        </button>
      )}
    </div>
  );
}

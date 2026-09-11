"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { DegradationStatus, TelemetrySnapshot } from "@/types/telemetry";
import type { ResolvedVehicleParts } from "@/types/vehicleAsset";
import { loadVehicleAsset, disposeVehicleAsset, type LoadedVehicleAsset } from "@/lib/three/gltfVehicleLoader";
import { buildProceduralVehicle, disposeProceduralVehicle, type ProceduralVehicleAsset } from "@/lib/three/proceduralVehicle";

interface VehicleModelCanvasProps {
  telemetry: TelemetrySnapshot;
  assetUrl?: string;
  className?: string;
}

interface LiveTelemetryRef {
  rpm: number;
  coolantTemp: number;
  status: DegradationStatus;
}

const IDLE_RPM = 800;
const REDLINE_RPM = 7000;
const MAX_WHEEL_ANGULAR_VELOCITY = 28;
const VELOCITY_LERP_FACTOR = 0.08;
const COLOR_LERP_FACTOR = 0.05;

const STATUS_COLORS: Record<DegradationStatus, THREE.Color> = {
  INFO: new THREE.Color(0x2dd4bf),
  WARNING: new THREE.Color(0xf59e0b),
  CRITICAL: new THREE.Color(0xdc2626),
};

type LoadState = "loading" | "ready-gltf" | "ready-procedural" | "error";

type ActiveAsset =
  | { kind: "gltf"; asset: LoadedVehicleAsset }
  | { kind: "procedural"; asset: ProceduralVehicleAsset };

function partsOf(active: ActiveAsset): ResolvedVehicleParts {
  return active.kind === "gltf"
    ? active.asset
    : { ...active.asset, diagnosticWireframes: [] }; // procedural exposes its wireframe separately below
}

export default function VehicleModelCanvas({ telemetry, assetUrl, className }: VehicleModelCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const liveDataRef = useRef<LiveTelemetryRef>({ rpm: 0, coolantTemp: 20, status: "INFO" });
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const rpmEvent = telemetry.ENGINE_RPM;
    const coolantEvent = telemetry.COOLANT_TEMP;
    const statuses = [rpmEvent?.status, coolantEvent?.status].filter(
      (s): s is DegradationStatus => Boolean(s)
    );
    const worstStatus: DegradationStatus = statuses.includes("CRITICAL")
      ? "CRITICAL"
      : statuses.includes("WARNING")
      ? "WARNING"
      : "INFO";

    liveDataRef.current.rpm = rpmEvent?.value ?? liveDataRef.current.rpm;
    liveDataRef.current.coolantTemp = coolantEvent?.value ?? liveDataRef.current.coolantTemp;
    liveDataRef.current.status = worstStatus;
  }, [telemetry]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(4.5, 2.5, 6);
    camera.lookAt(0, 0.5, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
    scene.add(ambientLight);

    const diagnosticLight = new THREE.PointLight(STATUS_COLORS.INFO, 12, 15, 2);
    diagnosticLight.position.set(0, 3, 2);
    scene.add(diagnosticLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    let animationFrameId: number | null = null;
    let lastFrameTime = performance.now();
    let currentAngularVelocity = 0;
    const currentDiagnosticColor = STATUS_COLORS.INFO.clone();
    let pulsePhase = 0;

    let active: ActiveAsset | null = null;
    let proceduralWireframeMaterial: THREE.MeshBasicMaterial | null = null;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      if (!active) return;

      const now = performance.now();
      const deltaSeconds = Math.min((now - lastFrameTime) / 1000, 0.1);
      lastFrameTime = now;

      const { rpm, status } = liveDataRef.current;
      const clampedRpm = Math.max(0, Math.min(rpm, REDLINE_RPM));
      const targetAngularVelocity = clampedRpm <= 0 ? 0 : (clampedRpm / REDLINE_RPM) * MAX_WHEEL_ANGULAR_VELOCITY;

      currentAngularVelocity += (targetAngularVelocity - currentAngularVelocity) * VELOCITY_LERP_FACTOR;
      if (targetAngularVelocity === 0 && Math.abs(currentAngularVelocity) < 0.01) {
        currentAngularVelocity = 0;
      }

      const rotationDelta = currentAngularVelocity * deltaSeconds;
      const parts = partsOf(active);
      for (const wheel of parts.wheels) {
        wheel.rotation.x += rotationDelta;
      }

      const targetColor = STATUS_COLORS[status];
      currentDiagnosticColor.lerp(targetColor, COLOR_LERP_FACTOR);

      let intensityMultiplier = 1;
      if (status === "CRITICAL") {
        pulsePhase += deltaSeconds * 4.5;
        intensityMultiplier = 0.7 + Math.sin(pulsePhase) * 0.3;
      } else {
        pulsePhase = 0;
      }

      diagnosticLight.color.copy(currentDiagnosticColor);
      diagnosticLight.intensity = 12 * intensityMultiplier;

      for (const mesh of parts.diagnosticMeshes) {
        const applyEmissive = (m: THREE.Material) => {
          const standard = m as THREE.MeshStandardMaterial;
          if (standard.emissive) {
            standard.emissive.copy(currentDiagnosticColor);
            standard.emissiveIntensity = 0.6 * intensityMultiplier;
          }
        };
        const material = mesh.material;
        Array.isArray(material) ? material.forEach(applyEmissive) : material && applyEmissive(material);
      }

      for (const mesh of parts.diagnosticWireframes) {
        const applyColor = (m: THREE.Material) => {
          (m as THREE.MeshBasicMaterial).color?.copy(currentDiagnosticColor);
        };
        const material = mesh.material;
        Array.isArray(material) ? material.forEach(applyColor) : material && applyColor(material);
      }

      if (proceduralWireframeMaterial) {
        proceduralWireframeMaterial.color.copy(currentDiagnosticColor);
      }

      renderer.render(scene, camera);
    };

    animationFrameId = requestAnimationFrame(animate);

    const activateProceduralFallback = (reason: string) => {
      if (cancelled) return;
      console.info(`[VehicleModelCanvas] Using procedural wireframe fallback (${reason})`);
      const proceduralAsset = buildProceduralVehicle();
      scene.add(proceduralAsset.root);

      // Grab the wireframe overlay's material directly — it's the second
      // child added in buildProceduralVehicle(), identified by its wireframe
      // flag rather than array index, so this stays correct even if the
      // builder's internal ordering changes.
      proceduralAsset.root.traverse((obj) => {
        if (obj instanceof THREE.Mesh && (obj.material as THREE.MeshBasicMaterial).wireframe) {
          proceduralWireframeMaterial = obj.material as THREE.MeshBasicMaterial;
        }
      });

      active = { kind: "procedural", asset: proceduralAsset };
      setLoadState("ready-procedural");
    };

    setLoadState("loading");
    setLoadError(null);

    if (!assetUrl || assetUrl.trim().length === 0) {
      // No path configured at all — go straight to fallback, no network attempt,
      // no error state. This is the expected day-to-day dev state right now.
      activateProceduralFallback("no assetUrl configured");
    } else {
      loadVehicleAsset(assetUrl)
        .then((gltfAsset) => {
          if (cancelled) {
            disposeVehicleAsset(gltfAsset);
            return;
          }
          scene.add(gltfAsset.root);
          active = { kind: "gltf", asset: gltfAsset };
          setLoadState("ready-gltf");
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          const message = err instanceof Error ? err.message : "Unknown GLTF load error";
          console.warn(`[VehicleModelCanvas] GLTF load failed for "${assetUrl}": ${message}`);
          setLoadError(message);
          // Seamless fallback — no error screen shown to the user; the
          // wireframe car takes over and telemetry binding continues
          // uninterrupted. loadError is still captured in state for
          // debugging/dev visibility (see render below), but doesn't block anything.
          activateProceduralFallback(`GLTF load failed: ${message}`);
        });
    }

    const handleResize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      cancelled = true;

      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      resizeObserver.disconnect();

      if (active) {
        scene.remove(active.asset.root);
        if (active.kind === "gltf") {
          disposeVehicleAsset(active.asset);
        } else {
          disposeProceduralVehicle(active.asset);
        }
      }
      // If a GLTF load is still in-flight at unmount, its .then() checks
      // `cancelled` and disposes itself once it resolves. If the fallback
      // hasn't fired yet either, there's simply nothing extra to dispose.

      scene.remove(ambientLight, diagnosticLight, fillLight);

      renderer.dispose();
      renderer.forceContextLoss();
      if (renderer.domElement.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetUrl]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ width: "100%", height: "100%", minHeight: "400px", position: "relative" }}
      aria-label="Live 3D vehicle diagnostic visualization"
      role="img"
    >
      {loadState === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-sm text-neutral-400">
          Loading vehicle model…
        </div>
      )}
      {/* Dev-only visibility into a failed GLTF load — doesn't block the
          fallback from rendering, just surfaces why you're seeing the
          wireframe car instead of your asset. Safe to remove for prod. */}
      {loadState === "ready-procedural" && loadError && process.env.NODE_ENV !== "production" && (
        <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-xs text-amber-400 pointer-events-none">
          GLTF load failed — showing procedural fallback ({loadError})
        </div>
      )}
    </div>
  );
}
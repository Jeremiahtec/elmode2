// components/vehicle3d/ProceduralVehicle.tsx
"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { RegionHighlight, VehicleRegion } from "@/types/vehicle3d";
import { STATUS_COLOR } from "@/lib/metricDisplay";

const BASE_METAL = "#2a3038"; // dark gunmetal — matches graphite-700
const BASE_METAL_LIGHT = "#3a424c";
const GLASS = "#0d0f11";

interface RegionMaterialProps {
  region: VehicleRegion;
  highlights: RegionHighlight[];
  baseColor: string;
}

/**
 * A mesh whose emissive color reflects the diagnostic status of its region,
 * if any. Healthy/untagged regions stay a neutral gunmetal — highlighting
 * is reserved for WARNING/CRITICAL only, per the brief's "subtle, not
 * constant" instruction. No highlight is drawn for INFO/healthy at all,
 * so a fully healthy vehicle shows no colored regions — clean by default.
 */
function useRegionColor(region: VehicleRegion, highlights: RegionHighlight[]): { color: string; intensity: number } {
  const match = highlights.find((h) => h.region === region);
  if (!match || match.status === "INFO") {
    return { color: BASE_METAL, intensity: 0 };
  }
  return { color: STATUS_COLOR[match.status], intensity: match.status === "CRITICAL" ? 0.55 : 0.35 };
}

export function ProceduralVehicle({ highlights }: { highlights: RegionHighlight[] }) {
  const critPulseRef = useRef(0);
  const engineMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const coolingMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const lubricationMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const batteryMatRef = useRef<THREE.MeshStandardMaterial>(null);

  const engine = useRegionColor("engine-bay", highlights);
  const cooling = useRegionColor("cooling", highlights);
  const lubrication = useRegionColor("lubrication", highlights);
  const battery = useRegionColor("battery", highlights);

  const hasCritical = highlights.some((h) => h.status === "CRITICAL");

  useFrame((_, delta) => {
    // Slow pulse applied uniformly to any CRITICAL region's emissive
    // intensity — subtle, per brief section 26 ("do not overdo effects").
    if (hasCritical) {
      critPulseRef.current += delta * 2.2;
    }
    const pulse = hasCritical ? 0.75 + Math.sin(critPulseRef.current) * 0.25 : 1;

    if (engineMatRef.current) engineMatRef.current.emissiveIntensity = engine.intensity * pulse;
    if (coolingMatRef.current) coolingMatRef.current.emissiveIntensity = cooling.intensity * pulse;
    if (lubricationMatRef.current) lubricationMatRef.current.emissiveIntensity = lubrication.intensity * pulse;
    if (batteryMatRef.current) batteryMatRef.current.emissiveIntensity = battery.intensity * pulse;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Lower body / chassis */}
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.6, 0.5, 1.7]} />
        <meshStandardMaterial color={BASE_METAL} metalness={0.75} roughness={0.35} />
      </mesh>

      {/* Cabin */}
      <mesh position={[-0.15, 1.05, 0]} castShadow>
        <boxGeometry args={[2.1, 0.55, 1.55]} />
        <meshStandardMaterial color={BASE_METAL_LIGHT} metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Cabin glass hint */}
      <mesh position={[-0.15, 1.06, 0]}>
        <boxGeometry args={[2.02, 0.4, 1.5]} />
        <meshStandardMaterial color={GLASS} metalness={0.2} roughness={0.1} transparent opacity={0.85} />
      </mesh>

      {/* Engine bay region — front third of the chassis */}
      <mesh position={[1.35, 0.62, 0]} castShadow>
        <boxGeometry args={[0.85, 0.35, 1.5]} />
        <meshStandardMaterial
          ref={engineMatRef}
          color={BASE_METAL_LIGHT}
          emissive={engine.color}
          emissiveIntensity={engine.intensity}
          metalness={0.7}
          roughness={0.4}
        />
      </mesh>

      {/* Cooling region — front grille/radiator area, forward of engine bay */}
      <mesh position={[1.78, 0.55, 0]} castShadow>
        <boxGeometry args={[0.1, 0.42, 1.3]} />
        <meshStandardMaterial
          ref={coolingMatRef}
          color={"#1a1e22"}
          emissive={cooling.color}
          emissiveIntensity={cooling.intensity}
          metalness={0.4}
          roughness={0.6}
        />
      </mesh>

      {/* Lubrication region — underside, mid-chassis (oil pan area) */}
      <mesh position={[0.5, 0.32, 0]}>
        <boxGeometry args={[0.9, 0.12, 1.1]} />
        <meshStandardMaterial
          ref={lubricationMatRef}
          color={"#1a1e22"}
          emissive={lubrication.color}
          emissiveIntensity={lubrication.intensity}
          metalness={0.6}
          roughness={0.5}
        />
      </mesh>

      {/* Battery region — rear third, under trunk */}
      <mesh position={[-1.4, 0.6, 0]} castShadow>
        <boxGeometry args={[0.6, 0.3, 1.3]} />
        <meshStandardMaterial
          ref={batteryMatRef}
          color={BASE_METAL_LIGHT}
          emissive={battery.color}
          emissiveIntensity={battery.intensity}
          metalness={0.65}
          roughness={0.4}
        />
      </mesh>

      {/* Wheels */}
      {[
        [1.15, 0.35, 0.95],
        [1.15, 0.35, -0.95],
        [-1.15, 0.35, 0.95],
        [-1.15, 0.35, -0.95],
      ].map(([x, y, z], i) => (
        <mesh key={i} position={[x, y, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.34, 0.34, 0.24, 20]} />
          <meshStandardMaterial color="#0f1114" metalness={0.3} roughness={0.75} />
        </mesh>
      ))}

      {/* Ground contact shadow (soft, fake AO disc rather than real shadow map cost) */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.35} />
      </mesh>
    </group>
  );
}

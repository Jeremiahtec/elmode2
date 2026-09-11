// types/vehicleAsset.ts
import * as THREE from "three";

export const ELMODE_ROLE_WHEEL = "wheel";
export const ELMODE_ROLE_DIAGNOSTIC_SURFACE = "diagnosticSurface"; // expects .emissive (MeshStandardMaterial/MeshPhysicalMaterial)
export const ELMODE_ROLE_DIAGNOSTIC_WIREFRAME = "diagnosticWireframe"; // expects .color (MeshBasicMaterial or similar unlit)

export interface ResolvedVehicleParts {
  root: THREE.Group;
  wheels: THREE.Object3D[];
  diagnosticMeshes: THREE.Mesh[]; // emissive-based
  diagnosticWireframes: THREE.Mesh[]; // color-based
}
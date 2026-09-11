import * as THREE from "three";
import { ELMODE_ROLE_WHEEL, ELMODE_ROLE_DIAGNOSTIC_SURFACE } from "@/types/vehicleAsset";

export interface ProceduralVehicleAsset {
  root: THREE.Group;
  wheels: THREE.Object3D[];
  diagnosticMeshes: THREE.Mesh[];
}

/**
 * Builds the wireframe placeholder car used before a real GLTF asset exists.
 * Deliberately tags its own nodes with the same userData.elmodeRole
 * convention the GLTF pipeline uses (see types/vehicleAsset.ts), so the RAF
 * binding loop in VehicleModelCanvas can treat GLTF and procedural output
 * identically — it only ever consumes { root, wheels, diagnosticMeshes },
 * never branches on "is this the fallback."
 */
export function buildProceduralVehicle(): ProceduralVehicleAsset {
  const root = new THREE.Group();
  root.name = "ProceduralVehicleFallback";

  const chassisGeometry = new THREE.BoxGeometry(3.2, 0.6, 1.6);
  const chassisMaterial = new THREE.MeshStandardMaterial({
    color: 0x111318,
    metalness: 0.6,
    roughness: 0.35,
    emissive: new THREE.Color(0x2dd4bf),
    emissiveIntensity: 0.15,
  });
  const chassis = new THREE.Mesh(chassisGeometry, chassisMaterial);
  chassis.position.y = 0.6;
  chassis.userData.elmodeRole = ELMODE_ROLE_DIAGNOSTIC_SURFACE;
  root.add(chassis);

  const wireframeGeometry = new THREE.BoxGeometry(3.22, 0.62, 1.62);
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    wireframe: true,
    transparent: true,
    opacity: 0.5,
  });
  const wireframeOverlay = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
  wireframeOverlay.position.copy(chassis.position);
  // Note: NOT tagged diagnosticSurface — it has no `emissive` property
  // (MeshBasicMaterial doesn't support it), so the RAF loop's material-color
  // application would just silently no-op on it anyway. Tagged separately
  // below via a light-touch color patch instead (see VehicleModelCanvas).
  root.add(wireframeOverlay);

  const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 24);
  const wheelMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1a1a,
    metalness: 0.3,
    roughness: 0.7,
  });

  const wheelPositions: Array<[number, number, number]> = [
    [1.1, 0.4, 0.9],
    [1.1, 0.4, -0.9],
    [-1.1, 0.4, 0.9],
    [-1.1, 0.4, -0.9],
  ];

  const wheels: THREE.Object3D[] = wheelPositions.map(([x, y, z]) => {
    const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, y, z);
    wheel.userData.elmodeRole = ELMODE_ROLE_WHEEL;
    root.add(wheel);
    return wheel;
  });

  return {
    root,
    wheels,
    diagnosticMeshes: [chassis], // wireframeOverlay handled separately — see note above
  };
}

/**
 * Disposes the procedural asset's geometries/materials. Mirrors
 * disposeVehicleAsset() in gltfVehicleLoader.ts in spirit, but doesn't need
 * the full recursive texture-walk since we authored every material here and
 * know none of them carry textures.
 */
export function disposeProceduralVehicle(asset: ProceduralVehicleAsset): void {
  asset.root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose());
      } else {
        material?.dispose();
      }
    }
  });
}
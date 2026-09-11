// lib/three/gltfVehicleLoader.ts
import * as THREE from "three";
import { GLTFLoader, type GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  ELMODE_ROLE_WHEEL,
  ELMODE_ROLE_DIAGNOSTIC_SURFACE,
  ELMODE_ROLE_DIAGNOSTIC_WIREFRAME,
  type ResolvedVehicleParts,
} from "@/types/vehicleAsset";

let cachedLoader: GLTFLoader | null = null;

function getLoader(): GLTFLoader {
  if (cachedLoader) return cachedLoader;
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath("/draco/");
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  cachedLoader = loader;
  return loader;
}

export interface LoadedVehicleAsset extends ResolvedVehicleParts {
  gltf: GLTF;
}

/**
 * Loads a GLTF/GLB and resolves its parts by the userData.elmodeRole
 * convention. Throws (does not swallow) on any failure — network error,
 * malformed file, or an empty/missing path — so the caller can decide how
 * to react. In VehicleModelCanvas, that reaction is: fall back to the
 * procedural builder.
 */
export async function loadVehicleAsset(url: string): Promise<LoadedVehicleAsset> {
  if (!url || url.trim().length === 0) {
    throw new Error("No asset URL provided");
  }

  const loader = getLoader();
  const gltf = await loader.loadAsync(url);

  const root = gltf.scene;
  const wheels: THREE.Object3D[] = [];
  const diagnosticMeshes: THREE.Mesh[] = [];
  const diagnosticWireframes: THREE.Mesh[] = [];

  root.traverse((object) => {
    const role = object.userData?.elmodeRole as string | undefined;
    if (role === ELMODE_ROLE_WHEEL) {
      wheels.push(object);
    } else if (role === ELMODE_ROLE_DIAGNOSTIC_SURFACE && object instanceof THREE.Mesh) {
      diagnosticMeshes.push(object);
    } else if (role === ELMODE_ROLE_DIAGNOSTIC_WIREFRAME && object instanceof THREE.Mesh) {
      diagnosticWireframes.push(object);
    }
    if (object instanceof THREE.Mesh) {
      object.castShadow = true;
      object.receiveShadow = true;
    }
  });

  if (wheels.length === 0) {
    console.warn(
      `[gltfVehicleLoader] No nodes tagged elmodeRole="${ELMODE_ROLE_WHEEL}" found in ${url}. Wheel rotation will be a no-op.`
    );
  }

  return { gltf, root, wheels, diagnosticMeshes, diagnosticWireframes };
}

export function disposeVehicleAsset(asset: LoadedVehicleAsset): void {
  asset.root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry?.dispose();
      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach(disposeMaterialAndTextures);
      } else if (material) {
        disposeMaterialAndTextures(material);
      }
    }
  });
  asset.gltf.parser?.cache?.removeAll?.();
}

function disposeMaterialAndTextures(material: THREE.Material): void {
  const textured = material as THREE.MeshStandardMaterial;
  const textures: Array<THREE.Texture | null | undefined> = [
    textured.map,
    textured.normalMap,
    textured.roughnessMap,
    textured.metalnessMap,
    textured.emissiveMap,
    textured.aoMap,
    textured.envMap,
    (textured as THREE.MeshPhysicalMaterial).clearcoatMap,
  ];
  textures.filter((t): t is THREE.Texture => Boolean(t)).forEach((t) => t.dispose());
  material.dispose();
}
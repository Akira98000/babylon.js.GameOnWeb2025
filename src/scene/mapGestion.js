import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

export let mapPartsData = [];

export async function loadMapParts(scene) {
  const basePath = "/map/";
  const partNames = [
    "citymap_part1opt.glb",
    "citymap_part2opt.glb",
    "citymap_part3opt.glb",
    "citymap_part4opt.glb"
  ];

  mapPartsData = [];

  const parts = await Promise.all(
    partNames.map(async (fileName) => {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null,
        basePath,
        fileName,
        scene
      );

      const meshesToMerge = [];

      result.meshes.forEach(mesh => {
        if (mesh.id !== result.meshes[0].id && mesh.isVisible) {
          mesh.checkCollisions = true;
          mesh.freezeWorldMatrix(); // Optimisation
          if (mesh.material) {
            mesh.material.freeze(); // Optimisation
          }
          meshesToMerge.push(mesh);
        } else if (!mesh.isVisible) {
          mesh.dispose(); // Nettoyage
        }
      });

      const merged = BABYLON.Mesh.MergeMeshes(meshesToMerge, true, true, undefined, false, true);
      if (merged) {
        merged.freezeWorldMatrix();
        merged.checkCollisions = true;
        if (merged.material) merged.material.freeze();
      }

      const mainMesh = result.meshes[0];
      mainMesh.computeWorldMatrix(true);
      const boundingInfo = mainMesh.getBoundingInfo();
      const boundingBox = boundingInfo.boundingBox;

      mapPartsData.push({
        mainMesh,
        boundingBox
      });

      return merged || mainMesh;
    })
  );

  // Positionnement des parties de la map
  parts.forEach(part => {
    part.position.set(0, 0, 0);
  });

  // Nettoyage des anciennes lumières (si jamais il y en avait)
  scene.lights
    .filter(light => light.name.startsWith("spotLight_"))
    .forEach(light => light.dispose());

  // Gèle tous les meshes actifs (optimisation)
  scene.freezeActiveMeshes();
}
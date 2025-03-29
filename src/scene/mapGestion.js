import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

export let mapPartsData = [];

export async function loadMapParts(scene) {
  const basePath = "/map/";
  const partNames = ["test.glb"];
  mapPartsData = [];

  const parts = await Promise.all(
    partNames.map(async (fileName) => {
      const result = await BABYLON.SceneLoader.ImportMeshAsync(
        null,
        basePath,
        fileName,
        scene
      );

      const meshMap = {};

      result.meshes.forEach((mesh, index) => {
        if (index === 0 || !mesh.isVisible) return;

        mesh.checkCollisions = true;

        const baseName = mesh.name.replace(/_\d+$/, "");

        if (!meshMap[baseName]) {
          meshMap[baseName] = {
            original: mesh,
            transforms: [],
          };
        } else {
          mesh.computeWorldMatrix(true);
          meshMap[baseName].transforms.push(mesh.getWorldMatrix().clone());
          mesh.setEnabled(false);
        }
      });

      Object.values(meshMap).forEach(({ original, transforms }) => {
        transforms.forEach(matrix => {
          original.thinInstanceAdd(matrix);
        });
      });

      const mainMesh = result.meshes[0];
      mainMesh.computeWorldMatrix(true);
      const boundingBox = mainMesh.getBoundingInfo().boundingBox;

      mapPartsData.push({
        mainMesh,
        boundingBox,
      });

      return mainMesh;
    })
  );

  parts.forEach(part => {
    part.position.set(0, 0, 0);
  });


}
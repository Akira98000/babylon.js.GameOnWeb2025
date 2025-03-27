import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

export let mapPartsData = [];

export async function loadMapParts(scene) {
  const basePath = "/map/";
  const partNames = [
    "citymap_part1.glb",
    "citymap_part2.glb",
    "citymap_part3.glb",
    "citymap_part4.glb"
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

      result.meshes.forEach(mesh => {
        if (mesh.id !== result.meshes[0].id && mesh.isVisible) {
          mesh.checkCollisions = true;
        }
      });

      const mainMesh = result.meshes[0];
      mainMesh.computeWorldMatrix(true);
      const boundingInfo = mainMesh.getBoundingInfo();
      const boundingBox = boundingInfo.boundingBox;

      mapPartsData.push({
        mainMesh,
        boundingBox
      });

      return mainMesh;
    })
  );

  parts.forEach(part => {
    part.position.set(0, 0, 0);
  });

  scene.lights
    .filter(light => light.name.startsWith("spotLight_"))
    .forEach(light => light.dispose());

  const lampNames = scene.meshes
    .filter(mesh => mesh.name.startsWith("streetlight"))
    .map(mesh => mesh.name);

  lampNames.forEach((lampName) => {
    const targetMesh = scene.getMeshByName(lampName);
    if (targetMesh) {
      targetMesh.computeWorldMatrix(true);
      const boundingInfo = targetMesh.getBoundingInfo();
      const max = boundingInfo.boundingBox.maximumWorld;
      const min = boundingInfo.boundingBox.minimumWorld;
      
      const topPosition = new BABYLON.Vector3(
        (min.x + max.x) / 2,
        max.y,
        (min.z + max.z) / 2
      );
      
      const groundTarget = new BABYLON.Vector3(
        topPosition.x - 0.5,
        min.y - 2,
        topPosition.z - 2.0
      );

      const direction = groundTarget.subtract(topPosition).normalize();

      const spotLight = new BABYLON.SpotLight(
        `spotLight_${lampName}`,
        topPosition,
        direction,
        Math.PI, 
        2,
        scene
      );

      spotLight.intensity = 50;
      spotLight.range = 300;
      spotLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
      spotLight.specular = new BABYLON.Color3(1, 1, 1);
    } else {
      console.warn(`Lampadaire introuvable: ${lampName}`);
    }
  });
}
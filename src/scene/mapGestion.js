import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";

// FONCTION : CHARGEMENT DES PARTIES DE LA MAP
export let mapPartsData = [];

// FONCTION : CHARGEMENT DES PARTIES DE LA MAP
export async function loadMapParts(scene) {
  const basePath = "/map/";
  const partNames = ["test.glb", "test3.glb", "test2.glb", "test4.glb"];
  mapPartsData = [];
  const parts = await Promise.all(
    partNames.map((fileName) => importMapPart(scene, basePath, fileName))
  );
  parts.forEach(part => {
    part.position.set(0, 0, 0);
  });
}

// FONCTION : CHARGEMENT SPÉCIFIQUE DE LA MAP POUR LE NIVEAU 6
export async function loadDamagedMapForLevel6(scene) {
  const basePath = "/map/";
  
  // Nettoyer les données de la carte précédente
  mapPartsData.forEach(data => {
    if (data.mainMesh) {
      data.mainMesh.dispose();
    }
  });
  mapPartsData = [];
  
  // Remplacer test.glb par test1_damaged.glb pour le niveau 6
  const partNames = ["test1_damaged.glb", "test3.glb", "test2.glb", "test4.glb"];
  
  const parts = await Promise.all(
    partNames.map((fileName) => importMapPart(scene, basePath, fileName))
  );
  parts.forEach(part => {
    part.position.set(0, 0, 0);
  });
  
  return parts;
}

// FONCTION : IMPORTATION DES PARTIES DE LA MAP
async function importMapPart(scene, basePath, fileName) {
  const result = await BABYLON.SceneLoader.ImportMeshAsync(null, basePath, fileName, scene);
  const meshMap = groupAndProcessMeshes(result.meshes);
  applyThinInstances(meshMap);
  const mainMesh = result.meshes[0];
  mainMesh.computeWorldMatrix(true);
  const boundingBox = mainMesh.getBoundingInfo().boundingBox;
  mapPartsData.push({
    mainMesh,
    boundingBox,
  });
  return mainMesh;
}

// FONCTION : REGROUPEMENT ET TRAITEMENT DES MESHES
function groupAndProcessMeshes(meshes) {
  const meshMap = {};
  meshes.forEach((mesh, index) => {
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

  return meshMap;
}

function applyThinInstances(meshMap) {
  Object.values(meshMap).forEach(({ original, transforms }) => {
    transforms.forEach(matrix => {
      original.thinInstanceAdd(matrix);
    });
  });
}
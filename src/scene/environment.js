import * as BABYLON from "@babylonjs/core";

// FONCTION PRINCIPALE : CREATION DE L'ENVIRONNEMENT
export function createEnvironment(scene) {
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.disableLighting = true;
  skyboxMaterial.reflectionTexture = null;
  skybox.material = skyboxMaterial;

  const hemiLight = createHemisphericLight(scene);
  const dirLight = createDirectionalLight(scene);
  const spotLight = createSpotLight(scene);

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;
  const daySettings = getDaySettings();

  scene.clearColor = daySettings.clearColor;
  scene.fogColor = daySettings.fogColor;
  scene.fogDensity = daySettings.fogDensity;
  skyboxMaterial.emissiveColor = daySettings.skyColor;
  
  hemiLight.intensity = daySettings.hemiIntensity;
  hemiLight.diffuse = daySettings.hemiDiffuse;
  hemiLight.groundColor = daySettings.hemiGround;

  dirLight.intensity = daySettings.dirIntensity;
  dirLight.diffuse = daySettings.dirDiffuse;

  spotLight.intensity = daySettings.spotIntensity;
}

function createHemisphericLight(scene) {
  return new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
}

function createDirectionalLight(scene) {
  return new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 0), scene);
}

function createSpotLight(scene) {
  const light = new BABYLON.SpotLight(
    "spotLight",
    BABYLON.Vector3.Zero(),
    BABYLON.Vector3.Down(),
    Math.PI / 3,
    2,
    scene
  );
  light.diffuse = new BABYLON.Color3(1, 1, 0.9);
  light.specular = new BABYLON.Color3(1, 1, 1);
  light.range = 100;
  return light;
}

function getDaySettings() {
  return {
    clearColor: new BABYLON.Color4(1, 0.753, 0.796, 1),
    fogColor:  new BABYLON.Color3(1, 0.753, 0.796),
    skyColor: new BABYLON.Color3(1, 1, 1),
    fogDensity: 0.027,
    hemiIntensity: 0.6,
    dirIntensity: 1,
    spotIntensity: 0,
    hemiDiffuse: new BABYLON.Color3(1, 1, 1),
    hemiGround: new BABYLON.Color3(0.5, 0.5, 0.5),
    dirDiffuse: new BABYLON.Color3(1, 1, 1)
  };
}
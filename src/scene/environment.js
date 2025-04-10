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
  const day = getDaySettings();
  const night = getNightSettings();

  const startTime = Date.now();
  const cycleDuration = 240; 

  scene.onBeforeRenderObservable.add(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const fakeHour = (elapsed % cycleDuration) / cycleDuration * 24;
    const t = getBlendFactor(fakeHour);

    scene.clearColor = BABYLON.Color4.Lerp(day.clearColor, night.clearColor, t);
    scene.fogColor = BABYLON.Color3.Lerp(day.fogColor, night.fogColor, t);
    scene.fogDensity = BABYLON.Scalar.Lerp(day.fogDensity, night.fogDensity, t);
    skyboxMaterial.emissiveColor = BABYLON.Color3.Lerp(day.skyColor, night.skyColor, t);
    
    hemiLight.intensity = BABYLON.Scalar.Lerp(day.hemiIntensity, night.hemiIntensity, t);
    hemiLight.diffuse = BABYLON.Color3.Lerp(day.hemiDiffuse, night.hemiDiffuse, t);
    hemiLight.groundColor = BABYLON.Color3.Lerp(day.hemiGround, night.hemiGround, t);

    dirLight.intensity = BABYLON.Scalar.Lerp(day.dirIntensity, night.dirIntensity, t);
    dirLight.diffuse = BABYLON.Color3.Lerp(day.dirDiffuse, night.dirDiffuse, t);

    spotLight.intensity = BABYLON.Scalar.Lerp(day.spotIntensity, night.spotIntensity, t);
  });
}

// FONCTION : CREATION DE LA LUMIERE HEMISPHERIQUE
function createHemisphericLight(scene) {
  return new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
}

// FONCTION : CREATION DE LA LUMIERE DIRECTIONNELLE
function createDirectionalLight(scene) {
  return new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 0), scene);
}

// FONCTION : CREATION DE LA LUMIERE SPOT
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

// FONCTION : PARAMETRE VISUELLE DE JOUR
function getDaySettings() {
  return {
    clearColor: new BABYLON.Color4(1, 0.753, 0.796, 1),
    fogColor:  new BABYLON.Color3(1, 0.753, 0.796),
    skyColor: new BABYLON.Color3(1, 1, 1),
    fogDensity: 0.024,
    hemiIntensity: 0.6,
    dirIntensity: 1,
    spotIntensity: 0,
    hemiDiffuse: new BABYLON.Color3(1, 1, 1),
    hemiGround: new BABYLON.Color3(0.5, 0.5, 0.5),
    dirDiffuse: new BABYLON.Color3(1, 1, 1)
  };
}

// FONCTION : PARAMETRE VISUELLE DE NUIT
function getNightSettings() {
  return {
    clearColor: new BABYLON.Color4(0, 0, 0, 1),
    fogColor: new BABYLON.Color3(0, 0, 0.16),
    skyColor: new BABYLON.Color3(0, 0, 0.05),
    fogDensity: 0.0234,
    hemiIntensity: 0.1,
    dirIntensity: 0.3,
    spotIntensity: 50,
    hemiDiffuse: new BABYLON.Color3(1, 0.3, 0.3),
    hemiGround: new BABYLON.Color3(0.5, 0.2, 0.2),
    dirDiffuse: new BABYLON.Color3(1, 0.4, 0.4)
  };
}

// FONCTION DE TYPE BLEND IN POUR UNE TRANSITION FLUIDE ENTRE JOUR ET NUIT
function getBlendFactor(hour) {
  const radians = (hour / 24) * 2 * Math.PI;
  const cosValue = Math.cos(radians);
  return BABYLON.Scalar.Clamp((cosValue + 1) / 2, 0, 1);
}
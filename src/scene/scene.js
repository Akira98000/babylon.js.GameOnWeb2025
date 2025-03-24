import * as BABYLON from "@babylonjs/core";

export function createScene(engine, canvas) {
  const scene = new BABYLON.Scene(engine);
  scene.collisionsEnabled = true;
  scene.gravity = new BABYLON.Vector3(0, -9.81, 0);

  const camera = new BABYLON.ArcRotateCamera(
    "camera",
    Math.PI,
    Math.PI / 4,
    2.5,
    new BABYLON.Vector3(0, 1.5, 0),
    scene
  );
  camera.attachControl(canvas, true);

  return { scene, camera };
}

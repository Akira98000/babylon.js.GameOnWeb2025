import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';

export const setupCamera = (scene, canvas) => {
    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI,
        GAME_CONFIG.CAMERA.INITIAL.BETA,
        GAME_CONFIG.CAMERA.INITIAL.RADIUS,
        new BABYLON.Vector3(0, GAME_CONFIG.CAMERA.INITIAL.HEIGHT_OFFSET, 0),
        scene
    );

    // Configuration des limites
    camera.lowerBetaLimit = GAME_CONFIG.CAMERA.LIMITS.BETA.LOWER;
    camera.upperBetaLimit = GAME_CONFIG.CAMERA.LIMITS.BETA.UPPER;
    camera.lowerRadiusLimit = GAME_CONFIG.CAMERA.LIMITS.RADIUS.LOWER;
    camera.upperRadiusLimit = GAME_CONFIG.CAMERA.LIMITS.RADIUS.UPPER;

    // Configuration de la sensibilité
    camera.angularSensibilityX = GAME_CONFIG.CAMERA.SENSITIVITY.ANGULAR_X;
    camera.angularSensibilityY = GAME_CONFIG.CAMERA.SENSITIVITY.ANGULAR_Y;

    // Autres paramètres
    camera.heightOffset = 1;
    camera.rotationOffset = 0;
    camera.useNaturalPinchZoom = false;
    camera.wheelPrecision = 1000000;
    camera.minZ = 0.1;
    camera.maxZ = 100;

    camera.attachControl(canvas, true);

    return camera;
};

export const updateCameraPosition = (camera, hero) => {
    const targetPosition = hero.position.clone();
    targetPosition.y += GAME_CONFIG.CAMERA.INITIAL.HEIGHT_OFFSET;
    camera.target = BABYLON.Vector3.Lerp(camera.target, targetPosition, 0.1);
}; 
import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';

export const setupCamera = (scene, canvas) => {
    const isSmallScreen = window.innerWidth < 768; // Détection mobile / petite tablette

    const camera = new BABYLON.ArcRotateCamera(
        "camera",
        Math.PI,
        GAME_CONFIG.CAMERA.INITIAL.BETA,
        GAME_CONFIG.CAMERA.INITIAL.RADIUS,
        new BABYLON.Vector3(0, GAME_CONFIG.CAMERA.INITIAL.HEIGHT_OFFSET, 0),
        scene
    );

    camera.lowerBetaLimit = GAME_CONFIG.CAMERA.LIMITS.BETA.LOWER;
    camera.upperBetaLimit = GAME_CONFIG.CAMERA.LIMITS.BETA.UPPER;
    camera.lowerRadiusLimit = GAME_CONFIG.CAMERA.LIMITS.RADIUS.LOWER;
    camera.upperRadiusLimit = GAME_CONFIG.CAMERA.LIMITS.RADIUS.UPPER;
    camera.angularSensibilityX = GAME_CONFIG.CAMERA.SENSITIVITY.ANGULAR_X;
    camera.angularSensibilityY = GAME_CONFIG.CAMERA.SENSITIVITY.ANGULAR_Y;
    camera.heightOffset = 1;
    camera.rotationOffset = 0;
    camera.useNaturalPinchZoom = false;
    camera.minZ = 0.1;
    camera.maxZ = 40;

    if (isSmallScreen) {
        camera.radius = GAME_CONFIG.CAMERA.INITIAL.RADIUS * 1.5;
        camera.maxZ = 30;
        camera.lowerRadiusLimit *= 1.2;
        camera.upperRadiusLimit *= 1.5;
        camera.angularSensibilityX *= 1.5;
        camera.angularSensibilityY *= 1.5;
    }

    camera.attachControl(canvas, true);
    return camera;
};
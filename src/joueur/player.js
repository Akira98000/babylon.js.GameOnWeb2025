import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';
import { createMuzzleFlash, createConfetti } from '../effects/visualEffects';
import { createBullet } from '../armes/balles';

let isShooting = false;

export const createPlayer = async (scene, camera, canvas) => {
    const heroResult = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'licorn.glb', scene);
    const hero = heroResult.meshes[0];
    hero.name = 'hero';
    hero.scaling.scaleInPlace(GAME_CONFIG.HERO.SCALE);
    hero.position = new BABYLON.Vector3(0, 0, 0);
    hero.checkCollisions = true;
    hero.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);
    hero.ellipsoidOffset = new BABYLON.Vector3(0, 0.5, 0);
    hero.applyGravity = true;
    hero.isPickable = false;

    const groundOffset = new BABYLON.Vector3(0, hero.ellipsoid.y, 0);
    const groundRayLength = hero.ellipsoid.y + 0.1;
    const shootOffset = new BABYLON.Vector3(0, 1.5, 0);
    const MIN_HEIGHT = -1;
    const gravityForce = scene.gravity.scale(0.015);

    const checkGrounded = () => {
        const origin = hero.position.clone().add(groundOffset);
        const ray = new BABYLON.Ray(origin, BABYLON.Vector3.Down(), groundRayLength);
        return scene.pickWithRay(ray).hit;
    };

    const confetti = createConfetti(scene);
    const shotgunSound = new BABYLON.Sound("shotgunSound", "/son/shotgun.mp3", scene, null, {
        volume: GAME_CONFIG.AUDIO.SHOTGUN.VOLUME,
        spatialSound: GAME_CONFIG.AUDIO.SHOTGUN.SPATIAL
    });

    let lastShotTime = 0;
    const shootCooldown = 500;
    let isMoving = false;
    let currentAnimation = null;
    let controlsRef = null;
    let animationsRef = null;

    const calcReturnDelay = (speedRatio) => Math.min(150, (1000 / speedRatio) / 4);
    const playShootAnimation = (animations, isMoving) => {
        if (!animations) return false;
        const shootAnimation = isMoving ? animations.shotgunAnim : animations.shootStandingAnim;
        if (!shootAnimation) return false;
        const returnAnimation = isMoving ? animations.walkAnim : animations.idleAnim;
        const returnDelay = calcReturnDelay(shootAnimation.speedRatio);

        if (animations.immediateTransition) {
            animations.immediateTransition(shootAnimation);
            currentAnimation = shootAnimation;
            setTimeout(() => {
                if (returnAnimation) {
                    animations.immediateTransition(returnAnimation);
                    currentAnimation = returnAnimation;
                }
            }, returnDelay);
            return true;
        } else if (controlsRef && controlsRef.changeAnimation) {
            controlsRef.changeAnimation(shootAnimation);
            setTimeout(() => {
                if (returnAnimation) {
                    controlsRef.changeAnimation(returnAnimation);
                }
            }, returnDelay);
            return true;
        } else if (animations.transitionToAnimation) {
            const fromAnim = currentAnimation || (animations.walkAnim?.isPlaying ? animations.walkAnim : animations.idleAnim);
            animations.transitionToAnimation(fromAnim, shootAnimation);
            currentAnimation = shootAnimation;
            setTimeout(() => {
                if (returnAnimation) {
                    animations.transitionToAnimation(shootAnimation, returnAnimation);
                    currentAnimation = returnAnimation;
                }
            }, returnDelay);
            return true;
        }
        return false;
    };

    const executeShot = (position, direction) => {
        const bulletStartPosition = position.clone().add(shootOffset);
        shotgunSound.play();
        confetti.emitter = bulletStartPosition;
        confetti.start();
        setTimeout(() => confetti.stop(), 200);
        createBullet(scene, bulletStartPosition, direction);
    };

    scene.onPointerDown = (evt) => {
        if (evt.button === 0) {
            isShooting = true;
            const currentTime = Date.now();
            if (currentTime - lastShotTime > shootCooldown) {
                lastShotTime = currentTime;
                const shootDirection = camera.getForwardRay().direction.normalize();
                const shootPosition = hero.position.clone();
                if (animationsRef) {
                    const animationApplied = playShootAnimation(animationsRef, isMoving);
                    // Légère temporisation pour synchroniser l'animation et le tir
                    setTimeout(() => executeShot(shootPosition, shootDirection), animationApplied ? 16 : 0);
                } else {
                    executeShot(shootPosition, shootDirection);
                }
            }
        }
    };

    scene.onPointerUp = (evt) => {
        if (evt.button === 0) {
            isShooting = false;
        }
    };

    const handleShooting = (animations) => {
        animationsRef = animations;
        if (!controlsRef && animations.transitionToAnimation && scene.metadata?.controls) {
            controlsRef = scene.metadata.controls;
        }
        isMoving = animations.walkAnim?.isPlaying || false;
    };

    scene.onBeforeRenderObservable.add(() => {
        if (!checkGrounded()) {
            hero.moveWithCollisions(gravityForce);
            if (hero.position.y < MIN_HEIGHT) {
                hero.position.y = MIN_HEIGHT;
            }
        } else {
            hero.position.y = 0.1;
        }
    });

    if (!document.getElementById("crosshair")) {
        const crosshair = document.createElement("div");
        crosshair.id = "crosshair";
        document.body.appendChild(crosshair);
    }

    return {
        hero,
        handleShooting,
        executeShot,
        get isShooting() {
            return isShooting;
        }
    };
};
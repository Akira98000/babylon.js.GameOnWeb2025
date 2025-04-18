import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';
import { createMuzzleFlash } from '../effects/visualEffects';
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
    hero.renderingGroupId = 1; 
    
    for (let child of heroResult.meshes) {
        if (child.material) {
            child.material.freeze(); 
        }
    }
    
    const groundOffset = new BABYLON.Vector3(0, hero.ellipsoid.y, 0);
    const groundRayLength = hero.ellipsoid.y + 0.1;
    const shootOffset = new BABYLON.Vector3(0, 1.5, 0);
    const MIN_HEIGHT = -1;
    const gravityBaseForce = scene.gravity.scale(0.015);
    const targetFPS = 60;

    const checkGrounded = () => {
        const origin = hero.position.clone().add(groundOffset);
        const ray = new BABYLON.Ray(origin, BABYLON.Vector3.Down(), groundRayLength);
        return scene.pickWithRay(ray).hit;
    };

    const shotgunSound = new BABYLON.Sound("shotgunSound", "/son/shotgun.mp3", scene, null, {
        volume: GAME_CONFIG.AUDIO.SHOTGUN.VOLUME,
        spatialSound: GAME_CONFIG.AUDIO.SHOTGUN.SPATIAL
    });

    let lastShotTime = 0;
    const shootCooldown = GAME_CONFIG.ANIMATIONS?.SHOOT?.COOLDOWN || 500;
    let isMoving = false;
    let currentAnimation = null;
    let controlsRef = null;
    let animationsRef = null;
    let shootEndObserver = null;

    const playShootAnimation = (animations, isMoving, shootPosition, shootDirection) => {
        if (!animations || !animations.transitionToAnimation) return false;

        const shootAnimation = isMoving ? animations.shotgunAnim : animations.shootStandingAnim;
        if (!shootAnimation) return false;

        const returnAnimation = isMoving ? animations.walkAnim : animations.idleAnim;
        const fromAnim = currentAnimation || (animations.walkAnim?.isPlaying ? animations.walkAnim : animations.idleAnim);

        if (shootEndObserver) {
            shootAnimation.onAnimationEndObservable.remove(shootEndObserver);
            shootEndObserver = null;
        }

        executeShot(shootPosition, shootDirection);

        animations.transitionToAnimation(fromAnim, shootAnimation);
        currentAnimation = shootAnimation;

        shootEndObserver = shootAnimation.onAnimationEndObservable.addOnce(() => {
            if (returnAnimation && currentAnimation === shootAnimation) {
                animations.transitionToAnimation(shootAnimation, returnAnimation);
                currentAnimation = returnAnimation;
            }
            shootEndObserver = null;
        });

        return true;
    };

    const executeShot = (position, direction) => {
        const bulletStartPosition = position.clone().add(shootOffset);
        shotgunSound.play();
        createBullet(scene, bulletStartPosition, direction);
    };

    if (!document.getElementById("crosshair")) {
        const crosshair = document.createElement("div");
        crosshair.id = "crosshair";
        document.body.appendChild(crosshair);

        const style = document.createElement('style');
        style.textContent = `
            @keyframes crosshairFlash {
                0% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.5); opacity: 0.8; }
                100% { transform: scale(1); opacity: 1; }
            }
            .crosshair-flash {
                animation: crosshairFlash 0.2s ease-out;
            }
        `;
        document.head.appendChild(style);
    }

    const flashCrosshair = () => {
        const crosshair = document.getElementById("crosshair");
        if (crosshair) {
            crosshair.classList.remove('crosshair-flash');
            void crosshair.offsetWidth;
            crosshair.classList.add('crosshair-flash');
        }
    };

    scene.onPointerDown = (evt) => {
        if (evt.button === 0) {
            isShooting = true;
            const currentTime = Date.now();
            
            flashCrosshair();
            
            if (currentTime - lastShotTime > shootCooldown) {
                lastShotTime = currentTime;
                const shootDirection = camera.getForwardRay().direction.normalize();
                const shootPosition = hero.position.clone();
                if (animationsRef) {
                    playShootAnimation(animationsRef, isMoving, shootPosition, shootDirection);
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
            const deltaTime = scene.getEngine().getDeltaTime() / 1000;
            const fpsRatio = targetFPS * deltaTime;
            const adjustedGravity = gravityBaseForce.scale(fpsRatio);
            
            hero.moveWithCollisions(adjustedGravity);
            if (hero.position.y < MIN_HEIGHT) {
                hero.position.y = MIN_HEIGHT;
            }
        } else {
            hero.position.y = 0.1;
        }
    });

    return {
        hero,
        handleShooting,
        executeShot,
        get isShooting() {
            return isShooting;
        }
    };
};
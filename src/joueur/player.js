import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';
import { createMuzzleFlash, createConfetti } from '../effects/visualEffects';
import { createBullet } from '../armes/balles';

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

    const checkGrounded = () => {
        const origin = hero.position.clone().add(new BABYLON.Vector3(0, hero.ellipsoid.y, 0));
        const ray = new BABYLON.Ray(origin, BABYLON.Vector3.Down(), hero.ellipsoid.y + 0.1);
        return scene.pickWithRay(ray).hit;
    };

    const confetti = createConfetti(scene);
    const shotgunSound = new BABYLON.Sound("shotgunSound", "/son/shotgun.mp3", scene, null, {
        volume: GAME_CONFIG.AUDIO.SHOTGUN.VOLUME,
        spatialSound: GAME_CONFIG.AUDIO.SHOTGUN.SPATIAL
    });

    let isShooting = false;
    let lastShotTime = 0;
    const shootCooldown = 500;
    let isMoving = false;
    let currentAnimation = null; 
    let controlsRef = null;
    
    // Référence aux animations (sera initialisée dans handleShooting)
    let animationsRef = null;

    // Fonction pour jouer l'animation de tir appropriée
    const playShootAnimation = (animations, isMoving) => {
        if (!animations) return;
        
        // Sélectionner l'animation appropriée selon l'état de mouvement
        const shootAnimation = isMoving ? animations.shotgunAnim : animations.shootStandingAnim;
        if (!shootAnimation) return;
        
        // Déterminer l'animation à revenir après le tir
        const returnAnimation = isMoving ? animations.walkAnim : animations.idleAnim;
        
        // Utiliser la méthode immédiate pour toutes les animations de tir
        if (animations.immediateTransition) {
            // Transition immédiate pour une réponse instantanée
            animations.immediateTransition(shootAnimation);
            currentAnimation = shootAnimation;
            
            // Calculer un délai de retour dynamique basé sur la vitesse d'animation
            const returnDelay = Math.min(150, (1000 / shootAnimation.speedRatio) / 4);
            
            // Revenir à l'animation précédente après le délai
            setTimeout(() => {
                if (returnAnimation) {
                    animations.immediateTransition(returnAnimation);
                    currentAnimation = returnAnimation;
                }
            }, returnDelay);
            
            return true; // Indiquer que l'animation a été appliquée avec succès
        } 
        else if (controlsRef && controlsRef.changeAnimation) {
            // Fallback sur changeAnimation si disponible
            controlsRef.changeAnimation(shootAnimation);
            
            // Calcul du délai de retour
            const returnDelay = Math.min(150, (1000 / shootAnimation.speedRatio) / 4);
            setTimeout(() => {
                if (returnAnimation) {
                    controlsRef.changeAnimation(returnAnimation);
                }
            }, returnDelay);
            
            return true; // Indiquer que l'animation a été appliquée avec succès
        }
        else if (animations.transitionToAnimation) {
            // Dernier recours: transition standard
            const fromAnim = currentAnimation || (animations.walkAnim?.isPlaying ? animations.walkAnim : animations.idleAnim);
            animations.transitionToAnimation(fromAnim, shootAnimation);
            currentAnimation = shootAnimation;
            
            // Calcul du délai de retour
            const returnDelay = Math.min(150, (1000 / shootAnimation.speedRatio) / 4);
            setTimeout(() => {
                if (returnAnimation) {
                    animations.transitionToAnimation(shootAnimation, returnAnimation);
                    currentAnimation = returnAnimation;
                }
            }, returnDelay);
            
            return true; // Indiquer que l'animation a été appliquée avec succès
        }
        
        return false; // Indiquer que l'animation n'a pas pu être appliquée
    };
    
    const executeShot = (position, direction) => {
        const bulletStartPosition = position.clone().add(new BABYLON.Vector3(0, 1.5, 0));
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
                    if (animationApplied) {
                        setTimeout(() => {
                            executeShot(shootPosition, shootDirection);
                        }, 16);
                    } else {
                        executeShot(shootPosition, shootDirection);
                    }
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
        // Stocker la référence aux animations pour pouvoir l'utiliser dans onPointerDown
        animationsRef = animations;
        
        // Stocker la référence aux contrôles si elle n'est pas déjà définie
        if (!controlsRef && animations.transitionToAnimation) {
            if (scene.metadata && scene.metadata.controls) {
                controlsRef = scene.metadata.controls;
            }
        }
        
        // Vérifier si le joueur est en mouvement
        isMoving = animations.walkAnim?.isPlaying || false;
    };

    scene.onBeforeRenderObservable.add(() => {
        const MIN_HEIGHT = -1; // Hauteur minimale en dessous de laquelle le personnage ne peut pas descendre
        
        if (!checkGrounded()) {
            hero.moveWithCollisions(scene.gravity.scale(0.015));
            if (hero.position.y < MIN_HEIGHT) {
                hero.position.y = MIN_HEIGHT;
            }
        } else {
            hero.position.y = 0.1;
        }
    });

    const crosshair = document.createElement("div");
    crosshair.id = "crosshair";
    document.body.appendChild(crosshair);

    return {
        hero,
        handleShooting,
        executeShot
    };
};

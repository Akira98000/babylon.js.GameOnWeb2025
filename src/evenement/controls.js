import * as BABYLON from "@babylonjs/core";
import { GAME_CONFIG } from "../config/gameConfig";

export function setupControls(scene, hero, animations, camera, canvas) {
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);

    const heroBaseSpeed = 0.14;
    const heroStrafeSpeed = 0.08; 
    const targetFPS = 60;
    const rotationSensitivity = 0.01;
    const shootAnimationDuration = GAME_CONFIG.ANIMATIONS?.SHOOT?.DURATION || 300;
    let animating = false;
    let sambaAnimating = false;
    let targetRotationY = Math.PI;
    let currentRotationY = Math.PI;
    let rotationDelta = 0;
    let currentAnimation = animations.idleAnim;
    let lastShootTime = 0;
    let lastMoveTime = 0;
    let lastPointerEvent = 0;
    const moveThrottle = GAME_CONFIG.ANIMATIONS?.MOVEMENT?.RESPONSIVENESS || 8;
    const pointerThrottle = 16;

    if (hero.rotationQuaternion) hero.rotationQuaternion = null;
    hero.rotation.y = targetRotationY;

    // Fonction d'aide pour maintenir les angles dans un intervalle cohérent
    const normalizeAngle = (angle) => {
        // Maintenir l'angle dans l'intervalle [0, 2π]
        let normalized = angle % (2 * Math.PI);
        if (normalized < 0) normalized += 2 * Math.PI;
        return normalized;
    };

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => {
        const key = evt.sourceEvent.key.toLowerCase();
        if (!inputMap[key]) {
            inputMap[key] = true;
            if (["z", "q", "s", "d"].includes(key)) {
                handleKeyStateChange();
            }
        }
    }));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, evt => {
        const key = evt.sourceEvent.key.toLowerCase();
        if (inputMap[key]) {
            inputMap[key] = false;
            if (["z", "q", "s", "d"].includes(key)) {
                handleKeyStateChange();
            }
        }
    }));

    const isActionAllowed = (action) => {
        if (scene.metadata.tutorial && scene.metadata.tutorial.isVisible) {
            return scene.metadata.tutorial.isActionAllowed(action);
        }
        return true;
    };

    scene.onPointerDown = (evt) => {
        if (evt.button === 0) {
            if (document.pointerLockElement !== canvas) {
                canvas.requestPointerLock = canvas.requestPointerLock || canvas.msRequestPointerLock || canvas.mozRequestPointerLock || canvas.webkitRequestPointerLock;
                if (canvas.requestPointerLock) {
                    canvas.requestPointerLock();
                }
            }

            if (isActionAllowed('shoot')) {
                scene.metadata.executeShot?.(hero.position, camera.getForwardRay().direction);
            }
        }
    };

    document.addEventListener("pointerlockchange", lockChangeAlert, false);
    document.addEventListener("mozpointerlockchange", lockChangeAlert, false);
    document.addEventListener("webkitpointerlockchange", lockChangeAlert, false);

    function lockChangeAlert() {
        scene.metadata.isPointerLocked = document.pointerLockElement === canvas || document.mozPointerLockElement === canvas || document.webkitPointerLockElement === canvas;
    }

    scene.onPointerObservable.add(pointerInfo => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && 
            scene.metadata.isPointerLocked &&
            isActionAllowed('look')) {
            const now = Date.now();
            if (now - lastPointerEvent >= pointerThrottle) {
                const event = pointerInfo.event;
                const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                
                // Application directe du mouvement à la rotation actuelle
                currentRotationY += movementX * rotationSensitivity;
                currentRotationY = normalizeAngle(currentRotationY);
                targetRotationY = currentRotationY;
                
                // Appliquer directement à l'objet hero
                hero.rotation.y = currentRotationY;
                
                lastPointerEvent = now;
            }
        }
    });

    const isPlayerMoving = () => animating && !sambaAnimating;

    const changeAnimation = (newAnimation) => {
        if (currentAnimation === newAnimation || !newAnimation) return;

        const now = Date.now();
        const isShootingAnim = [animations.shotgunAnim, animations.shootStandingAnim].includes(currentAnimation);
        const isNewShootingAnim = [animations.shotgunAnim, animations.shootStandingAnim].includes(newAnimation);
        const isMovementAnim = newAnimation === animations.walkAnim;

        if (isMovementAnim && !isShootingAnim) {
            if (animations.immediateTransition) {
                animations.immediateTransition(newAnimation);
            } else {
                if (currentAnimation) currentAnimation.stop();
                const movementSpeed = GAME_CONFIG.ANIMATIONS?.MOVEMENT?.TRANSITION_SPEED || 2.0;
                newAnimation.start(true, movementSpeed, newAnimation.from, newAnimation.to, false);
            }
            currentAnimation = newAnimation;
            return;
        }

        if (isNewShootingAnim) {
            lastShootTime = now;
            if (animations.immediateTransition) {
                animations.immediateTransition(newAnimation);
            } else {
                if (currentAnimation) currentAnimation.stop();
                newAnimation.start(true, 1.5, newAnimation.from, newAnimation.to, false);
            }
            currentAnimation = newAnimation;
            return;
        }

        if (isShootingAnim && now - lastShootTime < shootAnimationDuration) return;

        if (inputMap["shift"] || isNewShootingAnim) {
            animations.immediateTransition?.(newAnimation);
            currentAnimation = newAnimation;
            return;
        }

        if (animations.transitionToAnimation) {
            animations.transitionToAnimation(currentAnimation, newAnimation);
        } else {
            currentAnimation?.stop();
            newAnimation.start(true, 1.0, newAnimation.from, newAnimation.to, false);
        }

        currentAnimation = newAnimation;
    };

    const handleKeyStateChange = () => {
        // Direction d'avancement basée sur la rotation actuelle du héros
        const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
        // Direction latérale perpendiculaire à la direction d'avancement
        const right = new BABYLON.Vector3(Math.sin(hero.rotation.y + Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
        
        let forwardMovement = BABYLON.Vector3.Zero();
        let strafeMovement = BABYLON.Vector3.Zero();

        // Mouvement en avant/arrière sans changer la rotation du personnage
        if (inputMap["z"] && isActionAllowed('moveForward')) forwardMovement.subtractInPlace(forward);
        if (inputMap["s"] && isActionAllowed('moveBackward')) forwardMovement.addInPlace(forward);
        
        // Mouvement latéral (strafe) sans changer la rotation du personnage
        if (inputMap["d"] && isActionAllowed('moveRight')) strafeMovement.subtractInPlace(right);
        if (inputMap["q"] && isActionAllowed('moveLeft')) strafeMovement.addInPlace(right);

        const now = Date.now();
        const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
            now - lastShootTime < shootAnimationDuration;

        const isMoving = forwardMovement.length() > 0 || strafeMovement.length() > 0;

        if (isMoving && !animating && !isShooting) {
            animating = true;
            changeAnimation(animations.walkAnim);
        } else if (!isMoving && animating && !isShooting && !sambaAnimating) {
            animating = false;
            changeAnimation(animations.idleAnim);
        }
    };

    scene.onBeforeRenderObservable.add(() => {
        const now = Date.now();

        if (now - lastMoveTime >= moveThrottle) {
            const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
            const right = new BABYLON.Vector3(Math.sin(hero.rotation.y + Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
            
            let moveDirection = BABYLON.Vector3.Zero();
            let forwardMovement = BABYLON.Vector3.Zero();
            let strafeMovement = BABYLON.Vector3.Zero();

            if (inputMap["z"] && isActionAllowed('moveForward')) forwardMovement.subtractInPlace(forward);
            if (inputMap["s"] && isActionAllowed('moveBackward')) forwardMovement.addInPlace(forward);
            
            if (inputMap["d"] && isActionAllowed('moveRight')) strafeMovement.subtractInPlace(right);
            if (inputMap["q"] && isActionAllowed('moveLeft')) strafeMovement.addInPlace(right);

            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;

            if (forwardMovement.length() > 0 || strafeMovement.length() > 0) {
                if (forwardMovement.length() > 0) {
                    forwardMovement.normalize();
                }
                
                if (strafeMovement.length() > 0) {
                    strafeMovement.normalize();
                }

                const deltaTime = scene.getEngine().getDeltaTime() / 1000;
                const fpsRatio = targetFPS * deltaTime;
                const adjustedForwardSpeed = heroBaseSpeed * fpsRatio;
                const adjustedStrafeSpeed = heroStrafeSpeed * fpsRatio;
                const movement = forwardMovement.scale(adjustedForwardSpeed).add(strafeMovement.scale(adjustedStrafeSpeed));
                
                hero.moveWithCollisions(movement);

                if (!animating && !isShooting) {
                    animating = true;
                    changeAnimation(animations.walkAnim);
                } else if (animating && !isShooting && currentAnimation !== animations.walkAnim) {
                    changeAnimation(animations.walkAnim);
                }
            } else if (animating && !isShooting) {
                animating = false;
                changeAnimation(animations.idleAnim);
            }

            if (inputMap["b"] && isActionAllowed('dance') && !isShooting) {
                if (!sambaAnimating) {
                    sambaAnimating = true;
                    changeAnimation(animations.sambaAnim);
                }
            } else if (sambaAnimating && !isShooting && !animating) {
                sambaAnimating = false;
                changeAnimation(animations.idleAnim);
            }

            lastMoveTime = now;
        }

        const cameraHeight = GAME_CONFIG.CAMERA.FOLLOW?.HEIGHT_OFFSET || 2;
        const cameraDistance = GAME_CONFIG.CAMERA.FOLLOW?.DISTANCE || 6;
        const targetLerp = GAME_CONFIG.CAMERA.FOLLOW?.TARGET_LERP || 0.2;
        
        // On garde uniquement le suivi de la cible (le héros)
        const idealTarget = hero.position.add(new BABYLON.Vector3(0, 1.5, 0));
        const currentTarget = camera.getTarget().clone();
        const newTarget = BABYLON.Vector3.Lerp(currentTarget, idealTarget, targetLerp);
        camera.setTarget(newTarget);

        // Calculer l'angle entre la caméra et l'axe Z
        const cameraDirection = camera.getTarget().subtract(camera.position);
        cameraDirection.y = 0; // On ignore la composante verticale
        cameraDirection.normalize();
        
        // Calculer l'angle de rotation nécessaire et ajouter PI pour inverser la direction
        currentRotationY = Math.atan2(cameraDirection.x, cameraDirection.z) + Math.PI;
        targetRotationY = currentRotationY;
        
        // Appliquer la rotation au héros
        hero.rotation.y = currentRotationY;
    });

    scene.metadata.executeShot = (position, direction) => {
        scene.metadata.player?.executeShot?.(position, direction);
    };
    
    return { inputMap, isPlayerMoving, changeAnimation, isMobile: false };
}

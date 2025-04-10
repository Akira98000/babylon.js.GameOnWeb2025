import * as BABYLON from "@babylonjs/core";
import { GAME_CONFIG } from "../config/gameConfig";

export function setupControls(scene, hero, animations, camera, canvas) {
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);

    const heroBaseSpeed = 0.12;
    const heroStrafeSpeed = 0.08; 
    const targetFPS = 60;
    const rotationSensitivity = 0.005;
    const shootAnimationDuration = GAME_CONFIG.ANIMATIONS?.SHOOT?.DURATION || 300;
    let animating = false;
    let sambaAnimating = false;
    let targetRotationY = Math.PI;
    let currentAnimation = animations.idleAnim;
    let lastShootTime = 0;
    let lastMoveTime = 0;
    let lastPointerEvent = 0;
    const moveThrottle = GAME_CONFIG.ANIMATIONS?.MOVEMENT?.RESPONSIVENESS || 8;
    const pointerThrottle = 16;

    if (hero.rotationQuaternion) hero.rotationQuaternion = null;
    hero.rotation.y = targetRotationY;

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => {
        const key = evt.sourceEvent.key.toLowerCase();
        if (!inputMap[key]) {
            inputMap[key] = true;
            if (["z", "q", "s", "d"].includes(key)) {
                handleKeyStateChange();
            }
            
            // Touche R pour réinitialiser la caméra en cas de besoin
            if (key === "r") {
                resetCamera();
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
                targetRotationY += movementX * rotationSensitivity;
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
        
        // Toujours mettre à jour la rotation pour plus de fluidité
        // La rotation est uniquement contrôlée par la souris
        hero.rotation.y = BABYLON.Scalar.LerpAngle(hero.rotation.y, targetRotationY, 0.1);
            
        if (now - lastMoveTime >= moveThrottle) {
            // Direction d'avancement (avant/arrière) basée sur la rotation actuelle du héros
            const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
            // Direction latérale (gauche/droite) perpendiculaire à la direction d'avancement
            const right = new BABYLON.Vector3(Math.sin(hero.rotation.y + Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
            
            let moveDirection = BABYLON.Vector3.Zero();
            let forwardMovement = BABYLON.Vector3.Zero();
            let strafeMovement = BABYLON.Vector3.Zero();

            // Mouvement en avant/arrière sans changer la rotation du personnage
            if (inputMap["z"] && isActionAllowed('moveForward')) forwardMovement.subtractInPlace(forward);
            if (inputMap["s"] && isActionAllowed('moveBackward')) forwardMovement.addInPlace(forward);
            
            // Mouvement latéral (strafe) sans changer la rotation du personnage
            if (inputMap["d"] && isActionAllowed('moveRight')) strafeMovement.subtractInPlace(right);
            if (inputMap["q"] && isActionAllowed('moveLeft')) strafeMovement.addInPlace(right);

            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;

            if (forwardMovement.length() > 0 || strafeMovement.length() > 0) {
                // Normaliser les vecteurs de mouvement s'ils ne sont pas nuls
                if (forwardMovement.length() > 0) {
                    forwardMovement.normalize();
                }
                
                if (strafeMovement.length() > 0) {
                    strafeMovement.normalize();
                }
                
                // Calcul de la vitesse ajustée en fonction du taux de rafraîchissement
                const deltaTime = scene.getEngine().getDeltaTime() / 1000;
                const fpsRatio = targetFPS * deltaTime;
                const adjustedForwardSpeed = heroBaseSpeed * fpsRatio;
                const adjustedStrafeSpeed = heroStrafeSpeed * fpsRatio;
                
                // Appliquer les vitesses différentes selon la direction
                const movement = forwardMovement.scale(adjustedForwardSpeed).add(strafeMovement.scale(adjustedStrafeSpeed));
                
                // Déplacement fluide et immédiat sans modifier la rotation
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

        // Sortir la mise à jour de la caméra hors du throttle pour qu'elle se fasse à chaque frame
        // Utiliser les paramètres de configuration
        const cameraHeight = GAME_CONFIG.CAMERA.FOLLOW?.HEIGHT_OFFSET || 2;
        const cameraDistance = GAME_CONFIG.CAMERA.FOLLOW?.DISTANCE || 6;
        const positionLerp = GAME_CONFIG.CAMERA.FOLLOW?.POSITION_LERP || 0.2;
        const targetLerp = GAME_CONFIG.CAMERA.FOLLOW?.TARGET_LERP || 0.2;
        
        const cameraOffset = new BABYLON.Vector3(0, cameraHeight, cameraDistance);
        const rotatedOffset = BABYLON.Vector3.TransformCoordinates(cameraOffset, BABYLON.Matrix.RotationY(hero.rotation.y));
        
        // Position idéale de la caméra (utilisée uniquement pour le reset avec la touche R)
        const idealPosition = hero.position.add(rotatedOffset);
        
        // Vérifier la distance entre la caméra actuelle et la position idéale
        const currentDistance = BABYLON.Vector3.Distance(camera.position, idealPosition);
        const maxAllowedDistance = cameraDistance * 4; // Distance maximale autorisée (augmentée)
        
        // Si la caméra est trop loin, la forcer à se repositionner immédiatement
        if (currentDistance > maxAllowedDistance) {
            camera.position = idealPosition;
        }
        // Suppression de l'interpolation qui faisait revenir la caméra à sa position d'origine
        // else {
        //    camera.position = BABYLON.Vector3.Lerp(camera.position, idealPosition, positionLerp);
        // }
        
        // Position cible idéale (on garde cette partie pour que la caméra continue de regarder le joueur)
        const idealTarget = hero.position.add(new BABYLON.Vector3(0, 1.5, 0));
        camera.setTarget(BABYLON.Vector3.Lerp(camera.getTarget(), idealTarget, targetLerp));
        
        // Faire en sorte que le personnage regarde dans la direction de la caméra
        // On calcule le vecteur de direction entre le personnage et la caméra (sur le plan horizontal)
        const cameraDirection = new BABYLON.Vector3(
            camera.position.x - hero.position.x,
            0,
            camera.position.z - hero.position.z
        );
        
        if (cameraDirection.length() > 0.1) {
            // Calculer l'angle de rotation en fonction de la position de la caméra
            const cameraAngle = Math.atan2(cameraDirection.x, cameraDirection.z);
            // Ajuster l'angle pour que le personnage regarde dans la direction de la caméra
            // et non vers la caméra elle-même
            targetRotationY = cameraAngle;
        }
    });

    scene.metadata.executeShot = (position, direction) => {
        scene.metadata.player?.executeShot?.(position, direction);
    };

    // Fonction pour réinitialiser la caméra si elle se détache
    const resetCamera = () => {
        const cameraHeight = GAME_CONFIG.CAMERA.FOLLOW?.HEIGHT_OFFSET || 2;
        const cameraDistance = GAME_CONFIG.CAMERA.FOLLOW?.DISTANCE || 6;
        
        const cameraOffset = new BABYLON.Vector3(0, cameraHeight, cameraDistance);
        const rotatedOffset = BABYLON.Vector3.TransformCoordinates(cameraOffset, BABYLON.Matrix.RotationY(hero.rotation.y));
        
        // Réinitialiser immédiatement la position et la cible de la caméra
        camera.position = hero.position.add(rotatedOffset);
        camera.setTarget(hero.position.add(new BABYLON.Vector3(0, 1.5, 0)));
    };

    return { inputMap, isPlayerMoving, changeAnimation, isMobile: false };
}

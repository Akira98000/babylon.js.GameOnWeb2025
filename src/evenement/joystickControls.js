import * as BABYLON from "@babylonjs/core";

export function setupJoystickControls(scene, hero, animations, camera) {
    // Initialisation du CSS pour empêcher le défilement et les actions tactiles indésirables
    const style = document.createElement('style');
    style.innerHTML = `
      body {
        touch-action: none;
        overflow: hidden;
        position: fixed;
        width: 100%;
        height: 100%;
      }
      #joystick-controls {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        user-select: none;
      }
      .joystick-container {
        position: absolute;
        width: 120px;
        height: 120px;
        border-radius: 60px;
        background-color: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.5);
        pointer-events: auto;
        touch-action: none;
      }
      .joystick-knob {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 50px;
        height: 50px;
        border-radius: 25px;
        background-color: rgba(255, 255, 255, 0.8);
        pointer-events: none;
      }
      #left-joystick-container {
        bottom: 20px;
        left: 20px;
      }
      #right-joystick-container {
        bottom: 20px;
        right: 20px;
      }
      #r2-button {
        position: absolute;
        top: 20px;
        right: 20px;
        width: 70px;
        height: 70px;
        border-radius: 35px;
        background-color: rgba(0, 0, 0, 0.3);
        border: 2px solid rgba(255, 255, 255, 0.5);
        color: white;
        font-size: 24px;
        display: flex;
        justify-content: center;
        align-items: center;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
      }
    `;
    document.head.appendChild(style);

    // Créer le conteneur pour les contrôles joystick
    const joystickControlsContainer = document.createElement("div");
    joystickControlsContainer.id = "joystick-controls";
    document.body.appendChild(joystickControlsContainer);

    // Joystick gauche (mouvement)
    const leftJoystickContainer = document.createElement("div");
    leftJoystickContainer.id = "left-joystick-container";
    leftJoystickContainer.className = "joystick-container";
    joystickControlsContainer.appendChild(leftJoystickContainer);

    const leftJoystickKnob = document.createElement("div");
    leftJoystickKnob.id = "left-joystick-knob";
    leftJoystickKnob.className = "joystick-knob";
    leftJoystickContainer.appendChild(leftJoystickKnob);

    // Joystick droit (rotation/caméra)
    const rightJoystickContainer = document.createElement("div");
    rightJoystickContainer.id = "right-joystick-container";
    rightJoystickContainer.className = "joystick-container";
    joystickControlsContainer.appendChild(rightJoystickContainer);

    const rightJoystickKnob = document.createElement("div");
    rightJoystickKnob.id = "right-joystick-knob";
    rightJoystickKnob.className = "joystick-knob";
    rightJoystickContainer.appendChild(rightJoystickKnob);

    // Bouton R2 (tir)
    const r2Button = document.createElement("div");
    r2Button.id = "r2-button";
    r2Button.textContent = "R2";
    joystickControlsContainer.appendChild(r2Button);

    // Variables pour les joysticks
    let leftJoystickActive = false;
    let leftJoystickStartX = 0;
    let leftJoystickStartY = 0;
    let leftJoystickCurrentX = 0;
    let leftJoystickCurrentY = 0;
    let leftJoystickPointerId = -1;

    let rightJoystickActive = false;
    let rightJoystickStartX = 0;
    let rightJoystickStartY = 0;
    let rightJoystickCurrentX = 0;
    let rightJoystickCurrentY = 0;
    let rightJoystickPointerId = -1;

    const joystickMaxDistance = 50;
    let targetRotationY = hero.rotation.y;

    // Variables pour l'animation
    let animating = false;
    let sambaAnimating = false;
    let currentAnimation = animations.idleAnim;
    let lastShootTime = 0;
    const shootCooldown = 500;
    const shootAnimationDuration = 300;

    // Fonction pour changer d'animation
    const changeAnimation = (newAnimation) => {
        if (currentAnimation === newAnimation || !newAnimation) return;
        
        const now = Date.now();
        const isShootingAnim = [animations.shotgunAnim, animations.shootStandingAnim].includes(currentAnimation);
        const isNewShootingAnim = [animations.shotgunAnim, animations.shootStandingAnim].includes(newAnimation);
        
        if (isNewShootingAnim) {
            lastShootTime = now;
            animations.immediateTransition?.(newAnimation);
            currentAnimation = newAnimation;
            return;
        }
        
        if (isShootingAnim && now - lastShootTime < shootAnimationDuration) return;
        
        if (animations.transitionToAnimation) {
            animations.transitionToAnimation(currentAnimation, newAnimation);
        } else {
            currentAnimation?.stop();
            newAnimation.start(true, 1.0, newAnimation.from, newAnimation.to, false);
        }
        
        currentAnimation = newAnimation;
    };

    // Événements pour le joystick gauche (mouvement)
    leftJoystickContainer.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        leftJoystickActive = true;
        leftJoystickPointerId = event.pointerId;
        const rect = leftJoystickContainer.getBoundingClientRect();
        leftJoystickStartX = rect.left + rect.width / 2;
        leftJoystickStartY = rect.top + rect.height / 2;
        leftJoystickCurrentX = event.clientX;
        leftJoystickCurrentY = event.clientY;
        updateLeftJoystickPosition();
        
        // Capture le pointeur pour garantir que tous les événements ultérieurs iront à ce conteneur
        leftJoystickContainer.setPointerCapture(event.pointerId);
    });

    // Événements pour le joystick droit (rotation/caméra)
    rightJoystickContainer.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        rightJoystickActive = true;
        rightJoystickPointerId = event.pointerId;
        const rect = rightJoystickContainer.getBoundingClientRect();
        rightJoystickStartX = rect.left + rect.width / 2;
        rightJoystickStartY = rect.top + rect.height / 2;
        rightJoystickCurrentX = event.clientX;
        rightJoystickCurrentY = event.clientY;
        updateRightJoystickPosition();
        
        // Capture le pointeur pour garantir que tous les événements ultérieurs iront à ce conteneur
        rightJoystickContainer.setPointerCapture(event.pointerId);
    });

    // Gestionnaires d'événements pour chaque joystick
    leftJoystickContainer.addEventListener("pointermove", (event) => {
        if (leftJoystickActive && event.pointerId === leftJoystickPointerId) {
            leftJoystickCurrentX = event.clientX;
            leftJoystickCurrentY = event.clientY;
            updateLeftJoystickPosition();
        }
    });

    rightJoystickContainer.addEventListener("pointermove", (event) => {
        if (rightJoystickActive && event.pointerId === rightJoystickPointerId) {
            rightJoystickCurrentX = event.clientX;
            rightJoystickCurrentY = event.clientY;
            updateRightJoystickPosition();
        }
    });
    
    leftJoystickContainer.addEventListener("pointerup", (event) => {
        if (event.pointerId === leftJoystickPointerId) {
            leftJoystickActive = false;
            resetLeftJoystick();
            leftJoystickContainer.releasePointerCapture(event.pointerId);
        }
    });
    
    rightJoystickContainer.addEventListener("pointerup", (event) => {
        if (event.pointerId === rightJoystickPointerId) {
            rightJoystickActive = false;
            resetRightJoystick();
            rightJoystickContainer.releasePointerCapture(event.pointerId);
        }
    });
    
    leftJoystickContainer.addEventListener("pointercancel", (event) => {
        if (event.pointerId === leftJoystickPointerId) {
            leftJoystickActive = false;
            resetLeftJoystick();
        }
    });
    
    rightJoystickContainer.addEventListener("pointercancel", (event) => {
        if (event.pointerId === rightJoystickPointerId) {
            rightJoystickActive = false;
            resetRightJoystick();
        }
    });

    // Événements pour le bouton R2 (tir)
    r2Button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        const now = Date.now();
        if (now - lastShootTime > shootCooldown) {
            lastShootTime = now;
            const shootDirection = camera.getForwardRay().direction.normalize();
            const shootPosition = hero.position.clone();
            
            // Animation de tir
            const shootAnimation = animating ? animations.shotgunAnim : animations.shootStandingAnim;
            changeAnimation(shootAnimation);
            
            // Effectuer le tir
            setTimeout(() => {
                if (scene.metadata.executeShot) {
                    scene.metadata.executeShot(shootPosition, shootDirection);
                }
            }, 16);
        }
        
        // Effet visuel pour le bouton
        r2Button.style.backgroundColor = "rgba(50, 150, 255, 0.6)";
        r2Button.style.transform = "scale(0.95)";
    });

    r2Button.addEventListener("pointerup", () => {
        r2Button.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
        r2Button.style.transform = "scale(1)";
    });

    // Fonctions pour mettre à jour la position des joysticks
    function updateLeftJoystickPosition() {
        let deltaX = leftJoystickCurrentX - leftJoystickStartX;
        let deltaY = leftJoystickCurrentY - leftJoystickStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > joystickMaxDistance) {
            const ratio = joystickMaxDistance / distance;
            deltaX *= ratio;
            deltaY *= ratio;
        }
        
        leftJoystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    }

    function resetLeftJoystick() {
        leftJoystickKnob.style.transform = "translate(-50%, -50%)";
    }

    function updateRightJoystickPosition() {
        let deltaX = rightJoystickCurrentX - rightJoystickStartX;
        let deltaY = rightJoystickCurrentY - rightJoystickStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > joystickMaxDistance) {
            const ratio = joystickMaxDistance / distance;
            deltaX *= ratio;
            deltaY *= ratio;
        }
        
        rightJoystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    }

    function resetRightJoystick() {
        rightJoystickKnob.style.transform = "translate(-50%, -50%)";
    }

    const isPlayerMoving = () => animating && !sambaAnimating;

    // Mettre à jour le mouvement et la rotation à chaque frame
    scene.onBeforeRenderObservable.add(() => {
        // Mettre à jour la rotation du joueur en fonction du joystick droit
        if (rightJoystickActive) {
            const deltaX = rightJoystickCurrentX - rightJoystickStartX;
            const deltaY = rightJoystickCurrentY - rightJoystickStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 5) {
                const rotationSpeed = 0.003;
                targetRotationY += deltaX * rotationSpeed;
                
                // Ajout de la capacité à regarder vers le haut/bas avec le joystick droit (optionnel)
                if (camera.beta - deltaY * 0.001 > BABYLON.Tools.ToRadians(10) && 
                    camera.beta - deltaY * 0.001 < BABYLON.Tools.ToRadians(80)) {
                    camera.beta -= deltaY * 0.001;
                }
            }
        }
        
        hero.rotation.y = BABYLON.Scalar.LerpAngle(hero.rotation.y, targetRotationY, 0.1);

        // Mettre à jour le mouvement du joueur en fonction du joystick gauche
        if (leftJoystickActive) {
            const deltaX = leftJoystickCurrentX - leftJoystickStartX;
            const deltaY = leftJoystickCurrentY - leftJoystickStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 5) { // Seuil réduit pour plus de sensibilité
                const normalizedX = deltaX / distance;
                const normalizedY = deltaY / distance;
                
                const forward = new BABYLON.Vector3(
                    Math.sin(hero.rotation.y),
                    0,
                    Math.cos(hero.rotation.y)
                );
                
                const right = new BABYLON.Vector3(
                    Math.sin(hero.rotation.y + Math.PI / 2),
                    0,
                    Math.cos(hero.rotation.y + Math.PI / 2)
                );
                
                const moveDirection = new BABYLON.Vector3(0, 0, 0);
                moveDirection.addInPlace(forward.scale(-normalizedY));
                moveDirection.addInPlace(right.scale(-normalizedX));
                
                if (moveDirection.length() > 0) {
                    moveDirection.normalize();
                    const speedFactor = Math.min(1, distance / joystickMaxDistance);
                    hero.moveWithCollisions(moveDirection.scale(0.15 * speedFactor));
                    
                    // Animation de marche
                    const now = Date.now();
                    const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                        now - lastShootTime < shootAnimationDuration;
                    
                    if (!animating && !isShooting) {
                        animating = true;
                        changeAnimation(animations.walkAnim);
                    } else if (animating && !isShooting && currentAnimation !== animations.walkAnim) {
                        changeAnimation(animations.walkAnim);
                    }
                }
            }
        } else if (animating) {
            const now = Date.now();
            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;
                
            if (!isShooting) {
                animating = false;
                changeAnimation(animations.idleAnim);
            }
        }

        // Mettre à jour la position de la caméra
        const cameraOffset = new BABYLON.Vector3(0, 2, 6);
        const rotatedOffset = BABYLON.Vector3.TransformCoordinates(cameraOffset, BABYLON.Matrix.RotationY(hero.rotation.y));
        camera.position = BABYLON.Vector3.Lerp(camera.position, hero.position.add(rotatedOffset), 0.1);
        camera.setTarget(BABYLON.Vector3.Lerp(camera.getTarget(), hero.position.add(new BABYLON.Vector3(0, 1.5, 0)), 0.1));
    });

    // Configuration pour le tir
    scene.metadata.executeShot = (position, direction) => {
        scene.metadata.player?.executeShot?.(position, direction);
    };

    // Désactivation du défilement pour la page
    function preventDefault(e) {
        e.preventDefault();
    }
    
    document.addEventListener('touchmove', preventDefault, { passive: false });
    
    // Ajout au return pour nettoyer les événements lors de la suppression
    return {
        isPlayerMoving,
        changeAnimation,
        // Fonction pour désactiver les contrôles joystick
        dispose: () => {
            document.removeEventListener('touchmove', preventDefault);
            document.head.removeChild(style);
            document.body.removeChild(joystickControlsContainer);
        }
    };
} 
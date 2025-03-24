import * as BABYLON from "@babylonjs/core";

const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
           (window.matchMedia && window.matchMedia("(max-width: 768px), (max-height: 768px)").matches);
};

export function setupMobileControls(scene, hero, animations, camera) {
    if (!isMobileDevice()) {
        return null;
    }

    const mobileControlsContainer = document.createElement("div");
    mobileControlsContainer.id = "mobile-controls";
    Object.assign(mobileControlsContainer.style, {
        position: "absolute",
        bottom: "0",
        left: "0",
        width: "100%",
        height: "100%", 
        pointerEvents: "none",
        zIndex: "1000",
        userSelect: "none"
    });
    document.body.appendChild(mobileControlsContainer);

    const joystickContainer = document.createElement("div");
    joystickContainer.id = "joystick-container";
    Object.assign(joystickContainer.style, {
        position: "absolute",
        bottom: "20px",
        left: "20px",
        width: "120px",
        height: "120px",
        borderRadius: "60px",
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        border: "2px solid rgba(255, 255, 255, 0.5)",
        pointerEvents: "auto",
        touchAction: "none"
    });
    mobileControlsContainer.appendChild(joystickContainer);

    const joystickKnob = document.createElement("div");
    joystickKnob.id = "joystick-knob";
    Object.assign(joystickKnob.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "50px",
        height: "50px",
        borderRadius: "25px",
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        pointerEvents: "none"
    });
    joystickContainer.appendChild(joystickKnob);

    const actionButtonsContainer = document.createElement("div");
    actionButtonsContainer.id = "action-buttons";
    Object.assign(actionButtonsContainer.style, {
        position: "absolute",
        bottom: "20px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "15px",
        pointerEvents: "auto"
    });
    mobileControlsContainer.appendChild(actionButtonsContainer);
    const shootButton = createActionButton("🔫", "shoot-button");
    actionButtonsContainer.appendChild(shootButton);
    const danceButton = createActionButton("💃", "dance-button");
    actionButtonsContainer.appendChild(danceButton);
    const interactButton = createActionButton("✋", "interact-button");
    actionButtonsContainer.appendChild(interactButton);

    const rotationZone = document.createElement("div");
    rotationZone.id = "rotation-zone";
    Object.assign(rotationZone.style, {
        position: "absolute",
        top: "0",
        right: "0",
        width: "70%",
        height: "100%",
        pointerEvents: "auto",
        touchAction: "none"
    });
    mobileControlsContainer.appendChild(rotationZone);

    let joystickActive = false;
    let joystickStartX = 0;
    let joystickStartY = 0;
    let joystickCurrentX = 0;
    let joystickCurrentY = 0;
    const joystickMaxDistance = 35; 

    let isRotating = false;
    let lastTouchX = 0;
    const rotationSensitivity = 0.003;
    let targetRotationY = hero.rotation.y;

    let animating = false;
    let sambaAnimating = false;
    let currentAnimation = animations.idleAnim;
    let lastShootTime = 0;
    const shootCooldown = 500;
    const shootAnimationDuration = 350;

    const changeAnimation = (newAnimation) => {
        if (currentAnimation === newAnimation || !newAnimation) return;
        
        const now = Date.now();
        const isShootingAnim = currentAnimation === animations.shotgunAnim || currentAnimation === animations.shootStandingAnim;
        const isNewShootingAnim = newAnimation === animations.shotgunAnim || newAnimation === animations.shootStandingAnim;
        
        if (isNewShootingAnim) {
            lastShootTime = now;
            
            if (animations.immediateTransition) {
                animations.immediateTransition(newAnimation);
                currentAnimation = newAnimation;
                return;
            }
        }
        else if (isShootingAnim && now - lastShootTime < shootAnimationDuration) {
            return;
        }
        
        if (animations.transitionToAnimation) {
            animations.transitionToAnimation(currentAnimation, newAnimation);
        } else {
            if (currentAnimation) currentAnimation.stop();
            newAnimation.start(true, 1.0, newAnimation.from, newAnimation.to, false);
        }
        
        currentAnimation = newAnimation;
    };

    const isPlayerMoving = () => {
        return animating && !sambaAnimating;
    };

    joystickContainer.addEventListener("touchstart", (event) => {
        joystickActive = true;
        const touch = event.touches[0];
        const rect = joystickContainer.getBoundingClientRect();
        joystickStartX = rect.left + rect.width / 2;
        joystickStartY = rect.top + rect.height / 2;
        joystickCurrentX = touch.clientX;
        joystickCurrentY = touch.clientY;
        updateJoystickPosition();
    });

    document.addEventListener("touchmove", (event) => {
        if (!joystickActive) return;
        const touch = event.touches[0];
        joystickCurrentX = touch.clientX;
        joystickCurrentY = touch.clientY;
        updateJoystickPosition();
    });

    document.addEventListener("touchend", (event) => {
        if (joystickActive) {
            joystickActive = false;
            resetJoystick();
        }
    });

    // Événements pour la rotation
    rotationZone.addEventListener("touchstart", (event) => {
        isRotating = true;
        lastTouchX = event.touches[0].clientX;
    });

    rotationZone.addEventListener("touchmove", (event) => {
        if (!isRotating) return;
        const touchX = event.touches[0].clientX;
        const deltaX = touchX - lastTouchX;
        targetRotationY += deltaX * rotationSensitivity;
        lastTouchX = touchX;
    });

    rotationZone.addEventListener("touchend", () => {
        isRotating = false;
    });

    // Événements pour les boutons d'action
    shootButton.addEventListener("touchstart", () => {
        const now = Date.now();
        if (now - lastShootTime > shootCooldown) {
            lastShootTime = now;
            const shootDirection = camera.getForwardRay().direction.normalize();
            const shootPosition = hero.position.clone();
            
            // Animation de tir
            const shootAnimation = animating ? animations.shotgunAnim : animations.shootStandingAnim;
            changeAnimation(shootAnimation);
            
            // Créer le bullet après un court délai pour correspondre à l'animation
            setTimeout(() => {
                if (scene.metadata.executeShot) {
                    scene.metadata.executeShot(shootPosition, shootDirection);
                }
            }, 16);
        }
    });

    danceButton.addEventListener("touchstart", () => {
        sambaAnimating = true;
        changeAnimation(animations.sambaAnim);
    });

    danceButton.addEventListener("touchend", () => {
        sambaAnimating = false;
        if (!animating) {
            changeAnimation(animations.idleAnim);
        } else {
            changeAnimation(animations.walkAnim);
        }
    });

    interactButton.addEventListener("touchstart", () => {
        // Simuler un appui sur la touche K pour l'interaction
        if (scene.metadata.controls && scene.metadata.controls.inputMap) {
            scene.metadata.controls.inputMap["k"] = true;
            setTimeout(() => {
                scene.metadata.controls.inputMap["k"] = false;
            }, 100);
        }
    });

    // Fonction pour mettre à jour la position du joystick
    function updateJoystickPosition() {
        let deltaX = joystickCurrentX - joystickStartX;
        let deltaY = joystickCurrentY - joystickStartY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > joystickMaxDistance) {
            const ratio = joystickMaxDistance / distance;
            deltaX *= ratio;
            deltaY *= ratio;
        }
        
        joystickKnob.style.transform = `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`;
    }

    // Fonction pour réinitialiser le joystick
    function resetJoystick() {
        joystickKnob.style.transform = "translate(-50%, -50%)";
    }

    // Fonction pour créer un bouton d'action
    function createActionButton(emoji, id) {
        const button = document.createElement("div");
        button.id = id;
        button.textContent = emoji;
        Object.assign(button.style, {
            width: "70px",
            height: "70px",
            borderRadius: "35px",
            backgroundColor: "rgba(0, 0, 0, 0.3)",
            border: "2px solid rgba(255, 255, 255, 0.5)",
            color: "white",
            fontSize: "30px",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
            pointerEvents: "auto"
        });
        
        // Ajouter des effets visuels pour le feedback
        button.addEventListener("touchstart", () => {
            button.style.backgroundColor = "rgba(50, 150, 255, 0.6)";
            button.style.transform = "scale(0.95)";
        });
        
        button.addEventListener("touchend", () => {
            button.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
            button.style.transform = "scale(1)";
        });
        
        return button;
    }

    // Mettre à jour le mouvement du joueur à chaque frame
    scene.onBeforeRenderObservable.add(() => {
        hero.rotation.y = BABYLON.Scalar.LerpAngle(hero.rotation.y, targetRotationY, 0.1);

        // Calculer la direction de mouvement à partir du joystick
        if (joystickActive) {
            const deltaX = joystickCurrentX - joystickStartX;
            const deltaY = joystickCurrentY - joystickStartY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            if (distance > 10) { // Un seuil minimum pour éviter les petits mouvements non intentionnels
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
                    
                    if (!animating) {
                        animating = true;
                        changeAnimation(animations.walkAnim);
                    }
                }
            }
        } else if (animating && !sambaAnimating) {
            animating = false;
            changeAnimation(animations.idleAnim);
        }

        // Mettre à jour la position de la caméra
        const cameraOffset = new BABYLON.Vector3(0, 2, 6);
        const rotatedOffset = BABYLON.Vector3.TransformCoordinates(cameraOffset, BABYLON.Matrix.RotationY(hero.rotation.y));
        camera.position = BABYLON.Vector3.Lerp(camera.position, hero.position.add(rotatedOffset), 0.1);
        camera.setTarget(BABYLON.Vector3.Lerp(camera.getTarget(), hero.position.add(new BABYLON.Vector3(0, 1.5, 0)), 0.1));
    });

    return {
        isPlayerMoving,
        changeAnimation,
        isMobile: true,
        // Fonction pour désactiver les contrôles mobiles
        dispose: () => {
            document.body.removeChild(mobileControlsContainer);
        }
    };
} 
import * as BABYLON from "@babylonjs/core";

export function setupGamepadControls(scene, hero, animations, camera) {
    // Variables pour le gamepad
    let gamepad = null;
    let gamepadConnected = false;
    let lastButtonStates = {};
    
    // Variables pour les animations
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
    
    // Gestionnaire de connexion gamepad
    window.addEventListener("gamepadconnected", (e) => {
        console.log(`Manette connectée: ${e.gamepad.id}`);
        gamepadConnected = true;
        gamepad = e.gamepad;
        
        // Afficher les informations sur le gamepad en mode debug
        console.log("Gamepad connecté:", gamepad);
        console.log("Axes:", gamepad.axes.length);
        console.log("Boutons:", gamepad.buttons.length);
        
        // Créer un message pour informer l'utilisateur qu'une manette est connectée
        const gamepadInfo = document.createElement('div');
        gamepadInfo.id = 'gamepadInfo';
        gamepadInfo.innerHTML = `
            <div style="font-weight: bold; margin-bottom: 5px;">Manette connectée: ${e.gamepad.id}</div>
            <div style="font-weight: bold; margin-bottom: 3px;">Contrôles:</div>
            <div>- Joystick gauche: Déplacement (comme ZQSD)</div>
            <div>- Joystick droit: Orientation caméra (comme souris)</div>
            <div>- R2 (gâchette droite): Tirer</div>
            <div>- Bouton ○ (Cercle): Danse</div>
        `;
        Object.assign(gamepadInfo.style, {
            position: 'absolute',
            top: '10px',
            left: '10px',
            padding: '10px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            borderRadius: '5px',
            zIndex: '1000',
            transition: 'opacity 0.5s ease-in-out',
            fontSize: '14px',
            lineHeight: '1.4'
        });
        document.body.appendChild(gamepadInfo);
        
        // Faire disparaître le message après 7 secondes
        setTimeout(() => {
            gamepadInfo.style.opacity = '0';
            setTimeout(() => {
                if (gamepadInfo.parentNode) {
                    document.body.removeChild(gamepadInfo);
                }
            }, 500);
        }, 7000);
    });
    
    window.addEventListener("gamepaddisconnected", (e) => {
        console.log(`Manette déconnectée: ${e.gamepad.id}`);
        gamepadConnected = false;
    });
    
    const isPlayerMoving = () => animating && !sambaAnimating;
    
    // Fonction pour gérer le tir
    function handleShooting() {
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
    }
    
    // Mise à jour à chaque frame
    scene.onBeforeRenderObservable.add(() => {
        // Si pas de gamepad connecté, essayer d'en obtenir un
        if (!gamepadConnected) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    gamepad = gamepads[i];
                    gamepadConnected = true;
                    console.log("Gamepad détecté automatiquement:", gamepad.id);
                    break;
                }
            }
            if (!gamepadConnected) return;
        }
        
        // Mettre à jour notre référence au gamepad
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        let currentGamepad = null;
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i] && gamepads[i].connected) {
                currentGamepad = gamepads[i];
                break;
            }
        }
        
        if (!currentGamepad) {
            gamepadConnected = false;
            return;
        }
        
        gamepad = currentGamepad;
        
        // Debug: afficher périodiquement les valeurs des boutons pour détecter R2
        if (Math.random() < 0.001) { // Environ tous les 1000 frames
            console.log("Axes:", gamepad.axes.map(a => a.toFixed(2)));
            console.log("Boutons:", gamepad.buttons.map((b, i) => `${i}: ${b.value.toFixed(2)}`));
        }
        
        // Mappings spécifiques pour PS4
        let axesMapping = {
            leftStickX: 0,
            leftStickY: 1,
            rightStickX: 2,
            rightStickY: 3
        };
        
        let buttonMapping = {
            r2: 7, // Index standard pour R2 sur PS4
            circle: 1, // Bouton cercle pour danse
            l1: 4,    // Bouton L1
            l2: 6     // Bouton L2
        };
        
        // Adaptation pour différents contrôleurs
        if (gamepad.id.toLowerCase().includes("dualshock") || 
            gamepad.id.toLowerCase().includes("playstation") || 
            gamepad.id.toLowerCase().includes("ps4") || 
            gamepad.id.toLowerCase().includes("wireless controller")) {
            
            // Mapping PS4 standard
            buttonMapping.r2 = 7;
            buttonMapping.circle = 1;
            buttonMapping.l1 = 4;
            buttonMapping.l2 = 6;
            
        } else if (gamepad.id.toLowerCase().includes("xbox")) {
            // Mapping pour Xbox
            buttonMapping.r2 = 7;
            buttonMapping.circle = 1;
            buttonMapping.l1 = 4;
            buttonMapping.l2 = 6;
        } else {
            // Mapping générique - essayer de détecter R2
            // Dans certains cas, R2 peut être un axe et non un bouton
            if (gamepad.axes.length > 5 && Math.abs(gamepad.axes[5]) > 0.1) {
                // Simuler un bouton à partir de l'axe
                const axisValue = (gamepad.axes[5] + 1) / 2; // Convert [-1, 1] to [0, 1]
                if (axisValue > 0.5 && !lastButtonStates["axis5"]) {
                    handleShooting();
                    lastButtonStates["axis5"] = true;
                } else if (axisValue <= 0.5) {
                    lastButtonStates["axis5"] = false;
                }
            }
        }
        
        // Contrôle du mouvement avec le joystick gauche
        const leftStickX = applyDeadzone(gamepad.axes[axesMapping.leftStickX], 0.1);
        const leftStickY = applyDeadzone(gamepad.axes[axesMapping.leftStickY], 0.1);
        
        // Contrôle de la rotation avec le joystick droit - comme la souris
        const rightStickX = applyDeadzone(gamepad.axes[axesMapping.rightStickX], 0.1);
        const rightStickY = applyDeadzone(gamepad.axes[axesMapping.rightStickY], 0.1);
        
        // Rotation du personnage avec le joystick droit - comme la souris
        if (Math.abs(rightStickX) > 0) {
            const rotationSpeed = 0.05;
            // Similaire au comportement de la souris
            hero.rotation.y += rightStickX * rotationSpeed;
        }
        
        // Inclinaison verticale de la caméra avec le joystick droit
        if (Math.abs(rightStickY) > 0) {
            if (camera.beta - rightStickY * 0.05 > BABYLON.Tools.ToRadians(10) && 
                camera.beta - rightStickY * 0.05 < BABYLON.Tools.ToRadians(80)) {
                camera.beta -= rightStickY * 0.05;
            }
        }
        
        // Mouvement du personnage avec le joystick gauche
        const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
        const right = new BABYLON.Vector3(Math.sin(hero.rotation.y + Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
        let moveDirection = BABYLON.Vector3.Zero();
        
        if (Math.abs(leftStickX) > 0 || Math.abs(leftStickY) > 0) {
            // Reproduire la logique des touches ZQSD
            if (leftStickY < 0) moveDirection.subtractInPlace(forward);   // Z (avancer)
            if (leftStickY > 0) moveDirection.addInPlace(forward);        // S (reculer)
            if (leftStickX > 0) moveDirection.subtractInPlace(right);     // D (droite)
            if (leftStickX < 0) moveDirection.addInPlace(right);          // Q (gauche)
            
            const magnitude = Math.sqrt(leftStickX * leftStickX + leftStickY * leftStickY);
            const normalizedMagnitude = Math.min(1, magnitude);
            
            if (moveDirection.length() > 0) {
                moveDirection.normalize();
                hero.moveWithCollisions(moveDirection.scale(0.15 * normalizedMagnitude));
                
                // Animation de marche identique au clavier
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
        } else if (animating && !sambaAnimating) {
            const now = Date.now();
            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;
            
            if (!isShooting) {
                animating = false;
                changeAnimation(animations.idleAnim);
            }
        }
        
        // Bouton cercle (B) pour la danse samba
        if (gamepad.buttons[buttonMapping.circle] && gamepad.buttons[buttonMapping.circle].pressed) {
            const now = Date.now();
            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;
                
            if (!isShooting && !sambaAnimating) {
                sambaAnimating = true;
                changeAnimation(animations.sambaAnim);
            }
        } else if (sambaAnimating && !animating) {
            const now = Date.now();
            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;
                
            if (!isShooting) {
                sambaAnimating = false;
                changeAnimation(animations.idleAnim);
            }
        }
        
        // Vérifier si le bouton R2 est pressé
        if (gamepad.buttons[buttonMapping.r2] && 
            gamepad.buttons[buttonMapping.r2].pressed && 
            !lastButtonStates[buttonMapping.r2]) {
            handleShooting();
        }
        
        // Mettre à jour les états des boutons
        for (let i = 0; i < gamepad.buttons.length; i++) {
            lastButtonStates[i] = gamepad.buttons[i].pressed;
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
    
    // Fonction utilitaire pour appliquer une zone morte aux joysticks
    function applyDeadzone(value, deadzone) {
        if (Math.abs(value) < deadzone) {
            return 0;
        }
        
        return value > 0 
            ? (value - deadzone) / (1 - deadzone)
            : (value + deadzone) / (1 - deadzone);
    }
    
    return {
        isPlayerMoving,
        changeAnimation
    };
} 
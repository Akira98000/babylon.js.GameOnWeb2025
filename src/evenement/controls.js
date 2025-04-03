import * as BABYLON from "@babylonjs/core";
import { GamepadNotification } from "../ui/gamepadNotification.js";
import { GamepadUtility } from "../ui/gamepadUtility.js";

export function setupControls(scene, hero, animations, camera, canvas) {
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);

    const heroSpeed = 0.15;
    const rotationSensitivity = 0.005;
    const shootAnimationDuration = 300;
    let animating = false;
    let sambaAnimating = false;
    let targetRotationY = Math.PI;
    let currentAnimation = animations.idleAnim;
    let lastShootTime = 0;
    let lastMoveTime = 0;
    let lastPointerEvent = 0;
    const moveThrottle = 16;
    const pointerThrottle = 16;
    let gamepadConnected = false;
    let gamepad = null;
    let gamepadConfig = null;
    const gamepadDeadzone = 0.15; 
    let lastGamepadShootTime = 0;
    const gamepadShootCooldown = 300; 
    
    const PS4_BUTTON = {
        CROSS: 0,    
        CIRCLE: 1,   
        SQUARE: 2,     
        TRIANGLE: 3,   
        L1: 4,
        R1: 5,        
        L2: 6,
        R2: 7,        
        SHARE: 8,
        OPTIONS: 9,
        L3: 10,       
        R3: 11,       
        PS: 12,        
        TOUCHPAD: 13
    };
    
    const PS4_AXIS = {
        LEFT_STICK_X: 0,  
        LEFT_STICK_Y: 1,  
        RIGHT_STICK_X: 2, 
        RIGHT_STICK_Y: 3 
    };

    if (hero.rotationQuaternion) hero.rotationQuaternion = null;
    hero.rotation.y = targetRotationY;

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
    }));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, evt => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
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
    
    window.addEventListener("gamepadconnected", (e) => {
        console.log("Manette connectée: " + e.gamepad.id);
        gamepadConnected = true;
        gamepad = e.gamepad;
        gamepadConfig = GamepadUtility.detectConfiguration(gamepad);
        GamepadNotification.show("Manette PS4 connectée !", "connected");
        if (scene.metadata.hudControls) {
            scene.metadata.hudControls.setGamepadStatus(true, "PS4");
        }
    });
    
    window.addEventListener("gamepaddisconnected", (e) => {
        console.log("Manette déconnectée: " + e.gamepad.id);
        if (gamepad && gamepad.index === e.gamepad.index) {
            gamepadConnected = false;
            gamepad = null;
            GamepadNotification.show("Manette PS4 déconnectée", "disconnected");
            if (scene.metadata.hudControls) {
                scene.metadata.hudControls.setGamepadStatus(false);
            }
        }
    });

    scene.onPointerObservable.add(pointerInfo => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && 
            scene.metadata.isPointerLocked &&
            isActionAllowed('look')) {
            const now = Date.now();
            if (now - lastPointerEvent >= pointerThrottle) {
                const event = pointerInfo.event;
                const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
                const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
                targetRotationY += movementX * rotationSensitivity;
                
                camera.beta += movementY * rotationSensitivity;
                
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

        if (isNewShootingAnim) {
            lastShootTime = now;
            animations.immediateTransition?.(newAnimation);
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
    
    const updateGamepadInput = () => {
        if (!gamepadConnected) return;
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
       
        if (!gamepads || !gamepads[gamepad.index]) return;
        gamepad = gamepads[gamepad.index];
        
        if (!gamepadConfig) {
            gamepadConfig = GamepadUtility.detectConfiguration(gamepad);
        }
        
        if (Math.random() < 0.001) {
            console.log("État des axes:", gamepad.axes.map((value, idx) => `${idx}:${value.toFixed(2)}`).join(', '));
            console.log("État des boutons:", gamepad.buttons.map((btn, idx) => `${idx}:${btn.pressed ? 'Pressé' : 'Relâché'}`).join(', '));
        }
        
        const isCrossPressed = GamepadUtility.isButtonPressed(gamepad, gamepadConfig, 'cross');
        const isR1Pressed = GamepadUtility.isButtonPressed(gamepad, gamepadConfig, 'r1');
        const isR2Pressed = GamepadUtility.isButtonPressed(gamepad, gamepadConfig, 'r2');
        
        if ((isCrossPressed || isR1Pressed || isR2Pressed) && isActionAllowed('shoot')) {
            const now = Date.now();
            if (now - lastGamepadShootTime > gamepadShootCooldown) {
                console.log("Tir avec manette détecté");
                scene.metadata.executeShot?.(hero.position, camera.getForwardRay().direction);
                lastGamepadShootTime = now;
            }
        }
        
        const isTrianglePressed = GamepadUtility.isButtonPressed(gamepad, gamepadConfig, 'triangle');
        if (isTrianglePressed && isActionAllowed('dance')) {
            inputMap["b"] = true;
            if (!sambaAnimating) {
                console.log("Danse avec manette détectée");
            }
        } else if (inputMap["b"] === true && !isTrianglePressed) {
            inputMap["b"] = false;
        }
        
        const rawLeftX = gamepad.axes[PS4_AXIS.LEFT_STICK_X];
        const rawLeftY = gamepad.axes[PS4_AXIS.LEFT_STICK_Y];
        let leftX = Math.abs(rawLeftX) > gamepadDeadzone ? rawLeftX : 0;
        let leftY = Math.abs(rawLeftY) > gamepadDeadzone ? rawLeftY : 0;
        
        const shouldInvertX = localStorage.getItem('gamepadInvertXAxis') === 'true';
        if (shouldInvertX) {
            leftX = -leftX;
        }
        leftY = -leftY;
        if (Math.abs(leftX) > 0 || Math.abs(leftY) > 0) {
            if (Math.random() < 0.01) {
                console.log("Mouvement manette raw: X:", rawLeftX.toFixed(2), "Y:", rawLeftY.toFixed(2));
                console.log("Mouvement manette traité: X:", leftX.toFixed(2), "Y:", leftY.toFixed(2));
                console.log("Direction activée:", 
                    leftX < 0 ? "GAUCHE" : (leftX > 0 ? "DROITE" : ""), 
                    leftY > 0 ? "AVANT" : (leftY < 0 ? "ARRIÈRE" : ""));
            }
        }
        
        inputMap["q"] = leftX < -gamepadDeadzone && isActionAllowed('moveLeft');
        inputMap["d"] = leftX > gamepadDeadzone && isActionAllowed('moveRight');
        inputMap["z"] = leftY > gamepadDeadzone && isActionAllowed('moveForward');
        inputMap["s"] = leftY < -gamepadDeadzone && isActionAllowed('moveBackward');
        
        const rightX = Math.abs(gamepad.axes[PS4_AXIS.RIGHT_STICK_X]) > gamepadDeadzone 
            ? gamepad.axes[PS4_AXIS.RIGHT_STICK_X] 
            : 0;
        
        const rightY = Math.abs(gamepad.axes[PS4_AXIS.RIGHT_STICK_Y]) > gamepadDeadzone 
            ? gamepad.axes[PS4_AXIS.RIGHT_STICK_Y] 
            : 0;
        
        if (rightX !== 0 && isActionAllowed('look')) {
            targetRotationY += rightX * 0.05; 
        }
        
        if (rightY !== 0 && isActionAllowed('look')) {
            camera.beta += rightY * 0.05;
        }
    };

    setInterval(() => {
        if (!gamepadConnected) {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            for (let i = 0; i < gamepads.length; i++) {
                if (gamepads[i] && gamepads[i].connected) {
                    console.log("Manette détectée par intervalle:", gamepads[i].id);
                    gamepadConnected = true;
                    gamepad = gamepads[i];
                    GamepadNotification.show("Manette PS4 connectée !", "connected");
                    if (scene.metadata.hudControls) {
                        scene.metadata.hudControls.setGamepadStatus(true, "PS4");
                    }
                    break;
                }
            }
        }
    }, 2000);

    scene.onBeforeRenderObservable.add(() => {
        updateGamepadInput();
        const now = Date.now();
        if (now - lastMoveTime >= moveThrottle) {
            hero.rotation.y = BABYLON.Scalar.LerpAngle(hero.rotation.y, targetRotationY, 0.1);

            const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
            const right = new BABYLON.Vector3(Math.sin(hero.rotation.y + Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
            let moveDirection = BABYLON.Vector3.Zero();

            if (Math.random() < 0.01) {
                const activeKeys = Object.entries(inputMap)
                    .filter(([key, value]) => value === true)
                    .map(([key]) => key)
                    .join(', ');
                console.log("Touches actives:", activeKeys || "aucune");
            }

            if (inputMap["z"] && isActionAllowed('moveForward')) {
                moveDirection.subtractInPlace(forward);
            }
            if (inputMap["s"] && isActionAllowed('moveBackward')) {
                moveDirection.addInPlace(forward);
            }
            if (inputMap["d"] && isActionAllowed('moveRight')) {
                moveDirection.subtractInPlace(right);
            }
            if (inputMap["q"] && isActionAllowed('moveLeft')) {
                moveDirection.addInPlace(right);
            }

            const isShooting = [animations.shootStandingAnim?.isPlaying, animations.shotgunAnim?.isPlaying].some(Boolean) &&
                now - lastShootTime < shootAnimationDuration;

            if (moveDirection.length() > 0) {
                moveDirection.normalize();
                hero.moveWithCollisions(moveDirection.scale(heroSpeed));

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

        const cameraOffset = new BABYLON.Vector3(0, 2, 6);
        const rotatedOffset = BABYLON.Vector3.TransformCoordinates(cameraOffset, BABYLON.Matrix.RotationY(hero.rotation.y));
        camera.position = BABYLON.Vector3.Lerp(camera.position, hero.position.add(rotatedOffset), 0.1);
        camera.setTarget(BABYLON.Vector3.Lerp(camera.getTarget(), hero.position.add(new BABYLON.Vector3(0, 1.5, 0)), 0.1));
    });

    scene.metadata.executeShot = (position, direction) => {
        scene.metadata.player?.executeShot?.(position, direction);
    };

    return { inputMap, isPlayerMoving, changeAnimation, isMobile: false, hasGamepadSupport: true };
}

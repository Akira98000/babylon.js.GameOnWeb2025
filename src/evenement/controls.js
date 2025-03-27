import * as BABYLON from "@babylonjs/core";

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
    const moveThrottle = 16;

    if (hero.rotationQuaternion) hero.rotationQuaternion = null;
    hero.rotation.y = targetRotationY;

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, evt => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
    }));

    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, evt => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
    }));

    canvas.onclick = () => canvas.requestPointerLock();

    let lastPointerEvent = 0;
    const pointerThrottle = 16;

    scene.onPointerObservable.add(pointerInfo => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE && 
            document.pointerLockElement === canvas) {
            const now = Date.now();
            if (now - lastPointerEvent >= pointerThrottle) {
                targetRotationY += pointerInfo.event.movementX * rotationSensitivity;
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

    scene.onBeforeRenderObservable.add(() => {
        const now = Date.now();
        if (now - lastMoveTime >= moveThrottle) {
            hero.rotation.y = BABYLON.Scalar.LerpAngle(hero.rotation.y, targetRotationY, 0.1);

            const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
            const right = new BABYLON.Vector3(Math.sin(hero.rotation.y + Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
            let moveDirection = BABYLON.Vector3.Zero();

            if (inputMap["z"]) moveDirection.subtractInPlace(forward);
            if (inputMap["s"]) moveDirection.addInPlace(forward);
            if (inputMap["d"]) moveDirection.subtractInPlace(right);
            if (inputMap["q"]) moveDirection.addInPlace(right);

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

            if (inputMap["b"] && !isShooting) {
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

    return { inputMap, isPlayerMoving, changeAnimation, isMobile: false };
}

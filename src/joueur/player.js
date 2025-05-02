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
    
    const hitbox = BABYLON.MeshBuilder.CreateBox("playerHitbox", {
        width: 3.0,
        height: 10.0,
        depth: 3.0
    }, scene);
    hitbox.parent = hero;
    hitbox.position = new BABYLON.Vector3(0, 1.0, 0);
    const hitboxMaterial = new BABYLON.StandardMaterial("playerHitboxMaterial", scene);
    hitboxMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    hitboxMaterial.alpha = 0.3;
    hitbox.material = hitboxMaterial;
    hitbox.isPickable = true;
    hitbox.isPlayer = true;
    
    hero.maxHealth = 100;
    hero.currentHealth = 100;
    hero.isDead = false;
    hero.isHit = false;
    hero.hitRecoveryTime = 200;
    hero.lastHitTime = 0;
    hero.damagePerBullet = 10;
    
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

    const hitSound = new BABYLON.Sound("playerHitSound", "/son/hit.mp3", scene, null, {
        volume: 0.5
    });

    let lastShotTime = 0;
    const shootCooldown = GAME_CONFIG.ANIMATIONS?.SHOOT?.COOLDOWN || 500;
    let isMoving = false;
    let currentAnimation = null;
    let controlsRef = null;
    let animationsRef = null;
    let shootEndObserver = null;

    const createHealthBar = () => {
        const healthBarContainer = document.createElement("div");
        healthBarContainer.id = "playerHealthBar";
        healthBarContainer.style.position = "fixed";
        healthBarContainer.style.bottom = "20px";
        healthBarContainer.style.left = "20px";
        healthBarContainer.style.width = "200px";
        healthBarContainer.style.height = "20px";
        healthBarContainer.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        healthBarContainer.style.border = "2px solid white";
        healthBarContainer.style.borderRadius = "10px";
        healthBarContainer.style.overflow = "hidden";
        
        const healthBarFill = document.createElement("div");
        healthBarFill.id = "playerHealthBarFill";
        healthBarFill.style.width = "100%";
        healthBarFill.style.height = "100%";
        healthBarFill.style.backgroundColor = "#4CAF50";
        healthBarFill.style.transition = "width 0.3s";
        
        healthBarContainer.appendChild(healthBarFill);
        document.body.appendChild(healthBarContainer);
        
        return healthBarFill;
    };
    
    const healthBarFill = createHealthBar();
    
    const updateHealthBar = () => {
        const ratio = Math.max(0, hero.currentHealth / hero.maxHealth);
        healthBarFill.style.width = `${ratio * 100}%`;
        
        if (ratio < 0.3) {
            healthBarFill.style.backgroundColor = "#FF0000";
        } else if (ratio < 0.6) {
            healthBarFill.style.backgroundColor = "#FFA500";
        } else {
            healthBarFill.style.backgroundColor = "#4CAF50";
        }
    };
    
    const takeDamage = (amount) => {
        const now = Date.now();
        if (now - hero.lastHitTime < hero.hitRecoveryTime || hero.isDead) return;
        
        hero.currentHealth -= amount;
        hero.lastHitTime = now;
        hero.isHit = true;
        
        updateHealthBar();
        hitSound.play();
        
        const redFilter = document.createElement("div");
        redFilter.style.position = "fixed";
        redFilter.style.top = "0";
        redFilter.style.left = "0";
        redFilter.style.width = "100%";
        redFilter.style.height = "100%";
        redFilter.style.backgroundColor = "rgba(255, 0, 0, 0.3)";
        redFilter.style.pointerEvents = "none";
        redFilter.style.transition = "opacity 0.5s";
        redFilter.style.zIndex = "1000";
        document.body.appendChild(redFilter);
        
        setTimeout(() => {
            redFilter.style.opacity = "0";
            setTimeout(() => {
                document.body.removeChild(redFilter);
            }, 500);
        }, 100);
        
        if (hero.currentHealth <= 0 && !hero.isDead) {
            hero.isDead = true;
            console.log("Le joueur est mort!");
        }
    };
    
    scene.onBeforeRenderObservable.add(() => {
        if (hero.isDead) return;
        
        const bullets = scene.meshes.filter(mesh => 
            mesh.name && mesh.name.startsWith("bullet") && !mesh.isDisposed && 
            !mesh.metadata?.fromPlayer && !mesh.metadata?.fromAlly && mesh.metadata?.fromEnemy
        );
        
        for (const bullet of bullets) {
            const dist = BABYLON.Vector3.Distance(
                bullet.absolutePosition,
                hitbox.absolutePosition
            );
            if (dist < 2.0) {
                takeDamage(hero.damagePerBullet);
                if (!bullet.isDisposed) bullet.dispose();
                break;
            }
        }
    });

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
        createBullet(scene, bulletStartPosition, direction, true, false, false);
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
            
            if (currentTime - lastShotTime > shootCooldown && (scene.metadata.shootingEnabled || false)) {
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
        takeDamage,
        get isShooting() {
            return isShooting;
        }
    };
};
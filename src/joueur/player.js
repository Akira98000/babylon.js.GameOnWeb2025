import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';
import { createMuzzleFlash } from '../effects/visualEffects';
import { createBullet } from '../armes/balles';
import { EnnemiIA } from '../ennemis/EnnemiIA';

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
    
    // Créer un hitbox plus grand pour le joueur pour faciliter la détection des balles
    const hitbox = BABYLON.MeshBuilder.CreateBox("playerHitbox", {
        width: 4.0,   // Élargi de 3.0 à 4.0
        height: 10.0, // Hauteur maintenue à 10.0
        depth: 4.0    // Profondeur élargie de 3.0 à 4.0
    }, scene);
    hitbox.parent = hero;
    hitbox.position = new BABYLON.Vector3(0, 1.0, 0);
    const hitboxMaterial = new BABYLON.StandardMaterial("playerHitboxMaterial", scene);
    hitboxMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
    hitboxMaterial.alpha = 0;
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
    const shootCooldown = 100;
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
        
        // Log pour déboguer
        console.log("takeDamage appelé avec:", amount);
        console.log("Santé actuelle:", hero.currentHealth);
        console.log("Temps écoulé depuis dernier hit:", now - hero.lastHitTime);
        
        // Période d'invincibilité plus courte pour les tests
        hero.hitRecoveryTime = 100; // Réduit de 200 à 100ms
        
        if (now - hero.lastHitTime < hero.hitRecoveryTime || hero.isDead) {
            console.log("Dégâts ignorés - période d'invincibilité ou mort");
            return;
        }
        
        // Appliquer les dégâts
        hero.currentHealth -= amount;
        hero.lastHitTime = now;
        hero.isHit = true;
        
        console.log("Santé après dégâts:", hero.currentHealth);
        
        // Mettre à jour la barre de vie
        updateHealthBar();
        
        // Jouer le son de dégât
        if (hitSound && hitSound.play) {
            hitSound.play();
        } else {
            console.error("Son de dégât non disponible");
        }
        
        const redFilter = document.createElement("div");
        redFilter.style.position = "fixed";
        redFilter.style.top = "0";
        redFilter.style.left = "0";
        redFilter.style.width = "100%";
        redFilter.style.height = "100%";
        redFilter.style.backgroundColor = "rgba(255, 0, 0, 0.5)"; 
        redFilter.style.pointerEvents = "none";
        redFilter.style.transition = "opacity 0.5s";
        redFilter.style.zIndex = "1000";
        document.body.appendChild(redFilter);
        
        if (camera) {
            const originalPosition = camera.position.clone();
            const randomShake = () => (Math.random() - 0.5) * 0.3;
            
            setTimeout(() => {
                camera.position.x += randomShake();
                camera.position.y += randomShake();
            }, 0);
            
            setTimeout(() => {
                camera.position.x += randomShake();
                camera.position.y += randomShake();
            }, 50);
            
            setTimeout(() => {
                camera.position.x = originalPosition.x;
                camera.position.y = originalPosition.y;
            }, 150);
        }
        
        setTimeout(() => {
            redFilter.style.opacity = "0";
            setTimeout(() => {
                if (document.body.contains(redFilter)) {
                    document.body.removeChild(redFilter);
                }
            }, 500);
        }, 100);
        
        if (hero.currentHealth <= 0 && !hero.isDead) {
            hero.isDead = true;
            console.log("%c LE JOUEUR EST MORT! ", "background:black; color:red; font-size:20px");
            
            // Afficher un message de mort
            const deathMessage = document.createElement("div");
            deathMessage.style.position = "fixed";
            deathMessage.style.top = "50%";
            deathMessage.style.left = "50%";
            deathMessage.style.transform = "translate(-50%, -50%)";
            deathMessage.style.color = "red";
            deathMessage.style.fontWeight = "bold";
            deathMessage.style.fontSize = "48px";
            deathMessage.style.textShadow = "0 0 10px black";
            deathMessage.style.zIndex = "1001";
            deathMessage.textContent = "VOUS ÊTES MORT!";
            document.body.appendChild(deathMessage);
            
            // Créer un élément pour le décompte
            const countdownElement = document.createElement("div");
            countdownElement.style.position = "fixed";
            countdownElement.style.top = "60%"; 
            countdownElement.style.left = "50%";
            countdownElement.style.transform = "translate(-50%, -50%)";
            countdownElement.style.color = "white";
            countdownElement.style.fontWeight = "bold";
            countdownElement.style.fontSize = "36px";
            countdownElement.style.textShadow = "0 0 10px black";
            countdownElement.style.zIndex = "1001";
            countdownElement.textContent = "Redémarrage dans 3...";
            document.body.appendChild(countdownElement);
            
            // Initialiser le compteur
            let countdown = 3;
            
            // Fonction pour mettre à jour le compteur
            const updateCountdown = () => {
                countdown--;
                if (countdown > 0) {
                    countdownElement.textContent = `Redémarrage dans ${countdown}...`;
                    setTimeout(updateCountdown, 1000);
                } else {
                    countdownElement.textContent = "Redémarrage...";
                    
                    // Redémarrer le niveau actuel
                    setTimeout(() => {
                        // Nettoyage des éléments UI
                        if (document.body.contains(deathMessage)) {
                            document.body.removeChild(deathMessage);
                        }
                        if (document.body.contains(countdownElement)) {
                            document.body.removeChild(countdownElement);
                        }
                        
                        // Réinitialiser le joueur
                        hero.isDead = false;
                        hero.currentHealth = hero.maxHealth;
                        updateHealthBar();
                        
                        // Redémarrer le niveau via le levelManager
                        if (scene.metadata && scene.metadata.levelManager) {
                            // Récupérer le niveau actuel
                            const currentLevel = scene.metadata.levelManager.currentLevel;
                            
                            // Vérifier s'il s'agit du niveau 5 pour utiliser les checkpoints
                            if (currentLevel === 5 && scene.metadata.level5) {
                                // Redémarrer le niveau 5 en gardant le checkpoint
                                scene.metadata.levelManager.goToLevel(currentLevel);
                            } else {
                                // Pour les autres niveaux, réinitialiser la position du joueur
                                hero.position = new BABYLON.Vector3(0, 0, 0);
                                
                                // Forcer la recréation d'une nouvelle instance du niveau pour réinitialiser complètement
                                // les ennemis et tous les éléments du niveau
                                if (scene.metadata.levelManager.levels[currentLevel]) {
                                    // Nettoyer d'abord tous les ennemis existants
                                    if (EnnemiIA && EnnemiIA.allEnemies) {
                                        const allEnemies = [...EnnemiIA.allEnemies];
                                        for (const enemy of allEnemies) {
                                            if (enemy && enemy.mesh) enemy.die();
                                        }
                                        EnnemiIA.allEnemies = [];
                                    }
                                    
                                    // Recréer une instance fraîche du niveau
                                    const Level = scene.metadata.levelManager.levels[currentLevel].constructor;
                                    scene.metadata.levelManager.levels[currentLevel] = new Level(scene);
                                }
                                
                                // Redémarrer le niveau actuel
                                scene.metadata.levelManager.goToLevel(currentLevel);
                            }
                        }
                    }, 1000);
                }
            };
            
            // Démarrer le décompte après 1 seconde
            setTimeout(updateCountdown, 1000);
        }
    };
    
    // Observable dédié pour les impacts de balles ennemies - indépendant du flag shootingEnabled
    scene.onBeforeRenderObservable.add(() => {
        if (hero.isDead) return;
        
        // Trouver toutes les balles dans la scène
        const bullets = scene.meshes.filter(mesh => 
            mesh.name && mesh.name.startsWith("bullet") && !mesh.isDisposed
        );
        
        // Log toutes les 60 frames environ (1 seconde à 60 FPS)
        if (bullets.length > 0 && Math.random() < 0.02) {
            console.log(`DEBUG: Total balles trouvées: ${bullets.length}`);
            for (const bullet of bullets) {
                console.log(`DEBUG: Balle ${bullet.name}, metadata:`, bullet.metadata);
            }
        }
        
        // Ne filtrer que les balles ennemies
        const enemyBullets = bullets.filter(bullet => 
            bullet.metadata && bullet.metadata.fromEnemy === true
        );
        
        // Log les balles ennemies
        if (enemyBullets.length > 0) {
            console.log(`DEBUG: Balles ennemies trouvées: ${enemyBullets.length}`);
        }
        
        if (enemyBullets.length > 0) {
            // Vérifier pour chaque balle ennemie
            for (const bullet of enemyBullets) {
                // Calculer la distance en ignorant partiellement la différence de hauteur (y)
                // Créer des positions modifiées pour le calcul de distance
                const bulletPos = bullet.absolutePosition.clone();
                const hitboxPos = hitbox.absolutePosition.clone();
                
                // Réduire l'importance de la composante Y dans le calcul de distance
                const heightDiff = Math.abs(bulletPos.y - hitboxPos.y);
                
                // Distance horizontale (plan XZ)
                bulletPos.y = 0;
                hitboxPos.y = 0;
                const horizontalDist = BABYLON.Vector3.Distance(bulletPos, hitboxPos);
                
                // Distance combinée avec facteur de hauteur réduit
                const dist = horizontalDist + (heightDiff * 0.5);
                
                // Log de débogage pour voir les distances
                if (horizontalDist < 10) {
                    console.log("Balle proche - Distance horizontale:", horizontalDist.toFixed(2), 
                        "Différence hauteur:", heightDiff.toFixed(2), 
                        "Distance combinée:", dist.toFixed(2),
                        "Metadata:", bullet.metadata);
                }
                
                // Augmenter TRÈS SIGNIFICATIVEMENT la zone de détection et appliquer des dégâts si touché
                // Critères beaucoup plus permissifs pour faciliter les hits
                if (horizontalDist < 10.0 && heightDiff < 6.0) {
                    // Ajouter un log très visible quand on touche le joueur
                    console.log("%c JOUEUR TOUCHÉ PAR UNE BALLE ENNEMIE! ", "background:red; color:white; font-size:20px");
                    console.log("Distance horizontale:", horizontalDist.toFixed(2), "Diff hauteur:", heightDiff.toFixed(2));
                    
                    // Appliquer les dégâts
                    takeDamage(hero.damagePerBullet);
                    
                    // Ajouter un effet visuel d'impact plus important
                    const impactPoint = bullet.absolutePosition.clone();
                    _createImpactEffect(impactPoint);
                    
                    // Détruire la balle
                    if (!bullet.isDisposed) bullet.dispose();
                    
                    // Afficher une alerte temporaire au centre de l'écran
                    _showHitFeedback();
                    
                    break;
                }
            }
        }
    });
    
    // Fonction pour créer un effet visuel d'impact
    const _createImpactEffect = (position) => {
        // Particules plus importantes et plus nombreuses
        const impactParticles = new BABYLON.ParticleSystem("impactParticles", 60, scene);
        impactParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
        impactParticles.emitter = position;
        impactParticles.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        impactParticles.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
        impactParticles.color1 = new BABYLON.Color4(1, 0.5, 0, 1.0);
        impactParticles.color2 = new BABYLON.Color4(1, 0, 0, 1.0);
        impactParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);
        impactParticles.minSize = 0.2;
        impactParticles.maxSize = 0.5;
        impactParticles.minLifeTime = 0.2;
        impactParticles.maxLifeTime = 0.5;
        impactParticles.emitRate = 200;
        impactParticles.gravity = new BABYLON.Vector3(0, 0, 0);
        impactParticles.direction1 = new BABYLON.Vector3(-1, -1, -1);
        impactParticles.direction2 = new BABYLON.Vector3(1, 1, 1);
        impactParticles.minEmitPower = 1.5;
        impactParticles.maxEmitPower = 4;
        impactParticles.updateSpeed = 0.01;
        
        // Ajouter une lumière temporaire à l'impact
        const impactLight = new BABYLON.PointLight("impactLight", position, scene);
        impactLight.diffuse = new BABYLON.Color3(1, 0.3, 0);
        impactLight.intensity = 1.5;
        impactLight.range = 8;
        
        impactParticles.start();
        
        setTimeout(() => {
            impactParticles.stop();
            setTimeout(() => {
                impactParticles.dispose();
                impactLight.dispose();
            }, 500);
        }, 150);
    };
    
    // Fonction pour afficher un feedback visuel de hit au centre de l'écran
    const _showHitFeedback = () => {
        // Créer un élément de feedback si nécessaire
        let hitFeedback = document.getElementById("hitFeedback");
        if (!hitFeedback) {
            hitFeedback = document.createElement("div");
            hitFeedback.id = "hitFeedback";
            hitFeedback.style.position = "fixed";
            hitFeedback.style.top = "50%";
            hitFeedback.style.left = "50%";
            hitFeedback.style.transform = "translate(-50%, -50%)";
            hitFeedback.style.color = "red";
            hitFeedback.style.fontWeight = "bold";
            hitFeedback.style.fontSize = "32px";
            hitFeedback.style.textShadow = "0 0 10px rgba(255,0,0,0.7)";
            hitFeedback.style.zIndex = "1000";
            hitFeedback.style.pointerEvents = "none";
            hitFeedback.style.transition = "opacity 0.3s";
            hitFeedback.style.opacity = "0";
            document.body.appendChild(hitFeedback);
        }
        
        // Afficher le message
        hitFeedback.textContent = "TOUCHÉ!";
        hitFeedback.style.opacity = "1";
        
        // Faire disparaître le message après un délai
        setTimeout(() => {
            hitFeedback.style.opacity = "0";
        }, 400);
    };

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
        // S'assurer que la position de départ est légèrement au-dessus du sol pour éviter les collisions
        const adjustedPosition = position.clone();
        if (adjustedPosition.y < 0.5) {
            adjustedPosition.y = 0.5; // Toujours positionner le tir à au moins 0.5 unité du sol
        }
        
        // Ajuster le décalage du tir pour qu'il parte de la position de la caméra
        const cameraPosition = camera.position.clone();
        const bulletStartPosition = cameraPosition.clone();
        
        // Ajouter un petit décalage vers l'avant pour éviter les collisions avec le joueur
        bulletStartPosition.addInPlace(direction.scale(0.5));
        
        // Jouer le son de tir avec un léger pitch aléatoire pour plus de variété
        shotgunSound.setPlaybackRate(0.9 + Math.random() * 0.2);
        shotgunSound.play();
        
        // Créer la balle avec la direction correcte
        const bullet = createBullet(scene, bulletStartPosition, direction, true, false, false);
        
        // Ajouter un effet de lumière plus intense au point de départ
        const muzzleLight = new BABYLON.PointLight("muzzleLight", bulletStartPosition, scene);
        muzzleLight.diffuse = new BABYLON.Color3(0.5, 0.5, 1);
        muzzleLight.intensity = 1.5; // Intensité augmentée
        muzzleLight.range = 4; // Portée augmentée
        
        // Effet de caméra: petit recul
        const kickbackAmount = 0.02;
        camera.position.subtractInPlace(direction.scale(kickbackAmount));
        setTimeout(() => {
            camera.position.addInPlace(direction.scale(kickbackAmount));
        }, 50);
        
        // Disparition de la lumière
        setTimeout(() => {
            muzzleLight.dispose();
        }, 100);
        
        // Retourner la balle créée pour d'éventuelles manipulations futures
        return bullet;
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
            
            // Tirer immédiatement au premier clic, sans vérifier shootingEnabled
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

    // Ajouter un observateur pour le tir en rafale
    scene.onBeforeRenderObservable.add(() => {
        // Vérifier si le joueur est en train de tirer et si le cooldown est écoulé, sans vérifier shootingEnabled
        if (isShooting && !hero.isDead) {
            const currentTime = Date.now();
            if (currentTime - lastShotTime > shootCooldown) {
                lastShotTime = currentTime;
                
                // Créer la direction et la position de tir
                const shootDirection = camera.getForwardRay().direction.normalize();
                const shootPosition = hero.position.clone();
                
                // Exécuter le tir
                if (animationsRef) {
                    playShootAnimation(animationsRef, isMoving, shootPosition, shootDirection);
                } else {
                    executeShot(shootPosition, shootDirection);
                }
                
                // Faire clignoter le viseur à chaque tir
                flashCrosshair();
            }
        }
    });

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
        updateHealthBar,
        get isShooting() {
            return isShooting;
        }
    };
};
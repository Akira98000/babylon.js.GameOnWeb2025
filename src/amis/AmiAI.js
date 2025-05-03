import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { createBullet } from "../armes/balles";
import { mapPartsData } from "../scene/mapGestion";
import { EnnemiIA } from "../ennemis/EnnemiIA";

export class AmiAI {
    static allAllies = [];

    constructor(scene, position) {
        this.scene = scene;
        this.position = position;

        this.maxSpeed = 0.15;
        this.maxForce = 0.05;
        this.detectionDistance = 50;
        this.shootingDistance = 20;
        this.keepDistance = 5;
        this.arriveRadius = 3;
        this.maxEnemyDistance = 8;
        this.followPlayerDistance = 5;

        // Mode de suivi du joueur
        this.followPlayer = false;
        this.player = null;

        // Wander
        this.wanderRadius = 2;
        this.wanderDistance = 4;
        this.wanderAngle = 0;
        this.wanderChange = 0.3;

        // Forces de comportement
        this.separationWeight = 2.0;
        this.pursuitWeight = 1.0;
        this.wanderWeight = 0.5;
        this.followWeight = 1.5; // Poids pour suivre le joueur

        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.lastShootTime = 0;
        this.shootCooldown = 1000;

        // Assignation d'une position préférée
        this.preferredOffset = (AmiAI.allAllies.length * (2 * Math.PI / 3)) % (2 * Math.PI);
        
        // Vie
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.isDead = false;
        this.isHit = false;
        this.hitRecoveryTime = 200;
        this.lastHitTime = 0;
        this.damagePerBullet = 34;

        // Animation
        this.animations = null;
        this.currentAnimation = null;
        this.isRunning = false;
        this.rotationSpeed = 0.1;
        this.targetRotation = 0;
        this.smoothingFactor = 0.2;

        // Offset unique pour chaque ami
        this.offsetAngle = Math.random() * Math.PI * 2;
        
        // Détection de blocage
        this.lastPositions = [];
        this.stuckCheckInterval = 40; // Vérifier la position tous les 40 frames (plus réactif que les ennemis)
        this.stuckThreshold = 0.25; // Distance minimale de mouvement
        this.frameCounter = 0;
        this.stuckCounter = 0;
        this.teleportAfterStuckCount = 2; // Nombre de vérifications avant de téléporter (plus réactif)

        // Ajouter à la liste statique
        AmiAI.allAllies.push(this);

        BABYLON.Engine.UseUBO = false;
        this.loadAmi();
    }

    async loadAmi() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "/personnage/",
                "banana.glb",
                this.scene
            );

            this.root = new BABYLON.TransformNode("amiRoot", this.scene);
            this.root.position = this.position;

            this.mesh = result.meshes[0];
            this.mesh.parent = this.root;
            this.mesh.position = BABYLON.Vector3.Zero();
            this.mesh.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);

            // Changer la couleur pour différencier des ennemis
            const material = new BABYLON.StandardMaterial("amiMaterial", this.scene);
            material.diffuseColor = new BABYLON.Color3(0, 0.7, 1); // Bleu clair
            material.specularColor = new BABYLON.Color3(0.5, 0.6, 1);
            material.emissiveColor = new BABYLON.Color3(0, 0.3, 0.5);
            this.mesh.material = material;

            this.hitbox = BABYLON.MeshBuilder.CreateBox("hitbox", {
                width: 1.5,
                height: 2,
                depth: 1.5
            }, this.scene);
            this.hitbox.parent = this.root;
            this.hitbox.position.y = 1;
            const hitboxMaterial = new BABYLON.StandardMaterial("hitboxMaterial", this.scene);
            hitboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 1);
            hitboxMaterial.alpha = 0;
            this.hitbox.material = hitboxMaterial;
            this.hitbox.isPickable = true;
            this.hitbox.isAmi = true;

            this.createHealthBar();

            if (result.animationGroups) {
                this.animations = {
                    run: result.animationGroups.find(a => a.name.toLowerCase().includes("pistolrun")),
                    idle: result.animationGroups.find(a => a.name.toLowerCase().includes("idle")),
                    shoot: result.animationGroups.find(a => a.name.toLowerCase().includes("shoot"))
                };

                if (this.animations.run) {
                    this.animations.run.start(true);
                    this.currentAnimation = "pistolrun";
                }
            }

            this.scene.onBeforeRenderObservable.add(() => {
                if (this.isDead || !this.hitbox) return;

                const bullets = this.scene.meshes.filter(mesh =>
                    mesh.name && mesh.name.startsWith("bullet") && !mesh.isDisposed && !mesh.metadata?.fromPlayer && !mesh.metadata?.fromAlly && mesh.metadata?.fromEnemy
                );

                for (const bullet of bullets) {
                    const dist = BABYLON.Vector3.Distance(
                        bullet.absolutePosition,
                        this.hitbox.absolutePosition
                    );
                    if (dist < 1.5) {
                        this.takeDamage(this.damagePerBullet);
                        if (!bullet.isDisposed) bullet.dispose();
                        break;
                    }
                }
            });

        } catch (error) {
            console.error("Erreur lors du chargement de l'ami:", error);
        }
    }

    createHealthBar() {
        const healthBarWidth = 0.5;
        const healthBarHeight = 0.1;

        this.healthBar = BABYLON.MeshBuilder.CreatePlane("healthBar", { width: healthBarWidth, height: healthBarHeight }, this.scene);
        const healthMaterial = new BABYLON.StandardMaterial("healthBarMaterial", this.scene);
        healthMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);
        healthMaterial.emissiveColor = new BABYLON.Color3(0, 1, 0);
        healthMaterial.backFaceCulling = false;
        this.healthBar.material = healthMaterial;

        this.healthBar.parent = this.root;
        this.healthBar.position.y = 2.0;
        this.healthBar.position.z = 0.01;
        this.healthBar.rotation.y = Math.PI;

        this.healthBarBackground = this.healthBar.clone("healthBarBg");
        this.healthBarBackground.parent = this.root;
        this.healthBarBackground.position.y = 2.0;
        this.healthBarBackground.position.z = -0.01;
        this.healthBarBackground.scaling.x = 1;
        const bgMaterial = new BABYLON.StandardMaterial("healthBarBgMaterial", this.scene);
        bgMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        bgMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        bgMaterial.backFaceCulling = false;
        this.healthBarBackground.material = bgMaterial;
    }

    takeDamage(amount) {
        const now = Date.now();
        if (now - this.lastHitTime < this.hitRecoveryTime || this.isDead) return;

        this.currentHealth -= amount;
        this.lastHitTime = now;
        this.isHit = true;

        const ratio = Math.max(0, this.currentHealth / this.maxHealth);
        if (this.healthBar) {
            this.healthBar.scaling.x = ratio;
            this.healthBar.position.x = 0.5 * (1 - ratio) * this.healthBarBackground.scaling.x;
        }

        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            setTimeout(() => {
                if (this.mesh && this.mesh.material) {
                    this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0.3, 0.5);
                }
            }, this.hitRecoveryTime);
        }

        if (this.currentHealth <= 0 && !this.isDead) this.die();
    }

    die() {
        this.isDead = true;
        const index = AmiAI.allAllies.indexOf(this);
        if (index > -1) {
            AmiAI.allAllies.splice(index, 1);
        }
        
        if (this.animations) Object.values(this.animations).forEach(a => a?.stop());

        const fadeOut = new BABYLON.Animation(
            "fadeOut",
            "visibility",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        fadeOut.setKeys([
            { frame: 0, value: 1 },
            { frame: 30, value: 0 }
        ]);

        this.mesh.animations = [fadeOut];
        this.scene.beginAnimation(this.mesh, 0, 30, false, 1, () => {
            [this.healthBar, this.healthBarBackground, this.hitbox, this.mesh, this.root]
              .forEach(obj => obj && obj.dispose());
        });

        document.dispatchEvent(new CustomEvent("allyKilled", { detail: { ally: this } }));
    }

    shoot(target) {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;

        // S'assurer que la cible est valide
        if (!target) {
            console.warn("Cible invalide pour le tir : target est null");
            return;
        }

        if (!target.root || !target.root.position) {
            console.warn("Cible invalide pour le tir : target.root ou target.root.position est null");
            return;
        }

        // Amélioration du calcul de direction pour meilleure précision
        const dir = target.root.position.subtract(this.root.position);
        dir.y = 0; // Assurer que la visée est horizontale pour plus de précision
        
        // Prédiction de la position de l'ennemi en fonction de sa vitesse
        if (target.velocity && target.velocity.length() > 0.1) {
            // Calculer le temps que prendra la balle pour atteindre la cible
            const distance = dir.length();
            const bulletSpeed = 40; // Doit correspondre à la vitesse dans createBullet
            const timeToTarget = distance / bulletSpeed;
            
            // Prédire où sera la cible
            const predictedPosition = target.root.position.add(
                target.velocity.scale(timeToTarget * 0.7) // Facteur de correction (0.7) pour éviter la surcompensation
            );
            
            // Recalculer la direction avec la position prédite
            dir.copyFrom(predictedPosition.subtract(this.root.position));
            dir.y = 0; // Maintenir la visée horizontale
        }
        
        // Mise à jour de la rotation
        this.targetRotation = Math.atan2(dir.x, dir.z) + Math.PI;
        this.root.rotation.y = this.targetRotation;

        if (this.animations && this.animations.shoot) {
            this.animations.shoot.start(false);
            this.animations.shoot.onAnimationEndObservable.addOnce(() => {
                if (this.animations.run && this.isRunning) this.animations.run.start(true);
                else if (this.animations.idle) this.animations.idle.start(true);
            });
        }

        // Créer la direction de tir avec une légère élévation pour éviter les obstacles
        const shootDir = dir.normalize();
        
        // Position de départ de la balle (légèrement plus élevée pour éviter les obstacles)
        const origin = this.root.position.clone();
        origin.y += 1.6; // Augmenté de 1.5 à 1.6

        // Créer la balle avec les paramètres appropriés
        createBullet(this.scene, origin, shootDir, false, false, true);

        this.lastShootTime = now;
    }

    separate() {
        const desiredSeparation = 4.0;
        let steer = new BABYLON.Vector3(0, 0, 0);
        let count = 0;

        for (const other of AmiAI.allAllies) {
            if (other === this || other.isDead || !other.root || !other.root.position) continue;

            const d = BABYLON.Vector3.Distance(this.root.position, other.root.position);
            if (d > 0 && d < desiredSeparation) {
                const diff = this.root.position
                    .subtract(other.root.position)
                    .normalize()
                    .scale(1.0 / Math.pow(d, 2));
                steer.addInPlace(diff);
                count++;
            }
        }

        if (count > 0) {
            steer.scaleInPlace(1.0 / count);
            steer.normalize().scaleInPlace(this.maxSpeed);
            steer.subtractInPlace(this.velocity);
            steer.normalize().scaleInPlace(this.maxForce * 2);
        }
        return steer;
    }

    findNearestEnemy() {
        let nearestEnemy = null;
        let minDistance = Infinity;

        for (const enemy of EnnemiIA.allEnemies) {
            if (enemy.isDead || !enemy.root || !enemy.root.position) continue;

            const distance = BABYLON.Vector3.Distance(this.root.position, enemy.root.position);
            
            // Vérifier s'il y a un obstacle entre l'allié et l'ennemi
            const direction = enemy.root.position.subtract(this.root.position).normalize();
            const ray = new BABYLON.Ray(
                new BABYLON.Vector3(
                    this.root.position.x,
                    this.root.position.y + 1.0, // Ajuster la hauteur pour éviter les collisions avec le sol
                    this.root.position.z
                ),
                direction,
                distance
            );
            
            let obstacleDetected = false;
            
            if (mapPartsData && mapPartsData.length > 0) {
                for (const mapPart of mapPartsData) {
                    if (!mapPart.mainMesh) continue;
                    
                    const collisionMeshes = mapPart.mainMesh.getChildMeshes(false).filter(mesh => 
                        mesh.checkCollisions
                    );
                    
                    for (const mesh of collisionMeshes) {
                        const hit = ray.intersectsMesh(mesh);
                        if (hit.hit) {
                            obstacleDetected = true;
                            break;
                        }
                    }
                    if (obstacleDetected) break;
                }
            }
            
            // Seulement considérer cet ennemi s'il n'y a pas d'obstacle entre l'allié et l'ennemi
            if (!obstacleDetected && distance < minDistance) {
                minDistance = distance;
                nearestEnemy = enemy;
            }
        }

        return nearestEnemy;
    }

    seek(target) {
        const desired = target.subtract(this.root.position);
        const dist = desired.length();
        
        if (dist < 0.1) return new BABYLON.Vector3(0, 0, 0);
        
        desired.normalize();
        
        let speed;
        if (dist < this.keepDistance) {
            speed = this.maxSpeed * (dist / this.keepDistance);
        } else if (dist < this.arriveRadius) {
            speed = this.maxSpeed * (dist / this.arriveRadius);
        } else {
            speed = this.maxSpeed;
        }
        
        desired.scaleInPlace(speed);
        const steer = desired.subtract(this.velocity);
        steer.y = 0;
        
        if (steer.length() > this.maxForce) {
            steer.normalize().scaleInPlace(this.maxForce);
        }
        
        return steer;
    }

    wander() {
        const circleCenter = this.velocity.clone();
        if (circleCenter.length() < 0.01) {
            circleCenter.x = Math.cos(this.wanderAngle);
            circleCenter.z = Math.sin(this.wanderAngle);
        }
        circleCenter.normalize().scaleInPlace(this.wanderDistance);
        this.wanderAngle += (Math.random() * 2 - 1) * this.wanderChange;
        const displacement = new BABYLON.Vector3(
            Math.cos(this.wanderAngle) * this.wanderRadius,
            0,
            Math.sin(this.wanderAngle) * this.wanderRadius
        );
        const wanderForce = circleCenter.add(displacement);
        wanderForce.y = 0;
        if (wanderForce.length() > this.maxForce) {
            wanderForce.normalize().scaleInPlace(this.maxForce);
        }
        return wanderForce;
    }

    update() {
        if (!this.root || this.isDead) return;
        
        const nearestEnemy = this.findNearestEnemy();
        let force = new BABYLON.Vector3(0, 0, 0);
        let shouldTrack = false;
        let isFollowingPlayer = false;

        // Mode de suivi du joueur (priorité plus basse que l'attaque des ennemis)
        if (this.followPlayer && this.player) {
            const distToPlayer = BABYLON.Vector3.Distance(this.root.position, this.player.position);
            
            // Si aucun ennemi à proximité ou l'ennemi est loin
            if (!nearestEnemy || (nearestEnemy && BABYLON.Vector3.Distance(this.root.position, nearestEnemy.root.position) > this.detectionDistance)) {
                isFollowingPlayer = true;
                
                // Si trop loin du joueur, le suivre
                if (distToPlayer > this.followPlayerDistance) {
                    const followForce = this.seek(this.player.position);
                    force.addInPlace(followForce.scale(this.followWeight));
                    this.isRunning = true;
                    shouldTrack = true;
                    this.currentAnimation = "run";
                } 
                // Si suffisamment proche, rester à cette distance
                else if (distToPlayer < this.followPlayerDistance * 0.5) {
                    const awayFromPlayer = this.root.position.subtract(this.player.position).normalize();
                    force.addInPlace(awayFromPlayer.scale(this.maxForce));
                    this.isRunning = true;
                }
                else {
                    // Comportement de vagabondage autour du joueur
                    const wanderForce = this.wander();
                    force.addInPlace(wanderForce.scale(this.wanderWeight * 0.3));
                }
                
                // Dans tous les cas, ajouter une force de séparation des autres alliés
                const separationForce = this.separate();
                force.addInPlace(separationForce.scale(this.separationWeight));
            }
        }

        // Si on ne suit pas déjà le joueur, vérifier les ennemis
        if (!isFollowingPlayer && nearestEnemy && !nearestEnemy.isDead) {
            const distToEnemy = BABYLON.Vector3.Distance(this.root.position, nearestEnemy.root.position);

            if (distToEnemy < this.detectionDistance) {
                // Si l'allié est trop proche de l'ennemi, on s'éloigne
                if (distToEnemy < this.maxEnemyDistance) {
                    const awayFromEnemy = this.root.position.subtract(nearestEnemy.root.position).normalize();
                    force.addInPlace(awayFromEnemy.scale(this.maxForce * 2));
                } else {
                    const pursuitForce = this.seek(nearestEnemy.root.position);
                    force.addInPlace(pursuitForce.scale(this.pursuitWeight));
                }

                const separationForce = this.separate();
                force.addInPlace(separationForce.scale(this.separationWeight));

                this.isRunning = true;
                shouldTrack = true;
                this.currentAnimation = "run";

                // Tirer si l'ennemi est à portée
                if (distToEnemy < this.shootingDistance) {
                    // Mettre à jour la rotation immédiatement pour améliorer le ciblage
                    const d = nearestEnemy.root.position.subtract(this.root.position);
                    d.y = 0; // Assurer une visée horizontale
                    this.targetRotation = Math.atan2(d.x, d.z) + Math.PI;
                    this.root.rotation.y = this.targetRotation;
                    
                    this.shoot(nearestEnemy);
                }
            } else {
                // Si en mode suivi et pas d'ennemi à proximité, revenir vers le joueur
                if (this.followPlayer && this.player) {
                    const distToPlayer = BABYLON.Vector3.Distance(this.root.position, this.player.position);
                    if (distToPlayer > this.followPlayerDistance * 1.5) {
                        const followForce = this.seek(this.player.position);
                        force.addInPlace(followForce.scale(this.followWeight));
                        this.isRunning = true;
                        shouldTrack = true;
                    } else {
                        // Vagabonder autour du joueur
                        const wanderForce = this.wander();
                        force.addInPlace(wanderForce.scale(this.wanderWeight));
                        this.isRunning = false;
                        if (this.animations.idle && this.currentAnimation !== "idle") {
                            this.animations.idle.start(true);
                            this.currentAnimation = "idle";
                        }
                    }
                } else {
                    // Comportement normal quand pas d'ennemi et pas en mode suivi
                    const wanderForce = this.wander();
                    force.addInPlace(wanderForce.scale(this.wanderWeight));
                    this.isRunning = false;
                    if (this.animations.idle && this.currentAnimation !== "idle") {
                        this.animations.idle.start(true);
                        this.currentAnimation = "idle";
                    }
                }
            }
        }

        force.scaleInPlace(this.smoothingFactor);
        this.velocity.scaleInPlace(1 - this.smoothingFactor);
        this.velocity.addInPlace(force);

        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().scaleInPlace(this.maxSpeed);
        }

        this.velocity.y = 0;
        
        // Stocker la position actuelle avant déplacement pour vérifier les collisions
        const previousPosition = this.root.position.clone();
        
        // Calculer la nouvelle position
        const newPosition = previousPosition.add(this.velocity);
        
        // Vérifier les collisions avec les éléments de la map
        let collisionDetected = false;
        const collisionMargin = 0.75;
        const allyHeight = 2.0;
        
        const raycastDirection = this.velocity.clone().normalize();
        const rayLength = this.velocity.length() + collisionMargin;
        
        const ray = new BABYLON.Ray(
            new BABYLON.Vector3(
                this.root.position.x,
                this.root.position.y + allyHeight / 2, 
                this.root.position.z
            ),
            raycastDirection,
            rayLength
        );
        
        if (mapPartsData && mapPartsData.length > 0) {
            for (const mapPart of mapPartsData) {
                if (!mapPart.mainMesh) continue;
                
                const collisionMeshes = mapPart.mainMesh.getChildMeshes(false).filter(mesh => 
                    mesh.checkCollisions
                );
                
                for (const mesh of collisionMeshes) {
                    const hit = ray.intersectsMesh(mesh);
                    if (hit.hit) {
                        collisionDetected = true;
                        break;
                    }
                }
                
                if (collisionDetected) break;
            }
        }
        
        if (!collisionDetected) {
            this.root.position = newPosition;
        } else {
            const slideX = new BABYLON.Vector3(this.velocity.x, 0, 0);
            const slideZ = new BABYLON.Vector3(0, 0, this.velocity.z);
            
            const rayX = new BABYLON.Ray(
                new BABYLON.Vector3(
                    this.root.position.x,
                    this.root.position.y + allyHeight / 2, 
                    this.root.position.z
                ),
                slideX.normalize(),
                slideX.length() + collisionMargin
            );
            
            let collisionX = false;
            for (const mapPart of mapPartsData) {
                if (!mapPart.mainMesh) continue;
                const collisionMeshes = mapPart.mainMesh.getChildMeshes(false).filter(mesh => 
                    mesh.checkCollisions
                );
                
                for (const mesh of collisionMeshes) {
                    const hit = rayX.intersectsMesh(mesh);
                    if (hit.hit) {
                        collisionX = true;
                        break;
                    }
                }
                if (collisionX) break;
            }
            
            const rayZ = new BABYLON.Ray(
                new BABYLON.Vector3(
                    this.root.position.x,
                    this.root.position.y + allyHeight / 2, 
                    this.root.position.z
                ),
                slideZ.normalize(),
                slideZ.length() + collisionMargin
            );
            
            let collisionZ = false;
            for (const mapPart of mapPartsData) {
                if (!mapPart.mainMesh) continue;
                const collisionMeshes = mapPart.mainMesh.getChildMeshes(false).filter(mesh => 
                    mesh.checkCollisions
                );
                
                for (const mesh of collisionMeshes) {
                    const hit = rayZ.intersectsMesh(mesh);
                    if (hit.hit) {
                        collisionZ = true;
                        break;
                    }
                }
                if (collisionZ) break;
            }
            
            if (!collisionX) {
                this.root.position.x += slideX.x;
            }
            
            if (!collisionZ) {
                this.root.position.z += slideZ.z;
            }
        }
        
        this.root.position.y = this.position.y;

        // Mise à jour de la rotation
        if (shouldTrack && nearestEnemy) {
            const d = nearestEnemy.root.position.subtract(this.root.position);
            d.y = 0; // Assurer une visée horizontale
            this.targetRotation = Math.atan2(d.x, d.z) + Math.PI; 
            
            // Appliquer une rotation plus directe pour un meilleur ciblage
            const rotDiff = this.targetRotation - this.root.rotation.y;
            let normalizedRotDiff = rotDiff;
            while (normalizedRotDiff > Math.PI) normalizedRotDiff -= 2 * Math.PI;
            while (normalizedRotDiff < -Math.PI) normalizedRotDiff += 2 * Math.PI;
            this.root.rotation.y += normalizedRotDiff * (this.rotationSpeed * 1.5); // Rotation plus rapide
        } else if (this.velocity.length() > 0.01) {
            this.targetRotation = Math.atan2(this.velocity.x, this.velocity.z) + Math.PI;
        }

        if (this.animations) {
            if (this.isRunning && this.currentAnimation !== "pistolrun") {
                this.animations.run?.start(true);
                this.currentAnimation = "pistolrun";
            }
        }
    }
} 
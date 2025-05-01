import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { createBullet } from "../armes/balles";
import { mapPartsData } from "../scene/mapGestion";
import { AmiAI } from "../amis/AmiAI";

export class EnnemiIA {
    static allEnemies = [];

    constructor(scene, position, player) {
        this.scene = scene;
        this.player = player;
        this.position = position;
        this.quartier = -1;
        this.maxSpeed = 0.15;
        this.maxForce = 0.05;
        this.detectionDistance = 40;
        this.shootingDistance = 15;
        this.keepDistance = 5;
        this.arriveRadius = 3;
        this.maxAllyDistance = 8;
        this.wanderRadius = 2;
        this.wanderDistance = 4;
        this.wanderAngle = 0;
        this.wanderChange = 0.3;
        this.separationWeight = 2.0;
        this.pursuitWeight = 1.0;
        this.wanderWeight = 0.5;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.lastShootTime = 0;
        this.shootCooldown = 2000;
        this.preferredOffset = (EnnemiIA.allEnemies.length * (2 * Math.PI / 3)) % (2 * Math.PI);
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.currentHealth = this.health;
        this.isDead = false;
        this.isHit = false;
        this.hitRecoveryTime = 200;
        this.lastHitTime = 0;
        this.damagePerBullet = 34;
        this.animations = null;
        this.currentAnimation = null;
        this.isRunning = false;
        this.rotationSpeed = 0.1;
        this.targetRotation = 0;
        this.smoothingFactor = 0.2;
        this.offsetAngle = Math.random() * Math.PI * 2;
        this.lastPositions = [];
        this.stuckCheckInterval = 50; 
        this.stuckThreshold = 0.3; 
        this.frameCounter = 0;
        this.stuckCounter = 0;
        this.teleportAfterStuckCount = 3; 
        EnnemiIA.allEnemies.push(this);
        BABYLON.Engine.UseUBO = false;
        this.loadEnnemi();
    }

    async loadEnnemi() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "",
                "/personnage/",
                "pizza.glb",
                this.scene
            );

            this.root = new BABYLON.TransformNode("ennemiRoot", this.scene);
            this.root.position = this.position;

            this.mesh = result.meshes[0];
            this.mesh.parent = this.root;
            this.mesh.position = BABYLON.Vector3.Zero();
            this.mesh.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);

            this.hitbox = BABYLON.MeshBuilder.CreateBox("hitbox", {
                width: 1.5,
                height: 2,
                depth: 1.5
            }, this.scene);
            this.hitbox.parent = this.root;
            this.hitbox.position.y = 1;
            const hitboxMaterial = new BABYLON.StandardMaterial("hitboxMaterial", this.scene);
            hitboxMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
            hitboxMaterial.alpha = 0.3;
            this.hitbox.material = hitboxMaterial;
            this.hitbox.isPickable = true;
            this.hitbox.isEnnemi = true;
            
            this.createHealthBar();

            if (result.animationGroups) {
                this.animations = {
                    run: result.animationGroups.find(a => a.name.toLowerCase().includes("run")),
                    idle: result.animationGroups.find(a => a.name.toLowerCase().includes("idle")),
                    shoot: result.animationGroups.find(a => a.name.toLowerCase().includes("shoot"))
                };

                if (this.animations.run) {
                    this.animations.run.start(true);
                    this.currentAnimation = "run";
                }
            }

            this.scene.onBeforeRenderObservable.add(() => {
                if (this.isDead || !this.hitbox) return;

                const bullets = this.scene.meshes.filter(mesh =>
                    mesh.name && mesh.name.startsWith("bullet") && !mesh.isDisposed && (mesh.metadata?.fromPlayer || mesh.metadata?.fromAlly)
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
            console.error("Erreur lors du chargement de l'ennemi:", error);
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
                    this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                }
            }, this.hitRecoveryTime);
        }

        if (this.currentHealth <= 0 && !this.isDead) this.die();
    }

    die() {
        this.isDead = true;
        // Retirer l'ennemi de la liste statique
        const index = EnnemiIA.allEnemies.indexOf(this);
        if (index > -1) {
            EnnemiIA.allEnemies.splice(index, 1);
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

        document.dispatchEvent(new CustomEvent("enemyKilled", { detail: { enemy: this } }));
    }

    findNearestAlly() {
        let nearestAlly = null;
        let minDistance = Infinity;

        if (AmiAI.allAllies.length === 0) return null;

        for (const ally of AmiAI.allAllies) {
            if (ally.isDead || !ally.root || !ally.root.position) continue;

            const distance = BABYLON.Vector3.Distance(this.root.position, ally.root.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestAlly = ally;
            }
        }

        return { ally: nearestAlly, distance: minDistance };
    }

    shoot(target) {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;

        let dir;
        if (target === this.player) {
            dir = this.player.position.subtract(this.root.position);
        } else {
            dir = target.root.position.subtract(this.root.position);
        }
        
        this.targetRotation = Math.atan2(dir.x, dir.z);
        this.root.rotation.y = this.targetRotation;

        if (this.animations.shoot) {
            this.animations.shoot.start(false);
            this.animations.shoot.onAnimationEndObservable.addOnce(() => {
                if (this.animations.run && this.isRunning) this.animations.run.start(true);
                else if (this.animations.idle) this.animations.idle.start(true);
            });
        }

        const shootDir = dir.normalize();
        const origin = this.root.position.clone();
        origin.y += 1.5;
        createBullet(this.scene, origin, shootDir, false, true, false);
        this.lastShootTime = now;
    }

    separate() {
        const desiredSeparation = 4.0;
        let steer = new BABYLON.Vector3(0, 0, 0);
        let count = 0;

        for (const other of EnnemiIA.allEnemies) {
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

    getPreferredPosition() {
        const angle = this.preferredOffset;
        const radius = this.keepDistance;
        const offset = new BABYLON.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
        return this.player.position.add(offset);
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
        if (!this.root || !this.player || this.isDead) return;

        // Vérifier si l'ennemi est bloqué
        this._checkIfStuck();

        const distToPlayer = BABYLON.Vector3.Distance(this.root.position, this.player.position);
        const nearestAllyInfo = this.findNearestAlly();
        
        let force = new BABYLON.Vector3(0, 0, 0);
        let shouldTrack = false;
        let targetToTrack = null;

        // Comportement standard pour tous les ennemis (plus de distinction boss/non-boss)
        // Vérifier si un allié est plus proche que le joueur et à portée de détection
        let shouldPursueAlly = false;
        if (nearestAllyInfo && nearestAllyInfo.ally && nearestAllyInfo.distance < distToPlayer && 
            nearestAllyInfo.distance < this.detectionDistance) {
            shouldPursueAlly = true;
            targetToTrack = nearestAllyInfo.ally;

            // Si l'ennemi est trop proche de l'allié, on s'éloigne
            if (nearestAllyInfo.distance < this.maxAllyDistance) {
                const awayFromAlly = this.root.position.subtract(nearestAllyInfo.ally.root.position).normalize();
                force.addInPlace(awayFromAlly.scale(this.maxForce * 2));
            }
        }

        if (distToPlayer < this.detectionDistance || (shouldPursueAlly && nearestAllyInfo.distance < this.detectionDistance)) {
            let positionToSeek;
            
            if (shouldPursueAlly) {
                // Si on poursuit un allié, on se dirige vers lui
                positionToSeek = targetToTrack.root.position;
            } else {
                // Sinon on poursuit le joueur avec l'offset préféré
                positionToSeek = this.getPreferredPosition();
                targetToTrack = this.player;
            }
            
            const pursuitForce = this.seek(positionToSeek);
            force.addInPlace(pursuitForce.scale(this.pursuitWeight));

            const separationForce = this.separate();
            force.addInPlace(separationForce.scale(this.separationWeight));

            this.isRunning = true;
            shouldTrack = true;
            this.currentAnimation = "run";

            // Tirer si la cible est à portée de tir
            if ((shouldPursueAlly && nearestAllyInfo.distance < this.shootingDistance) || 
                (!shouldPursueAlly && distToPlayer < this.shootingDistance)) {
                if (shouldPursueAlly) {
                    this.shoot(targetToTrack);
                } else {
                    this.shoot(this.player);
                }
            }
        } else {
            const wanderForce = this.wander();
            force.addInPlace(wanderForce.scale(this.wanderWeight));
            this.isRunning = true;
            this.currentAnimation = "run";
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
        const collisionMargin = 0.75; // Marge de collision pour l'ennemi
        const enemyHeight = 2.0; // Hauteur approximative de l'ennemi
        
        // Créer un rayon pour la détection de collision
        const raycastDirection = this.velocity.clone().normalize();
        const rayLength = this.velocity.length() + collisionMargin;
        
        // Raycast pour détecter les collisions
        const ray = new BABYLON.Ray(
            new BABYLON.Vector3(
                this.root.position.x,
                this.root.position.y + enemyHeight / 2, 
                this.root.position.z
            ),
            raycastDirection,
            rayLength
        );
        
        // Vérifier les collisions avec les meshes de la map
        if (mapPartsData && mapPartsData.length > 0) {
            for (const mapPart of mapPartsData) {
                if (!mapPart.mainMesh) continue;
                
                // Récupérer tous les meshes enfants qui peuvent avoir des collisions
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
        
        // Appliquer le mouvement seulement s'il n'y a pas de collision
        if (!collisionDetected) {
            this.root.position = newPosition;
        } else {
            // En cas de collision, essayer de glisser le long des murs
            // Projections latérales du vecteur de mouvement
            const slideX = new BABYLON.Vector3(this.velocity.x, 0, 0);
            const slideZ = new BABYLON.Vector3(0, 0, this.velocity.z);
            
            // Vérifier si on peut glisser sur l'axe X
            const rayX = new BABYLON.Ray(
                new BABYLON.Vector3(
                    this.root.position.x,
                    this.root.position.y + enemyHeight / 2, 
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
            
            // Vérifier si on peut glisser sur l'axe Z
            const rayZ = new BABYLON.Ray(
                new BABYLON.Vector3(
                    this.root.position.x,
                    this.root.position.y + enemyHeight / 2, 
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
            
            // Appliquer le glissement si possible
            if (!collisionX) {
                this.root.position.x += slideX.x;
            }
            
            if (!collisionZ) {
                this.root.position.z += slideZ.z;
            }
        }
        
        // Maintenir la hauteur y constante
        this.root.position.y = this.position.y;

        if (shouldTrack && targetToTrack) {
            let d;
            if (targetToTrack === this.player) {
                d = this.player.position.subtract(this.root.position);
            } else {
                d = targetToTrack.root.position.subtract(this.root.position);
            }
            this.targetRotation = Math.atan2(d.x, d.z);
        } else if (this.velocity.length() > 0.01) {
            this.targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
        }

        let rotDiff = this.targetRotation - this.root.rotation.y;
        while (rotDiff > Math.PI) rotDiff -= 2 * Math.PI;
        while (rotDiff < -Math.PI) rotDiff += 2 * Math.PI;
        this.root.rotation.y += rotDiff * this.rotationSpeed;

        if (this.animations) {
            if (this.isRunning && this.currentAnimation !== "run") {
                this.animations.run?.start(true);
                this.currentAnimation = "run";
            }
        }
    }
    
    _checkIfStuck() {
        if (!this.root || this.isDead) return;
        
        // Incrémenter le compteur de frames
        this.frameCounter++;
        
        // Vérifier le blocage tous les X frames
        if (this.frameCounter % this.stuckCheckInterval === 0) {
            // Enregistrer la position actuelle
            const currentPosition = this.root.position.clone();
            
            // Si nous avons déjà des positions enregistrées
            if (this.lastPositions.length > 0) {
                const lastPosition = this.lastPositions[this.lastPositions.length - 1];
                const distance = BABYLON.Vector3.Distance(currentPosition, lastPosition);
                
                // Si l'ennemi ne s'est presque pas déplacé
                if (distance < this.stuckThreshold) {
                    this.stuckCounter++;
                    
                    // Si l'ennemi est bloqué depuis plusieurs vérifications
                    if (this.stuckCounter >= this.teleportAfterStuckCount) {
                        this._teleportToSafeLocation();
                        this.stuckCounter = 0;
                    }
                } else {
                    // Si l'ennemi s'est déplacé normalement, réinitialiser le compteur de blocage
                    this.stuckCounter = 0;
                }
            }
            
            // Enregistrer la position pour la prochaine vérification
            this.lastPositions.push(currentPosition);
            
            // Limiter la taille du tableau (garder seulement la dernière position)
            if (this.lastPositions.length > 1) {
                this.lastPositions.shift();
            }
        }
    }
    
    _teleportToSafeLocation() {
        if (!this.root || !this.player || this.isDead) return;
        
        console.log(`Téléportation d'un ennemi ${this.isBoss ? "boss" : "du quartier " + this.quartier} bloqué`);
        
        // Direction vers le joueur
        const dirToPlayer = this.player.position.subtract(this.root.position).normalize();
        
        // Trouver un point sûr dans un rayon autour de la position actuelle
        let safePosFound = false;
        let attempts = 0;
        let newPosition;
        
        // Essayer plusieurs positions aléatoires
        while (!safePosFound && attempts < 10) {
            attempts++;
            
            // Générer une direction aléatoire mais qui tend vers le joueur
            const randomAngle = Math.random() * Math.PI * 2;
            const randomDir = new BABYLON.Vector3(
                Math.cos(randomAngle),
                0,
                Math.sin(randomAngle)
            );
            
            // Combiner la direction aléatoire avec la direction vers le joueur
            const combinedDir = randomDir.scale(0.7).add(dirToPlayer.scale(0.3)).normalize();
            
            // Distance aléatoire entre 5 et 15 unités
            const distance = 5 + Math.random() * 10;
            
            // Nouvelle position potentielle
            newPosition = this.root.position.add(combinedDir.scale(distance));
            
            // Vérifier que la nouvelle position n'est pas en collision
            safePosFound = this._isPositionSafe(newPosition);
        }
        
        if (safePosFound) {
            // Téléporter l'ennemi à la position sûre
            this.root.position = newPosition;
            
            // Réinitialiser la vélocité pour éviter les comportements étranges
            this.velocity = new BABYLON.Vector3(0, 0, 0);
        } else {
            console.log("Impossible de trouver une position sûre pour téléporter l'ennemi");
        }
    }
    
    _isPositionSafe(position) {
        if (!mapPartsData || mapPartsData.length === 0) return true;
        
        // Hauteur de l'ennemi
        const enemyHeight = 2.0;
        
        // Créer une série de rayons pour vérifier les collisions autour de la position
        const rayDirections = [
            new BABYLON.Vector3(1, 0, 0),
            new BABYLON.Vector3(-1, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, -1),
            new BABYLON.Vector3(0.7, 0, 0.7),
            new BABYLON.Vector3(0.7, 0, -0.7),
            new BABYLON.Vector3(-0.7, 0, 0.7),
            new BABYLON.Vector3(-0.7, 0, -0.7)
        ];
        
        // Distance de détection
        const rayLength = 1.5;
        
        // Vérifier les collisions dans toutes les directions
        for (const dir of rayDirections) {
            const ray = new BABYLON.Ray(
                new BABYLON.Vector3(
                    position.x,
                    position.y + enemyHeight / 2,
                    position.z
                ),
                dir,
                rayLength
            );
            
            let collisionDetected = false;
            
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
            
            if (collisionDetected) {
                return false;
            }
        }
        
        return true;
    }
}
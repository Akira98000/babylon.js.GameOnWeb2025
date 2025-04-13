import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { createBullet } from "../armes/balles";

export class EnnemiIA {
    constructor(scene, position, player) {
        this.scene = scene;
        this.player = player;
        this.position = position;
        this.maxSpeed = 0.15;
        this.maxForce = 0.05;
        this.detectionDistance = 40;
        this.shootingDistance = 15;
        this.arriveRadius = 2;
        this.wanderRadius = 2;
        this.wanderDistance = 4;
        this.wanderAngle = 0;
        this.wanderChange = 0.3;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.lastShootTime = 0;
        this.shootCooldown = 2000;
        this.animations = null;
        this.currentAnimation = null;
        this.isRunning = false;
        this.rotationSpeed = 0.1;
        this.targetRotation = 0;
        this.smoothingFactor = 0.2; // Facteur de lissage pour éviter les zigzags

        // Système de vie
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.isDead = false;
        this.isHit = false;
        this.hitRecoveryTime = 200; // Temps de récupération après un coup en ms
        this.lastHitTime = 0;

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
            if (this.mesh.material) {
                this.mesh.material.freeze();
            }
            
            this.mesh.parent = this.root;
            this.mesh.position = BABYLON.Vector3.Zero();
            this.mesh.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
            this.createHealthBar();
            this.mesh.checkCollisions = true;
            this.mesh.ellipsoid = new BABYLON.Vector3(0.6, 1, 0.6);
            this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);
            this.mesh.applyGravity = false

            // Définir un identifiant unique pour l'ennemi
            this.mesh.name = "ennemi_" + Math.random().toString(36).substr(2, 9);
            this.mesh.isEnnemi = true;

            // Configuration des animations
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

            // Évite les erreurs WebGL liées à des animations mal initialisées
            result.animationGroups.forEach(group => group.normalize(0));

            // Créer un ActionManager pour l'ennemi
            this.mesh.actionManager = new BABYLON.ActionManager(this.scene);

            // Observer pour détecter les collisions avec les balles
            const bulletCollisionObserver = () => {
                if (this.isDead || !this.mesh) return;

                const bullets = this.scene.meshes.filter(mesh => 
                    mesh.name && 
                    mesh.name.startsWith("bullet") && 
                    !mesh.isDisposed
                );

                for (const bullet of bullets) {
                    if (!bullet.isDisposed && this.mesh) {
                        const distance = BABYLON.Vector3.Distance(
                            bullet.absolutePosition,
                            this.mesh.absolutePosition
                        );
                        
                        if (distance < 2) {  // Réduire cette distance pour une détection plus précise
                            console.log("Hit detected on enemy:", this.mesh.name);
                            console.log("Distance:", distance);
                            console.log("Bullet position:", bullet.absolutePosition);
                            console.log("Enemy position:", this.mesh.absolutePosition);
                            
                            this.takeDamage(20);
                            if (!bullet.isDisposed) {
                                bullet.dispose();
                            }
                            break;
                        }
                    }
                }
            };

            // Ajouter l'observateur à la scène
            this.scene.onBeforeRenderObservable.add(bulletCollisionObserver);

            // Ajouter l'observateur de mise à jour
            this.scene.onBeforeRenderObservable.add(() => this.update());

        } catch (error) {
            console.error("Erreur lors du chargement de l'ennemi:", error);
        }
    }

    createHealthBar() {
        // Créer un plan pour la barre de vie
        const healthBarWidth = 0.5;
        const healthBarHeight = 0.1;
        this.healthBar = BABYLON.MeshBuilder.CreatePlane("healthBar", {
            width: healthBarWidth,
            height: healthBarHeight
        }, this.scene);

        const healthMaterial = new BABYLON.StandardMaterial("healthBarMaterial", this.scene);
        healthMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        healthMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
        healthMaterial.backFaceCulling = false;
        this.healthBar.material = healthMaterial;
        this.healthBar.parent = this.root;
        this.healthBar.position.y = 2.0;
        this.healthBar.rotation.y = Math.PI;
        this.healthBarBackground = this.healthBar.clone("healthBarBg");
        this.healthBarBackground.parent = this.root;
        this.healthBarBackground.position.y = 2.0;
        this.healthBarBackground.scaling.x = 1;
        const bgMaterial = new BABYLON.StandardMaterial("healthBarBgMaterial", this.scene);
        bgMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        bgMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        bgMaterial.backFaceCulling = false;
        this.healthBarBackground.material = bgMaterial;
        this.healthBar.position.z = 0.01;
    }

    takeDamage(amount) {
        console.log("takeDamage called with", amount);
        console.log("Current health before damage:", this.currentHealth);
        
        const now = Date.now();
        if (now - this.lastHitTime < this.hitRecoveryTime || this.isDead) {
            console.log("Damage prevented - recovery time or dead");
            return;
        }

        this.currentHealth -= amount;
        console.log("Current health after damage:", this.currentHealth);
        this.lastHitTime = now;
        this.isHit = true;

        if (this.healthBar) {
            this.healthBar.scaling.x = Math.max(0, this.currentHealth / this.maxHealth);
        }

        if (this.mesh && this.mesh.material) {
            this.mesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0);
            setTimeout(() => {
                if (this.mesh && this.mesh.material) {
                    this.mesh.material.emissiveColor = new BABYLON.Color3(0, 0, 0);
                }
            }, this.hitRecoveryTime);
        }

        if (this.currentHealth <= 0 && !this.isDead) {
            console.log("Enemy killed!");
            this.die();
        }
    }

    die() {
        this.isDead = true;
        if (this.animations) {
            Object.values(this.animations).forEach(anim => anim?.stop());
        }
        const fadeOut = new BABYLON.Animation(
            "fadeOut",
            "visibility",
            60,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );

        const keys = [];
        keys.push({ frame: 0, value: 1 });
        keys.push({ frame: 30, value: 0 });
        fadeOut.setKeys(keys);

        this.mesh.animations = [fadeOut];
        this.scene.beginAnimation(this.mesh, 0, 30, false, 1, () => {
            // Nettoyer les ressources
            if (this.healthBar) this.healthBar.dispose();
            if (this.healthBarBackground) this.healthBarBackground.dispose();
            if (this.mesh) this.mesh.dispose();
            if (this.root) this.root.dispose();
        });
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;
        const directionToPlayer = this.player.position.subtract(this.root.position);
        this.targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
        this.root.rotation.y = this.targetRotation;

        if (this.animations.shoot) {
            this.animations.shoot.start(false);
            this.animations.shoot.onAnimationEndObservable.addOnce(() => {
                if (this.animations.run && this.isRunning) {
                    this.animations.run.start(true);
                } else if (this.animations.idle) {
                    this.animations.idle.start(true);
                }
            });
        }

        const shootDirection = directionToPlayer.normalize();
        const shootOrigin = this.root.position.clone();
        shootOrigin.y += 1.5; 
        createBullet(this.scene, shootOrigin, shootDirection);
        this.lastShootTime = now;
    }

    seek(target) {
        const desired = target.subtract(this.root.position);
        const distance = desired.length();
        desired.normalize();

        if (distance < this.arriveRadius) {
            const speed = this.maxSpeed * (distance / this.arriveRadius);
            desired.scaleInPlace(speed);
        } else {
            desired.scaleInPlace(this.maxSpeed);
        }

        const steer = desired.subtract(this.velocity);
        steer.y = 0;

        if (steer.length() > this.maxForce) {
            steer.normalize();
            steer.scaleInPlace(this.maxForce);
        }

        return steer;
    }

    wander() {
        const circleCenter = this.velocity.clone();
        if (circleCenter.length() < 0.01) {
            circleCenter.x = Math.cos(this.wanderAngle);
            circleCenter.z = Math.sin(this.wanderAngle);
        }

        circleCenter.normalize();
        circleCenter.scaleInPlace(this.wanderDistance);

        this.wanderAngle += (Math.random() * 2 - 1) * this.wanderChange;

        const displacement = new BABYLON.Vector3(
            Math.cos(this.wanderAngle) * this.wanderRadius,
            0,
            Math.sin(this.wanderAngle) * this.wanderRadius
        );

        const wanderForce = circleCenter.add(displacement);
        wanderForce.y = 0;

        if (wanderForce.length() > this.maxForce) {
            wanderForce.normalize();
            wanderForce.scaleInPlace(this.maxForce);
        }

        return wanderForce;
    }

    update() {
        if (!this.root || !this.player) return;

        const distanceToPlayer = BABYLON.Vector3.Distance(
            this.root.position,
            this.player.position
        );

        let force;
        let shouldTrackPlayer = false;

        if (distanceToPlayer < this.detectionDistance) {
            if (distanceToPlayer < this.shootingDistance) {
                this.shoot();
                force = this.seek(this.player.position);
                this.isRunning = true;
                shouldTrackPlayer = true;
            } else {
                force = this.seek(this.player.position);
                this.isRunning = true;
                shouldTrackPlayer = true;
            }
        } else {
            force = this.wander();
            this.isRunning = true;
        }
        force.scaleInPlace(this.smoothingFactor);
        this.velocity.scaleInPlace(1 - this.smoothingFactor);
        this.velocity.addInPlace(force);
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize();
            this.velocity.scaleInPlace(this.maxSpeed);
        }
        this.velocity.y = 0;
        this.root.position.addInPlace(this.velocity);
        this.root.position.y = this.position.y;
        
        if (shouldTrackPlayer) {
            const directionToPlayer = this.player.position.subtract(this.root.position);
            this.targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
        } else if (this.velocity.length() > 0.01) {
            this.targetRotation = Math.atan2(this.velocity.x, this.velocity.z);
        }

        let rotationDiff = this.targetRotation - this.root.rotation.y;
        while (rotationDiff > Math.PI) rotationDiff -= 2 * Math.PI;
        while (rotationDiff < -Math.PI) rotationDiff += 2 * Math.PI;
        this.root.rotation.y += rotationDiff * this.rotationSpeed;
    }
}
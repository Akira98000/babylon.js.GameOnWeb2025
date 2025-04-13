import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import { createBullet } from "../armes/balles";

export class EnnemiIA {
    constructor(scene, position, player) {
        this.scene = scene;
        this.player = player;
        this.position = position;
        this.maxSpeed = 0.1;
        this.maxForce = 0.01;
        this.detectionDistance = 20; // Distance de détection du joueur
        this.shootingDistance = 15; // Distance de tir
        this.arriveRadius = 2;
        this.wanderRadius = 2;
        this.wanderDistance = 4;
        this.wanderAngle = 0;
        this.wanderChange = 0.3;
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.lastShootTime = 0;
        this.shootCooldown = 2000; // Délai entre chaque tir (2 secondes)
        this.animations = null;
        this.currentAnimation = null;
        this.isRunning = false;

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
            
            this.mesh = result.meshes[0];
            this.mesh.position = this.position;
            this.mesh.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
            
            // Configuration des collisions
            this.mesh.checkCollisions = true;
            this.mesh.ellipsoid = new BABYLON.Vector3(1, 1, 1);
            this.mesh.ellipsoidOffset = new BABYLON.Vector3(0, 1, 0);

            // Configuration des animations
            if (result.animationGroups) {
                this.animations = {
                    run: result.animationGroups.find(a => a.name.toLowerCase().includes("run")),
                    idle: result.animationGroups.find(a => a.name.toLowerCase().includes("idle")),
                    shoot: result.animationGroups.find(a => a.name.toLowerCase().includes("shoot"))
                };

                // Démarrer l'animation de course par défaut
                if (this.animations.run) {
                    this.animations.run.start(true);
                    this.currentAnimation = "run";
                }
            }

            // Activer les mises à jour
            this.scene.onBeforeRenderObservable.add(() => this.update());
        } catch (error) {
            console.error("Erreur lors du chargement de l'ennemi:", error);
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShootTime < this.shootCooldown) return;

        // Jouer l'animation de tir si disponible
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

        // Créer et configurer la balle
        const shootDirection = this.player.position.subtract(this.mesh.position).normalize();
        const shootOrigin = this.mesh.position.clone();
        shootOrigin.y += 1.5; // Ajuster la hauteur du tir

        createBullet(this.scene, shootOrigin, shootDirection);
        this.lastShootTime = now;
    }

    seek(target) {
        const desired = target.subtract(this.mesh.position);
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
        if (!this.mesh || !this.player) return;

        const distanceToPlayer = BABYLON.Vector3.Distance(
            this.mesh.position,
            this.player.position
        );

        let force;
        if (distanceToPlayer < this.detectionDistance) {
            // Si le joueur est détecté
            if (distanceToPlayer < this.shootingDistance) {
                // Si le joueur est à portée de tir
                this.shoot();
                force = this.wander(); // Continuer à se déplacer aléatoirement pendant le tir
                this.isRunning = true;
            } else {
                // Poursuivre le joueur
                force = this.seek(this.player.position);
                this.isRunning = true;
            }
        } else {
            // Patrouiller normalement
            force = this.wander();
            this.isRunning = true;
        }

        // Mettre à jour la vélocité et la position
        this.velocity.addInPlace(force);
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize();
            this.velocity.scaleInPlace(this.maxSpeed);
        }

        // Vérifier les limites de la map (ajustez ces valeurs selon votre map)
        const mapLimits = {
            minX: -90, maxX: 90,
            minZ: -90, maxZ: 90
        };

        const nextPosition = this.mesh.position.add(this.velocity);
        if (nextPosition.x < mapLimits.minX || nextPosition.x > mapLimits.maxX ||
            nextPosition.z < mapLimits.minZ || nextPosition.z > mapLimits.maxZ) {
            // Inverser la direction si on atteint les limites
            this.velocity.scaleInPlace(-1);
            this.wanderAngle += Math.PI;
        }

        this.mesh.position.addInPlace(this.velocity);

        // Rotation de l'ennemi
        if (this.velocity.length() > 0.01) {
            const angle = Math.atan2(this.velocity.x, this.velocity.z);
            this.mesh.rotation.y = angle;
        }
    }
} 
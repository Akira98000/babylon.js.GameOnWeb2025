import * as BABYLON from '@babylonjs/core';
import { EnnemiIA } from '../ennemis/EnnemiIA.js';

export class Level4 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.ennemis = [];
        this.messageElement = this._createMessage("", "storyMessage");
        this.nombreEnnemis = 3;
        this.nombreEnnemisVaincus = 0;
        this.lights = [];
    }

    async init() {
        this._nettoyerArcEnCielNiveau3();
        if (!this.scene.metadata || !this.scene.metadata.player || !this.scene.metadata.player.hero) {
            console.error("Player not found in scene metadata");
            return;
        }
        const positions = [
            new BABYLON.Vector3(0, 0, -15)
        ];

        this._showMessage("Niveau 4: Combat contre les Pizzas Maléfiques!", 5000);
        this._playBattleSound();
        for (let i = 0; i < this.nombreEnnemis; i++) {
            if (i < positions.length) {
                setTimeout(() => {
                    this._spawnEnnemi(positions[i], i);
                }, i * 1500);
            }
        }
        setTimeout(() => {
            this._showMessage("Éliminez toutes les pizzas pour gagner!", 4000);
        }, 5000);
        this.scene.onBeforeRenderObservable.add(() => {
            this._checkBulletCollisions();
        });
    }

    _checkBulletCollisions() {
        const meshes = this.scene.meshes;
        for (let mesh of meshes) {
            if (mesh.name.startsWith("bullet")) {
                for (let ennemi of this.ennemis) {
                    if (ennemi.mesh && !ennemi.isDead && mesh.intersectsMesh(ennemi.mesh)) {
                        this._eliminerEnnemi(ennemi);
                        mesh.dispose();
                        break;
                    }
                }
            }
        }
    }

    _eliminerEnnemi(ennemi) {
        const index = this.ennemis.indexOf(ennemi);
        if (index > -1) {
            ennemi.takeDamage(100);
            this.ennemis.splice(index, 1);
            this.nombreEnnemisVaincus++;

            if (this.nombreEnnemisVaincus === this.nombreEnnemis) {
                this._victoire();
            } else {
                this._showMessage(`Pizza éliminée! Reste ${this.nombreEnnemis - this.nombreEnnemisVaincus} pizzas!`, 2000);
            }
        }
    }

    _victoire() {
        this.isCompleted = true;
        this._showMessage("Félicitations! Vous avez vaincu toutes les pizzas maléfiques!", 5000);
        setTimeout(() => {
            if (this.scene.metadata && this.scene.metadata.levelManager) {
                this.scene.metadata.levelManager.goToNextLevel();
            }
        }, 5000);
    }

    _createMessage(text, id) {
        const message = document.createElement("div");
        message.id = id;
        message.style.position = "absolute";
        message.style.top = "20%";
        message.style.left = "50%";
        message.style.transform = "translate(-50%, -50%)";
        message.style.color = "white";
        message.style.fontSize = "24px";
        message.style.fontFamily = "Arial, sans-serif";
        message.style.textAlign = "center";
        message.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        message.style.display = "none";
        document.body.appendChild(message);
        return message;
    }

    _showMessage(text, duration) {
        if (this.messageElement) {
            this.messageElement.textContent = text;
            this.messageElement.style.display = "block";
            setTimeout(() => {
                this.messageElement.style.display = "none";
            }, duration);
        }
    }

    dispose() {
        // Nettoyer les ressources
        for (let ennemi of this.ennemis) {
            if (ennemi.mesh) {
                ennemi.mesh.dispose();
            }
        }
        
        // Nettoyer les lumières
        for (let light of this.lights) {
            if (light && !light.isDisposed()) {
                light.dispose();
            }
        }
        
        if (this.messageElement && this.messageElement.parentNode) {
            this.messageElement.parentNode.removeChild(this.messageElement);
        }
    }

    _spawnEnnemi(position, index) {
        try {
            this._createSpawnEffect(position);
            const player = this.scene.metadata.player.hero;
            if (!player) {
                console.error("Player not found for enemy targeting");
                return;
            }
            const ennemi = new EnnemiIA(this.scene, position, player);
            this.ennemis.push(ennemi);
            
            const messages = [
                "Une pizza maléfique apparaît!",
                "Une autre pizza rejoint le combat!",
                "Une dernière pizza surgit!"
            ];
            
            this._showMessage(messages[index % messages.length], 2000);
        } catch (error) {
            console.error("Erreur lors de la création de l'ennemi:", error);
        }
    }
    
    _createSpawnEffect(position) {
        try {
            const spawnParticles = new BABYLON.ParticleSystem("spawnParticles", 200, this.scene);
            spawnParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
            spawnParticles.emitter = position;
            spawnParticles.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
            spawnParticles.maxEmitBox = new BABYLON.Vector3(1, 0, 1);
            
            spawnParticles.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
            spawnParticles.color2 = new BABYLON.Color4(1, 0, 0, 1);
            spawnParticles.colorDead = new BABYLON.Color4(0, 0, 0, 0);
            
            spawnParticles.minSize = 0.3;
            spawnParticles.maxSize = 1.5;
            spawnParticles.minLifeTime = 0.3;
            spawnParticles.maxLifeTime = 1.5;
            
            spawnParticles.emitRate = 100;
            spawnParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            spawnParticles.gravity = new BABYLON.Vector3(0, 1, 0);
            spawnParticles.direction1 = new BABYLON.Vector3(-5, 5, -5);
            spawnParticles.direction2 = new BABYLON.Vector3(5, 5, 5);
            spawnParticles.minAngularSpeed = 0;
            spawnParticles.maxAngularSpeed = Math.PI;
            spawnParticles.minEmitPower = 1;
            spawnParticles.maxEmitPower = 3;
            
            spawnParticles.targetStopDuration = 1.5;
            spawnParticles.start();
            
            const light = new BABYLON.PointLight("spawnLight", new BABYLON.Vector3(position.x, position.y + 1, position.z), this.scene);
            light.diffuse = new BABYLON.Color3(1, 0.5, 0);
            light.intensity = 3;
            light.range = 20;
            this.lights.push(light);
            
            const animation = new BABYLON.Animation(
                "lightAnimation",
                "intensity",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const keys = [
                { frame: 0, value: 0 },
                { frame: 15, value: 3 },
                { frame: 30, value: 0 }
            ];
            
            animation.setKeys(keys);
            light.animations = [animation];
            this.scene.beginAnimation(light, 0, 30, false, 1, () => {
                if (light && !light.isDisposed()) {
                    light.dispose();
                    const index = this.lights.indexOf(light);
                    if (index > -1) {
                        this.lights.splice(index, 1);
                    }
                }
            });
        } catch (error) {
            console.error("Erreur lors de la création de l'effet d'apparition:", error);
        }
    }
    
    _playBattleSound() {
        try {
            const battleSound = new BABYLON.Sound("battleSound", "/son/battle.mp3", this.scene, null, {
                volume: 0.5,
                autoplay: true
            });
        } catch (error) {
            console.warn("Impossible de jouer le son de bataille:", error);
        }
    }

    checkProximity(playerPosition) {
        return;
    }

    _nettoyerArcEnCielNiveau3() {
        for (let mesh of this.scene.meshes) {
            if (mesh && mesh.name && (mesh.name.startsWith("rainbow") || mesh.name === "finalRainbow")) {
                console.log(`Suppression de l'arc-en-ciel: ${mesh.name}`);
                mesh.dispose();
            }
        }
        
        for (let particleSystem of this.scene.particleSystems) {
            if (particleSystem && particleSystem.name && particleSystem.name.startsWith("rainbowParticles")) {
                console.log(`Suppression du système de particules: ${particleSystem.name}`);
                particleSystem.dispose();
            }
        }
    }
} 
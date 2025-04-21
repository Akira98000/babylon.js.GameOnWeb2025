import * as BABYLON from "@babylonjs/core";

export class PurpleStorm {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.damagePerSecond = 5;
        this.maxDamagePerSecond = 10;
        this.damageIncreaseRate = 1; 
        this.initialRadius = 100;
        this.currentRadius = this.initialRadius;
        this.finalRadius = 20;
        this.shrinkRate = 0.8; 
        this.phaseInterval = 15000; 
        this.nextPhaseCountdown = this.phaseInterval;
        this.stormWall = null;
        this.stormParticles = null;
        this.countdownElement = this._createCountdownElement();
    }
    
    start() {
        this.isActive = true;
        this._createStormWall();
        this._createStormParticles();
        this._startPhaseTimer();
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isActive) return;
            this._updateStormEffects();
            this._checkPlayerDamage();
        });
    }
    
    _createStormWall() {
        this.stormWall = BABYLON.MeshBuilder.CreateCylinder("stormWall", {
            height: 50,
            diameter: this.currentRadius * 2,
            tessellation: 96
        }, this.scene);
        const stormMaterial = new BABYLON.StandardMaterial("stormMaterial", this.scene);
        stormMaterial.diffuseColor = new BABYLON.Color3(0.5, 0, 0.5);
        stormMaterial.emissiveColor = new BABYLON.Color3(0.3, 0, 0.3);
        stormMaterial.alpha = 0.3;
        this.stormWall.material = stormMaterial;
        this.stormWall.position.y = 10;
    }
    
    _createStormParticles() {
        this.stormParticles = new BABYLON.ParticleSystem("stormParticles", 2000, this.scene);
        this.stormParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        this.stormParticles.color1 = new BABYLON.Color4(0.5, 0, 0.5, 1.0);
        this.stormParticles.color2 = new BABYLON.Color4(0.75, 0, 0.75, 1.0);
        this.stormParticles.colorDead = new BABYLON.Color4(0.5, 0, 0.5, 0);
        this.stormParticles.minSize = 0.1;
        this.stormParticles.maxSize = 0.5;
        this.stormParticles.minLifeTime = 0.3;
        this.stormParticles.maxLifeTime = 1.5;
        this.stormParticles.emitRate = 500;
        this.stormParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        this.stormParticles.gravity = new BABYLON.Vector3(0, 0, 0);
        this.stormParticles.createCylinderEmitter(this.currentRadius, 2, 0, 0);        
        this.stormParticles.start();
    }
    
    _updateStormEffects() {
        if (!this.stormWall) return;
        
        // Mettre à jour la taille du mur
        this.stormWall.scaling.x = this.currentRadius / this.initialRadius;
        this.stormWall.scaling.z = this.currentRadius / this.initialRadius;
        
        // Mettre à jour les particules
        if (this.stormParticles) {
            this.stormParticles.createCylinderEmitter(this.currentRadius, 2, 0, 0);
        }
    }
    
    _checkPlayerDamage() {
        const player = this.scene.metadata?.player?.hero;
        if (!player) return;
        
        // Calculer la distance du joueur par rapport au centre
        const distanceFromCenter = new BABYLON.Vector2(
            player.position.x,
            player.position.z
        ).length();
        
        // Si le joueur est en dehors de la zone sûre
        if (distanceFromCenter > this.currentRadius) {
            // Appliquer les dégâts - Correction: utiliser scene.metadata.player.takeDamage
            if (this.scene.metadata?.player?.takeDamage) {
                this.scene.metadata.player.takeDamage(this.damagePerSecond / 60); // Diviser par 60 car appelé à chaque frame
            }
        }
    }
    
    _startPhaseTimer() {
        let lastTime = Date.now();
        
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isActive) return;
            
            const currentTime = Date.now();
            const deltaTime = currentTime - lastTime;
            lastTime = currentTime;
            
            this.nextPhaseCountdown -= deltaTime;
            
            // Mettre à jour le compte à rebours
            const seconds = Math.ceil(this.nextPhaseCountdown / 1000);
            this._updateCountdown(seconds);
            
            if (this.nextPhaseCountdown <= 0) {
                this._startNewPhase();
            }
        });
    }
    
    _startNewPhase() {
        // Réduire la taille de la zone sûre
        this.currentRadius *= this.shrinkRate;
        
        // Augmenter les dégâts
        this.damagePerSecond = Math.min(
            this.damagePerSecond + this.damageIncreaseRate,
            this.maxDamagePerSecond
        );
        
        // Réinitialiser le compte à rebours
        this.nextPhaseCountdown = this.phaseInterval;
        
        // Vérifier si c'est la phase finale
        if (this.currentRadius <= this.finalRadius) {
            this.stop();
        }
    }
    
    _createCountdownElement() {
        const element = document.createElement("div");
        element.id = "stormCountdown";
        element.style.position = "absolute";
        element.style.top = "10%";
        element.style.left = "50%";
        element.style.transform = "translate(-50%, -50%)";
        element.style.color = "#8A2BE2";
        element.style.fontSize = "24px";
        element.style.fontFamily = "Arial, sans-serif";
        element.style.textAlign = "center";
        element.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        element.style.display = "none";
        document.body.appendChild(element);
        return element;
    }
    
    _updateCountdown(seconds) {
        if (this.countdownElement) {
            this.countdownElement.style.display = "block";
            this.countdownElement.textContent = `Rétrécissement de la zone dans: ${seconds} secondes`;
        }
    }
    
    stop() {
        this.isActive = false;
        
        if (this.stormWall) {
            this.stormWall.dispose();
            this.stormWall = null;
        }
        
        if (this.stormParticles) {
            this.stormParticles.stop();
            this.stormParticles.dispose();
            this.stormParticles = null;
        }
        
        if (this.countdownElement && this.countdownElement.parentNode) {
            this.countdownElement.parentNode.removeChild(this.countdownElement);
        }
    }
    
    dispose() {
        this.stop();
    }
} 
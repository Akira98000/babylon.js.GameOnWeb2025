import * as BABYLON from "@babylonjs/core";

export class PurpleStorm {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.damagePerSecond = 10;
        this.initialRadius = 100;
        this.currentRadius = this.initialRadius;
        this.finalRadius = 10;
        this.stormWall = null;
        this.stormParticles = null;
        this.stormCenter = new BABYLON.Vector3(0, 0, 0);
        this.countdownElement = this._createCountdownElement();
        this.lastEnemySpawnTime = 0;
        this.enemySpawnInterval = 5000; // 5 secondes en millisecondes
        this.finalPhaseStarted = false;
        this.finalPhaseStartTime = null;
        this.finalPhaseDuration = 20000; // 20 secondes en millisecondes
    }
    
    start() {
        this.isActive = true;
        this._createStormWall();
        this._createStormParticles();
        this._shrinkStorm();
        
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isActive) return;
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
        stormMaterial.alpha = 0.4;
        stormMaterial.backFaceCulling = false;
        stormMaterial.disableLighting = true;
        stormMaterial.specularColor = new BABYLON.Color3(0.6, 0, 0.6);
        stormMaterial.emissiveFresnelParameters = new BABYLON.FresnelParameters();
        stormMaterial.emissiveFresnelParameters.bias = 0.2;
        stormMaterial.emissiveFresnelParameters.power = 2;
        stormMaterial.emissiveFresnelParameters.leftColor = BABYLON.Color3.White();
        stormMaterial.emissiveFresnelParameters.rightColor = BABYLON.Color3.Purple();
        
        this.stormWall.material = stormMaterial;
        this.stormWall.position = new BABYLON.Vector3(0, 10, 0);
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
        this.stormParticles.emitter = new BABYLON.Vector3(0, 10, 0);
        this.stormParticles.createCylinderEmitter(this.currentRadius, 2, 0, 0);
        this.stormParticles.start();
    }
    
    _checkPlayerDamage() {
        const player = this.scene.metadata?.player?.hero;
        if (!player) return;
        const distanceFromCenter = BABYLON.Vector3.Distance(
            new BABYLON.Vector3(player.position.x, 0, player.position.z),
            this.stormCenter
        );
        
        // Si le joueur est en dehors de la zone sûre
        if (distanceFromCenter > this.currentRadius) {
            if (this.scene.metadata?.player?.takeDamage) {
                this.scene.metadata.player.takeDamage(this.damagePerSecond / 60);
            }
        }
    }
    
    _createCountdownElement() {
        const element = document.createElement("div");
        element.id = "stormWarning";
        element.style.position = "absolute";
        element.style.top = "10%";
        element.style.left = "50%";
        element.style.transform = "translate(-50%, -50%)";
        element.style.color = "#8A2BE2";
        element.style.fontSize = "24px";
        element.style.fontFamily = "Arial, sans-serif";
        element.style.textAlign = "center";
        element.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        element.style.display = "block";
        element.textContent = "⚠️ Tempête violette active ! Restez dans la zone sûre ! ⚠️";
        document.body.appendChild(element);
        return element;
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

    _shrinkStorm() {
        const shrinkDuration = 60; // durée en secondes
        const shrinkRate = (this.initialRadius - this.finalRadius) / (shrinkDuration * 60); 

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isActive) return;

            if (!this.finalPhaseStarted && this.currentRadius <= this.finalRadius) {
                // Démarrer la phase finale
                this.finalPhaseStarted = true;
                this.finalPhaseStartTime = Date.now();
                this._showMessage("⚠️ Phase finale de la tempête ! Tenez bon pendant 20 secondes ! ⚠️", 5000);
            }

            if (this.finalPhaseStarted) {
                const elapsedTime = Date.now() - this.finalPhaseStartTime;
                const remainingSeconds = Math.ceil((this.finalPhaseDuration - elapsedTime) / 1000);
                
                if (remainingSeconds > 0) {
                    this.countdownElement.textContent = `Fin de la tempête dans : ${remainingSeconds} secondes`;
                } else {
                    this._endStorm();
                    return;
                }
            } else {
                this.currentRadius -= shrinkRate;
                
                // Mise à jour du mur de la tempête
                if (this.stormWall) {
                    this.stormWall.scaling.x = this.currentRadius / this.initialRadius;
                    this.stormWall.scaling.z = this.currentRadius / this.initialRadius;
                }

                // Mise à jour des particules
                if (this.stormParticles) {
                    this.stormParticles.createCylinderEmitter(this.currentRadius, 2, 0, 0);
                }

                // Spawn des ennemis
                const currentTime = Date.now();
                if (currentTime - this.lastEnemySpawnTime >= this.enemySpawnInterval) {
                    this._spawnEnemy();
                    this.lastEnemySpawnTime = currentTime;
                }
            }
        });
    }

    _spawnEnemy() {
        if (!this.scene.metadata?.level5) return;

        // Générer une position aléatoire à l'intérieur du cercle actuel
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * this.currentRadius;
        const position = new BABYLON.Vector3(
            this.stormCenter.x + Math.cos(angle) * radius,
            0,
            this.stormCenter.z + Math.sin(angle) * radius
        );

        // Utiliser la méthode de spawn d'ennemis de Level5
        this.scene.metadata.level5._spawnEnnemi(position);
    }

    _endStorm() {
        this.isActive = false;
        if (this.scene.metadata?.level5) {
            this.scene.metadata.level5._showMessage("🎉 Félicitations ! Vous avez survécu à la tempête violette ! 🎉", 5000);
            
            // Nettoyer la scène et passer au niveau suivant après un court délai
            setTimeout(() => {
                if (this.scene.metadata?.level5) {
                    this.scene.metadata.level5.dispose(); // Nettoyer le niveau 5
                    if (this.scene.metadata?.levelManager) {
                        this.scene.metadata.levelManager.goToNextLevel(); // Passer au niveau 6
                    }
                }
            }, 6000);
        }
        this.dispose();
    }

    _showMessage(text, duration) {
        if (this.scene.metadata?.level5) {
            this.scene.metadata.level5._showMessage(text, duration);
        }
    }
} 
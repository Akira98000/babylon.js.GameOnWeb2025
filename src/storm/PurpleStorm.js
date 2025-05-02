import * as BABYLON from "@babylonjs/core";

export class PurpleStorm {
    constructor(scene) {
        this.scene = scene;
        this.isActive = false;
        this.damagePerSecond = 30;
        this.initialRadius = 100;
        this.currentRadius = this.initialRadius;
        this.finalRadius = 10;
        this.stormWall = null;
        this.stormParticles = null;
        this.stormCenter = new BABYLON.Vector3(0, 0, 0);
        this.countdownElement = this._createCountdownElement();
        this.finalPhaseStarted = false;
        this.finalPhaseStartTime = null;
        this.finalPhaseDuration = 7000; 
        
        // Propriété pour suivre si nous avons déjà réactivé les contrôles du joueur
        this.playerControlsEnsured = false;
        
        // Facteur d'accélération de la tempête
        this.stormSpeedFactor = 2.0; // La tempête avance 2x plus vite
    }
    
    start() {
        this.isActive = true;
        this._createStormWall();
        this._createStormParticles();
        this._shrinkStorm();
        
        // S'assurer que le joueur peut toujours se déplacer
        this._ensurePlayerControls();
        
        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isActive) return;
            this._checkPlayerDamage();
            
            // Vérifier périodiquement que le joueur peut se déplacer
            if (!this.playerControlsEnsured || Math.random() < 0.001) { // Occasionnellement revérifier
                this._ensurePlayerControls();
            }
        });
    }
    
    _ensurePlayerControls() {
        if (this.scene.metadata && this.scene.metadata.player && this.scene.metadata.player.hero) {
            const player = this.scene.metadata.player.hero;
            
            // Réactiver les contrôles du joueur si nécessaire
            if (player.controller) {
                player.controller.disableControls = false;
            }
            
            // Réactiver les composants de déplacement
            if (player.moveComponent) {
                player.moveComponent.enabled = true;
            }
            
            // Réinitialiser la physique du joueur si elle est bloquée
            if (player.physicsImpostor) {
                // Assurez-vous que le joueur n'est pas coincé
                player.physicsImpostor.setLinearVelocity(new BABYLON.Vector3(0, 0, 0));
                player.physicsImpostor.setAngularVelocity(new BABYLON.Vector3(0, 0, 0));
            }
            
            // Marquer que nous avons réactivé les contrôles
            this.playerControlsEnsured = true;
            
            console.log("Storm: Player controls ensured");
        }
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
        if (!this.isActive || !this.scene.metadata || !this.scene.metadata.player || !this.scene.metadata.player.hero) {
            return;
        }
        
        const player = this.scene.metadata.player.hero;
        
        // S'assurer que le joueur peut toujours se déplacer, même s'il est dans la tempête
        if (player.controller) {
            player.controller.disableControls = false;
        }
        
        // Calculer la distance du joueur par rapport au centre de la tempête
        const distanceFromCenter = BABYLON.Vector3.Distance(player.position, this.stormCenter);
        
        // Si le joueur est en dehors du rayon actuel de la tempête
        if (distanceFromCenter > this.currentRadius) {
            // Appliquer des dégâts au joueur seulement si la tempête est active
            if (this.scene.metadata.player.takeDamage) {
                // Doubler l'effet des dégâts appliqués par frame
                this.scene.metadata.player.takeDamage(this.damagePerSecond / 30); // Plus de dégâts par frame
            }
            
            // Effet visuel rouge plus intense pour indiquer les dégâts
            if (!this._damageIndicator) {
                this._damageIndicator = document.createElement("div");
                this._damageIndicator.style.position = "absolute";
                this._damageIndicator.style.top = "0";
                this._damageIndicator.style.left = "0";
                this._damageIndicator.style.width = "100%";
                this._damageIndicator.style.height = "100%";
                this._damageIndicator.style.backgroundColor = "rgba(255, 0, 0, 0.4)"; // Plus opaque (0.4 au lieu de 0.2)
                this._damageIndicator.style.pointerEvents = "none";
                this._damageIndicator.style.zIndex = "1000";
                document.body.appendChild(this._damageIndicator);
                
                // Faire apparaître progressivement
                this._damageIndicator.style.opacity = "0";
                this._damageIndicator.style.transition = "opacity 0.3s"; // Plus rapide (0.3s au lieu de 0.5s)
                setTimeout(() => {
                    if (this._damageIndicator) {
                        this._damageIndicator.style.opacity = "1";
                    }
                }, 10);
                
                // Ajouter un effet de pulsation pour augmenter l'urgence visuelle
                this._pulseEffect();
            }
        } else {
            // Si le joueur est dans la zone sûre, enlever l'indicateur de dégâts
            if (this._damageIndicator) {
                document.body.removeChild(this._damageIndicator);
                this._damageIndicator = null;
            }
        }
    }
    
    _pulseEffect() {
        if (!this._damageIndicator) return;
        
        let intensity = 0.4;
        let increasing = false;
        
        // Créer un intervalle pour faire pulser l'effet
        this._pulseInterval = setInterval(() => {
            if (!this._damageIndicator) {
                clearInterval(this._pulseInterval);
                return;
            }
            
            if (increasing) {
                intensity += 0.03;
                if (intensity >= 0.6) {
                    increasing = false;
                }
            } else {
                intensity -= 0.03;
                if (intensity <= 0.3) {
                    increasing = true;
                }
            }
            
            this._damageIndicator.style.backgroundColor = `rgba(255, 0, 0, ${intensity})`;
        }, 50);
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
        
        // Supprimer l'indicateur de dégâts s'il existe
        if (this._damageIndicator && this._damageIndicator.parentNode) {
            this._damageIndicator.parentNode.removeChild(this._damageIndicator);
            this._damageIndicator = null;
        }
        
        // Arrêter l'intervalle de pulsation
        if (this._pulseInterval) {
            clearInterval(this._pulseInterval);
            this._pulseInterval = null;
        }
    }
    
    dispose() {
        this.stop();
        
        // Supprimer toutes les références
        this.scene = null;
        this.stormCenter = null;
        this.countdownElement = null;
        
        // S'assurer que les contrôles du joueur sont restaurés avant de quitter
        if (this.scene && this.scene.metadata && this.scene.metadata.player && this.scene.metadata.player.hero) {
            const player = this.scene.metadata.player.hero;
            if (player.controller) {
                player.controller.disableControls = false;
            }
        }
    }

    _shrinkStorm() {
        const shrinkDuration = 30; 
        const shrinkRate = (this.initialRadius - this.finalRadius) / (shrinkDuration * 60); 

        this.scene.onBeforeRenderObservable.add(() => {
            if (!this.isActive) return;

            // Réduire le rayon plus rapidement (doublement de la vitesse)
            this.currentRadius -= shrinkRate * 2;
            
            // Mettre à jour le cylindre de la tempête
            if (this.stormWall) {
                this.stormWall.scaling.x = this.currentRadius / this.initialRadius;
                this.stormWall.scaling.z = this.currentRadius / this.initialRadius;
            }
            
            // Mettre à jour les particules
            if (this.stormParticles) {
                this.stormParticles.createCylinderEmitter(this.currentRadius, 2, 0, 0);
            }

            if (!this.finalPhaseStarted && this.currentRadius <= this.finalRadius) {
                // Démarrer la phase finale
                this.finalPhaseStarted = true;
                this.finalPhaseStartTime = Date.now();
                // Réduire la durée de la phase finale de 20 à 10 secondes
                this.finalPhaseDuration = 7000; // 7 secondes au lieu de 10
                this._showMessage("⚠️ Phase finale de la tempête ! Tenez bon pendant 7 secondes ! ⚠️", 5000);
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
            }
        });
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
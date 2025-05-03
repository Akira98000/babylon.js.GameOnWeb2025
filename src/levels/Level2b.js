import * as BABYLON from '@babylonjs/core';
import { GameMessages } from '../utils/GameMessages.js';

export class Level2b {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.magician = null;
        this.proximityThreshold = 5;
        this._keyHandler = this._handleKeyDown.bind(this);
        this.onComplete = null;
        
        // Nouvelle combinaison avec les touches directionnelles
        this.keyCombo = [
            "ArrowUp", "ArrowUp", "ArrowDown", "ArrowUp", 
            "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowLeft", 
            "ArrowDown", "ArrowUp"
        ];
        this.currentCombo = [];
        this.comboDisplay = null;
        this.magicianPosition = new BABYLON.Vector3(-67.99, 0.10, -4.70);
        this.isPlayerNearMagician = false;
        this.comboChallengeActive = false;
        this.originalKeyDownHandlers = {};
    }

    async init() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'magic.glb', this.scene);
            this.magician = result.meshes[0];
            this.magician.name = 'levelMagician';
            this.magician.scaling.set(0.5, 0.5, 0.5); // Échelle réduite à 0.5
            this.magician.position = this.magicianPosition;
            this.magician.rotation.y = Math.PI; // Rotation de 180 degrés
            
            // Tentative de récupération et démarrage de l'animation d'idle du magicien si disponible
            const idleAnimation = this.scene.getAnimationGroupByName("idle");
            if (idleAnimation) {
                idleAnimation.start(true);
            }
            
            // Création de la zone de proximité
            this.proximityArea = this._createProximityArea(this.magician.position);
            
            // Ajout du gestionnaire d'événements clavier
            window.addEventListener("keydown", this._keyHandler);
            
            // Création de l'affichage de la combinaison
            this._createComboDisplay();
        } catch (error) {
            console.error("Erreur lors de l'initialisation du niveau 2b:", error);
        }
    }

    _createProximityArea(position) {
        const area = BABYLON.MeshBuilder.CreateSphere("magicianProximity", { diameter: 10, segments: 8 }, this.scene);
        area.isVisible = false;
        area.position.copyFrom(position);
        area.position.y += 1;
        area.isPickable = false;
        return area;
    }

    _createComboDisplay() {
        // Création de l'élément d'affichage de la combinaison
        this.comboDisplay = document.createElement("div");
        this.comboDisplay.id = "comboDisplay";
        this.comboDisplay.style.position = "fixed";
        this.comboDisplay.style.top = "50%";
        this.comboDisplay.style.left = "50%";
        this.comboDisplay.style.transform = "translate(-50%, -50%)";
        this.comboDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        this.comboDisplay.style.color = "white";
        this.comboDisplay.style.padding = "20px";
        this.comboDisplay.style.fontSize = "24px";
        this.comboDisplay.style.borderRadius = "10px";
        this.comboDisplay.style.fontFamily = "Arial, sans-serif";
        this.comboDisplay.style.display = "none";
        this.comboDisplay.style.zIndex = "1000";
        this.comboDisplay.style.textAlign = "center";
        document.body.appendChild(this.comboDisplay);
    }

    checkProximity(playerPosition) {
        if (this.isCompleted || !this.proximityArea) return;
        
        if (!playerPosition) return;
        
        const distance = BABYLON.Vector3.Distance(playerPosition, this.proximityArea.position);
        const wasNear = this.isPlayerNearMagician;
        this.isPlayerNearMagician = distance < this.proximityThreshold;
        
        // Si le statut de proximité a changé
        if (wasNear !== this.isPlayerNearMagician) {
            if (this.isPlayerNearMagician) {
                if (!this.comboChallengeActive) {
                    this._startComboChallenge();
                }
            } else {
                if (this.comboChallengeActive && !this.isCompleted) {
                    this._hideComboChallenge();
                }
            }
        }
    }

    _handleKeyDown(event) {
        // On ne gère plus les touches directionnelles ici, car elles sont interceptées
        // directement au niveau du document dans _backupAndDisableCameraControls
        return true;
    }

    _startComboChallenge() {
        // Afficher le défi de combinaison
        this.currentCombo = [];
        this.comboDisplay.style.display = "block";
        this.comboChallengeActive = true;
        this._updateComboDisplay();
        
        // Faire briller le magicien ou jouer une animation
        this._animateMagician();
        
        // Sauvegarder les gestionnaires de touches originaux et les désactiver temporairement
        this._backupAndDisableCameraControls();
    }
    
    _hideComboChallenge() {
        if (this.comboDisplay) {
            this.comboDisplay.style.display = "none";
            this.comboChallengeActive = false;
        }
        
        // Restaurer les gestionnaires de touches originaux
        this._restoreCameraControls();
    }
    
    _backupAndDisableCameraControls() {
        // Sauvegarder temporairement les contrôles originaux
        if (this.scene.actionManager) {
            const actions = this.scene.actionManager.actions;
            this.originalActions = [...actions];
            
            // Filtrer les actions pour conserver seulement celles qui ne sont pas liées aux touches directionnelles
            const filteredActions = actions.filter(action => {
                if (action.trigger && action.trigger.sourceEvent) {
                    const key = action.trigger.sourceEvent.key;
                    return key !== "ArrowUp" && key !== "ArrowDown" && 
                           key !== "ArrowLeft" && key !== "ArrowRight";
                }
                return true;
            });
            
            // Remplacer les actions
            this.scene.actionManager.actions = filteredActions;
        }
        
        // Désactiver les contrôles de caméra plus directement
        if (this.scene.activeCamera) {
            // Sauvegarder l'état des contrôles de caméra
            this.cameraControlsEnabled = this.scene.activeCamera.inputs.attached.keyboard.detachControl;
            
            // Désactiver les entrées clavier pour la caméra
            if (this.scene.activeCamera.inputs) {
                if (this.scene.activeCamera.inputs.attached.keyboard) {
                    this.scene.activeCamera.inputs.attached.keyboard.detachControl(this.scene.getEngine().getRenderingCanvas());
                }
                
                // Sauvegarder le gestionnaire onKeyDown original
                if (this.scene.onKeyDown) {
                    this.originalOnKeyDown = this.scene.onKeyDown;
                    
                    // Remplacer par une version qui ignore les touches directionnelles
                    this.scene.onKeyDown = (evt) => {
                        if (evt.key === "ArrowUp" || evt.key === "ArrowDown" || 
                            evt.key === "ArrowLeft" || evt.key === "ArrowRight") {
                            return;
                        }
                        if (this.originalOnKeyDown) {
                            this.originalOnKeyDown(evt);
                        }
                    };
                }
            }
        }
        
        // Désactiver tous les gestionnaires de touches directionnelles au niveau du document
        this.originalKeydownHandler = document.onkeydown;
        document.onkeydown = (evt) => {
            if (this.comboChallengeActive && (
                evt.key === "ArrowUp" || evt.key === "ArrowDown" || 
                evt.key === "ArrowLeft" || evt.key === "ArrowRight")) {
                evt.preventDefault();
                evt.stopPropagation();
                
                // Ajouter la touche à notre combinaison
                this.currentCombo.push(evt.key);
                
                // Mettre à jour l'affichage
                this._updateComboDisplay();
                
                // Vérifier si la combinaison est correcte
                let isCorrectSoFar = true;
                for (let i = 0; i < this.currentCombo.length; i++) {
                    if (this.currentCombo[i] !== this.keyCombo[i]) {
                        isCorrectSoFar = false;
                        break;
                    }
                }
                
                if (isCorrectSoFar) {
                    if (this.currentCombo.length === this.keyCombo.length) {
                        this._completeComboChallenge();
                    }
                } else {
                    this.currentCombo = [];
                    this._updateComboDisplay("Essayez encore...");
                }
                
                return false;
            } else if (this.originalKeydownHandler) {
                return this.originalKeydownHandler(evt);
            }
        };
    }
    
    _restoreCameraControls() {
        // Restaurer les contrôles originaux
        if (this.scene.actionManager && this.originalActions) {
            this.scene.actionManager.actions = this.originalActions;
            this.originalActions = null;
        }
        
        // Restaurer les contrôles de caméra
        if (this.scene.activeCamera) {
            if (this.scene.activeCamera.inputs && this.cameraControlsEnabled) {
                // Réattacher les contrôles clavier
                if (this.scene.activeCamera.inputs.attached.keyboard) {
                    this.scene.activeCamera.inputs.attached.keyboard.attachControl(this.scene.getEngine().getRenderingCanvas(), true);
                }
            }
            
            // Restaurer le gestionnaire onKeyDown original
            if (this.originalOnKeyDown) {
                this.scene.onKeyDown = this.originalOnKeyDown;
                this.originalOnKeyDown = null;
            }
        }
        
        // Restaurer le gestionnaire de touches du document
        if (this.originalKeydownHandler) {
            document.onkeydown = this.originalKeydownHandler;
            this.originalKeydownHandler = null;
        }
    }

    _updateComboDisplay(message) {
        if (!this.comboDisplay) return;
        
        // Convertir les touches directionnelles en symboles
        const keyToSymbol = {
            "ArrowUp": "↑",
            "ArrowDown": "↓",
            "ArrowLeft": "←",
            "ArrowRight": "→"
        };
        
        // Créer l'affichage du progrès actuel
        const progressSymbols = this.currentCombo.map(key => keyToSymbol[key]);
        const progressText = progressSymbols.join(" ");
        
        // Créer l'affichage de la combinaison complète
        const fullComboSymbols = this.keyCombo.map(key => keyToSymbol[key]);
        const fullComboText = fullComboSymbols.join(" ");
        
        // Calculer les cases restantes
        const remainingCount = this.keyCombo.length - this.currentCombo.length;
        const remainingText = remainingCount > 0 ? "□ ".repeat(remainingCount).trim() : "";
        
        // Afficher la combinaison requise
        this.comboDisplay.innerHTML = `
            <div style="margin-bottom: 20px;">
                <span style="font-size: 32px;">🧙‍♂️</span>
                <h2 style="margin: 10px 0;">Séquence magique</h2>
                ${message ? `<p style="color: orange;">${message}</p>` : ''}
            </div>
            <div style="font-size: 32px; letter-spacing: 10px; margin: 15px 0; color: #4CAF50;">
                ${progressText} <span style="color: #aaa;">${remainingText}</span>
            </div>
            <p style="margin: 15px 0; font-size: 18px; color: #ffcc00;">
                Combinaison: <strong>${fullComboText}</strong>
            </p>
            <p style="margin-top: 10px; font-size: 16px; color: #aaa;">
                Utilisez les touches fléchées pour saisir la combinaison
            </p>
        `;
    }

    _animateMagician() {
        // Animation du magicien (à implémenter selon les animations disponibles)
        const castSpellAnimation = this.scene.getAnimationGroupByName("cast") || 
                                  this.scene.getAnimationGroupByName("spell") || 
                                  this.scene.getAnimationGroupByName("magic");
        
        if (castSpellAnimation) {
            castSpellAnimation.start(false);
        }
        
        // Animation de rotation du magicien
        const rotateAnimation = new BABYLON.Animation(
            "magicianRotation",
            "rotation.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const keyFrames = [];
        keyFrames.push({ frame: 0, value: Math.PI });
        keyFrames.push({ frame: 60, value: Math.PI + Math.PI * 2 });
        
        rotateAnimation.setKeys(keyFrames);
        this.magician.animations = [rotateAnimation];
        
        this.scene.beginAnimation(this.magician, 0, 60, true);
        
        // Création d'un effet de particules autour du magicien
        const particleSystem = new BABYLON.ParticleSystem("magicParticles", 2000, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("/textures/sparkle.png", this.scene);
        particleSystem.emitter = this.magician;
        particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(1, 3, 1);
        particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.5;
        particleSystem.minLifeTime = 0.3;
        particleSystem.maxLifeTime = 1.5;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 3, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 8, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 8, 1);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.005;
        particleSystem.start();
        
        setTimeout(() => {
            particleSystem.stop();
        }, 3000);
    }

    _completeComboChallenge() {
        // Cacher l'interface de combinaison
        if (this.comboDisplay) {
            this.comboDisplay.style.display = "none";
        }

        // Faire disparaître le magicien avec une animation
        this._fadeOutMagician();
        
        // Activer le pouvoir de tir pour le joueur
        this._enableShooting();
        
        // Restaurer les contrôles de caméra
        this._restoreCameraControls();
        
        // Afficher un message de réussite
        GameMessages.showCelebrationMessage(
            "Pouvoir Acquis !",
            "🧙‍♂️✨",
            "Le magicien vous a transmis un pouvoir, le pouvoir d'éliminer les ennemis. Il vous considère comme le gardien de ce monde DreamLand.",
            () => {
                this.isCompleted = true;
                
                // Nettoyer tous les éléments d'interface
                this._cleanupAllUI();
                
                if (this.onComplete && typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }
        );
        
        // Supprimer le gestionnaire d'événements clavier
        window.removeEventListener("keydown", this._keyHandler);
    }

    _fadeOutMagician() {
        if (!this.magician || this.magician.isDisposed) return;
        
        // Créer une animation pour faire disparaître le magicien
        const fadeAnimation = new BABYLON.Animation(
            "magicianFadeOut",
            "scaling",
            30,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Keyframes pour l'animation
        const keyFrames = [];
        keyFrames.push({ 
            frame: 0, 
            value: this.magician.scaling.clone()
        });
        keyFrames.push({ 
            frame: 30, 
            value: new BABYLON.Vector3(0, 0, 0)
        });
        
        fadeAnimation.setKeys(keyFrames);
        
        // Créer un système de particules pour l'effet de disparition
        const particleSystem = new BABYLON.ParticleSystem("magicianDisappearParticles", 300, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("/textures/sparkle.png", this.scene);
        particleSystem.emitter = this.magician;
        particleSystem.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(1, 2, 1);
        particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0.2, 1.0);
        particleSystem.color2 = new BABYLON.Color4(1, 0.5, 0.1, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(0, 0, 0.2, 0.0);
        particleSystem.minSize = 0.2;
        particleSystem.maxSize = 0.5;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.5;
        particleSystem.emitRate = 100;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.gravity = new BABYLON.Vector3(0, 8, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-5, 8, -5);
        particleSystem.direction2 = new BABYLON.Vector3(5, 8, 5);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 1;
        particleSystem.maxEmitPower = 3;
        particleSystem.updateSpeed = 0.01;
        
        // Démarrer les particules
        particleSystem.start();
        
        // Arrêter l'animation continue de rotation
        this.scene.stopAnimation(this.magician);
        
        // Démarrer l'animation de disparition
        this.scene.beginAnimation(this.magician, 0, 30, false, 1, () => {
            // Une fois l'animation terminée, supprimer le magicien
            setTimeout(() => {
                particleSystem.stop();
                setTimeout(() => {
                    particleSystem.dispose();
                    if (this.magician && !this.magician.isDisposed) {
                        this.magician.dispose();
                        this.magician = null;
                    }
                    if (this.proximityArea && !this.proximityArea.isDisposed) {
                        this.proximityArea.dispose();
                        this.proximityArea = null;
                    }
                }, 1500);
            }, 500);
        });
    }

    _cleanupAllUI() {
        // Supprimer l'affichage de la combinaison
        if (this.comboDisplay && this.comboDisplay.parentNode) {
            this.comboDisplay.parentNode.removeChild(this.comboDisplay);
            this.comboDisplay = null;
        }
        
        // Supprimer tous les messages du GameMessages
        const messages = document.querySelectorAll('[id$="Message"]');
        messages.forEach(message => {
            if (message && message.parentNode) {
                message.parentNode.removeChild(message);
            }
        });
    }

    _enableShooting() {
        // Activer la capacité de tir pour le joueur
        if (this.scene.onPointerDown) {
            this.scene.metadata.shootingEnabled = true;
        }
    }

    cleanup() {
        // Supprimer le gestionnaire d'événements clavier
        window.removeEventListener("keydown", this._keyHandler);
        
        // Restaurer les contrôles de caméra si nécessaire
        this._restoreCameraControls();
        
        // Nettoyer tous les éléments d'interface
        this._cleanupAllUI();
        
        // Supprimer le magicien et la zone de proximité
        if (this.magician && !this.magician.isDisposed) {
            this.scene.stopAnimation(this.magician);
            this.magician.dispose();
            this.magician = null;
        }
        
        if (this.proximityArea && !this.proximityArea.isDisposed) {
            this.proximityArea.dispose();
            this.proximityArea = null;
        }
    }
} 
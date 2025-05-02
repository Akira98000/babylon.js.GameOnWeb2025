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
        // Nouvelle combinaison: haut, haut, bas, gauche, droite, gauche, bas, haut
        this.keyCombo = "ArrowUpArrowUpArrowDownArrowLeftArrowRightArrowLeftArrowDownArrowUp";
        this.currentCombo = "";
        this.comboDisplay = null;
        this.magicianPosition = new BABYLON.Vector3(-67.99, 0.10, -4.70);
        this.isComboActive = false;
        this.keyToDirection = {
            "ArrowUp": "↑",
            "ArrowDown": "↓", 
            "ArrowLeft": "←", 
            "ArrowRight": "→"
        };
        // Stockage des contrôles originaux pour les désactiver pendant la combinaison
        this.originalControls = null;
        // Compteur d'essais incorrects
        this.failedAttempts = 0;
        // Séquence de solution à afficher
        this.solutionSequence = ["↑", "↑", "↓", "←", "→", "←", "↓", "↑"];
    }

    async init() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'magic.glb', this.scene);
            this.magician = result.meshes[0];
            this.magician.name = 'levelMagician';
            this.magician.scaling.set(0.5, 0.5, 0.5);
            this.magician.rotation = new BABYLON.Vector3(0, Math.PI, 0);
            this.magician.position = this.magicianPosition;
            
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
        const isNear = distance < this.proximityThreshold;
        
        // Si le joueur est près du magicien et que le défi n'est pas encore actif
        if (isNear && !this.isComboActive) {
            this._startComboChallenge();
            this.isComboActive = true;
        } else if (!isNear && this.isComboActive) {
            // Si le joueur s'éloigne, cacher l'interface de combinaison et restaurer les contrôles
            this.comboDisplay.style.display = "none";
            this.isComboActive = false;
            this.currentCombo = "";
            this._restorePlayerControls();
        }
    }

    _handleKeyDown(event) {
        // Si le défi de combinaison est actif, capturer les touches pour la combinaison
        if (this.isComboActive && !this.isCompleted) {
            const key = event.key;
            
            // Filtrer uniquement les touches directionnelles
            if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
                // Empêcher le comportement par défaut pour éviter le mouvement de la caméra
                event.preventDefault();
                event.stopPropagation();
                
                this.currentCombo += key;
                
                // Mettre à jour l'affichage de la combinaison
                this._updateComboDisplay();
                
                // Vérifier si la combinaison est correcte
                if (this.keyCombo.startsWith(this.currentCombo)) {
                    if (this.currentCombo === this.keyCombo) {
                        // La combinaison complète est correcte
                        this._completeComboChallenge();
                    }
                } else {
                    // La combinaison est incorrecte, réinitialiser
                    this.currentCombo = "";
                    this.failedAttempts++;
                    
                    if (this.failedAttempts >= 3) {
                        // Après 3 tentatives, montrer la solution
                        this._updateComboDisplay("Voici la solution :", true);
                    } else {
                        this._updateComboDisplay(`Séquence incorrecte, essayez encore... (${this.failedAttempts}/3)`);
                    }
                }
            }
        }
    }

    _startComboChallenge() {
        // Réinitialiser le compteur d'essais
        this.failedAttempts = 0;
        
        // Afficher le défi de combinaison
        this.currentCombo = "";
        this.comboDisplay.style.display = "block";
        this._updateComboDisplay();
        
        // Bloquer les contrôles du joueur pour éviter que les touches fléchées ne déplacent le personnage
        this._disablePlayerControls();
        
        // Faire briller le magicien ou jouer une animation
        this._animateMagician();
    }

    _disablePlayerControls() {
        // Stocker les contrôles originaux
        if (this.scene.actionManager) {
            // Désactiver les actions liées aux touches fléchées
            const originalActions = this.scene.actionManager.actions.slice();
            this.originalActions = originalActions;
            
            // Vider toutes les actions
            this.scene.actionManager.actions = [];
            
            // Ne garder que notre gestionnaire d'événements clavier
            window.removeEventListener("keydown", this._keyHandler);
            document.addEventListener("keydown", this._keyHandler, true);
        }
    }

    _restorePlayerControls() {
        // Restaurer les actions originales
        if (this.originalActions && this.scene.actionManager) {
            this.scene.actionManager.actions = this.originalActions;
            this.originalActions = null;
        }
        
        // Restaurer notre gestionnaire d'événements
        document.removeEventListener("keydown", this._keyHandler, true);
        window.addEventListener("keydown", this._keyHandler);
    }

    _updateComboDisplay(message, showSolution = false) {
        if (!this.comboDisplay) return;
        
        // Convertir la séquence actuelle en symboles de direction
        const progressSymbols = this.currentCombo.match(/Arrow(Up|Down|Left|Right)/g)
            ?.map(key => this.keyToDirection[key]) || [];
        
        const progressText = progressSymbols.join(" ");
        
        // Calculer le nombre de directions restantes
        const totalDirections = this.keyCombo.match(/Arrow(Up|Down|Left|Right)/g)?.length || 0;
        const remainingCount = totalDirections - progressSymbols.length;
        const remainingText = remainingCount > 0 ? "□ ".repeat(remainingCount).trim() : "";
        
        // Préparer l'affichage de la solution si nécessaire
        let solutionHtml = '';
        if (showSolution) {
            solutionHtml = `
                <div style="margin-top: 20px; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                    <p style="color: #ffcc00; margin-bottom: 10px;">Solution :</p>
                    <div style="font-size: 28px; letter-spacing: 10px;">
                        ${this.solutionSequence.join(" ")}
                    </div>
                </div>
            `;
        }
        
        this.comboDisplay.innerHTML = `
            <div style="margin-bottom: 20px;">
                <span style="font-size: 32px;">🧙‍♂️</span>
                <h2 style="margin: 10px 0;">Saisir la séquence magique</h2>
                ${message ? `<p style="color: orange;">${message}</p>` : ''}
            </div>
            <div style="font-size: 32px; letter-spacing: 5px; margin: 20px 0;">
                ${progressText} ${remainingText}
            </div>
            <p style="margin-top: 20px; font-size: 16px; color: #aaa;">
                Utilisez les touches fléchées pour saisir la séquence...
            </p>
            <div style="display: flex; justify-content: center; margin-top: 15px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; grid-gap: 5px; text-align: center; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                    <div></div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;">↑</div>
                    <div></div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;">←</div>
                    <div></div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;">→</div>
                    <div></div>
                    <div style="padding: 10px; background: rgba(255,255,255,0.2); border-radius: 5px;">↓</div>
                    <div></div>
                </div>
            </div>
            ${solutionHtml}
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
        // Restaurer les contrôles du joueur
        this._restorePlayerControls();
        
        // Cacher l'affichage de la combinaison
        this.comboDisplay.style.display = "none";
        this.isComboActive = false;
        
        // Activer le pouvoir de tir pour le joueur
        this._enableShooting();
        
        // Afficher un message de réussite
        GameMessages.showCelebrationMessage(
            "Pouvoir Acquis !",
            "🧙‍♂️✨",
            "Le magicien vous a transmis un pouvoir, le pouvoir d'éliminer les ennemis. Il vous considère comme le gardien de ce monde DreamLand.",
            () => {
                this.isCompleted = true;
                if (this.onComplete && typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }
        );
        
        // Supprimer le gestionnaire d'événements clavier
        window.removeEventListener("keydown", this._keyHandler);
    }

    _enableShooting() {
        // Activer la capacité de tir pour le joueur
        if (this.scene.onPointerDown) {
            const originalOnPointerDown = this.scene.onPointerDown;
            this.scene.metadata.shootingEnabled = true;
        }
    }

    cleanup() {
        // Restaurer les contrôles du joueur si nécessaire
        if (this.isComboActive) {
            this._restorePlayerControls();
        }
        
        // Supprimer le gestionnaire d'événements clavier
        window.removeEventListener("keydown", this._keyHandler);
        document.removeEventListener("keydown", this._keyHandler, true);
        
        // Supprimer l'affichage de la combinaison
        if (this.comboDisplay && this.comboDisplay.parentNode) {
            this.comboDisplay.parentNode.removeChild(this.comboDisplay);
            this.comboDisplay = null;
        }
    }
} 
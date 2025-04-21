import * as BABYLON from '@babylonjs/core';
import { EnnemiIA } from '../ennemis/EnnemiIA.js';
import { AmiAI } from '../amis/AmiAI.js';

export class Level4 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.ennemis = [];
        this.amis = [];
        this.messageElement = this._createMessage("", "storyMessage");
        this.nombreEnnemis = 3;
        this.nombreAmis = 2;
        this.nombreEnnemisVaincus = 0;
        this.lights = [];
    }

    async init() {
        this._nettoyerArcEnCielNiveau3();
        if (!this.scene.metadata || !this.scene.metadata.player || !this.scene.metadata.player.hero) {
            console.error("Player not found in scene metadata");
            return;
        }
        const positionsEnnemis = [
            new BABYLON.Vector3(0, 0, -15),
            new BABYLON.Vector3(5, 0, -12),
            new BABYLON.Vector3(-5, 0, -18)
        ];

        const positionsAmis = [
            new BABYLON.Vector3(3, 0, 5),
            new BABYLON.Vector3(-3, 0, 5)
        ];

        this._showMessage("Niveau 4: Combat contre les Pizzas Maléfiques!", 5000);
        this._playBattleSound();

        // Spawn des amis
        for (let i = 0; i < this.nombreAmis; i++) {
            if (i < positionsAmis.length) {
                setTimeout(() => {
                    this._spawnAmi(positionsAmis[i], i);
                }, i * 1000);
            }
        }

        // Spawn des ennemis
        for (let i = 0; i < this.nombreEnnemis; i++) {
            if (i < positionsEnnemis.length) {
                setTimeout(() => {
                    this._spawnEnnemi(positionsEnnemis[i], i);
                }, (i + this.nombreAmis) * 1500);
            }
        }

        setTimeout(() => {
            this._showMessage("Éliminez toutes les pizzas maléfiques avec l'aide de vos alliés!", 4000);
        }, 5000);

        this.scene.onBeforeRenderObservable.add(() => {
            this._checkBulletCollisions();
            for (const ennemi of this.ennemis) {
                if (!ennemi.isDead) {
                    ennemi.update();
                }
            }
            for (const ami of this.amis) {
                if (!ami.isDead) {
                    ami.update();
                }
            }
        });
    }

    _checkBulletCollisions() {
        const meshes = this.scene.meshes;
        for (let mesh of meshes) {
            if (mesh.name.startsWith("bullet")) {
                if (mesh.metadata && (mesh.metadata.fromPlayer || mesh.metadata.fromAlly)) {
                    for (let ennemi of this.ennemis) {
                        if (ennemi.mesh && !ennemi.isDead && mesh.intersectsMesh(ennemi.hitbox || ennemi.mesh)) {
                            ennemi.takeDamage(20);
                            if (ennemi.isDead) {
                                this._eliminerEnnemi(ennemi);
                            }
                            mesh.dispose();
                            break;
                        }
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
                this._showMessage(`Pizza maléfique éliminée! Reste ${this.nombreEnnemis - this.nombreEnnemisVaincus} pizzas!`, 2000);
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
        for (let ennemi of this.ennemis) {
            if (ennemi.mesh) {
                ennemi.mesh.dispose();
            }
        }
        
        // Nettoyage amélioré des alliés
        for (let ami of this.amis) {
            if (ami.isDead) continue; // Si l'allié est déjà mort, ne pas le traiter à nouveau
            
            // Marquer comme mort pour éviter des opérations supplémentaires dans d'autres parties du code
            ami.isDead = true;
            
            // Nettoyer les ressources
            if (ami.mesh) ami.mesh.dispose();
            if (ami.root) ami.root.dispose();
            if (ami.hitbox) ami.hitbox.dispose();
            if (ami.healthBar) ami.healthBar.dispose();
            if (ami.healthBarBackground) ami.healthBarBackground.dispose();
            
            // Retirer de la liste statique des alliés si présent
            const index = AmiAI.allAllies.indexOf(ami);
            if (index > -1) {
                AmiAI.allAllies.splice(index, 1);
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

    _spawnAmi(position, index) {
        try {
            const ami = new AmiAI(this.scene, position);
            this.amis.push(ami);
            
            const messages = [
                "Une pizza alliée arrive en renfort!",
                "Un autre allié rejoint le combat!"
            ];
            
            this._showMessage(messages[index % messages.length], 2000);
        } catch (error) {
            console.error("Erreur lors de la création de l'ami:", error);
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

    checkProximity(playerPosition) {
        // Le niveau 4 n'a pas besoin de vérifier la proximité
        // Cette méthode est ajoutée pour maintenir la cohérence avec les autres niveaux
        return;
    }
} 
import * as BABYLON from '@babylonjs/core';
import { EnnemiIA } from '../ennemis/EnnemiIA.js';
import { AmiAI } from '../amis/AmiAI.js';
import { PurpleStorm } from '../storm/PurpleStorm.js';

export class Level5 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.ennemis = [];
        this.amis = [];
        this.messageElement = this._createMessage("", "storyMessage");
        this.nombreQuartiers = 3;
        this.quartierActuel = 0;
        this.nombreEnnemisParQuartier = 5;
        this.nombreEnnemisVaincus = 0;
        this.lights = [];
        
        // Trackers pour les ennemis par quartier
        this.ennemisParQuartier = [0, 0, 0];
        this.ennemisVaincusParQuartier = [0, 0, 0];
        
        this.quartiers = [
            { name: "Centre-Sud", position: new BABYLON.Vector3(-1.84, 0.10, -84.43) },
            { name: "Est", position: new BABYLON.Vector3(-111.76, 0.10, -83.29) },
            { name: "Nord", position: new BABYLON.Vector3(-61.82, 0.10, -30.11) }
        ];
        
        // Élément pour afficher les coordonnées du joueur
        this.playerCoordinatesElement = this._createCoordinatesDisplay();
        
        // Tempête violette
        this.purpleStorm = null;
        this.stormStarted = false;
    }

    async init() {
        if (!this.scene.metadata || !this.scene.metadata.player || !this.scene.metadata.player.hero) {
            console.error("Player not found in scene metadata");
            return;
        }

        this._showMessage("Niveau 5: La Reconquête des Quartiers!", 5000);
        this._playBattleSound();
        const player = this.scene.metadata.player.hero;
        const offset1 = new BABYLON.Vector3(-2, 0, -2);
        const worldOffset1 = player.position.add(offset1);
        this._spawnAmi(worldOffset1, 0);
        
        const offset2 = new BABYLON.Vector3(2, 0, -2);
        const worldOffset2 = player.position.add(offset2);
        this._spawnAmi(worldOffset2, 1);
        
        this._passerAuQuartierSuivant();

        // Observer pour mettre à jour les coordonnées et les entités
        this.scene.onBeforeRenderObservable.add(() => {
            this._checkBulletCollisions();
            this._updatePlayerCoordinates();
            this._updateAllies();
            
            // Vérifier si tous les ennemis ont été éliminés
            this._checkForLevelCompletion();
            
            for (const ennemi of this.ennemis) {
                if (!ennemi.isDead) {
                    ennemi.update();
                }
            }
        });
    }

    _updateAllies() {
        // Mettre à jour manuellement les alliés pour s'assurer qu'ils suivent correctement
        if (!this.scene.metadata || !this.scene.metadata.player || !this.scene.metadata.player.hero) return;
        
        const player = this.scene.metadata.player.hero;
        
        for (const ami of this.amis) {
            if (!ami.isDead) {
                // Forcer la mise à jour des propriétés de suivi
                ami.followPlayer = true;
                ami.player = player;
                
                // Vérifier la distance avec le joueur
                if (ami.root && player.position) {
                    const distToPlayer = BABYLON.Vector3.Distance(ami.root.position, player.position);
                    
                    // Si l'allié est très loin du joueur (plus de 20 unités), le téléporter près du joueur
                    if (distToPlayer > 30) {
                        const randomOffset = new BABYLON.Vector3(
                            (Math.random() - 0.5) * 5,
                            0,
                            (Math.random() - 0.5) * 5
                        );
                        ami.root.position = player.position.add(randomOffset);
                    }
                }
                
                // Mettre à jour l'allié
                ami.update();
            }
        }
    }

    _updatePlayerCoordinates() {
        if (this.scene.metadata && this.scene.metadata.player && this.scene.metadata.player.hero) {
            const position = this.scene.metadata.player.hero.position;
            const x = position.x.toFixed(2);
            const y = position.y.toFixed(2);
            const z = position.z.toFixed(2);
            
            let quartierActuel = "Centre";
            let minDistance = 50; // Distance plus grande pour considérer les quartiers éloignés
            
            for (const quartier of this.quartiers) {
                const distance = BABYLON.Vector3.Distance(position, quartier.position);
                if (distance < minDistance) {
                    minDistance = distance;
                    quartierActuel = quartier.name;
                }
            }
            
            this.playerCoordinatesElement.textContent = `Position: X: ${x}, Y: ${y}, Z: ${z} | Quartier: ${quartierActuel}`;
        }
    }

    _createCoordinatesDisplay() {
        const element = document.createElement("div");
        element.id = "playerCoordinates";
        element.style.position = "absolute";
        element.style.bottom = "10px";
        element.style.left = "10px";
        element.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        element.style.color = "white";
        element.style.padding = "5px 10px";
        element.style.borderRadius = "5px";
        element.style.fontFamily = "Arial, sans-serif";
        element.style.fontSize = "14px";
        element.style.zIndex = "1000";
        document.body.appendChild(element);
        return element;
    }

    _passerAuQuartierSuivant() {
        if (this.quartierActuel >= this.nombreQuartiers) {
            // Tous les quartiers sont terminés, victoire
            this._victoire();
            return;
        }

        const quartier = this.quartiers[this.quartierActuel];
        this._showMessage(`Quartier ${quartier.name}: Éliminez toutes les pizzas maléfiques!`, 4000);

        // Générer des positions autour du centre du quartier
        const positions = [];
        for (let i = 0; i < this.nombreEnnemisParQuartier; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 5; // Augmentation de la distance maximale
            positions.push(new BABYLON.Vector3(
                quartier.position.x + Math.cos(angle) * distance,
                quartier.position.y, // Utiliser la même hauteur que le point central
                quartier.position.z + Math.sin(angle) * distance
            ));
        }

        // Réinitialiser le compteur d'ennemis pour ce quartier
        this.ennemisParQuartier[this.quartierActuel] = this.nombreEnnemisParQuartier;
        this.ennemisVaincusParQuartier[this.quartierActuel] = 0;

        // Spawn des ennemis
        for (let i = 0; i < this.nombreEnnemisParQuartier; i++) {
            setTimeout(() => {
                this._spawnEnnemi(positions[i], i);
            }, i * 800); // Réduction du délai pour accélérer l'apparition
        }

        this.quartierActuel++;
    }

    _checkBulletCollisions() {
        const meshes = this.scene.meshes;
        for (let mesh of meshes) {
            if (mesh.name.startsWith("bullet")) {
                if (mesh.metadata && (mesh.metadata.fromPlayer || mesh.metadata.fromAlly)) {
                    for (let ennemi of this.ennemis) {
                        if (ennemi.mesh && !ennemi.isDead && mesh.intersectsMesh(ennemi.hitbox || ennemi.mesh)) {
                            // Tous les ennemis prennent les mêmes dégâts
                            const damage = 20;
                            ennemi.takeDamage(damage);
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
            
            // Incrémenter le compteur d'ennemis vaincus pour le quartier spécifique
            if (ennemi.quartier >= 0 && ennemi.quartier < this.ennemisVaincusParQuartier.length) {
                this.ennemisVaincusParQuartier[ennemi.quartier]++;
                console.log(`Quartier ${ennemi.quartier}: ${this.ennemisVaincusParQuartier[ennemi.quartier]}/${this.ennemisParQuartier[ennemi.quartier]} ennemis vaincus`);
            }

            // Vérifier si tous les ennemis du quartier actuel sont éliminés
            const quartierActif = this.quartierActuel - 1;
            
            // Vérifier si nous avons éliminé tous les ennemis du quartier actif
            if (quartierActif >= 0 && 
                this.ennemisVaincusParQuartier[quartierActif] >= this.ennemisParQuartier[quartierActif]) {
                
                // Vérifier si nous devons démarrer la tempête
                if (quartierActif === 2 && !this.stormStarted) {
                    this._startPurpleStorm();
                } else if (this.quartierActuel < this.nombreQuartiers) {
                    this._showMessage(`Quartier ${this.quartiers[quartierActif].name} libéré! Dirigez-vous vers le quartier ${this.quartiers[this.quartierActuel].name}.`, 3000);
                    setTimeout(() => {
                        this._passerAuQuartierSuivant();
                    }, 3000);
                } else {
                    // Si c'était le dernier quartier, victoire
                    this._victoire();
                }
            } else {
                // Afficher les ennemis restants dans le quartier actuel
                const quartierIndex = ennemi.quartier;
                if (quartierIndex >= 0 && quartierIndex < this.quartiers.length) {
                    const restants = this.ennemisParQuartier[quartierIndex] - this.ennemisVaincusParQuartier[quartierIndex];
                    this._showMessage(`Pizza maléfique éliminée! Reste ${restants} pizzas dans le quartier ${this.quartiers[quartierIndex].name}!`, 2000);
                }
            }
            
            // Vérifier après chaque élimination si tous les ennemis ont été tués
            this._checkForLevelCompletion();
        }
    }

    _startPurpleStorm() {
        if (!this.stormStarted) {
            this.stormStarted = true;
            this.purpleStorm = new PurpleStorm(this.scene);
            // Donner accès à l'instance de Level5 à la tempête
            if (!this.scene.metadata) this.scene.metadata = {};
            this.scene.metadata.level5 = this;
            this.purpleStorm.start();
            this._showMessage("⚠️ Une tempête violette approche! Restez dans la zone sûre! ⚠️", 5000);
        }
    }

    _victoire() {
        this.isCompleted = true;
        this._showMessage("Félicitations! Vous avez libéré tous les quartiers de la ville!", 5000);
        setTimeout(() => {
            if (this.scene.metadata && this.scene.metadata.levelManager) {
                this.scene.metadata.levelManager.goToNextLevel();
            }
        }, 6000);
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
        
        for (let ami of this.amis) {
            if (ami.mesh) {
                ami.mesh.dispose();
            }
            if (ami.root) {
                ami.root.dispose();
            }
            if (ami.hitbox) {
                ami.hitbox.dispose();
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
        
        if (this.playerCoordinatesElement && this.playerCoordinatesElement.parentNode) {
            this.playerCoordinatesElement.parentNode.removeChild(this.playerCoordinatesElement);
        }
        
        // Nettoyer la tempête
        if (this.purpleStorm) {
            this.purpleStorm.dispose();
        }
        
        this.amis = [];
    }

    _spawnEnnemi(position, index) {
        try {
            const player = this.scene.metadata.player.hero;
            if (!player) {
                console.error("Player not found for enemy targeting");
                return;
            }

            const ennemi = new EnnemiIA(this.scene, position, player);
            ennemi.quartier = this.quartierActuel - 1;
            
            this.ennemis.push(ennemi);
            
            const messages = [
                "Une pizza maléfique apparaît dans le quartier!",
                "Une pizza du quartier vous attaque!",
                "Voici une pizza ennemie!",
                "Une pizza hostile a été repérée!",
                "Attention, pizza maléfique en approche!"
            ];
            
            this._showMessage(messages[index % messages.length], 2000);
        } catch (error) {
            console.error("Erreur lors de la création de l'ennemi:", error);
        }
    }

    _spawnAmi(position, index) {
        try {
            const player = this.scene.metadata.player.hero;
            if (!player) {
                console.error("Player not found for ally targeting");
                return;
            }
            
            const ami = new AmiAI(this.scene, position);
            ami.followPlayer = true;
            ami.player = player;
            ami.followPlayerDistance = 4; 
            ami.followWeight = 2.0; 
            ami.detectionDistance = 60; 
            
            this.amis.push(ami);
            
            const messages = [
                "Une banane alliée vous accompagne!",
                "Un allié rejoint le combat!"
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

    checkProximity(playerPosition) {
        // Vérifier si le joueur est proche du centre d'un quartier
        for (let i = this.quartierActuel - 1; i < this.nombreQuartiers; i++) {
            if (i === this.quartierActuel - 1) {
                // Quartier actuel - vérifier si tous les ennemis sont vaincus
                // On n'utilise plus cette méthode pour passer au quartier suivant
                // car on veut s'assurer que tous les ennemis sont éliminés d'abord
                
                // Si tous les ennemis du quartier sont vaincus, permettre au joueur de passer au suivant
                if (this.ennemisVaincusParQuartier[i] >= this.ennemisParQuartier[i] &&
                    this.quartierActuel < this.nombreQuartiers) {
                    const quartierSuivant = this.quartiers[this.quartierActuel];
                    if (quartierSuivant) {
                        const distance = BABYLON.Vector3.Distance(playerPosition, quartierSuivant.position);
                        if (distance < 15) { // Augmenté pour les grandes distances dans le monde
                            this._passerAuQuartierSuivant();
                        }
                    }
                }
            }
        }
    }

    // Vérifier si le niveau est terminé
    _checkForLevelCompletion() {
        // Si le niveau est déjà complété, on ne fait rien
        if (this.isCompleted) return;
        
        // Vérifier si tous les ennemis ont été éliminés
        if (this.ennemis.length === 0) {
            // Vérifier si tous les quartiers ont été visités
            if (this.quartierActuel >= this.nombreQuartiers) {
                // Le joueur a éliminé tous les ennemis et visité tous les quartiers
                this._victoire();
            }
        }
        
        // Vérifier si tous les quartiers ont été nettoyés
        let tousQuartiersLiberes = true;
        for (let i = 0; i < this.quartierActuel; i++) {
            if (this.ennemisVaincusParQuartier[i] < this.ennemisParQuartier[i]) {
                tousQuartiersLiberes = false;
                break;
            }
        }
        
        // Si tous les quartiers actuels sont libérés et qu'on est au dernier quartier
        if (tousQuartiersLiberes && this.quartierActuel >= this.nombreQuartiers) {
            if (this.ennemis.length === 0) {
                this._victoire();
            }
        }
    }
} 
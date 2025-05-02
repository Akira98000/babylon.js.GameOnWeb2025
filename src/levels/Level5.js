import * as BABYLON from '@babylonjs/core';
import { EnnemiIA } from '../ennemis/EnnemiIA.js';
import { AmiAI } from '../amis/AmiAI.js';
import { PurpleStorm } from '../storm/PurpleStorm.js';
import { Level5Hacker } from '../cheats/Level5Hacker.js';

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

        // Initialiser le hacker pour le niveau 5
        if (!this.scene.metadata) this.scene.metadata = {};
        this.scene.metadata.level5 = this;
        this.hacker = new Level5Hacker(this.scene);
        this.hacker.init();

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
                
                if (ami.root && player.position) {
                    const distToPlayer = BABYLON.Vector3.Distance(ami.root.position, player.position);
                    
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
            let minDistance = 50; 
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
        if (this.stormStarted) {
            console.log("La tempête violette a commencé, arrêt de la génération d'ennemis");
            return;
        }

        if (this.quartierActuel >= this.nombreQuartiers) {
            this._victoire();
            return;
        }

        const quartier = this.quartiers[this.quartierActuel];
        this._showMessage(`Quartier ${quartier.name}: Éliminez toutes les pizzas maléfiques!`, 4000);
        const positions = [];
        for (let i = 0; i < this.nombreEnnemisParQuartier; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 5; 
            positions.push(new BABYLON.Vector3(
                quartier.position.x + Math.cos(angle) * distance,
                quartier.position.y, 
                quartier.position.z + Math.sin(angle) * distance
            ));
        }
        this.ennemisParQuartier[this.quartierActuel] = this.nombreEnnemisParQuartier;
        this.ennemisVaincusParQuartier[this.quartierActuel] = 0;
        for (let i = 0; i < this.nombreEnnemisParQuartier; i++) {
            setTimeout(() => {
                this._spawnEnnemi(positions[i], i);
            }, i * 800); 
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
            if (ennemi.quartier >= 0 && ennemi.quartier < this.ennemisVaincusParQuartier.length) {
                this.ennemisVaincusParQuartier[ennemi.quartier]++;
                console.log(`Quartier ${ennemi.quartier}: ${this.ennemisVaincusParQuartier[ennemi.quartier]}/${this.ennemisParQuartier[ennemi.quartier]} ennemis vaincus`);
            }
            const quartierActif = this.quartierActuel - 1;
            if (quartierActif >= 0 && 
                this.ennemisVaincusParQuartier[quartierActif] >= this.ennemisParQuartier[quartierActif]) {
                if (quartierActif === 2 && !this.stormStarted) {
                    this._startPurpleStorm();
                } else if (this.quartierActuel < this.nombreQuartiers) {
                    this._showMessage(`Quartier ${this.quartiers[quartierActif].name} libéré! Dirigez-vous vers le quartier ${this.quartiers[this.quartierActuel].name}.`, 3000);
                    setTimeout(() => {
                        this._passerAuQuartierSuivant();
                    }, 3000);
                } else {
                    this._victoire();
                }
            } else {
                const quartierIndex = ennemi.quartier;
                if (quartierIndex >= 0 && quartierIndex < this.quartiers.length) {
                    const restants = this.ennemisParQuartier[quartierIndex] - this.ennemisVaincusParQuartier[quartierIndex];
                    this._showMessage(`Pizza maléfique éliminée! Reste ${restants} pizzas dans le quartier ${this.quartiers[quartierIndex].name}!`, 2000);
                }
            }
            this._checkForLevelCompletion();
        }
    }

    _startPurpleStorm() {
        if (!this.stormStarted) {
            this.stormStarted = true;
            for (let ennemi of this.ennemis) {
                if (ennemi.mesh) {
                    ennemi.mesh.dispose();
                }
                if (ennemi.healthBar && ennemi.healthBar.container) {
                    ennemi.healthBar.container.dispose();
                }
            }
            this.ennemis = [];
            this.purpleStorm = new PurpleStorm(this.scene);
            if (!this.scene.metadata) this.scene.metadata = {};
            this.scene.metadata.level5 = this;
            this.purpleStorm.start();
            this._showMessage("⚠️ DANGER MORTEL! Une tempête violette DÉVASTATRICE approche! ⚠️", 5000);
            
            // Charger la reine qui a besoin d'aide
            this._loadHelpQueen();
            
            // Afficher un message après quelques secondes pour indiquer comment libérer la reine
            setTimeout(() => {
                this._showMessage("URGENT! La reine est emprisonnée! Appuyez sur 'K' pour la libérer IMMÉDIATEMENT!", 5000);
            }, 6000);
            
            // Avertissement supplémentaire pour l'urgence
            setTimeout(() => {
                this._showMessage("⚠️ ALERTE CRITIQUE! La tempête est MORTELLE et ULTRA-RAPIDE! ⚠️", 4000);
            }, 12000);
        }
    }

    _loadHelpQueen() {
        // Position spécifiée pour la reine
        const queenPosition = new BABYLON.Vector3(8.45, 0.10, -12.91);
        
        // Charger le modèle help_queen.glb
        BABYLON.SceneLoader.ImportMeshAsync("", "/personnage/", "help_queen.glb", this.scene).then((result) => {
            const queen = result.meshes[0];
            queen.name = "helpQueen";
            queen.position = queenPosition;
            queen.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
            
            // Chercher l'animation "help"
            const helpAnimation = this.scene.getAnimationGroupByName("help");
            if (helpAnimation) {
                // Lancer l'animation en boucle
                helpAnimation.start(true);
                console.log("Animation 'help' démarrée pour la reine");
            } else {
                console.warn("Animation 'help' non trouvée pour help_queen.glb");
                
                // Essayer de trouver d'autres animations disponibles
                const animations = this.scene.animationGroups;
                if (animations && animations.length > 0) {
                    console.log("Animations disponibles:", animations.map(a => a.name).join(", "));
                    // Lancer la première animation disponible
                    animations[0].start(true);
                    console.log(`Animation '${animations[0].name}' démarrée comme fallback`);
                }
            }
            
            // Ajouter un effet de lumière sur la reine pour la mettre en évidence
            const queenLight = new BABYLON.PointLight("queenLight", queenPosition.clone(), this.scene);
            queenLight.position.y += 3;
            queenLight.diffuse = new BABYLON.Color3(1, 0.8, 0.4);
            queenLight.intensity = 0.8;
            queenLight.range = 15;
            this.lights.push(queenLight);
            
            // Ajouter un effet de pulsation à la lumière
            const pulseAnimation = new BABYLON.Animation(
                "pulseAnimation",
                "intensity",
                30,
                BABYLON.Animation.ANIMATIONTYPE_FLOAT,
                BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const keys = [];
            keys.push({ frame: 0, value: 0.8 });
            keys.push({ frame: 15, value: 1.2 });
            keys.push({ frame: 30, value: 0.8 });
            
            pulseAnimation.setKeys(keys);
            queenLight.animations = [pulseAnimation];
            this.scene.beginAnimation(queenLight, 0, 30, true);
            
            console.log("Help Queen chargée à la position spécifiée");
            
            // Ajouter l'action de clavier pour libérer la reine
            this._setupQueenReleaseAction(queen, queenPosition);
        }).catch(error => {
            console.error("Erreur lors du chargement de help_queen.glb:", error);
        });
    }

    _setupQueenReleaseAction(queen, queenPosition) {
        // Variable pour suivre si la reine a été libérée
        this.queenReleased = false;
        
        // Observer pour la touche 'k'
        const inputMap = {};
        this.scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    inputMap[kbInfo.event.key] = true;
                    break;
                case BABYLON.KeyboardEventTypes.KEYUP:
                    inputMap[kbInfo.event.key] = false;
                    break;
            }
            
            // Vérifier si la touche 'k' est pressée et si la tempête a commencé
            if (inputMap["k"] && this.stormStarted && !this.queenReleased) {
                this._releaseQueen(queen, queenPosition);
            }
        });
        
        // Afficher le message d'instruction lors du démarrage de la tempête
        this._showMessage("⚠️ Appuyez sur 'K' pour libérer la reine! ⚠️", 5000);
    }

    _releaseQueen(queen, queenPosition) {
        // Marquer la reine comme libérée
        this.queenReleased = true;
        
        // Supprimer l'ancien modèle
        if (queen) {
            queen.dispose();
        }
        
        // Charger le modèle libéré
        BABYLON.SceneLoader.ImportMeshAsync("", "/personnage/", "help_queen_released.glb", this.scene).then((result) => {
            const releasedQueen = result.meshes[0];
            releasedQueen.name = "releasedQueen";
            releasedQueen.position = queenPosition;
            releasedQueen.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
            
            // Chercher une animation appropriée pour la reine libérée
            const celebrationAnimation = this.scene.getAnimationGroupByName("celebration");
            if (celebrationAnimation) {
                celebrationAnimation.start(true);
            } else {
                const animations = this.scene.animationGroups;
                if (animations && animations.length > 0) {
                    animations[0].start(true);
                }
            }
            
            // Ajouter des effets visuels pour la libération
            this._createLiberationEffects(queenPosition);
            
            // Afficher un message de victoire
            this._showMessage("La reine a été libérée! Le royaume est sauvé!", 5000);
            
            // Marquer le niveau comme terminé immédiatement
            this.isCompleted = true;
            
            // Passer au niveau suivant après un délai
            setTimeout(() => {
                this._showMessage("Félicitations! Niveau 5 terminé avec succès!", 5000);
                
                // Nettoyer le niveau et passer au suivant
                setTimeout(() => {
                    this.dispose();
                    if (this.scene.metadata?.levelManager) {
                        this.scene.metadata.levelManager.goToNextLevel();
                    }
                }, 6000);
            }, 5000);
            
            // Si le jeu a un système de progression entre les niveaux, on peut l'activer ici
            if (this.scene.metadata && this.scene.metadata.gameManager) {
                // Informer le gestionnaire de jeu que le niveau est terminé
                setTimeout(() => {
                    if (typeof this.scene.metadata.gameManager.levelCompleted === 'function') {
                        this.scene.metadata.gameManager.levelCompleted(5);
                    }
                }, 6000);
            }
            
        }).catch(error => {
            console.error("Erreur lors du chargement de help_queen_released.glb:", error);
        });
    }

    _createLiberationEffects(position) {
        // Créer des particules ou des effets visuels pour la libération
        const emitter = BABYLON.ParticleHelper.CreateDefault(
            new BABYLON.Vector3(position.x, position.y + 2, position.z),
            200,
            this.scene
        );
        
        emitter.minEmitBox = new BABYLON.Vector3(-1, 0, -1);
        emitter.maxEmitBox = new BABYLON.Vector3(1, 0, 1);
        
        emitter.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
        emitter.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
        
        emitter.minSize = 0.1;
        emitter.maxSize = 0.5;
        
        emitter.minLifeTime = 0.3;
        emitter.maxLifeTime = 1.5;
        
        emitter.emitRate = 100;
        emitter.manualEmitCount = 300;
        
        emitter.start();
        
        // Arrêter les particules après quelques secondes
        setTimeout(() => {
            emitter.stop();
            setTimeout(() => {
                emitter.dispose();
            }, 2000);
        }, 3000);
    }

    _victoire() {
        if (this.isCompleted) return; // Éviter les appels multiples
        
        this.isCompleted = true;
        this._showMessage("Félicitations! Vous avez libéré tous les quartiers de la ville!", 5000);
        
        // Si la tempête n'a pas encore commencé, on la démarre
        if (!this.stormStarted) {
            this._startPurpleStorm();
        }
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
        
        // Nettoyer les modèles de la reine
        const helpQueen = this.scene.getMeshByName("helpQueen");
        if (helpQueen) {
            helpQueen.dispose();
        }
        
        const releasedQueen = this.scene.getMeshByName("releasedQueen");
        if (releasedQueen) {
            releasedQueen.dispose();
        }
        
        // Nettoyer les animations
        const animations = this.scene.animationGroups;
        if (animations) {
            for (let i = 0; i < animations.length; i++) {
                const animation = animations[i];
                if (animation && (animation.name === "help" || animation.name === "celebration")) {
                    animation.dispose();
                }
            }
        }
        
        // Nettoyer les particules
        const particleSystems = this.scene.particleSystems;
        if (particleSystems) {
            while (particleSystems.length) {
                particleSystems[0].dispose();
            }
        }
        
        // Enlever les observables du clavier
        if (this.scene.onKeyboardObservable) {
            this.scene.onKeyboardObservable.clear();
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
        
        // Nettoyer le hacker
        if (this.hacker) {
            this.hacker.dispose();
        }
        
        this.amis = [];
    }

    _spawnEnnemi(position, index) {
        // Ne pas créer d'ennemis si la tempête violette a commencé
        if (this.stormStarted) {
            console.log("Tentative de création d'ennemi ignorée - La tempête violette est active");
            return;
        }

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
        
        // Comportement standard
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
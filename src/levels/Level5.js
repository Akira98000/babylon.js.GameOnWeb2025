import * as BABYLON from '@babylonjs/core';
import { EnnemiIA } from '../ennemis/EnnemiIA.js';
import { AmiAI } from '../amis/AmiAI.js';
import { PurpleStorm } from '../storm/PurpleStorm.js';
import { Level5Hacker } from '../cheats/Level5Hacker.js';
import { GameMessages } from '../utils/GameMessages.js';

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
        
        // Système de checkpoints
        this.checkpoints = [
            { id: 0, name: "Début", position: new BABYLON.Vector3(-1.84, 0.10, -84.43), reached: true },
            { id: 1, name: "Quartier Centre-Sud", position: new BABYLON.Vector3(-1.84, 0.10, -84.43), reached: false },
            { id: 2, name: "Quartier Est", position: new BABYLON.Vector3(-111.76, 0.10, -83.29), reached: false },
            { id: 3, name: "Quartier Nord", position: new BABYLON.Vector3(-61.82, 0.10, -30.11), reached: false },
            { id: 4, name: "Tempête Violette", position: new BABYLON.Vector3(8.45, 0.10, -12.91), reached: false }
        ];
        this.currentCheckpoint = 0;
        
        // Charger le checkpoint si sauvegardé
        this._loadCheckpoint();
        
        // Trackers pour les ennemis par quartier
        this.ennemisParQuartier = [0, 0, 0];
        this.ennemisVaincusParQuartier = [0, 0, 0];
        
        this.quartiers = [
            { name: "Centre-Sud", position: new BABYLON.Vector3(-1.84, 0.10, -84.43) },
            { name: "Est", position: new BABYLON.Vector3(-111.76, 0.10, -83.29) },
            { name: "Nord", position: new BABYLON.Vector3(-61.82, 0.10, -30.11) }
        ];
        
        // Définir les périmètres pour chaque groupe d'ennemis
        this.perimetre = [
            { // GRP 0 (Centre-Sud)
                min: { x: -23.84, z: -87.15 },
                max: { x: 23.39, z: -80.58 }
            },
            { // GRP 1 (Est)
                min: { x: -122.22, z: -86.98 },
                max: { x: -90.22, z: -78.83 }
            },
            { // GRP 2 (Nord)
                min: { x: -65.27, z: -41.94 },
                max: { x: -57.69, z: -3.62 }
            }
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
        
        // Positionner le joueur au checkpoint actuel
        this._placePlayerAtCheckpoint(player);
        
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
            positions.push(this._getPositionDansPerimetre(this.quartierActuel));
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

    // Méthode pour obtenir une position aléatoire dans le périmètre spécifié
    _getPositionDansPerimetre(groupeIndex) {
        const perimetre = this.perimetre[groupeIndex];
        
        // Générer des coordonnées aléatoires dans le périmètre
        const x = perimetre.min.x + Math.random() * (perimetre.max.x - perimetre.min.x);
        const z = perimetre.min.z + Math.random() * (perimetre.max.z - perimetre.min.z);
        
        return new BABYLON.Vector3(x, 0.10, z);
    }

    // Méthode pour vérifier si une position est dans le périmètre d'un groupe
    estDansPerimetre(position, groupeIndex) {
        const perimetre = this.perimetre[groupeIndex];
        return (
            position.x >= perimetre.min.x && 
            position.x <= perimetre.max.x && 
            position.z >= perimetre.min.z && 
            position.z <= perimetre.max.z
        );
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
                
                // Sauvegarder le checkpoint quand un quartier est terminé
                this._saveCheckpoint(quartierActif + 1);
                
                // Augmenter la vie du joueur de 50% lorsqu'un groupe est éliminé
                this._augmenterVieJoueur();
                
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

    // Méthode pour augmenter la vie du joueur de 50%
    _augmenterVieJoueur() {
        if (!this.scene.metadata || !this.scene.metadata.player) return;
        
        const player = this.scene.metadata.player;
        const hero = player.hero;
        
        if (hero && hero.currentHealth < hero.maxHealth) {
            // Calculer le montant de santé à ajouter (50% de la santé maximale)
            const soinAmount = hero.maxHealth * 0.5;
            
            // Limiter la santé au maximum
            const nouvelleVie = Math.min(hero.currentHealth + soinAmount, hero.maxHealth);
            const gainReel = nouvelleVie - hero.currentHealth;
            
            // Mettre à jour la santé du joueur
            hero.currentHealth = nouvelleVie;
            
            // Afficher un message
            this._showMessage(`+${Math.round(gainReel)} PV! Groupe d'ennemis éliminé, vous récupérez 50% de votre vie!`, 3000);
            
            // Effets visuels de guérison
            this._createHealingEffect(hero.position);
            
            // Si player a une méthode pour mettre à jour l'interface
            if (typeof player.updateHealthBar === 'function') {
                player.updateHealthBar();
            }
            
            // Son de guérison
            this._playHealSound();
        }
    }
    
    _createHealingEffect(position) {
        // Créer un système de particules pour l'effet de guérison
        const healingParticles = new BABYLON.ParticleSystem("healingParticles", 50, this.scene);
        healingParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        
        // Configurer l'émetteur
        const emitter = new BABYLON.Vector3(position.x, position.y + 1, position.z);
        healingParticles.emitter = emitter;
        
        // Configurer les propriétés des particules
        healingParticles.color1 = new BABYLON.Color4(0, 1, 0, 1);
        healingParticles.color2 = new BABYLON.Color4(0.5, 1, 0.5, 1);
        healingParticles.colorDead = new BABYLON.Color4(0, 0.5, 0, 0);
        
        healingParticles.minSize = 0.3;
        healingParticles.maxSize = 0.5;
        
        healingParticles.minLifeTime = 1.0;
        healingParticles.maxLifeTime = 2.0;
        
        healingParticles.emitRate = 50;
        
        healingParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        healingParticles.direction1 = new BABYLON.Vector3(-1, 3, -1);
        healingParticles.direction2 = new BABYLON.Vector3(1, 3, 1);
        
        healingParticles.minEmitPower = 1;
        healingParticles.maxEmitPower = 2;
        
        // Créer une lumière verte temporaire
        const healLight = new BABYLON.PointLight("healLight", emitter, this.scene);
        healLight.diffuse = new BABYLON.Color3(0, 1, 0);
        healLight.specular = new BABYLON.Color3(0, 1, 0);
        healLight.intensity = 1;
        healLight.range = 10;
        
        // Démarrer les particules
        healingParticles.start();
        
        // Arrêter et nettoyer après 2 secondes
        setTimeout(() => {
            healingParticles.stop();
            setTimeout(() => {
                healingParticles.dispose();
                healLight.dispose();
            }, 2000);
        }, 1000);
    }
    
    _playHealSound() {
        try {
            const healSound = new BABYLON.Sound("healSound", "/son/heal.mp3", this.scene, null, {
                volume: 0.7,
                autoplay: true
            });
        } catch (error) {
            console.warn("Impossible de jouer le son de guérison:", error);
        }
    }

    _startPurpleStorm() {
        if (!this.stormStarted) {
            this.stormStarted = true;
            
            // Sauvegarder le checkpoint de la tempête
            this._saveCheckpoint(4);
            
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
            const helpAnimation = this.scene.getAnimationGroupByName("help");
            if (helpAnimation) {
                helpAnimation.start(true);
                console.log("Animation 'help' démarrée pour la reine");
            } else {
                console.warn("Animation 'help' non trouvée pour help_queen.glb");
                const animations = this.scene.animationGroups;
                if (animations && animations.length > 0) {
                    console.log("Animations disponibles:", animations.map(a => a.name).join(", "));
                    animations[0].start(true);
                    console.log(`Animation '${animations[0].name}' démarrée comme fallback`);
                }
            }
            
            const queenLight = new BABYLON.PointLight("queenLight", queenPosition.clone(), this.scene);
            queenLight.position.y += 3;
            queenLight.diffuse = new BABYLON.Color3(1, 0.8, 0.4);
            queenLight.intensity = 0.8;
            queenLight.range = 15;
            this.lights.push(queenLight);
            
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
            this._setupQueenReleaseAction(queen, queenPosition);
        }).catch(error => {
            console.error("Erreur lors du chargement de help_queen.glb:", error);
        });
    }

    _setupQueenReleaseAction(queen, queenPosition) {
        this.queenReleased = false;
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
            if (inputMap["k"] && this.stormStarted && !this.queenReleased) {
                this._releaseQueen(queen, queenPosition);
            }
        });
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
            
            // Marquer le niveau comme terminé
            this.isCompleted = true;
            
            // Réinitialiser le checkpoint du niveau
            localStorage.removeItem('level5_checkpoint');
            
            // Utiliser GameMessages pour afficher un message de célébration avec confettis
            GameMessages.showCelebrationMessage(
                "Mission Accomplie!",
                "👑",
                "La reine a été libérée ! Le royaume est sauvé !<br><br>Vous avez terminé le niveau 5 avec succès !",
                () => {
                    // Cette fonction sera appelée quand le message de célébration se termine
                    this.dispose();
                    if (this.scene.metadata?.levelManager) {
                        this.scene.metadata.levelManager.goToNextLevel();
                    }
                }
            );
            
            // Si le jeu a un système de progression entre les niveaux, on peut l'activer ici
            if (this.scene.metadata && this.scene.metadata.gameManager) {
                // Informer le gestionnaire de jeu que le niveau est terminé
                setTimeout(() => {
                    if (typeof this.scene.metadata.gameManager.levelCompleted === 'function') {
                        this.scene.metadata.gameManager.levelCompleted(5);
                    }
                }, 3000);
            }
            
        }).catch(error => {
            console.error("Erreur lors du chargement de help_queen_released.glb:", error);
            
            // Même en cas d'erreur, afficher un message et terminer le niveau
            GameMessages.showTemporaryMessage(
                "Niveau Terminé",
                "🏆",
                "Vous avez libéré la reine et sauvé le royaume !",
                5000,
                "#FFD700"  // Couleur or
            );
            
            setTimeout(() => {
                this.dispose();
                if (this.scene.metadata?.levelManager) {
                    this.scene.metadata.levelManager.goToNextLevel();
                }
            }, 6000);
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
        if (this.isCompleted) return; 
        this.isCompleted = true;
        this._showMessage("Félicitations! Vous avez libéré tous les quartiers de la ville!", 5000);
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
        message.style.fontSize = "30px";
        message.style.fontFamily = "Arial, sans-serif";
        message.style.textAlign = "center";
        message.style.textShadow = "2px 2px 4px rgba(0,0,0,0.8)";
        message.style.background = "rgba(0, 0, 0, 0.5)";
        message.style.padding = "15px 25px";
        message.style.borderRadius = "10px";
        message.style.boxShadow = "0 0 10px rgba(128, 0, 128, 0.7)";
        message.style.zIndex = "1500";
        message.style.display = "none";
        document.body.appendChild(message);
        return message;
    }

    _showMessage(text, duration) {
        if (this.messageElement) {
            // Sauvegarder l'ancien message s'il est actuellement affiché
            const wasDisplayed = this.messageElement.style.display === "block";
            const oldMessage = this.messageElement.textContent;
            const oldTimeout = this._currentMessageTimeout;
            
            // Effacer le timeout précédent si existant
            if (this._currentMessageTimeout) {
                clearTimeout(this._currentMessageTimeout);
                this._currentMessageTimeout = null;
            }
            
            // Afficher le nouveau message
            this.messageElement.textContent = text;
            this.messageElement.style.display = "block";
            
            // Effet d'apparition
            this.messageElement.style.opacity = "0";
            this.messageElement.style.transition = "opacity 0.5s ease-in-out";
            setTimeout(() => {
                this.messageElement.style.opacity = "1";
            }, 50);
            
            // Configurer le nouveau timeout pour masquer le message
            this._currentMessageTimeout = setTimeout(() => {
                // Effet de disparition
                this.messageElement.style.opacity = "0";
                setTimeout(() => {
                    this.messageElement.style.display = "none";
                    
                    // Restaurer l'ancien message si nécessaire
                    if (wasDisplayed && oldMessage && oldMessage !== text) {
                        this._showMessage(oldMessage, duration);
                    }
                }, 500);
            }, duration);
            
            // Journaliser le message pour le débogage
            console.log(`Message affiché: "${text}" (durée: ${duration}ms)`);
        } else {
            console.error("messageElement n'est pas défini");
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
        
        // Si le niveau est terminé avec succès, supprimer le checkpoint
        if (this.isCompleted) {
            localStorage.removeItem('level5_checkpoint');
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
                // Arrêter toutes les animations au lieu de seulement certaines
                if (animation) {
                    animation.stop();
                    // Arrêter spécifiquement l'animation de danse (samba)
                    if (animation.name === "help" || animation.name === "celebration" || 
                        animation.name === "salsa" || animation.name === "samba" || 
                        animation.name.toLowerCase().includes("dance")) {
                        animation.dispose();
                    }
                }
            }
        }
        
        // S'assurer que les animations de danse sont arrêtées pour le héros
        if (this.scene.metadata?.player?.hero) {
            const hero = this.scene.metadata.player.hero;
            if (this.scene.metadata.controls) {
                // Forcer l'arrêt de l'animation de danse si elle est active
                const controls = this.scene.metadata.controls;
                if (typeof controls.changeAnimation === 'function') {
                    const idleAnim = animations?.find(a => a.name === "idle");
                    if (idleAnim) {
                        controls.changeAnimation(idleAnim);
                    }
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
            
            // Assigner le périmètre à l'ennemi
            ennemi.perimetreIndex = ennemi.quartier;
            ennemi.perimetre = this.perimetre[ennemi.quartier];
            
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

    _placePlayerAtCheckpoint(player) {
        if (!player) return;
        
        const checkpoint = this.checkpoints[this.currentCheckpoint];
        if (checkpoint) {
            player.position = checkpoint.position.clone();
            console.log(`Joueur placé au checkpoint ${checkpoint.id}: ${checkpoint.name}`);
            this._showMessage(`Checkpoint: ${checkpoint.name}`, 3000);
        }
    }

    _saveCheckpoint(checkpointId) {
        if (checkpointId <= this.currentCheckpoint) return; // Ne pas régresser
        
        const checkpoint = this.checkpoints[checkpointId];
        if (checkpoint) {
            checkpoint.reached = true;
            this.currentCheckpoint = checkpointId;
            
            // Sauvegarder dans le localStorage
            localStorage.setItem('level5_checkpoint', checkpointId.toString());
            console.log(`Checkpoint ${checkpointId} sauvegardé`);
            
            // Afficher un message
            this._showMessage(`Checkpoint atteint: ${checkpoint.name}`, 3000);
        }
    }
    
    _loadCheckpoint() {
        const savedCheckpoint = localStorage.getItem('level5_checkpoint');
        if (savedCheckpoint) {
            const checkpointId = parseInt(savedCheckpoint);
            if (!isNaN(checkpointId) && checkpointId >= 0 && checkpointId < this.checkpoints.length) {
                this.currentCheckpoint = checkpointId;
                
                // Marquer tous les checkpoints précédents comme atteints
                for (let i = 0; i <= checkpointId; i++) {
                    this.checkpoints[i].reached = true;
                }
                
                console.log(`Checkpoint ${checkpointId} chargé`);
                
                // Avancer au quartier correspondant au checkpoint
                if (checkpointId >= 1 && checkpointId <= 3) {
                    this.quartierActuel = checkpointId;
                    
                    // Marquer les quartiers précédents comme terminés
                    for (let i = 0; i < checkpointId; i++) {
                        this.ennemisParQuartier[i] = this.nombreEnnemisParQuartier;
                        this.ennemisVaincusParQuartier[i] = this.nombreEnnemisParQuartier;
                    }
                } else if (checkpointId === 4) {
                    // Cas spécial: tempête violette
                    this.quartierActuel = 3;
                    for (let i = 0; i < 3; i++) {
                        this.ennemisParQuartier[i] = this.nombreEnnemisParQuartier;
                        this.ennemisVaincusParQuartier[i] = this.nombreEnnemisParQuartier;
                    }
                }
            }
        }
    }
} 
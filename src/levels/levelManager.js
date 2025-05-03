import { Level0 } from './Level0.js';
import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level2b } from './Level2b.js';
import { Level3 } from './Level3.js';
import { Level4 } from './Level4.js';
import { Level5 } from './Level5.js';
import { Level6 } from './level6.js';
import { CutScene } from './CutScene.js';
import { AmiAI } from '../amis/AmiAI.js';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 0; 
        this.levels = {
            0: new Level0(scene),
            1: new Level1(scene),
            2: new Level2(scene),
            '2b': new Level2b(scene),
            3: new Level3(scene),
            4: new Level4(scene),
            5: new Level5(scene),
            6: new Level6(scene)
        };
        this.cutScenes = {
            1: new CutScene(scene, "NIVEAU 1: LA RENCONTRE", 3000, 1),
            2: new CutScene(scene, "NIVEAU 2: EXPLORATION", 3000, 2),
            '2b': new CutScene(scene, "NIVEAU 2B: LE MAGICIEN", 3000, 2.5),
            3: new CutScene(scene, "NIVEAU 3: LA CATASTROPHE", 3000, 3),
            4: new CutScene(scene, "NIVEAU 4: LA MENACE", 3000, 4),
            5: new CutScene(scene, "NIVEAU 5: LES QUARTIERS", 3000, 5),
            6: new CutScene(scene, "NIVEAU 6: L'ULTIME COMBAT", 3000, 6)
        };
        this.levelInstructions = {
            0: {
                title: "Tutoriel",
                icon: "💡",
                text: "Apprenez les contrôles de base du jeu."
            },
            1: {
                title: "La Rencontre",
                icon: "🐕",
                text: "Trouvez Ray le chien et appuyez sur K pour en faire votre ami fidèle."
            },
            2: {
                title: "Exploration",
                icon: "🍌",
                text: "Trouvez les trois bananes et appuyez sur F à proximité de chacune pour devenir ami avec elles."
            },
            '2b': {
                title: "Le Magicien",
                icon: "🧙‍♂️",
                text: "Trouvez le magicien et apprenez le pouvoir d'éliminer les ennemis."
            },
            3: {
                title: "La Catastrophe",
                icon: "⚠️",
                text: "La nuit tombe et les zombies apparaissent ! Survivez à l'assaut des créatures et défendez-vous."
            },
            4: {
                title: "La Menace",
                icon: "🧟",
                text: "Combattez les hordes de zombies et éliminez-les tous pour sauver la ville."
            },
            5: {
                title: "Les Quartiers",
                icon: "🏙️",
                text: "Explorez les différents quartiers de la ville et trouvez votre chemin vers la fusée."
            },
            6: {
                title: "L'Ultime Combat",
                icon: "🚀",
                text: "Atteignez la fusée et préparez-vous pour l'ultime bataille contre le boss final."
            }
        };
        
        // Initialisation des musiques
        this.standardAudio = new Audio("/assets/theme_sound.mp3");
        this.standardAudio.loop = true;
        this.standardAudio.volume = 0.5;
        
        this.combatAudio = new Audio("/assets/level_fight.mp3");
        this.combatAudio.loop = true;
        this.combatAudio.volume = 0.5;
        
        this.currentAudio = null;
        
        // Démarrer la musique standard au début
        this.switchToMusic("standard");
        
        this.levels[0].onComplete = this.goToNextLevel.bind(this);
        this.levels[1].onComplete = this.goToNextLevel.bind(this);
        this.levels[2].onComplete = this.goToLevel2b.bind(this);
        this.levels['2b'].onComplete = this.goToNextLevel.bind(this);
        this.levels[3].onComplete = this.goToNextLevel.bind(this);
        this.levels[4].onComplete = this.goToNextLevel.bind(this);
        this.loadAndAnimateGLB();
        
        this.instructionsElement = this._createInstructionsElement();
    }

    async initCurrentLevel() {
        if (this.currentLevel === 0) {
            if (this.cutScenes[0]) {
                this.cutScenes[0].onComplete = () => {
                    this.levels[0].init();
                    this._showLevelInstructions();
                };
                await this.cutScenes[0].init();
            } else {
                this.switchToMusic("standard");
                await this.levels[0].init();
                this._showLevelInstructions();
            }
        } else if (this.levels[this.currentLevel]) {
            // Jouer la musique appropriée selon le niveau
            if (this.currentLevel <= 2 || this.currentLevel === 6) {
                this.switchToMusic("standard");
            } else {
                this.switchToMusic("combat");
            }
            
            await this.levels[this.currentLevel].init();
            this._showLevelInstructions();
        }
    }

    checkProximity(playerPosition) {
        if (this.levels[this.currentLevel]) {
            this.levels[this.currentLevel].checkProximity(playerPosition);
        }
    }

    async goToLevel2b() {
        this._cleanupMessages();
        
        this.currentLevel = '2b';
        if (this.cutScenes['2b']) {
            this.cutScenes['2b'].onComplete = () => {
                this.switchToMusic("standard");
                this.levels['2b'].init();
                this._showLevelInstructions();
            };
            await this.cutScenes['2b'].init();
        } else {
            this.switchToMusic("standard");
            await this.levels['2b'].init();
            this._showLevelInstructions();
        }
    }

    async goToNextLevel() {
        this._cleanupMessages();
        
        if (this.currentLevel === 0) {
            this.currentLevel = 1;
            if (this.cutScenes[1]) {
                this.cutScenes[1].onComplete = () => {
                    this.switchToMusic("standard");
                    this.levels[1].init();
                    this._showLevelInstructions();
                };
                await this.cutScenes[1].init();
            } else {
                this.switchToMusic("standard");
                await this.levels[1].init();
                this._showLevelInstructions();
            }
        } else if (this.currentLevel === 1) {
            this.currentLevel = 2;
            if (this.cutScenes[2]) {
                this.cutScenes[2].onComplete = () => {
                    this.switchToMusic("standard");
                    this.levels[2].init();
                    this._showLevelInstructions();
                };
                await this.cutScenes[2].init();
            } else {
                this.switchToMusic("standard");
                await this.levels[2].init();
                this._showLevelInstructions();
            }
        } else if (this.currentLevel === '2b') {
            this.currentLevel = 3;
            if (this.cutScenes[3]) {
                this.cutScenes[3].onComplete = () => {
                    this.switchToMusic("combat");
                    this.levels[3].init().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level3:", error);
                    });
                    this._showLevelInstructions();
                };
                await this.cutScenes[3].init();
            } else {
                this.switchToMusic("combat");
                this.levels[3].init().catch(error => {
                    console.error("Erreur lors de l'initialisation du Level3:", error);
                });
                this._showLevelInstructions();
            }
        } else if (this.currentLevel === 3) {
            if (this.levels[3].forceRestoreColors) {
                this.levels[3].forceRestoreColors();
            }
            this.currentLevel = 4;
            
            // Nettoyer les véhicules en passant au niveau 4
            this._cleanupVehicles();
            
            setTimeout(async () => {
                if (this.cutScenes[4]) {
                    this.cutScenes[4].onComplete = () => {
                        this.switchToMusic("combat");
                        this.levels[4].init().catch(error => {
                            console.error("Erreur lors de l'initialisation du Level4:", error);
                        });
                        this._showLevelInstructions();
                    };
                    await this.cutScenes[4].init();
                } else {
                    this.switchToMusic("combat");
                    this.levels[4].init().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level4:", error);
                    });
                    this._showLevelInstructions();
                }
            }, 1500);
        } else if (this.currentLevel === 4) {
            this._cleanupAllies();
            
            this.currentLevel = 5;
            setTimeout(async () => {
                if (this.cutScenes[5]) {
                    this.cutScenes[5].onComplete = () => {
                        this.switchToMusic("combat");
                        this.levels[5].init().catch(error => {
                            console.error("Erreur lors de l'initialisation du Level5:", error);
                        });
                        this._showLevelInstructions();
                    };
                    await this.cutScenes[5].init();
                } else {
                    this.switchToMusic("combat");
                    this.levels[5].init().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level5:", error);
                    });
                    this._showLevelInstructions();
                }
            }, 2000);
        } else if (this.currentLevel === 5) {
            this._cleanupAllies();
            this.currentLevel = 6;
            
            this.levels[6] = new Level6(this.scene, this.scene.getEngine(), this.scene.activeCamera, this.scene.metadata?.player?.hero);
            setTimeout(async () => {
                if (this.cutScenes[6]) {
                    this.cutScenes[6].onComplete = () => {
                        this.switchToMusic("standard");
                        this.levels[6].initialize().catch(error => {
                            console.error("Erreur lors de l'initialisation du Level6:", error);
                        });
                        this._showLevelInstructions();
                    };
                    await this.cutScenes[6].init();
                } else {
                    this.switchToMusic("standard");
                    this.levels[6].initialize().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level6:", error);
                    });
                    this._showLevelInstructions();
                }
            }, 2000);
        }
    }

    _cleanupAllies() {
        console.log("Nettoyage des alliés avant le passage au niveau suivant...");
        
        const alliesArray = [...AmiAI.allAllies];
        
        for (const ally of alliesArray) {
            if (ally && !ally.isDead) {
                console.log("Nettoyage d'un allié");
                
                ally.isDead = true;
                
                if (ally.mesh) ally.mesh.dispose();
                if (ally.root) ally.root.dispose();
                if (ally.hitbox) ally.hitbox.dispose();
                if (ally.healthBar) ally.healthBar.dispose();
                if (ally.healthBarBackground) ally.healthBarBackground.dispose();
                
                const index = AmiAI.allAllies.indexOf(ally);
                if (index > -1) {
                    AmiAI.allAllies.splice(index, 1);
                }
            }
        }
        
        AmiAI.allAllies = [];
        console.log("Nettoyage des alliés terminé.");
    }

    _cleanupMessages() {
        const messages = document.querySelectorAll('[id$="Message"]:not(#celebration-message)');
        messages.forEach(msg => {
            if (msg && msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        });
    }
    
    switchToMusic(type) {
        let newAudio;
        switch(type) {
            case "standard":
                newAudio = this.standardAudio;
                break;
            case "combat":
                newAudio = this.combatAudio;
                break;
            default:
                newAudio = this.standardAudio;
        }
        
        const oldAudio = this.currentAudio;
        if (newAudio === oldAudio) return;
        
        console.log(`Changement de musique vers ${type}`);
        if (oldAudio) {
            this.fadeOutAudio(oldAudio);
        }
        
        newAudio.currentTime = 0;
        newAudio.volume = 0;
        
        newAudio.play()
            .then(() => {
                console.log(`Musique ${type} démarrée avec succès`);
                this.fadeInAudio(newAudio);
                this.currentAudio = newAudio;
            })
            .catch(err => {
                console.error(`Erreur lors du démarrage de la musique ${type}:`, err);
                document.addEventListener('click', () => {
                    newAudio.play()
                        .then(() => {
                            this.fadeInAudio(newAudio);
                            this.currentAudio = newAudio;
                        })
                        .catch(e => console.error(`Impossible de démarrer la musique ${type} même après interaction:`, e));
                }, { once: true });
            });
    }
    
    fadeInAudio(audio) {
        if (!audio) return;
        let volume = audio.volume;
        const fadeInterval = setInterval(() => {
            volume += 0.05;
            if (volume >= 1) {
                volume = 1;
                clearInterval(fadeInterval);
            }
            audio.volume = volume;
        }, 100);
    }
    
    fadeOutAudio(audio) {
        if (!audio) return;
        let volume = audio.volume;
        const fadeInterval = setInterval(() => {
            volume -= 0.05;
            if (volume <= 0) {
                volume = 0;
                audio.volume = volume;
                setTimeout(() => {
                    try {
                        audio.pause();
                    } catch (e) {
                        console.error("Erreur lors de la mise en pause de l'audio:", e);
                    }
                }, 500);
                clearInterval(fadeInterval);
            } else {
                audio.volume = volume;
            }
        }, 100);
    }

    _createTransitionEffect() {
        console.log("Transition vers le niveau 4 (sans overlay)");
        return;
    }

    async goToLevel(levelNumber) {
        if (!this.levels[levelNumber]) return;
        if (document.getElementById('levelTransitionOverlay')) {
            document.getElementById('levelTransitionOverlay').remove();
        }
        if (this.levels[this.currentLevel]) {
            if (this.levels[this.currentLevel].dispose) {
                this.levels[this.currentLevel].dispose();
            }
            if (this.levels[this.currentLevel].cleanup) {
                this.levels[this.currentLevel].cleanup();
            }
            this._cleanupMessages();
            this._cleanupAllies();
            
            // Si on passe d'un niveau <= 3 à un niveau > 3, nettoyer les véhicules
            if (this.currentLevel <= 3 && levelNumber > 3) {
                this._cleanupVehicles();
            }
        }
        
        this.currentLevel = levelNumber;
        
        // Si on réinitialise le niveau 5, recréer l'instance pour utiliser les checkpoints sauvegardés
        if (levelNumber === 5) {
            this.levels[5] = new Level5(this.scene);
        }
        
        // Afficher la cutscene avant de charger le niveau sélectionné
        if (this.cutScenes[levelNumber]) {
            this.cutScenes[levelNumber].onComplete = () => {
                // Sélectionner la musique appropriée selon le niveau
                if (levelNumber <= 2 || levelNumber === 6) {
                    this.switchToMusic("standard");
                } else {
                    this.switchToMusic("combat");
                }
                
                if (levelNumber === 6) {
                    this.levels[levelNumber].initialize();
                } else {
                    this.levels[levelNumber].init();
                }
            };
            await this.cutScenes[levelNumber].init();
        } else {
            // Sélectionner la musique appropriée selon le niveau
            if (levelNumber <= 2 || levelNumber === 6) {
                this.switchToMusic("standard");
            } else {
                this.switchToMusic("combat");
            }
            
            // Initialiser le nouveau niveau
            if (levelNumber === 6) {
                await this.levels[levelNumber].initialize();
            } else {
                await this.levels[levelNumber].init();
            }
        }
    }

    async loadAndAnimateGLB() {
        try {
            const glbModels = [
                "pnj_poo2.glb",
                "taxi.glb",
                "car2.glb"
            ];
            
            // Premier trajet (horizontal)
            const startPosition = new BABYLON.Vector3(-121.14, 0.10, -1.51); 
            const endPosition = new BABYLON.Vector3(22.75, 0.10, -1.51);
            const vehicleSpawnPosition = startPosition.clone();
            const vehicleDespawnPosition = endPosition.clone();
            
            // Deuxième trajet (avec virages)
            const secondTrajectory = [
                new BABYLON.Vector3(-4.55, 0.10, 44.61),   // Point de départ
                new BABYLON.Vector3(-4.55, 0.10, -45.36),  // Tourne à droite
                new BABYLON.Vector3(-27.26, 0.10, -46.46), // Tourne à gauche
                new BABYLON.Vector3(-28.52, 0.10, -86.96)  // Point d'arrivée
            ];

            // Troisième trajet (horizontal)
            const thirdStartPosition = new BABYLON.Vector3(23.59, 0.10, 43.16);
            const thirdEndPosition = new BABYLON.Vector3(-120.24, 0.10, 43.03);

            // Quatrième trajet (vertical)
            const fourthStartPosition = new BABYLON.Vector3(-63.44, 0.10, 40.74);
            const fourthEndPosition = new BABYLON.Vector3(-63.37, 0.10, -40.21);
            
            // Charger les modèles
            const models = await Promise.all(glbModels.map(async (modelName) => {
                const result = await BABYLON.SceneLoader.ImportMeshAsync(
                    "", 
                    "/pnj/road/",  
                    modelName,        
                    this.scene
                );
                const mesh = result.meshes[0];
                mesh.isVisible = false;
                mesh.position = new BABYLON.Vector3(1000, 1000, 1000);
                mesh.scaling = new BABYLON.Vector3(0.4, 0.4, 0.4);
                return mesh;
            }));
            
            const frameRate = 15;      
            const totalFrames = 300;   
    
            const spawnVehicle = (trajectory) => {
                // Vérifier si le niveau actuel est 1, 2, 2b ou 3
                if (![1, 2, '2b', 3].includes(this.currentLevel)) {
                    return; // Ne pas générer de véhicules pour les niveaux 4, 5 et 6
                }
                
                // Alterner entre les modèles
                const randomModel = models[Math.floor(Math.random() * models.length)];
                const vehicle = randomModel.clone(`vehicle_clone_${Date.now()}`);
                vehicle.isVisible = true;
                
                if (trajectory === "main") {
                    vehicle.rotation = new BABYLON.Vector3(0, Math.PI, 0);
                    vehicle.position = vehicleSpawnPosition.clone();
                    
                    BABYLON.Animation.CreateAndStartAnimation(
                        'vehicleMove', 
                        vehicle, 
                        'position', 
                        frameRate, 
                        totalFrames, 
                        vehicleSpawnPosition, 
                        vehicleDespawnPosition, 
                        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                    );
                    
                    const durationMs = (totalFrames / frameRate) * 1000;
                    setTimeout(() => {
                        vehicle.dispose();
                    }, durationMs);
                } else if (trajectory === "second") {
                    vehicle.position = secondTrajectory[0].clone();
                    vehicle.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
                    
                    const segmentFrames = Math.floor(totalFrames / 3);
                    const segmentDuration = (segmentFrames / frameRate) * 1000;
                    
                    BABYLON.Animation.CreateAndStartAnimation(
                        'vehicleMove1', 
                        vehicle, 
                        'position', 
                        frameRate, 
                        segmentFrames, 
                        secondTrajectory[0], 
                        secondTrajectory[1], 
                        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                    );
                    
                    setTimeout(() => {  
                        vehicle.rotation = new BABYLON.Vector3(0, -0, 0);
                        BABYLON.Animation.CreateAndStartAnimation(
                            'vehicleMove2', 
                            vehicle, 
                            'position', 
                            frameRate, 
                            segmentFrames, 
                            secondTrajectory[1], 
                            secondTrajectory[2], 
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
                    }, segmentDuration);
                    
                    setTimeout(() => {  
                        vehicle.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0);
                        BABYLON.Animation.CreateAndStartAnimation(
                            'vehicleMove3', 
                            vehicle, 
                            'position', 
                            frameRate, 
                            segmentFrames, 
                            secondTrajectory[2], 
                            secondTrajectory[3], 
                            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
                    }, segmentDuration * 2);
                    
                    setTimeout(() => {
                        vehicle.dispose();
                    }, segmentDuration * 3);
                } else if (trajectory === "third") {
                    vehicle.rotation = new BABYLON.Vector3(0, 0, 0);
                    vehicle.position = thirdStartPosition.clone();
                    
                    BABYLON.Animation.CreateAndStartAnimation(
                        'vehicleMove', 
                        vehicle, 
                        'position', 
                        frameRate, 
                        totalFrames, 
                        thirdStartPosition, 
                        thirdEndPosition, 
                        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                    );
                    
                    const durationMs = (totalFrames / frameRate) * 1000;
                    setTimeout(() => {
                        vehicle.dispose();
                    }, durationMs);
                } else if (trajectory === "fourth") {
                    vehicle.rotation = new BABYLON.Vector3(0, -Math.PI / 2, 0); // Rotation 90° pour le trajet vertical
                    vehicle.position = fourthStartPosition.clone();
                    
                    BABYLON.Animation.CreateAndStartAnimation(
                        'vehicleMove', 
                        vehicle, 
                        'position', 
                        frameRate, 
                        totalFrames, 
                        fourthStartPosition, 
                        fourthEndPosition, 
                        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
                    );
                    
                    const durationMs = (totalFrames / frameRate) * 1000;
                    setTimeout(() => {
                        vehicle.dispose();
                    }, durationMs);
                }
            };
    
            // Intervalles pour les quatre trajets
            const spawnInterval1 = 3000; 
            const spawnInterval2 = 5000;
            const spawnInterval3 = 4000;
            const spawnInterval4 = 3500; // Intervalle pour le quatrième trajet
            
            // Stocker les références aux intervalles pour pouvoir les arrêter plus tard
            this.vehicleIntervals = [];
            
            this.vehicleIntervals.push(setInterval(() => {
                spawnVehicle("main");
            }, spawnInterval1));
            
            this.vehicleIntervals.push(setInterval(() => {
                spawnVehicle("second");
            }, spawnInterval2));

            this.vehicleIntervals.push(setInterval(() => {
                spawnVehicle("third");
            }, spawnInterval3));

            this.vehicleIntervals.push(setInterval(() => {
                spawnVehicle("fourth");
            }, spawnInterval4));
    
        } catch (error) {
            console.error("Erreur lors du chargement des modèles GLB:", error);
        }
    }

    _createInstructionsElement() {
        const container = document.createElement("div");
        container.id = "levelInstructionsContainer";
        Object.assign(container.style, {
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: "15px",
            borderRadius: "10px",
            color: "white",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: "none",
            zIndex: "1000",
            width: "300px",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
            transition: "opacity 0.5s, transform 0.5s",
            opacity: "0",
            transform: "translateY(-20px)"
        });

        // Titre du niveau
        const header = document.createElement("div");
        Object.assign(header.style, {
            display: "flex",
            alignItems: "center",
            marginBottom: "10px",
            gap: "10px"
        });

        const icon = document.createElement("div");
        Object.assign(icon.style, {
            fontSize: "24px"
        });
        
        const title = document.createElement("div");
        Object.assign(title.style, {
            fontSize: "18px",
            fontWeight: "bold"
        });
        
        header.appendChild(icon);
        header.appendChild(title);
        container.appendChild(header);
        
        // Instructions du niveau
        const instructionsText = document.createElement("div");
        Object.assign(instructionsText.style, {
            fontSize: "14px",
            lineHeight: "1.4",
            marginBottom: "10px"
        });
        container.appendChild(instructionsText);
        
        // Bouton pour fermer
        const closeButton = document.createElement("button");
        closeButton.textContent = "OK";
        Object.assign(closeButton.style, {
            padding: "5px 15px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "5px",
            color: "white",
            cursor: "pointer",
            marginTop: "5px",
            width: "100%",
            transition: "background-color 0.3s"
        });
        
        closeButton.addEventListener("mouseenter", () => {
            closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        });
        
        closeButton.addEventListener("mouseleave", () => {
            closeButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        });
        
        closeButton.addEventListener("click", () => {
            this._hideInstructions();
        });
        
        container.appendChild(closeButton);
        document.body.appendChild(container);
        
        return {
            container,
            icon,
            title,
            instructionsText,
            closeButton
        };
    }
    
    _showLevelInstructions() {
        const levelInfo = this.levelInstructions[this.currentLevel];
        if (!levelInfo || !this.instructionsElement) return;
        
        this.instructionsElement.icon.textContent = levelInfo.icon;
        this.instructionsElement.title.textContent = levelInfo.title;
        this.instructionsElement.instructionsText.textContent = levelInfo.text;
        
        this.instructionsElement.container.style.display = "block";
        
        // Animation d'entrée
        setTimeout(() => {
            this.instructionsElement.container.style.opacity = "1";
            this.instructionsElement.container.style.transform = "translateY(0)";
        }, 100);
        
        // Masquer automatiquement après 10 secondes
        setTimeout(() => {
            this._hideInstructions();
        }, 10000);
    }
    
    _hideInstructions() {
        if (!this.instructionsElement) return;
        
        this.instructionsElement.container.style.opacity = "0";
        this.instructionsElement.container.style.transform = "translateY(-20px)";
        
        setTimeout(() => {
            this.instructionsElement.container.style.display = "none";
        }, 500);
    }

    _cleanupVehicles() {
        console.log("Nettoyage des véhicules...");
        
        // Supprimer tous les véhicules présents dans la scène
        const vehicles = this.scene.meshes.filter(mesh => 
            mesh.name.startsWith('vehicle_clone_'));
            
        for (const vehicle of vehicles) {
            vehicle.dispose();
        }
        
        // Arrêter les intervalles de génération
        if (this.vehicleIntervals) {
            this.vehicleIntervals.forEach(interval => clearInterval(interval));
            this.vehicleIntervals = [];
        }
        
        console.log("Nettoyage des véhicules terminé.");
    }
}

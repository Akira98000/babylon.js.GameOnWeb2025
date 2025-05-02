import { Level0 } from './Level0.js';
import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
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
            3: new Level3(scene),
            4: new Level4(scene),
            5: new Level5(scene),
            6: new Level6(scene)
        };
        this.cutScenes = {
            1: new CutScene(scene, "NIVEAU 1: LA RENCONTRE", 3000, 1),
            2: new CutScene(scene, "NIVEAU 2: EXPLORATION", 3000, 2),
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
        this.currentAudio = this.standardAudio;
        this.levels[0].onComplete = this.goToNextLevel.bind(this);
        this.levels[1].onComplete = this.goToNextLevel.bind(this);
        this.levels[2].onComplete = this.goToNextLevel.bind(this);
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
                await this.levels[0].init();
                this._showLevelInstructions();
            }
        } else if (this.levels[this.currentLevel]) {
            await this.levels[this.currentLevel].init();
            this._showLevelInstructions();
        }
    }

    checkProximity(playerPosition) {
        if (this.levels[this.currentLevel]) {
            this.levels[this.currentLevel].checkProximity(playerPosition);
        }
    }

    async goToNextLevel() {
        this._cleanupMessages();
        
        if (this.currentLevel === 0) {
            this.currentLevel = 1;
            if (this.cutScenes[1]) {
                this.cutScenes[1].onComplete = () => {
                    this.levels[1].init();
                    this._showLevelInstructions();
                };
                await this.cutScenes[1].init();
            } else {
                await this.levels[1].init();
                this._showLevelInstructions();
            }
        } else if (this.currentLevel === 1) {
            this.currentLevel = 2;
            if (this.cutScenes[2]) {
                this.cutScenes[2].onComplete = () => {
                    this.levels[2].init();
                    this._showLevelInstructions();
                };
                await this.cutScenes[2].init();
            } else {
                await this.levels[2].init();
                this._showLevelInstructions();
            }
        } else if (this.currentLevel === 2) {
            this.currentLevel = 3;
            this.switchToMusic("catastrophe");
            if (this.cutScenes[3]) {
                this.cutScenes[3].onComplete = () => {
                    this.levels[3].init().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level3:", error);
                    });
                    this._showLevelInstructions();
                };
                await this.cutScenes[3].init();
            } else {
                this.levels[3].init().catch(error => {
                    console.error("Erreur lors de l'initialisation du Level3:", error);
                });
                this._showLevelInstructions();
            }
        } else if (this.currentLevel === 3) {
            this._createTransitionEffect();
            if (this.levels[3].forceRestoreColors) {
                this.levels[3].forceRestoreColors();
            }
            this.currentLevel = 4;
            this.switchToMusic("combat");
            setTimeout(async () => {
                if (this.cutScenes[4]) {
                    this.cutScenes[4].onComplete = () => {
                        this.levels[4].init().catch(error => {
                            console.error("Erreur lors de l'initialisation du Level4:", error);
                        });
                        this._showLevelInstructions();
                    };
                    await this.cutScenes[4].init();
                } else {
                    this.levels[4].init().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level4:", error);
                    });
                    this._showLevelInstructions();
                }
            }, 1500);
        } else if (this.currentLevel === 4) {
            this._cleanupAllies();
            
            this._createQuartiersTransitionEffect();
            this.currentLevel = 5;
            setTimeout(async () => {
                if (this.cutScenes[5]) {
                    this.cutScenes[5].onComplete = () => {
                        this.levels[5].init().catch(error => {
                            console.error("Erreur lors de l'initialisation du Level5:", error);
                        });
                        this._showLevelInstructions();
                    };
                    await this.cutScenes[5].init();
                } else {
                    this.levels[5].init().catch(error => {
                        console.error("Erreur lors de l'initialisation du Level5:", error);
                    });
                    this._showLevelInstructions();
                }
            }, 2000);
        } else if (this.currentLevel === 5) {
            this._cleanupAllies();
            this._createRocketTransitionEffect();
            this.currentLevel = 6;
            
            this.levels[6] = new Level6(this.scene, this.scene.getEngine(), this.scene.activeCamera, this.scene.metadata?.player?.hero);
            setTimeout(async () => {
                if (this.cutScenes[6]) {
                    this.cutScenes[6].onComplete = () => {
                        this.levels[6].initialize().catch(error => {
                            console.error("Erreur lors de l'initialisation du Level6:", error);
                        });
                        this._showLevelInstructions();
                    };
                    await this.cutScenes[6].init();
                } else {
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
            case "catastrophe":
                newAudio = this.catastropheAudio;
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
        this.fadeOutAudio(oldAudio);
        
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
        const overlay = document.createElement("div");
        overlay.id = "levelTransitionOverlay";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
        overlay.style.transition = "background-color 1s ease-in-out";
        overlay.style.zIndex = "1000";
        overlay.style.pointerEvents = "none";
        document.body.appendChild(overlay);

        const warningText = document.createElement("div");
        warningText.id = "transitionWarningText";
        warningText.textContent = "ALERTE ! INVASION DE PIZZAS MALÉFIQUES !";
        warningText.style.position = "absolute";
        warningText.style.top = "50%";
        warningText.style.left = "50%";
        warningText.style.transform = "translate(-50%, -50%) scale(0)";
        warningText.style.color = "red";
        warningText.style.fontSize = "36px";
        warningText.style.fontWeight = "bold";
        warningText.style.fontFamily = "Arial, sans-serif";
        warningText.style.textAlign = "center";
        warningText.style.textShadow = "0 0 10px rgba(255, 0, 0, 0.7)";
        warningText.style.transition = "transform 0.5s ease-in-out";
        warningText.style.zIndex = "1001";
        warningText.style.opacity = "0";
        overlay.appendChild(warningText);

        setTimeout(() => {
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            setTimeout(() => {
                warningText.style.opacity = "1";
                warningText.style.transform = "translate(-50%, -50%) scale(1)";
                
                let scale = 1;
                let growing = false;
                const pulseInterval = setInterval(() => {
                    if (growing) {
                        scale += 0.05;
                        if (scale >= 1.2) growing = false;
                    } else {
                        scale -= 0.05;
                        if (scale <= 1) growing = true;
                    }
                    warningText.style.transform = `translate(-50%, -50%) scale(${scale})`;
                }, 100);
                
                setTimeout(() => {
                    clearInterval(pulseInterval);
                    warningText.style.transform = "translate(-50%, -50%) scale(0)";
                    warningText.style.opacity = "0";
                    overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
                    
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 1000);
                }, 3000);
            }, 500);
        }, 100);
    }

    _createQuartiersTransitionEffect() {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
        overlay.style.transition = "background-color 1s ease";
        overlay.style.zIndex = "1000";
        
        const warningText = document.createElement("div");
        warningText.textContent = "ALERTE: INVASION DE QUARTIERS";
        warningText.style.position = "absolute";
        warningText.style.top = "50%";
        warningText.style.left = "50%";
        warningText.style.transform = "translate(-50%, -50%) scale(0.5)";
        warningText.style.color = "red";
        warningText.style.fontSize = "48px";
        warningText.style.fontWeight = "bold";
        warningText.style.textAlign = "center";
        warningText.style.opacity = "0";
        warningText.style.transition = "opacity 0.5s ease, transform 0.5s ease";
        warningText.style.textShadow = "0 0 10px rgba(255, 0, 0, 0.7)";
        
        overlay.appendChild(warningText);
        document.body.appendChild(overlay);
        
        setTimeout(() => {
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            setTimeout(() => {
                warningText.style.opacity = "1";
                warningText.style.transform = "translate(-50%, -50%) scale(1)";
                
                let scale = 1;
                let growing = false;
                const pulseInterval = setInterval(() => {
                    if (growing) {
                        scale += 0.05;
                        if (scale >= 1.2) growing = false;
                    } else {
                        scale -= 0.05;
                        if (scale <= 1) growing = true;
                    }
                    warningText.style.transform = `translate(-50%, -50%) scale(${scale})`;
                }, 100);
                
                setTimeout(() => {
                    clearInterval(pulseInterval);
                    warningText.style.transform = "translate(-50%, -50%) scale(0)";
                    warningText.style.opacity = "0";
                    overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
                    
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 3000);
                }, 3000);
            }, 500);
        }, 100);
    }

    _createRocketTransitionEffect() {
        const overlay = document.createElement("div");
        overlay.id = "levelTransitionOverlay";
        overlay.style.position = "absolute";
        overlay.style.top = "0";
        overlay.style.left = "0";
        overlay.style.width = "100%";
        overlay.style.height = "100%";
        overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
        overlay.style.transition = "background-color 1s ease-in-out";
        overlay.style.zIndex = "1000";
        overlay.style.pointerEvents = "none";
        document.body.appendChild(overlay);

        const warningText = document.createElement("div");
        warningText.id = "transitionWarningText";
        warningText.textContent = "🚀 MISSION : CONSTRUIRE LA FUSÉE D'ÉVACUATION ! 🚀";
        warningText.style.position = "absolute";
        warningText.style.top = "50%";
        warningText.style.left = "50%";
        warningText.style.transform = "translate(-50%, -50%) scale(0)";
        warningText.style.color = "#FFD700";
        warningText.style.fontSize = "36px";
        warningText.style.fontWeight = "bold";
        warningText.style.fontFamily = "Arial, sans-serif";
        warningText.style.textAlign = "center";
        warningText.style.textShadow = "0 0 10px rgba(255, 215, 0, 0.7)";
        warningText.style.transition = "transform 0.5s ease-in-out";
        warningText.style.zIndex = "1001";
        warningText.style.opacity = "0";
        overlay.appendChild(warningText);

        setTimeout(() => {
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            setTimeout(() => {
                warningText.style.opacity = "1";
                warningText.style.transform = "translate(-50%, -50%) scale(1)";
                
                let scale = 1;
                let growing = false;
                const pulseInterval = setInterval(() => {
                    if (growing) {
                        scale += 0.05;
                        if (scale >= 1.2) growing = false;
                    } else {
                        scale -= 0.05;
                        if (scale <= 1) growing = true;
                    }
                    warningText.style.transform = `translate(-50%, -50%) scale(${scale})`;
                }, 100);
                
                setTimeout(() => {
                    clearInterval(pulseInterval);
                    warningText.style.transform = "translate(-50%, -50%) scale(0)";
                    warningText.style.opacity = "0";
                    overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
                    
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 1000);
                }, 3000);
            }, 500);
        }, 100);
    }

    async goToLevel(levelNumber) {
        if (!this.levels[levelNumber]) return;
        
        // Annuler toutes les transitions en cours
        if (document.getElementById('levelTransitionOverlay')) {
            document.getElementById('levelTransitionOverlay').remove();
        }
        
        // Nettoyer le niveau actuel si nécessaire
        if (this.levels[this.currentLevel]) {
            if (this.levels[this.currentLevel].dispose) {
                this.levels[this.currentLevel].dispose();
            }
            if (this.levels[this.currentLevel].cleanup) {
                this.levels[this.currentLevel].cleanup();
            }
            this._cleanupMessages();
            this._cleanupAllies();
        }
        
        this.currentLevel = levelNumber;
        
        // Afficher la cutscene avant de charger le niveau sélectionné
        if (this.cutScenes[levelNumber]) {
            this.cutScenes[levelNumber].onComplete = () => {
                if (levelNumber === 6) {
                    this.levels[levelNumber].initialize();
                } else {
                    this.levels[levelNumber].init();
                }
            };
            await this.cutScenes[levelNumber].init();
        } else {
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
            
            setInterval(() => {
                spawnVehicle("main");
            }, spawnInterval1);
            
            setInterval(() => {
                spawnVehicle("second");
            }, spawnInterval2);

            setInterval(() => {
                spawnVehicle("third");
            }, spawnInterval3);

            setInterval(() => {
                spawnVehicle("fourth");
            }, spawnInterval4);
    
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
}

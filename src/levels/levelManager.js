import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level3 } from './Level3.js';
import { Level4 } from './Level4.js';
import { Level5 } from './Level5.js';
import { Level6 } from './level6.js';
import { AmiAI } from '../amis/AmiAI.js';
import * as BABYLON from '@babylonjs/core';
import '@babylonjs/loaders';

export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.levels = {
            1: new Level1(scene),
            2: new Level2(scene),
            3: new Level3(scene),
            4: new Level4(scene),
            5: new Level5(scene),
            6: new Level6(scene)
        };
        this.currentAudio = this.standardAudio;
        this.levels[1].onComplete = this.goToNextLevel.bind(this);
        this.levels[2].onComplete = this.goToNextLevel.bind(this);
        this.levels[3].onComplete = this.goToNextLevel.bind(this);
        this.levels[4].onComplete = this.goToNextLevel.bind(this);

        // Démarrer l'animation du GLB
        this.loadAndAnimateGLB();
    }

    async initCurrentLevel() {
        if (this.levels[this.currentLevel]) {
            await this.levels[this.currentLevel].init();
        }
    }

    checkProximity(playerPosition) {
        if (this.levels[this.currentLevel]) {
            this.levels[this.currentLevel].checkProximity(playerPosition);
        }
    }

    async goToNextLevel() {
        this._cleanupMessages();
        
        if (this.currentLevel === 1) {
            this.currentLevel = 2;
            await this.levels[2].init();
        } else if (this.currentLevel === 2) {
            this.currentLevel = 3;
            this.switchToMusic("catastrophe");
            this.levels[3].init().then(() => {
            }).catch(error => {
                console.error("Erreur lors de l'initialisation du Level3:", error);
            });
        } else if (this.currentLevel === 3) {
            this._createTransitionEffect();
            if (this.levels[3].forceRestoreColors) {
                this.levels[3].forceRestoreColors();
            }
            this.currentLevel = 4;
            this.switchToMusic("combat");
            
            setTimeout(() => {
                this.levels[4].init().then(() => {
                }).catch(error => {
                    console.error("Erreur lors de l'initialisation du Level4:", error);
                });
            }, 1500);
        } else if (this.currentLevel === 4) {
            this._cleanupAllies();
            
            this._createQuartiersTransitionEffect();
            this.currentLevel = 5;
            
            setTimeout(() => {
                this.levels[5].init().then(() => {
                }).catch(error => {
                    console.error("Erreur lors de l'initialisation du Level5:", error);
                });
            }, 2000);
        } else if (this.currentLevel === 5) {
            this._cleanupAllies();
            this._createRocketTransitionEffect();
            this.currentLevel = 6;
            
            this.levels[6] = new Level6(this.scene, this.scene.getEngine(), this.scene.activeCamera, this.scene.metadata?.player?.hero);
            
            setTimeout(() => {
                this.levels[6].initialize().then(() => {
                }).catch(error => {
                    console.error("Erreur lors de l'initialisation du Level6:", error);
                });
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
        const messages = document.querySelectorAll('[id$="Message"]');
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
                    }, 1000);
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
        // Nettoyer le niveau actuel si nécessaire
        if (this.levels[this.currentLevel]) {
            if (this.levels[this.currentLevel].dispose) {
                this.levels[this.currentLevel].dispose();
            }
            this._cleanupMessages();
            this._cleanupAllies();
        }

        // Changer de niveau
        this.currentLevel = levelNumber;

        // Initialiser le nouveau niveau
        if (this.levels[this.currentLevel]) {
            if (this.currentLevel === 6) {
                await this.levels[this.currentLevel].initialize();
            } else {
                await this.levels[this.currentLevel].init();
            }
        }
    }

    async loadAndAnimateGLB() {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", 
                "./public/pnj/road/",  
                "pnj_poo.glb",        
                this.scene
            );
            
            const mesh = result.meshes[0];
            const startPosition = new BABYLON.Vector3(-121.14, 0.10, -1.51); 
            const endPosition = new BABYLON.Vector3(22.75, 0.10, -1.51);
            const vehicleSpawnPosition = startPosition.clone();
            const vehicleDespawnPosition = endPosition.clone();
    
            mesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
            mesh.position = startPosition.clone();
    
            const frameRate = 15;      
            const totalFrames = 300;   
    
            const moveGLB = () => {
                BABYLON.Animation.CreateAndStartAnimation(
                    'move', mesh, 'position',
                    frameRate, totalFrames,
                    startPosition, endPosition,
                    BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
                );
            };
    
            const spawnVehicle = () => {
                const vehicle = mesh.clone('vehicle');
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
            };
    
            const spawnInterval = 2000; 
            setInterval(() => {
                moveGLB();
                spawnVehicle();
            }, spawnInterval);
    
        } catch (error) {
            console.error("Erreur lors du chargement du modèle GLB:", error);
        }
    }
}

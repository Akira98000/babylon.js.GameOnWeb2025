import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level3 } from './Level3.js';
import { Level4 } from './Level4.js';

export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.levels = {
            1: new Level1(scene),
            2: new Level2(scene),
            3: new Level3(scene),
            4: new Level4(scene)
        };
        
        //this.standardAudio = new Audio("/assets/salsa.mp3");
        //this.standardAudio.loop = true;
        //this.standardAudio.volume = 0;
    
        //this.catastropheAudio = new Audio("/assets/catastrophe.mp3");
        //this.catastropheAudio.loop = true;
        //this.catastropheAudio.volume = 0;
        
        this.currentAudio = this.standardAudio;
        
        /*this.audioPromise = this.currentAudio.play()
            .then(() => {
                console.log("Audio standard démarré avec succès");
                this.fadeInAudio(this.currentAudio);
            })
            .catch(err => {
                console.error("Erreur lors du démarrage de l'audio:", err);
                document.addEventListener('click', () => {
                    this.currentAudio.play()
                        .then(() => this.fadeInAudio(this.currentAudio))
                        .catch(e => console.error("Impossible de démarrer l'audio même après interaction:", e));
                }, { once: true });*/
        
        this.levels[1].onComplete = this.goToNextLevel.bind(this);
        this.levels[2].onComplete = this.goToNextLevel.bind(this);
        this.levels[3].onComplete = this.goToNextLevel.bind(this);
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
        // Nettoyer tous les messages d'interaction
        this._cleanupMessages();
        
        if (this.currentLevel === 1) {
            console.log("Level1 terminé. Passage au Level2");
            this.currentLevel = 2;
            await this.levels[2].init();
        } else if (this.currentLevel === 2) {
            console.log("Level2 terminé. Passage au Level3");
            this.currentLevel = 3;
            this.switchToMusic("catastrophe");
            this.levels[3].init().then(() => {
                console.log("Level3 initialisé avec succès");
            }).catch(error => {
                console.error("Erreur lors de l'initialisation du Level3:", error);
            });
        } else if (this.currentLevel === 3) {
            console.log("Level3 terminé. Passage au Level4");
            
            // Effets de transition
            this._createTransitionEffect();
            
            // Forcer la restauration des couleurs si le niveau 3 a un effet noir et blanc
            if (this.levels[3].forceRestoreColors) {
                this.levels[3].forceRestoreColors();
            }
            
            // Mise à jour du niveau actuel
            this.currentLevel = 4;
            
            // Changement de musique
            this.switchToMusic("combat");
            
            // Initialisation du niveau 4 avec un léger délai pour laisser l'effet de transition se dérouler
            setTimeout(() => {
                this.levels[4].init().then(() => {
                    console.log("Level4 initialisé avec succès");
                }).catch(error => {
                    console.error("Erreur lors de l'initialisation du Level4:", error);
                });
            }, 1500);
        }
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
        // Créer un overlay pour l'effet de transition
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

        // Ajouter un texte d'avertissement
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

        // Animation de l'overlay et du texte
        setTimeout(() => {
            overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            setTimeout(() => {
                warningText.style.opacity = "1";
                warningText.style.transform = "translate(-50%, -50%) scale(1)";
                
                // Animation de pulsation pour le texte
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
                
                // Supprimer l'effet après quelques secondes
                setTimeout(() => {
                    clearInterval(pulseInterval);
                    warningText.style.transform = "translate(-50%, -50%) scale(0)";
                    warningText.style.opacity = "0";
                    overlay.style.backgroundColor = "rgba(0, 0, 0, 0)";
                    
                    // Retirer l'overlay après la fin de l'animation
                    setTimeout(() => {
                        if (overlay.parentNode) {
                            overlay.parentNode.removeChild(overlay);
                        }
                    }, 1000);
                }, 3000);
            }, 500);
        }, 100);
    }
}

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
        
        this.standardAudio = new Audio("/assets/salsa.mp3");
        this.standardAudio.loop = true;
        this.standardAudio.volume = 0;
    
        this.catastropheAudio = new Audio("/assets/catastrophe.mp3");
        this.catastropheAudio.loop = true;
        this.catastropheAudio.volume = 0;
        
        this.combatAudio = new Audio("/assets/combat.mp3");
        this.combatAudio.loop = true;
        this.combatAudio.volume = 0;
        
        this.currentAudio = this.standardAudio;
        
        // Utiliser une promesse pour s'assurer que l'audio est chargé avant de jouer
        this.audioPromise = this.currentAudio.play()
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
                }, { once: true });
            });
        
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
            this.currentLevel = 4;
            this.switchToMusic("combat");
            this.levels[4].init().then(() => {
                console.log("Level4 initialisé avec succès");
            }).catch(error => {
                console.error("Erreur lors de l'initialisation du Level4:", error);
            });
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
}

import { Level1 } from './Level1.js';
import { Level2 } from './Level2.js';
import { Level3 } from './Level3.js';

export class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.levels = {
            1: new Level1(scene),
            2: new Level2(scene),
            3: new Level3(scene)
        };
        
        this.standardAudio = new Audio("/assets/salsa.mp3");
        this.standardAudio.loop = true;
        this.standardAudio.volume = 0;
    
        this.catastropheAudio = new Audio("/assets/catastrophe.mp3");
        this.catastropheAudio.loop = true;
        this.catastropheAudio.volume = 0;
        this.currentAudio = this.standardAudio;
        
        // Utiliser une promesse pour s'assurer que l'audio est chargé avant de jouer
        this.audioPromise = this.currentAudio.play()
            .then(() => {
                console.log("Audio standard démarré avec succès");
                this.fadeInAudio(this.currentAudio);
            })
            .catch(err => {
                console.error("Erreur lors du démarrage de l'audio:", err);
                // En cas d'erreur, on essaie de démarrer l'audio lors d'une interaction utilisateur
                document.addEventListener('click', () => {
                    this.currentAudio.play()
                        .then(() => this.fadeInAudio(this.currentAudio))
                        .catch(e => console.error("Impossible de démarrer l'audio même après interaction:", e));
                }, { once: true });
            });
        
        this.levels[1].onComplete = this.goToNextLevel.bind(this);
        this.levels[2].onComplete = this.goToNextLevel.bind(this);
    }

    async initCurrentLevel() {
        if (this.currentLevel === 1) {
            await this.levels[1].init();
        } else if (this.currentLevel === 2) {
            await this.levels[2].init();
        } else if (this.currentLevel === 3) {
            await this.levels[3].init();
        }
    }

    checkProximity(playerPosition) {
        if (this.currentLevel === 1) {
            this.levels[1].checkProximity(playerPosition);
        } else if (this.currentLevel === 2) {
            this.levels[2].checkProximity(playerPosition);
        } else if (this.currentLevel === 3) {
            this.levels[3].checkProximity(playerPosition);
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
            
            // Changer immédiatement la musique pour le niveau 3
            this.switchToMusic("catastrophe");
            
            // Initialiser le niveau 3 sans attendre
            this.levels[3].init().then(() => {
                console.log("Level3 initialisé avec succès");
            }).catch(error => {
                console.error("Erreur lors de l'initialisation du Level3:", error);
            });
        }
    }
    
    _cleanupMessages() {
        // Supprimer tous les messages d'interaction qui pourraient être affichés
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"], [class*="message"]');
        allMessages.forEach(element => {
            if (element.id !== "storyMessage") {
                element.style.display = "none";
            }
        });
        console.log("Messages d'interaction nettoyés");
    }
    
    switchToMusic(type) {
        // Déterminer quel audio utiliser
        const newAudio = type === "catastrophe" ? this.catastropheAudio : this.standardAudio;
        const oldAudio = this.currentAudio;
        
        // Si c'est déjà le bon audio, ne rien faire
        if (newAudio === oldAudio) return;
        
        console.log(`Changement de musique vers ${type}`);
        
        // Baisser le volume de l'ancien audio
        this.fadeOutAudio(oldAudio);
        
        // Démarrer le nouvel audio
        newAudio.currentTime = 0;
        newAudio.volume = 0;
        
        // Utiliser une promesse pour s'assurer que l'audio est chargé avant de jouer
        newAudio.play()
            .then(() => {
                console.log(`Musique ${type} démarrée avec succès`);
                this.fadeInAudio(newAudio);
                this.currentAudio = newAudio;
            })
            .catch(err => {
                console.error(`Erreur lors du démarrage de la musique ${type}:`, err);
                // En cas d'erreur, on essaie de démarrer l'audio lors d'une interaction utilisateur
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
                
                // Ne pas mettre en pause immédiatement pour éviter les coupures
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

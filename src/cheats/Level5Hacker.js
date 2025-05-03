import * as BABYLON from '@babylonjs/core';

export class Level5Hacker {
    /**
     * Classe pour passer rapidement le niveau 5
     * 
     * @param {BABYLON.Scene} scene - La scène Babylon.js
     */
    constructor(scene) {
        this.scene = scene;
        this.hackButtonElement = null;
    }

    /**
     * Initialise le hack du niveau 5
     */
    init() {
        if (!this.scene || !this.scene.metadata || !this.scene.metadata.level5) {
            console.error("Le niveau 5 n'est pas chargé ou accessible");
            return;
        }

        this._setupHackFunctions();
    }

    /**
     * Configure les fonctions de hack
     */
    _setupHackFunctions() {
        // Raccourci clavier pour ouvrir le menu (touche H)
        window.addEventListener("keydown", (event) => {
            if (event.key.toLowerCase() === "h") {
                event.preventDefault();
                
                // Vérifier le niveau actuel depuis le LevelManager
                const levelManager = this.scene.metadata?.levelManager;
                if (!levelManager) return;
                
                // Afficher uniquement pour les niveaux 1, 2, 2b et 3
                const allowedLevels = [1, 2, '2b', 3];
                if (!allowedLevels.includes(levelManager.currentLevel)) {
                    console.log("Le menu de hack n'est disponible que dans les niveaux 1, 2, 2b et 3.");
                    return;
                }
                
                const level5 = this.scene.metadata.level5;
                if (level5) {
                    this._showHackOptions(level5);
                }
            }
        });
    }

    /**
     * Affiche les options de hack
     * @param {Object} level5 - Instance du niveau 5
     */
    _showHackOptions(level5) {
        const optionsContainer = document.createElement("div");
        optionsContainer.style.position = "absolute";
        optionsContainer.style.top = "50%";
        optionsContainer.style.left = "50%";
        optionsContainer.style.transform = "translate(-50%, -50%)";
        optionsContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        optionsContainer.style.padding = "20px";
        optionsContainer.style.borderRadius = "10px";
        optionsContainer.style.zIndex = "2000";
        optionsContainer.style.color = "white";
        optionsContainer.style.fontFamily = "Arial, sans-serif";

        const title = document.createElement("div");
        title.textContent = "Menu de Hack";
        title.style.fontSize = "24px";
        title.style.marginBottom = "15px";
        title.style.textAlign = "center";
        optionsContainer.appendChild(title);

        const hackOptions = [
            { label: "Terminer les 3 quartiers", action: "finishAllQuartiers" },
            { label: "Démarrer la tempête", action: "startStorm" },
            { label: "Libérer la reine", action: "releaseQueen" },
            { label: "Terminer le niveau", action: "completeLevel" },
            { label: "Niveau suivant immédiat", action: "nextLevelImmediate" },
            { label: "Téléporter aux quartiers", action: "teleport" }
        ];

        hackOptions.forEach(option => {
            const optionButton = document.createElement("div");
            optionButton.textContent = option.label;
            optionButton.style.padding = "8px 10px";
            optionButton.style.margin = "5px 0";
            optionButton.style.backgroundColor = "rgba(80, 0, 80, 0.6)";
            optionButton.style.borderRadius = "3px";
            optionButton.style.cursor = "pointer";
            
            optionButton.addEventListener("mouseover", () => {
                optionButton.style.backgroundColor = "rgba(120, 0, 120, 0.8)";
            });
            
            optionButton.addEventListener("mouseout", () => {
                optionButton.style.backgroundColor = "rgba(80, 0, 80, 0.6)";
            });
            
            optionButton.addEventListener("click", () => {
                this._executeHack(option.action);
                document.body.removeChild(optionsContainer);
            });
            
            optionsContainer.appendChild(optionButton);
        });

        // Ajouter un bouton pour fermer le menu
        const closeButton = document.createElement("div");
        closeButton.textContent = "Fermer";
        closeButton.style.padding = "10px";
        closeButton.style.margin = "20px 0 10px 0";
        closeButton.style.backgroundColor = "rgba(150, 0, 0, 0.6)";
        closeButton.style.borderRadius = "5px";
        closeButton.style.cursor = "pointer";
        closeButton.style.textAlign = "center";
        
        closeButton.addEventListener("mouseover", () => {
            closeButton.style.backgroundColor = "rgba(200, 0, 0, 0.8)";
        });
        
        closeButton.addEventListener("mouseout", () => {
            closeButton.style.backgroundColor = "rgba(150, 0, 0, 0.6)";
        });
        
        closeButton.addEventListener("click", () => {
            document.body.removeChild(optionsContainer);
        });
        
        optionsContainer.appendChild(closeButton);
        document.body.appendChild(optionsContainer);
    }

    /**
     * Exécute l'action de hack sélectionnée
     * @param {string} action - L'action à exécuter
     */
    _executeHack(action) {
        const level5 = this.scene.metadata.level5;
        
        if (!level5) {
            console.error("Level5 non disponible");
            return;
        }

        switch (action) {
            case "finishAllQuartiers":
                this._hackFinishAllQuartiers(level5);
                break;
            case "startStorm":
                this._hackStartStorm(level5);
                break;
            case "releaseQueen":
                this._hackReleaseQueen(level5);
                break;
            case "completeLevel":
                this._hackCompleteLevel(level5);
                break;
            case "nextLevelImmediate":
                this._nextLevelImmediate(level5);
                break;
            case "teleport":
                this._showTeleportOptions(level5);
                break;
            default:
                console.log("Action de hack non reconnue:", action);
        }
    }

    /**
     * Hack: Terminer rapidement tous les quartiers
     * @param {Object} level5 - Instance du niveau 5
     */
    _hackFinishAllQuartiers(level5) {
        // Éliminer tous les ennemis existants
        const allEnemies = [...level5.ennemis];
        allEnemies.forEach(ennemi => {
            level5._eliminerEnnemi(ennemi);
        });
        
        // Mettre à jour le statut des quartiers
        for (let i = 0; i < level5.nombreQuartiers; i++) {
            level5.ennemisParQuartier[i] = 5;
            level5.ennemisVaincusParQuartier[i] = 5;
        }
        
        // Forcer le passage au quartier suivant si nécessaire
        if (level5.quartierActuel < level5.nombreQuartiers) {
            level5.quartierActuel = level5.nombreQuartiers;
        }
        
        level5._showMessage("🔓 HACK: Tous les quartiers ont été libérés! 🔓", 5000);
        
        // Si la tempête n'a pas encore commencé, démarrer la phase finale
        if (!level5.stormStarted) {
            setTimeout(() => {
                this._hackStartStorm(level5);
            }, 1000);
        }
    }

    /**
     * Hack: Démarrer la tempête violette
     * @param {Object} level5 - Instance du niveau 5
     */
    _hackStartStorm(level5) {
        if (!level5.stormStarted) {
            level5._startPurpleStorm();
            level5._showMessage("🔓 HACK: Tempête violette démarrée! 🔓", 5000);
        } else {
            level5._showMessage("La tempête est déjà active!", 3000);
        }
    }

    /**
     * Hack: Libérer la reine
     * @param {Object} level5 - Instance du niveau 5
     */
    _hackReleaseQueen(level5) {
        if (level5.stormStarted && !level5.queenReleased) {
            const queen = this.scene.getMeshByName("helpQueen");
            const queenPosition = queen ? queen.position.clone() : new BABYLON.Vector3(8.45, 0.10, -12.91);
            
            if (queen) {
                level5._releaseQueen(queen, queenPosition);
                level5._showMessage("🔓 HACK: Reine libérée! 🔓", 5000);
            } else {
                level5._showMessage("Impossible de trouver la reine!", 3000);
            }
        } else if (level5.queenReleased) {
            level5._showMessage("La reine est déjà libérée!", 3000);
        } else {
            level5._showMessage("Démarrez d'abord la tempête!", 3000);
        }
    }

    /**
     * Hack: Terminer le niveau directement
     * @param {Object} level5 - Instance du niveau 5
     */
    _hackCompleteLevel(level5) {
        if (!level5.isCompleted) {
            // S'assurer que les métadonnées sont correctes
            if (!level5.scene.metadata) level5.scene.metadata = {};
            level5.scene.metadata.level5 = level5;
            
            // Marquer comme terminé
            level5.isCompleted = true;
            
            // Afficher un message
            level5._showMessage("🔓 HACK: Niveau 5 complété! 🔓", 5000);
            
            // Passer au niveau suivant
            setTimeout(() => {
                level5.dispose();
                if (level5.scene.metadata?.levelManager) {
                    level5.scene.metadata.levelManager.goToNextLevel();
                }
            }, 5000);
        } else {
            level5._showMessage("Le niveau est déjà terminé!", 3000);
        }
    }

    /**
     * Passe immédiatement au niveau suivant sans aucun délai
     * @param {Object} level5 - Instance du niveau 5
     */
    _nextLevelImmediate(level5) {
        level5._showMessage("🔓 HACK: Passage immédiat au niveau suivant! 🔓", 1000);
        
        // Nettoyer et passer au niveau suivant sans délai
        setTimeout(() => {
            level5.dispose();
            if (level5.scene.metadata?.levelManager) {
                level5.scene.metadata.levelManager.goToNextLevel();
            }
        }, 500); // Juste un court délai pour que le message s'affiche
    }

    /**
     * Affiche les options de téléportation
     * @param {Object} level5 - Instance du niveau 5
     */
    _showTeleportOptions(level5) {
        // Créer un menu de téléportation
        const teleportMenu = document.createElement("div");
        teleportMenu.style.position = "absolute";
        teleportMenu.style.top = "50%";
        teleportMenu.style.left = "50%";
        teleportMenu.style.transform = "translate(-50%, -50%)";
        teleportMenu.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        teleportMenu.style.padding = "20px";
        teleportMenu.style.borderRadius = "10px";
        teleportMenu.style.zIndex = "2000";
        teleportMenu.style.color = "white";
        teleportMenu.style.fontFamily = "Arial, sans-serif";
        
        const title = document.createElement("div");
        title.textContent = "Téléportation";
        title.style.fontSize = "24px";
        title.style.marginBottom = "15px";
        title.style.textAlign = "center";
        teleportMenu.appendChild(title);
        
        // Ajouter des boutons pour chaque quartier
        level5.quartiers.forEach((quartier, index) => {
            const button = document.createElement("div");
            button.textContent = `Téléporter au quartier ${quartier.name}`;
            button.style.padding = "10px";
            button.style.margin = "10px 0";
            button.style.backgroundColor = "rgba(80, 0, 80, 0.6)";
            button.style.borderRadius = "5px";
            button.style.cursor = "pointer";
            button.style.textAlign = "center";
            
            button.addEventListener("mouseover", () => {
                button.style.backgroundColor = "rgba(120, 0, 120, 0.8)";
            });
            
            button.addEventListener("mouseout", () => {
                button.style.backgroundColor = "rgba(80, 0, 80, 0.6)";
            });
            
            button.addEventListener("click", () => {
                this._teleportToQuartier(level5, quartier.position);
                document.body.removeChild(teleportMenu);
            });
            
            teleportMenu.appendChild(button);
        });
        
        // Ajouter un bouton pour fermer le menu
        const closeButton = document.createElement("div");
        closeButton.textContent = "Fermer";
        closeButton.style.padding = "10px";
        closeButton.style.margin = "20px 0 10px 0";
        closeButton.style.backgroundColor = "rgba(150, 0, 0, 0.6)";
        closeButton.style.borderRadius = "5px";
        closeButton.style.cursor = "pointer";
        closeButton.style.textAlign = "center";
        
        closeButton.addEventListener("mouseover", () => {
            closeButton.style.backgroundColor = "rgba(200, 0, 0, 0.8)";
        });
        
        closeButton.addEventListener("mouseout", () => {
            closeButton.style.backgroundColor = "rgba(150, 0, 0, 0.6)";
        });
        
        closeButton.addEventListener("click", () => {
            document.body.removeChild(teleportMenu);
        });
        
        teleportMenu.appendChild(closeButton);
        document.body.appendChild(teleportMenu);
    }

    /**
     * Téléporte le joueur vers un quartier spécifique
     * @param {Object} level5 - Instance du niveau 5
     * @param {BABYLON.Vector3} position - Position cible
     */
    _teleportToQuartier(level5, position) {
        if (level5.scene.metadata && level5.scene.metadata.player && level5.scene.metadata.player.hero) {
            const player = level5.scene.metadata.player.hero;
            
            // Ajouter un petit décalage pour éviter les collisions
            const teleportPos = position.clone();
            teleportPos.y += 1;
            
            // Téléporter le joueur
            player.position = teleportPos;
            
            level5._showMessage("🔓 HACK: Téléportation effectuée! 🔓", 3000);
        } else {
            console.error("Player not found for teleportation");
        }
    }

    /**
     * Supprime l'interface de hack
     */
    dispose() {
        // Supprimer tous les menus de hack qui pourraient être ouverts
        const hackMenus = document.querySelectorAll('div[style*="rgba(0, 0, 0, 0.8)"]');
        hackMenus.forEach(menu => {
            if (menu && menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
        });
    }
} 
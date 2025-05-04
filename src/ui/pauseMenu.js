import * as BABYLON from '@babylonjs/core';

export class PauseMenu {
    constructor(scene, levelManager) {
        this.scene = scene;
        this.levelManager = levelManager;
        this.isVisible = false;
        this.isMuted = false;
        
        // Initialiser le layout de clavier à partir des contrôles existants
        if (scene.metadata && scene.metadata.controls && typeof scene.metadata.controls.getCurrentLayout === 'function') {
            this.keyboardLayout = scene.metadata.controls.getCurrentLayout();
        } else {
            this.keyboardLayout = 'AZERTY'; // La disposition par défaut
        }

        // Stocker la référence au son du jeu
        this.music = scene.metadata?.music || null;
        
        // Créer l'interface utilisateur
        this._createUI();
        
        // Créer le bouton pause flottant
        this._createPauseButton();
        
        // Configurer le gestionnaire d'événements pour la touche Échap
        this._setupKeyListeners();
    }
    
    _createUI() {
        // Créer le conteneur principal
        this.menuContainer = document.createElement('div');
        this.menuContainer.id = 'pauseMenuContainer';
        Object.assign(this.menuContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'none',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1000',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        });
        
        // Créer le panneau du menu
        const menuPanel = document.createElement('div');
        Object.assign(menuPanel.style, {
            backgroundColor: 'rgba(50, 50, 50, 0.9)',
            width: '400px',
            padding: '20px',
            borderRadius: '15px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            color: 'white'
        });
        
        // Titre
        const title = document.createElement('h2');
        title.textContent = 'PAUSE';
        Object.assign(title.style, {
            fontSize: '2.5rem',
            marginBottom: '30px',
            background: 'linear-gradient(to right, white, #86a8e7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center'
        });
        
        // Conteneur des boutons
        const buttonsContainer = document.createElement('div');
        Object.assign(buttonsContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            gap: '15px'
        });
        
        // Style commun pour les boutons
        const buttonStyle = {
            padding: '12px 20px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            width: '100%',
            textAlign: 'center',
            transition: 'all 0.3s ease'
        };
        
        // Bouton de reprise du jeu
        const resumeButton = document.createElement('button');
        resumeButton.textContent = 'Reprendre le jeu';
        Object.assign(resumeButton.style, buttonStyle);
        resumeButton.addEventListener('mouseenter', () => {
            resumeButton.style.backgroundColor = 'rgba(120, 120, 120, 0.5)';
        });
        resumeButton.addEventListener('mouseleave', () => {
            resumeButton.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
        });
        resumeButton.addEventListener('click', () => {
            this.hide();
        });
        
        // Bouton pour couper/réactiver le son
        const soundButton = document.createElement('button');
        soundButton.textContent = this.isMuted ? 'Activer le son' : 'Couper le son';
        Object.assign(soundButton.style, buttonStyle);
        soundButton.addEventListener('mouseenter', () => {
            soundButton.style.backgroundColor = 'rgba(120, 120, 120, 0.5)';
        });
        soundButton.addEventListener('mouseleave', () => {
            soundButton.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
        });
        soundButton.addEventListener('click', () => {
            this._toggleSound();
            soundButton.textContent = this.isMuted ? 'Activer le son' : 'Couper le son';
        });
        
        // Bouton pour choisir la disposition du clavier
        const keyboardButton = document.createElement('button');
        keyboardButton.textContent = `Clavier: ${this.keyboardLayout}`;
        Object.assign(keyboardButton.style, buttonStyle);
        keyboardButton.addEventListener('mouseenter', () => {
            keyboardButton.style.backgroundColor = 'rgba(120, 120, 120, 0.5)';
        });
        keyboardButton.addEventListener('mouseleave', () => {
            keyboardButton.style.backgroundColor = 'rgba(100, 100, 100, 0.3)';
        });
        keyboardButton.addEventListener('click', () => {
            this._toggleKeyboardLayout();
            keyboardButton.textContent = `Clavier: ${this.keyboardLayout}`;
        });
        
        // Bouton pour quitter le jeu
        const quitButton = document.createElement('button');
        quitButton.textContent = 'Quitter la partie';
        Object.assign(quitButton.style, {
            ...buttonStyle,
            marginTop: '15px',
            backgroundColor: 'rgba(200, 50, 50, 0.3)'
        });
        quitButton.addEventListener('mouseenter', () => {
            quitButton.style.backgroundColor = 'rgba(255, 70, 70, 0.5)';
        });
        quitButton.addEventListener('mouseleave', () => {
            quitButton.style.backgroundColor = 'rgba(200, 50, 50, 0.3)';
        });
        quitButton.addEventListener('click', () => {
            this._returnToMainMenu();
        });
        
        // Assembler les éléments
        buttonsContainer.appendChild(resumeButton);
        buttonsContainer.appendChild(soundButton);
        buttonsContainer.appendChild(keyboardButton);
        buttonsContainer.appendChild(quitButton);
        
        menuPanel.appendChild(title);
        menuPanel.appendChild(buttonsContainer);
        
        this.menuContainer.appendChild(menuPanel);
        document.body.appendChild(this.menuContainer);
        
        // Stocker les références pour les mises à jour
        this.soundButton = soundButton;
        this.keyboardButton = keyboardButton;
    }
    
    _createPauseButton() {
        // Créer le conteneur du bouton pause
        const pauseButton = document.createElement('div');
        pauseButton.id = 'floatingPauseButton';
        Object.assign(pauseButton.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            backgroundColor: 'rgba(50, 50, 50, 0.7)',
            borderRadius: '10px',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '5px',
            padding: '8px',
            zIndex: '999',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            transition: 'all 0.3s ease',
            border: '2px solid rgba(138, 43, 226, 0.3)'
        });

        // Créer les deux barres du bouton pause
        for (let i = 0; i < 2; i++) {
            const bar = document.createElement('div');
            Object.assign(bar.style, {
                width: '5px',
                height: '20px',
                backgroundColor: 'white',
                borderRadius: '2px',
                boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)'
            });
            pauseButton.appendChild(bar);
        }

        // Ajouter des effets au survol
        pauseButton.addEventListener('mouseenter', () => {
            pauseButton.style.backgroundColor = 'rgba(80, 80, 80, 0.9)';
            pauseButton.style.transform = 'scale(1.1)';
            pauseButton.style.border = '2px solid rgba(138, 43, 226, 0.8)';
            pauseButton.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
            
            // Animation des barres
            const bars = pauseButton.querySelectorAll('div');
            bars.forEach(bar => {
                bar.style.backgroundColor = '#b19cd9';
                bar.style.boxShadow = '0 0 8px rgba(177, 156, 217, 0.8)';
            });
        });

        pauseButton.addEventListener('mouseleave', () => {
            pauseButton.style.backgroundColor = 'rgba(50, 50, 50, 0.7)';
            pauseButton.style.transform = 'scale(1)';
            pauseButton.style.border = '2px solid rgba(138, 43, 226, 0.3)';
            pauseButton.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
            
            // Animation des barres
            const bars = pauseButton.querySelectorAll('div');
            bars.forEach(bar => {
                bar.style.backgroundColor = 'white';
                bar.style.boxShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
            });
        });

        // Ajouter l'action de clic pour ouvrir le menu
        pauseButton.addEventListener('click', () => {
            // Effet visuel lors du clic
            pauseButton.style.transform = 'scale(0.95)';
            setTimeout(() => {
                if (pauseButton) pauseButton.style.transform = 'scale(1.1)';
            }, 100);
            
            // Ouvrir le menu pause
            this.show();
        });

        // Créer un tooltip
        const tooltip = document.createElement('div');
        tooltip.textContent = 'Menu Pause';
        Object.assign(tooltip.style, {
            position: 'absolute',
            top: '105%',
            right: '0',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            opacity: '0',
            transform: 'translateY(-10px)',
            transition: 'all 0.3s ease',
            pointerEvents: 'none'
        });
        
        pauseButton.appendChild(tooltip);
        
        pauseButton.addEventListener('mouseenter', () => {
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });
        
        pauseButton.addEventListener('mouseleave', () => {
            tooltip.style.opacity = '0';
            tooltip.style.transform = 'translateY(-10px)';
        });

        // Ajouter le bouton au document
        document.body.appendChild(pauseButton);
        this.pauseButton = pauseButton;
    }
    
    _setupKeyListeners() {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                if (this.isVisible) {
                    this.hide();
                } else {
                    this.show();
                }
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        this.keyDownHandler = handleKeyDown;
    }
    
    _toggleSound() {
        this.isMuted = !this.isMuted;
        
        console.log("Bouton son cliqué. Nouvel état:", this.isMuted ? "Muet" : "Actif");
        
        // 1. Gérer la musique du LevelManager
        if (this.levelManager) {
            console.log("LevelManager trouvé, gestion de ses audios");
            if (this.levelManager.standardAudio) {
                this.levelManager.standardAudio.volume = this.isMuted ? 0 : 0.5;
                console.log("Volume standardAudio changé à:", this.levelManager.standardAudio.volume);
            }
            if (this.levelManager.combatAudio) {
                this.levelManager.combatAudio.volume = this.isMuted ? 0 : 0.5;
                console.log("Volume combatAudio changé à:", this.levelManager.combatAudio.volume);
            }
            if (this.levelManager.currentAudio) {
                this.levelManager.currentAudio.volume = this.isMuted ? 0 : 0.5;
                console.log("Volume currentAudio changé à:", this.levelManager.currentAudio.volume);
            }
        }
        
        // 2. Gérer la musique du module music.js
        if (this.music) {
            console.log("Musique trouvée dans les métadonnées");
            if (this.music.horrorMusic) {
                this.music.horrorMusic.setVolume(this.isMuted ? 0 : 0.5);
                console.log("Volume horrorMusic changé");
            }
            if (this.music.salsaMusic) {
                this.music.salsaMusic.setVolume(this.isMuted ? 0 : 0.5);
                console.log("Volume salsaMusic changé");
            }
        }
        
        // 3. Gérer tous les sons de la scène Babylon.js
        if (this.scene) {
            const allSounds = this.scene.soundTracks?.[0]?.soundCollection || [];
            console.log(`Nombre de sons dans la scène: ${allSounds.length}`);
            
            allSounds.forEach(sound => {
                if (sound && sound.setVolume) {
                    const originalVolume = sound._volume || (this.isMuted ? 0 : 0.5);
                    sound.setVolume(this.isMuted ? 0 : originalVolume);
                    console.log(`Volume de ${sound.name || "son inconnu"} changé à: ${this.isMuted ? 0 : originalVolume}`);
                }
            });
        }
        
        // 4. Gérer le son du jeu global (HTMLAudioElement)
        const allAudioElements = document.querySelectorAll('audio');
        console.log(`Nombre d'éléments audio HTML: ${allAudioElements.length}`);
        
        allAudioElements.forEach(audio => {
            audio.volume = this.isMuted ? 0 : 0.5;
            console.log(`Volume d'un élément audio HTML changé à: ${audio.volume}`);
        });
        
        // Mettre à jour l'interface
        if (this.soundButton) {
            this.soundButton.textContent = this.isMuted ? 'Activer le son' : 'Couper le son';
        }
    }
    
    _toggleKeyboardLayout() {
        // Basculer entre AZERTY et QWERTY
        this.keyboardLayout = this.keyboardLayout === 'AZERTY' ? 'QWERTY' : 'AZERTY';
        
        // Si les contrôles existent dans les métadonnées de la scène
        if (this.scene.metadata && this.scene.metadata.controls) {
            const controls = this.scene.metadata.controls;
            
            // Utiliser la méthode changeKeyboardLayout que nous venons d'ajouter
            if (typeof controls.changeKeyboardLayout === 'function') {
                controls.changeKeyboardLayout(this.keyboardLayout);
                
                // Notifier le joueur du changement
                this._showNotification(`Clavier changé en ${this.keyboardLayout}`);
            }
        }
    }
    
    _showNotification(message) {
        // Créer une notification temporaire
        const notification = document.createElement('div');
        notification.textContent = message;
        Object.assign(notification.style, {
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '10px 20px',
            borderRadius: '5px',
            fontSize: '1rem',
            zIndex: '1001',
            transition: 'opacity 0.5s',
            opacity: '0'
        });
        
        document.body.appendChild(notification);
        
        // Animation d'apparition/disparition
        setTimeout(() => {
            notification.style.opacity = '1';
            setTimeout(() => {
                notification.style.opacity = '0';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 500);
            }, 2000);
        }, 10);
    }
    
    _returnToMainMenu() {
        // Masquer le menu pause
        this.hide();
        
        // Afficher une confirmation
        const confirmDialog = document.createElement('div');
        Object.assign(confirmDialog.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '1001'
        });
        
        const dialogContent = document.createElement('div');
        Object.assign(dialogContent.style, {
            backgroundColor: 'rgba(50, 50, 50, 0.9)',
            padding: '20px',
            borderRadius: '10px',
            border: '2px solid rgba(138, 43, 226, 0.8)',
            width: '350px',
            textAlign: 'center',
            color: 'white'
        });
        
        const dialogTitle = document.createElement('h3');
        dialogTitle.textContent = 'Quitter la partie ?';
        Object.assign(dialogTitle.style, {
            fontSize: '1.5rem',
            marginBottom: '15px'
        });
        
        const dialogMessage = document.createElement('p');
        dialogMessage.textContent = 'Êtes-vous sûr de vouloir quitter ? Votre progression sera perdue.';
        Object.assign(dialogMessage.style, {
            marginBottom: '20px'
        });
        
        const buttonContainer = document.createElement('div');
        Object.assign(buttonContainer.style, {
            display: 'flex',
            justifyContent: 'space-between',
            gap: '10px'
        });
        
        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Annuler';
        Object.assign(cancelButton.style, {
            padding: '10px',
            backgroundColor: 'rgba(100, 100, 100, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            flexGrow: '1'
        });
        
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirmer';
        Object.assign(confirmButton.style, {
            padding: '10px',
            backgroundColor: 'rgba(200, 50, 50, 0.5)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            flexGrow: '1'
        });
        
        // Actions des boutons
        cancelButton.addEventListener('click', () => {
            document.body.removeChild(confirmDialog);
        });
        
        confirmButton.addEventListener('click', () => {
            // Nettoyer tous les éléments du jeu
            this.dispose();
            
            // Si le gestionnaire de niveau existe, retourner au menu principal
            if (this.levelManager && typeof this.levelManager.returnToMainMenu === 'function') {
                this.levelManager.returnToMainMenu();
            } else {
                // Recharger la page si aucune méthode dédiée n'est disponible
                window.location.reload();
            }
        });
        
        // Assembler la boîte de dialogue
        buttonContainer.appendChild(cancelButton);
        buttonContainer.appendChild(confirmButton);
        dialogContent.appendChild(dialogTitle);
        dialogContent.appendChild(dialogMessage);
        dialogContent.appendChild(buttonContainer);
        confirmDialog.appendChild(dialogContent);
        
        document.body.appendChild(confirmDialog);
    }
    
    show() {
        if (!this.isVisible) {
            this.isVisible = true;
            this.menuContainer.style.display = 'flex';
            
            // Mettre le jeu en pause
            if (this.scene) {
                this.scene.metadata = this.scene.metadata || {};
                this.scene.metadata.pauseState = {
                    wasPaused: this.scene.paused
                };
                this.scene.paused = true;
            }
        }
    }
    
    hide() {
        if (this.isVisible) {
            this.isVisible = false;
            this.menuContainer.style.display = 'none';
            
            // Reprendre le jeu
            if (this.scene && this.scene.metadata && this.scene.metadata.pauseState) {
                this.scene.paused = this.scene.metadata.pauseState.wasPaused || false;
            }
        }
    }
    
    dispose() {
        // Nettoyer les écouteurs d'événements
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            this.keyDownHandler = null;
        }
        
        // Supprimer les éléments DOM
        if (this.menuContainer && this.menuContainer.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
            this.menuContainer = null;
        }
        
        // Supprimer le bouton pause
        if (this.pauseButton && this.pauseButton.parentNode) {
            this.pauseButton.parentNode.removeChild(this.pauseButton);
            this.pauseButton = null;
        }
        
        this.scene = null;
        this.levelManager = null;
    }
} 
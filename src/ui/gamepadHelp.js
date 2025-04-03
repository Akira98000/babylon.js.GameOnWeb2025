/**
 * Fenêtre d'aide pour la configuration et le test de manettes
 */
import { GamepadUtility } from "./gamepadUtility.js";

export class GamepadHelp {
    /**
     * Crée la fenêtre d'aide pour les manettes
     */
    constructor() {
        this.helpContainer = null;
        this.isVisible = false;
        this.gamepadTestingInterval = null;
        this.axesDisplay = [];
        this.buttonDisplay = [];
        this._createUI();
    }
    
    /**
     * Crée l'interface utilisateur
     */
    _createUI() {
        // Créer le conteneur principal
        this.helpContainer = document.createElement('div');
        Object.assign(this.helpContainer.style, {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: 'white',
            padding: '20px',
            borderRadius: '10px',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            zIndex: '2000',
            display: 'none',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 5px 20px rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        });
        
        // Créer le titre
        const title = document.createElement('h2');
        title.textContent = 'Aide Manette PS4';
        Object.assign(title.style, {
            textAlign: 'center',
            marginTop: '0',
            paddingBottom: '10px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#86a8e7'
        });
        this.helpContainer.appendChild(title);
        
        // Instructions de base
        const instructions = document.createElement('div');
        instructions.innerHTML = `
            <h3>Comment connecter votre manette :</h3>
            <ol>
                <li>Assurez-vous que votre manette est chargée</li>
                <li>Pour connecter en Bluetooth : maintenez simultanément les boutons SHARE et PS enfoncés jusqu'à ce que la lumière clignote</li>
                <li>Pour connecter en USB : utilisez un câble micro-USB</li>
                <li>Si la manette n'est pas détectée, essayez de rafraîchir la page</li>
            </ol>
            
            <h3>Contrôles du jeu :</h3>
            <ul>
                <li><strong>Joystick gauche</strong> : Déplacement</li>
                <li><strong>Joystick droit</strong> : Rotation de la caméra</li>
                <li><strong>X / R1 / R2</strong> : Tirer</li>
                <li><strong>Triangle</strong> : Danser</li>
            </ul>
        `;
        this.helpContainer.appendChild(instructions);
        
        // Section de test des manettes
        const testingSection = document.createElement('div');
        Object.assign(testingSection.style, {
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '5px'
        });
        
        const testingSectionTitle = document.createElement('h3');
        testingSectionTitle.textContent = 'Test de votre manette';
        testingSectionTitle.style.marginTop = '0';
        testingSection.appendChild(testingSectionTitle);
        
        const gamepadStatus = document.createElement('div');
        gamepadStatus.id = 'gamepad-help-status';
        gamepadStatus.textContent = 'Aucune manette détectée';
        Object.assign(gamepadStatus.style, {
            color: '#ff6b6b',
            fontWeight: 'bold',
            marginBottom: '10px'
        });
        testingSection.appendChild(gamepadStatus);
        this.gamepadStatus = gamepadStatus;
        
        // Affichage des axes
        const axesContainer = document.createElement('div');
        axesContainer.innerHTML = '<strong>Joysticks :</strong>';
        Object.assign(axesContainer.style, {
            marginBottom: '15px'
        });
        
        // Créer une grille pour les axes
        const axesGrid = document.createElement('div');
        Object.assign(axesGrid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginTop: '10px'
        });
        
        // Ajouter des visualisations pour chaque axe
        const axesNames = ['Gauche X', 'Gauche Y', 'Droit X', 'Droit Y'];
        for (let i = 0; i < 4; i++) {
            const axisContainer = document.createElement('div');
            Object.assign(axisContainer.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            });
            
            const axisLabel = document.createElement('div');
            axisLabel.textContent = axesNames[i] + ':';
            axisLabel.style.width = '70px';
            
            const axisBarContainer = document.createElement('div');
            Object.assign(axisBarContainer.style, {
                flex: '1',
                height: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                position: 'relative',
                overflow: 'hidden'
            });
            
            const axisBar = document.createElement('div');
            Object.assign(axisBar.style, {
                position: 'absolute',
                top: '0',
                left: '50%',
                height: '100%',
                width: '4px',
                backgroundColor: '#4a90e2',
                transition: 'transform 0.1s ease',
                transform: 'translateX(-50%)'
            });
            
            const axisValue = document.createElement('div');
            axisValue.textContent = '0.00';
            Object.assign(axisValue.style, {
                width: '40px',
                textAlign: 'right'
            });
            
            axisBarContainer.appendChild(axisBar);
            axisContainer.appendChild(axisLabel);
            axisContainer.appendChild(axisBarContainer);
            axisContainer.appendChild(axisValue);
            
            axesGrid.appendChild(axisContainer);
            this.axesDisplay.push({ bar: axisBar, value: axisValue });
        }
        
        axesContainer.appendChild(axesGrid);
        testingSection.appendChild(axesContainer);
        
        // Affichage des boutons
        const buttonsContainer = document.createElement('div');
        buttonsContainer.innerHTML = '<strong>Boutons :</strong>';
        Object.assign(buttonsContainer.style, {
            marginBottom: '15px'
        });
        
        // Créer une grille pour les boutons
        const buttonsGrid = document.createElement('div');
        Object.assign(buttonsGrid.style, {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '10px',
            marginTop: '10px'
        });
        
        // Ajouter des visualisations pour chaque bouton principal
        const buttonLabels = [
            'X (0)', 'O (1)', '□ (2)', '△ (3)',
            'L1 (4)', 'R1 (5)', 'L2 (6)', 'R2 (7)',
            'Share (8)', 'Options (9)', 'L3 (10)', 'R3 (11)'
        ];
        
        for (let i = 0; i < buttonLabels.length; i++) {
            const buttonIndicator = document.createElement('div');
            Object.assign(buttonIndicator.style, {
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                padding: '10px 5px',
                borderRadius: '5px',
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                transition: 'all 0.2s ease'
            });
            buttonIndicator.textContent = buttonLabels[i];
            
            buttonsGrid.appendChild(buttonIndicator);
            this.buttonDisplay.push(buttonIndicator);
        }
        
        buttonsContainer.appendChild(buttonsGrid);
        testingSection.appendChild(buttonsContainer);
        this.helpContainer.appendChild(testingSection);
        
        // Boutons de fermeture et de résolution des problèmes
        const buttonsFooter = document.createElement('div');
        Object.assign(buttonsFooter.style, {
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            gap: '10px',
            flexWrap: 'wrap'
        });
        
        // Bouton pour inverser l'axe X
        const invertXButton = document.createElement('button');
        invertXButton.textContent = 'Inverser axe X';
        Object.assign(invertXButton.style, {
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            flex: '1'
        });
        
        // Vérifier l'état actuel de l'inversion
        const isXInverted = localStorage.getItem('gamepadInvertXAxis') === 'true';
        invertXButton.textContent = isXInverted ? 'Désactiver inversion X' : 'Inverser axe X';
        
        invertXButton.addEventListener('click', () => {
            const currentInversion = localStorage.getItem('gamepadInvertXAxis') === 'true';
            localStorage.setItem('gamepadInvertXAxis', !currentInversion);
            invertXButton.textContent = !currentInversion ? 'Désactiver inversion X' : 'Inverser axe X';
            alert(`Axe X ${!currentInversion ? 'inversé' : 'normal'}. Testez le mouvement gauche/droite.`);
        });
        
        const resetButton = document.createElement('button');
        resetButton.textContent = 'Réinitialiser les contrôles';
        Object.assign(resetButton.style, {
            backgroundColor: '#4a90e2',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            flex: '1'
        });
        
        resetButton.addEventListener('click', () => {
            localStorage.removeItem('gamepadConfig');
            localStorage.removeItem('gamepadInvertXAxis');
            localStorage.removeItem('gamepadInvertYAxis');
            alert('Configuration de la manette réinitialisée. La page va être rechargée.');
            window.location.reload();
        });
        
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fermer';
        Object.assign(closeButton.style, {
            backgroundColor: '#ff6b6b',
            color: 'white',
            border: 'none',
            padding: '10px 15px',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            flex: '1'
        });
        
        closeButton.addEventListener('click', () => {
            this.hide();
        });
        
        // Ajouter des explications pour le dépannage
        const troubleshootingTips = document.createElement('div');
        troubleshootingTips.innerHTML = `
            <h3>Problèmes courants :</h3>
            <ul>
                <li>Si vous ne pouvez pas aller à <strong>gauche</strong>, cliquez sur "Inverser axe X"</li>
                <li>Essayez de reconnecter la manette et rafraîchir la page si les contrôles ne répondent pas</li>
                <li>Certains navigateurs requièrent une interaction avec la page avant d'utiliser une manette</li>
            </ul>
        `;
        Object.assign(troubleshootingTips.style, {
            marginTop: '20px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '5px',
            fontSize: '0.9em'
        });
        
        this.helpContainer.appendChild(troubleshootingTips);
        
        buttonsFooter.appendChild(invertXButton);
        buttonsFooter.appendChild(resetButton);
        buttonsFooter.appendChild(closeButton);
        this.helpContainer.appendChild(buttonsFooter);
        
        document.body.appendChild(this.helpContainer);
    }
    
    /**
     * Affiche la fenêtre d'aide
     */
    show() {
        if (this.helpContainer) {
            this.helpContainer.style.display = 'block';
            this.isVisible = true;
            this._startGamepadTesting();
        }
    }
    
    /**
     * Cache la fenêtre d'aide
     */
    hide() {
        if (this.helpContainer) {
            this.helpContainer.style.display = 'none';
            this.isVisible = false;
            this._stopGamepadTesting();
        }
    }
    
    /**
     * Démarre le test des manettes
     */
    _startGamepadTesting() {
        this._stopGamepadTesting();
        
        this.gamepadTestingInterval = setInterval(() => {
            const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
            let gamepadFound = false;
            
            for (let i = 0; i < gamepads.length; i++) {
                const gamepad = gamepads[i];
                if (gamepad && gamepad.connected) {
                    gamepadFound = true;
                    this.gamepadStatus.textContent = `Manette détectée: ${gamepad.id}`;
                    this.gamepadStatus.style.color = '#7fff7f';
                    
                    // Mettre à jour l'affichage des axes
                    const config = GamepadUtility.detectConfiguration(gamepad);
                    
                    // Axes
                    this._updateAxesDisplay(gamepad, config);
                    
                    // Boutons
                    this._updateButtonsDisplay(gamepad);
                    
                    break;
                }
            }
            
            if (!gamepadFound) {
                this.gamepadStatus.textContent = 'Aucune manette détectée';
                this.gamepadStatus.style.color = '#ff6b6b';
                
                // Réinitialiser l'affichage des axes et boutons
                this._resetDisplay();
            }
        }, 100);
    }
    
    /**
     * Arrête le test des manettes
     */
    _stopGamepadTesting() {
        if (this.gamepadTestingInterval) {
            clearInterval(this.gamepadTestingInterval);
            this.gamepadTestingInterval = null;
        }
    }
    
    /**
     * Met à jour l'affichage des axes
     * @param {Gamepad} gamepad - La manette à tester
     * @param {Object} config - La configuration de la manette
     */
    _updateAxesDisplay(gamepad, config) {
        // Mise à jour pour chaque axe principal
        const axesNames = ['leftStickX', 'leftStickY', 'rightStickX', 'rightStickY'];
        
        for (let i = 0; i < axesNames.length; i++) {
            if (i >= this.axesDisplay.length) break;
            
            const axisValue = GamepadUtility.getAxisValue(gamepad, config, axesNames[i], 0);
            const displayValue = parseFloat(axisValue).toFixed(2);
            this.axesDisplay[i].value.textContent = displayValue;
            
            // Mettre à jour la position de la barre
            // La valeur va de -1 à 1, on la transforme en pourcentage de 0% à 100%
            const percentage = ((axisValue + 1) / 2) * 100;
            this.axesDisplay[i].bar.style.transform = `translateX(${percentage - 50}%)`;
            this.axesDisplay[i].bar.style.width = Math.abs(axisValue) * 50 + '%';
            this.axesDisplay[i].bar.style.backgroundColor = axisValue === 0 ? '#4a90e2' : 
                (Math.abs(axisValue) > 0.5 ? '#7fff7f' : '#ffff7f');
        }
    }
    
    /**
     * Met à jour l'affichage des boutons
     * @param {Gamepad} gamepad - La manette à tester
     */
    _updateButtonsDisplay(gamepad) {
        for (let i = 0; i < Math.min(gamepad.buttons.length, this.buttonDisplay.length); i++) {
            const button = gamepad.buttons[i];
            const isPressed = button.pressed || button.value > 0.5;
            
            this.buttonDisplay[i].style.backgroundColor = isPressed ? '#7fff7f' : 'rgba(255, 255, 255, 0.2)';
            this.buttonDisplay[i].style.color = isPressed ? 'black' : 'rgba(255, 255, 255, 0.7)';
            this.buttonDisplay[i].style.transform = isPressed ? 'scale(1.05)' : 'scale(1)';
        }
    }
    
    /**
     * Réinitialise l'affichage quand aucune manette n'est détectée
     */
    _resetDisplay() {
        // Réinitialiser les axes
        for (let i = 0; i < this.axesDisplay.length; i++) {
            this.axesDisplay[i].value.textContent = '0.00';
            this.axesDisplay[i].bar.style.transform = 'translateX(-50%)';
            this.axesDisplay[i].bar.style.width = '4px';
            this.axesDisplay[i].bar.style.backgroundColor = '#4a90e2';
        }
        
        // Réinitialiser les boutons
        for (let i = 0; i < this.buttonDisplay.length; i++) {
            this.buttonDisplay[i].style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            this.buttonDisplay[i].style.color = 'rgba(255, 255, 255, 0.7)';
            this.buttonDisplay[i].style.transform = 'scale(1)';
        }
    }
    
    /**
     * Bascule la visibilité de la fenêtre d'aide
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }
} 
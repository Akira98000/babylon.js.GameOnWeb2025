/**
 * Classe utilitaire pour gérer les manettes de jeu avec différentes configurations
 */
export class GamepadUtility {
    /**
     * Détecte la configuration de la manette et ajuste les mappings en conséquence
     * @param {Gamepad} gamepad - L'objet Gamepad à analyser
     * @returns {Object} Configuration adaptée pour cette manette
     */
    static detectConfiguration(gamepad) {
        if (!gamepad) return null;
        
        console.log("Détection de la configuration de manette pour:", gamepad.id);
        
        // Vérifier si l'utilisateur a demandé des configurations manuelles
        const manualInvertX = localStorage.getItem('gamepadInvertXAxis') === 'true';
        const manualInvertY = localStorage.getItem('gamepadInvertYAxis') === 'true';
        
        if (manualInvertX || manualInvertY) {
            console.log("Configuration manuelle détectée:", 
                manualInvertX ? "Axe X inversé" : "Axe X normal",
                manualInvertY ? "Axe Y inversé" : "Axe Y normal");
        }
        
        const config = {
            isPS4: false,
            isXbox: false,
            invertYAxis: true, // Par défaut, nous inversons l'axe Y
            _debugInitial: true, // Flag pour un debugging initial plus fréquent
            buttonMappings: {
                cross: 0,      // X sur PS4, A sur Xbox
                circle: 1,     // O sur PS4, B sur Xbox
                square: 2,     // □ sur PS4, X sur Xbox
                triangle: 3,   // △ sur PS4, Y sur Xbox
                l1: 4,
                r1: 5,
                l2: 6,
                r2: 7,
                share: 8,      // Share sur PS4, View sur Xbox
                options: 9,    // Options sur PS4, Menu sur Xbox
                l3: 10,        // Joystick gauche pressé
                r3: 11,        // Joystick droit pressé
                home: 12,      // PS Button sur PS4, Xbox Button sur Xbox
                touchpad: 13   // Touchpad sur PS4 (non présent sur Xbox)
            },
            axisMappings: {
                leftStickX: 0,
                leftStickY: 1,
                rightStickX: 2,
                rightStickY: 3
            }
        };
        
        // Détection basée sur l'ID de la manette
        const id = gamepad.id.toLowerCase();
        
        if (id.includes("054c") || id.includes("sony") || id.includes("dualshock") || id.includes("playstation") || id.includes("ps4") || id.includes("ps5") || id.includes("wireless controller")) {
            config.isPS4 = true;
            console.log("Manette PlayStation détectée");
            
            // Configuration standard pour DualShock 4
            config.buttonMappings = {
                cross: 0,     // X
                circle: 1,    // O
                square: 2,    // □
                triangle: 3,  // △
                l1: 4,
                r1: 5,
                l2: 6,
                r2: 7,
                share: 8,
                options: 9,
                l3: 10,
                r3: 11,
                home: 12,
                touchpad: 13
            };
            
            // Les axes sur DualShock 4 sont:
            // 0: Joystick gauche X (-1 est gauche, +1 est droite)
            // 1: Joystick gauche Y (-1 est haut, +1 est bas) - besoin d'inversion
            // 2: Joystick droit X (-1 est gauche, +1 est droite)
            // 3: Joystick droit Y (-1 est haut, +1 est bas) - besoin d'inversion
            config.axisMappings = {
                leftStickX: 0,
                leftStickY: 1,
                rightStickX: 2,
                rightStickY: 3
            };
            
            config.invertYAxis = true;
        } else if (id.includes("xbox") || id.includes("microsoft")) {
            config.isXbox = true;
            console.log("Manette Xbox détectée");
        }
        
        // Vérification de l'état initial des axes pour la configuration
        if (gamepad.axes.length >= 4) {
            console.log("Valeurs initiales des axes:", 
                         "X-Gauche:", gamepad.axes[0].toFixed(2), 
                         "Y-Gauche:", gamepad.axes[1].toFixed(2),
                         "X-Droit:", gamepad.axes[2].toFixed(2),
                         "Y-Droit:", gamepad.axes[3].toFixed(2));
        }
        
        // Ajuster en fonction du nombre de boutons détectés
        if (gamepad.buttons.length < 14) {
            console.log(`Nombre de boutons limité (${gamepad.buttons.length}), ajustement des mappings`);
            // Configurations simplifiées pour manettes avec moins de boutons
            if (gamepad.buttons.length >= 10) {
                config.buttonMappings.home = Math.min(12, gamepad.buttons.length - 1);
            }
            if (gamepad.buttons.length <= 12) {
                config.buttonMappings.touchpad = config.buttonMappings.home;
            }
        }
        
        // Ajuster en fonction du nombre d'axes
        if (gamepad.axes.length < 4) {
            console.log(`Nombre d'axes limité (${gamepad.axes.length}), ajustement des mappings`);
            // Configuration simplifiée pour manettes avec moins d'axes
            config.axisMappings.rightStickX = Math.min(2, gamepad.axes.length - 1);
            config.axisMappings.rightStickY = Math.min(3, gamepad.axes.length - 1);
        }
        
        return config;
    }
    
    /**
     * Obtient la valeur d'un axe avec la zone morte appliquée
     * @param {Gamepad} gamepad - L'objet Gamepad
     * @param {Object} config - Configuration de la manette
     * @param {string} axisName - Nom de l'axe (leftStickX, leftStickY, rightStickX, rightStickY)
     * @param {number} deadzone - Valeur de la zone morte (0.0 à 1.0)
     * @param {boolean} invert - Si vrai, inverse la valeur de l'axe
     * @returns {number} Valeur de l'axe (-1.0 à 1.0) ou 0 si dans la zone morte
     */
    static getAxisValue(gamepad, config, axisName, deadzone = 0.15, invert = false) {
        if (!gamepad || !config || !config.axisMappings[axisName]) return 0;
        
        const axisIndex = config.axisMappings[axisName];
        if (axisIndex >= gamepad.axes.length) return 0;
        
        let value = gamepad.axes[axisIndex];
        
        // Vérifier si l'utilisateur a demandé une inversion manuelle des axes
        const manualInvertX = localStorage.getItem('gamepadInvertXAxis') === 'true';
        const manualInvertY = localStorage.getItem('gamepadInvertYAxis') === 'true';
        
        // Correction pour manettes avec axes inversés
        if (axisName === 'leftStickX' && manualInvertX) {
            // Inverser l'axe X si l'utilisateur l'a demandé
            value = -value;
        } else if ((axisName === 'leftStickY' || axisName === 'rightStickY')) {
            // Pour les axes Y, appliquer l'inversion standard et l'inversion manuelle si configurée
            if (config.invertYAxis !== manualInvertY) {
                value = -value;
            }
        } else if (axisName === 'rightStickX' && manualInvertX) {
            // Inverser l'axe X droit si configuré
            value = -value;
        }
        
        // Appliquer l'inversion supplémentaire si demandée
        if (invert) {
            value = -value;
        }
        
        // Appliquer la zone morte
        return Math.abs(value) > deadzone ? value : 0;
    }
    
    /**
     * Vérifie si un bouton est pressé
     * @param {Gamepad} gamepad - L'objet Gamepad
     * @param {Object} config - Configuration de la manette
     * @param {string} buttonName - Nom du bouton (cross, circle, square, triangle, etc.)
     * @param {number} threshold - Seuil pour les boutons analogiques (0.0 à 1.0)
     * @returns {boolean} Vrai si le bouton est pressé
     */
    static isButtonPressed(gamepad, config, buttonName, threshold = 0.5) {
        if (!gamepad || !config || !config.buttonMappings[buttonName]) return false;
        
        const buttonIndex = config.buttonMappings[buttonName];
        if (buttonIndex >= gamepad.buttons.length) return false;
        
        const button = gamepad.buttons[buttonIndex];
        return button.pressed || button.value > threshold;
    }
    
    /**
     * Obtient toutes les touches pressées de la manette
     * @param {Gamepad} gamepad - L'objet Gamepad
     * @returns {Array} Tableau des index des boutons pressés
     */
    static getPressedButtons(gamepad) {
        if (!gamepad) return [];
        
        return gamepad.buttons
            .map((button, index) => button.pressed ? index : -1)
            .filter(index => index >= 0);
    }
} 
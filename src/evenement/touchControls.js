import * as BABYLON from "@babylonjs/core";

export class TouchControls {
    constructor(scene, canvas) {
        this.scene = scene;
        this.canvas = canvas;
        this.enabled = false;
        this.joystickActive = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.maxDistance = 50;
        this.joystickContainer = null;
        this.joystickKnob = null;
        this.actionButtons = null;
        this.fireButton = null;
        this.jumpButton = null;
        
        // Variables pour la rotation par toucher
        this.touchRotating = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.rotationSensitivity = 0.005;

        this.inputMap = {
            z: false,  // forward
            s: false,  // backward
            q: false,  // left
            d: false,  // right
            space: false,  // jump
            shift: false   // sprint
        };

        this._createUI();
        this._setupEventListeners();
    }

    _createUI() {
        // Conteneur principal
        this.mobileControls = document.createElement('div');
        this.mobileControls.id = 'mobile-controls';
        document.body.appendChild(this.mobileControls);

        // Joystick
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.id = 'joystick-container';
        this.mobileControls.appendChild(this.joystickContainer);

        this.joystickKnob = document.createElement('div');
        this.joystickKnob.id = 'joystick-knob';
        this.joystickContainer.appendChild(this.joystickKnob);

        // Boutons d'action
        this.actionButtons = document.createElement('div');
        this.actionButtons.id = 'action-buttons';
        this.mobileControls.appendChild(this.actionButtons);

        // Bouton de tir
        this.fireButton = document.createElement('div');
        this.fireButton.id = 'fire-button';
        this.fireButton.innerHTML = '🔫';
        this.actionButtons.appendChild(this.fireButton);

        // Bouton de saut
        this.jumpButton = document.createElement('div');
        this.jumpButton.id = 'jump-button';
        this.jumpButton.innerHTML = '⬆️';
        this.actionButtons.appendChild(this.jumpButton);
    }

    _setupEventListeners() {
        // Gestion du joystick
        this.joystickContainer.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.joystickActive = true;
            const touch = event.touches[0];
            const rect = this.joystickContainer.getBoundingClientRect();
            this.startX = rect.left + rect.width / 2;
            this.startY = rect.top + rect.height / 2;
            this.currentX = touch.clientX;
            this.currentY = touch.clientY;
            this._updateJoystickPosition();
        });

        document.addEventListener('touchmove', (event) => {
            if (this.joystickActive && event.touches.length > 0) {
                event.preventDefault();
                const touch = event.touches[0];
                this.currentX = touch.clientX;
                this.currentY = touch.clientY;
                this._updateJoystickPosition();
                this._updateInputMap();
            }
        });

        document.addEventListener('touchend', (event) => {
            if (this.joystickActive) {
                event.preventDefault();
                this.joystickActive = false;
                this._resetJoystick();
                this._resetInputMap();
            }
        });

        // Gestion du bouton de tir
        this.fireButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (this.scene.metadata && this.scene.metadata.player && this.scene.metadata.executeShot) {
                const player = this.scene.metadata.player;
                const camera = this.scene.activeCamera;
                this.scene.metadata.executeShot(player.hero.position, camera.getForwardRay().direction);
            }
        });

        // Gestion du bouton de saut
        this.jumpButton.addEventListener('touchstart', (event) => {
            event.preventDefault();
            this.inputMap["space"] = true;
        });

        this.jumpButton.addEventListener('touchend', (event) => {
            event.preventDefault();
            this.inputMap["space"] = false;
        });
        
        // Gestion de la rotation de la caméra par toucher
        this._setupCameraRotationControls();
    }
    
    _setupCameraRotationControls() {
        // On exclut les zones de contrôle (joystick et boutons) pour ne détecter que le toucher sur le reste de l'écran
        this.canvas.addEventListener('touchstart', (event) => {
            // Exclure les touches sur les contrôles
            if (this._isTouchOnControls(event)) return;
            
            event.preventDefault();
            this.touchRotating = true;
            this.lastTouchX = event.touches[0].clientX;
            this.lastTouchY = event.touches[0].clientY;
        });
        
        this.canvas.addEventListener('touchmove', (event) => {
            // Ne pas gérer si on n'est pas en mode rotation ou si le toucher est sur les contrôles
            if (!this.touchRotating || this._isTouchOnControls(event)) return;
            
            event.preventDefault();
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - this.lastTouchX;
            const deltaY = touch.clientY - this.lastTouchY;
            
            // Mettre à jour les coordonnées du dernier toucher
            this.lastTouchX = touch.clientX;
            this.lastTouchY = touch.clientY;
            
            // Appliquer la rotation à la caméra et au joueur
            if (this.scene.activeCamera) {
                // Rotation horizontale (tourne le personnage)
                if (this.scene.metadata && this.scene.metadata.player && this.scene.metadata.player.hero) {
                    const hero = this.scene.metadata.player.hero;
                    hero.rotation.y -= deltaX * this.rotationSensitivity * 0.8;
                }
                
                // Rotation verticale (inclinaison de la caméra)
                const camera = this.scene.activeCamera;
                if (camera.beta !== undefined) {  // Pour ArcRotateCamera
                    camera.beta += deltaY * this.rotationSensitivity * 0.8;
                    // Limiter l'angle vertical pour éviter de regarder trop haut ou trop bas
                    camera.beta = Math.max(0.1, Math.min(Math.PI - 0.1, camera.beta));
                }
            }
        });
        
        this.canvas.addEventListener('touchend', (event) => {
            this.touchRotating = false;
        });
        
        this.canvas.addEventListener('touchcancel', (event) => {
            this.touchRotating = false;
        });
    }
    
    _isTouchOnControls(event) {
        if (!event.touches || event.touches.length === 0) return false;
        
        const touch = event.touches[0];
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Vérifier si le toucher est sur le joystick
        const joystickRect = this.joystickContainer.getBoundingClientRect();
        if (touchX >= joystickRect.left && touchX <= joystickRect.right &&
            touchY >= joystickRect.top && touchY <= joystickRect.bottom) {
            return true;
        }
        
        // Vérifier si le toucher est sur les boutons d'action
        const actionButtonsRect = this.actionButtons.getBoundingClientRect();
        if (touchX >= actionButtonsRect.left && touchX <= actionButtonsRect.right &&
            touchY >= actionButtonsRect.top && touchY <= actionButtonsRect.bottom) {
            return true;
        }
        
        return false;
    }

    _updateJoystickPosition() {
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const distance = Math.min(this.maxDistance, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
        const angle = Math.atan2(deltaY, deltaX);
        const moveX = distance * Math.cos(angle);
        const moveY = distance * Math.sin(angle);
        
        this.joystickKnob.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }

    _resetJoystick() {
        this.joystickKnob.style.transform = 'translate(0px, 0px)';
    }

    _updateInputMap() {
        const deltaX = this.currentX - this.startX;
        const deltaY = this.currentY - this.startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 10) {  // Seuil minimal pour éviter les déclenchements accidentels
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
            
            // Forward (up)
            this.inputMap["z"] = (angle > -135 && angle < -45);
            
            // Backward (down)
            this.inputMap["s"] = (angle > 45 && angle < 135);
            
            // Left
            this.inputMap["q"] = (angle > 135 || angle < -135);
            
            // Right
            this.inputMap["d"] = (angle > -45 && angle < 45);
        } else {
            this._resetInputMap();
        }
    }

    _resetInputMap() {
        this.inputMap["z"] = false;
        this.inputMap["s"] = false;
        this.inputMap["q"] = false;
        this.inputMap["d"] = false;
    }

    getInputMap() {
        return this.inputMap;
    }

    enable() {
        this.enabled = true;
        this.mobileControls.style.display = 'block';
    }

    disable() {
        this.enabled = false;
        this.mobileControls.style.display = 'none';
    }
}

// Fonction pour créer et activer les contrôles tactiles
export function setupTouchControls(scene, canvas) {
    const touchControls = new TouchControls(scene, canvas);
    touchControls.enable();
    return touchControls;
} 
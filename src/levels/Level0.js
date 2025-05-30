import * as BABYLON from '@babylonjs/core';

export class Level0 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.onComplete = null;
        this.tutorialContainer = null;
        this.currentStep = 0;
        this.isVisible = false;
        this.lastActionTime = 0;
        this.actionHoldStartTime = 0;
        this.requiredHoldTime = 200;
        this.stepTransitionDelay = 100;
        this.mouseMoveThreshold = 50;
        this.lastMouseX = 0;
        this.typingSpeed = 30; 
        this.typingTimeout = null;
        this.tutorialSteps = [
            {
                instruction: "Appuyez sur ESPACE pour continuer",
                key: ["ESPACE"],
                checkComplete: (inputMap) => inputMap[" "] || inputMap["space"]
            },
            {
                instruction: "Utilisez la touche Z ou W pour vous déplacer vers l'avant",
                key: ["Z", "W"],
                checkComplete: (inputMap) => inputMap["z"] || inputMap["w"]
            },
            {
                instruction: "Utilisez la touche A ou Q pour vous déplacer vers la gauche",
                key: ["A", "Q"],
                checkComplete: (inputMap) => inputMap["a"] || inputMap["q"]
            },
            {
                instruction: "Utilisez la touche S pour vous déplacer vers l'arrière",
                key: ["S"],
                checkComplete: (inputMap) => inputMap["s"]
            },
            {
                instruction: "Utilisez la touche D pour vous déplacer vers la droite",
                key: ["D"],
                checkComplete: (inputMap) => inputMap["d"]
            },
            {
                instruction: "Bougez la souris pour regarder autour de vous (Appuyez sur ESPACE si compris)",
                key: ["ESPACE"],
                checkComplete: (inputMap) => inputMap[" "] || inputMap["space"]
            },
            {
                instruction: "Cliquez pour tirer (Appuyez sur ESPACE si compris)",
                key: ["ESPACE"],
                checkComplete: (inputMap) => inputMap[" "] || inputMap["space"]
            }
        ];
        this._createUI();
    }

    async init() {
        this.show();
        this._addInputListeners();
        
        // Assigner ce tutoriel à scene.metadata.tutorial pour les contrôles
        this.scene.metadata.tutorial = this;
    }

    _addInputListeners() {
        this.updateHandler = (e) => {
            if (this.scene.metadata && this.scene.metadata.controls) {
                const inputMap = this.scene.metadata.controls.inputMap || {};
                const mouseMoved = this._checkMouseMovement(this.scene.metadata.controls.isMouseMoving);
                const isShooting = this.scene.metadata.controls.isShooting;
                const mouseX = this.scene.metadata.controls.mouseX || 0;
                
                this.update(inputMap, mouseMoved, isShooting, mouseX);
            }
        };
        
        this.scene.onBeforeRenderObservable.add(this.updateHandler);
    }

    _checkKeyHold(isPressed) {
        const currentTime = Date.now();
        
        if (isPressed) {
            if (this.actionHoldStartTime === 0) {
                this.actionHoldStartTime = currentTime;
            }
            return (currentTime - this.actionHoldStartTime) >= this.requiredHoldTime;
        } else {
            this.actionHoldStartTime = 0;
            return false;
        }
    }

    _checkMouseMovement(mouseMoved) {
        const currentTime = Date.now();
        
        if (mouseMoved) {
            if (this.actionHoldStartTime === 0) {
                this.actionHoldStartTime = currentTime;
            }
            return (currentTime - this.actionHoldStartTime) >= this.requiredHoldTime;
        } else {
            this.actionHoldStartTime = 0;
            return false;
        }
    }

    isActionAllowed(action) {
        if (!this.isVisible) return true;
        
        // Mapping des actions aux étapes du tutoriel
        const actionStepMapping = {
            'moveForward': 1,  // Étape Z/W
            'moveLeft': 2,     // Étape A/Q
            'moveBackward': 3, // Étape S
            'moveRight': 4,    // Étape D
            'look': 5,         // Étape mouvement souris
            'shoot': 6         // Étape tir
        };

        // Si l'action n'est pas dans le mapping, on la refuse
        if (!actionStepMapping.hasOwnProperty(action)) {
            return false;
        }

        // On permet l'action dès que son étape est atteinte ou dépassée
        return this.currentStep >= actionStepMapping[action];
    }

    _createUI() {
        this.tutorialContainer = document.createElement('div');
        this.tutorialContainer.id = 'tutorialContainer';
        this.tutorialContainer.classList.add('tutorial-container');
        
        Object.assign(this.tutorialContainer.style, {
            position: 'absolute',
            bottom: '30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            padding: '15px 20px',
            borderRadius: '10px',
            color: 'white',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: 'none',
            zIndex: '1000',
            maxWidth: '500px',
            width: '80%',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        });

        const header = document.createElement('div');
        Object.assign(header.style, {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '15px',
            gap: '10px'
        });

        const icon = document.createElement('div');
        Object.assign(icon.style, {
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: '#4a90e2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px'
        });
        icon.textContent = '💡';

        const title = document.createElement('div');
        Object.assign(title.style, {
            fontSize: '20px',
            fontWeight: 'bold'
        });
        title.textContent = 'Tutoriel de contrôle';

        const progressText = document.createElement('div');
        Object.assign(progressText.style, {
            marginLeft: 'auto',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.7)'
        });
        this.progressText = progressText;
        this.updateProgressText();

        header.appendChild(icon);
        header.appendChild(title);
        header.appendChild(progressText);
        this.tutorialContainer.appendChild(header);

        const instructionContainer = document.createElement('div');
        Object.assign(instructionContainer.style, {
            display: 'flex',
            alignItems: 'center',
            gap: '15px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            padding: '15px 20px',
            borderRadius: '8px',
            marginBottom: '15px'
        });

        const avatar = document.createElement('div');
        Object.assign(avatar.style, {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#4a90e2',
            backgroundImage: 'url("/image/creators/akira.jpg")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            flexShrink: '0'
        });

        const instructionText = document.createElement('div');
        Object.assign(instructionText.style, {
            fontSize: '18px',
            lineHeight: '1.4',
            color: 'rgba(255, 255, 255, 0.9)',
            fontWeight: '500'
        });

        instructionContainer.appendChild(avatar);
        instructionContainer.appendChild(instructionText);
        this.tutorialContainer.appendChild(instructionContainer);
        this.instructionText = instructionText;

        const progressBarContainer = document.createElement('div');
        Object.assign(progressBarContainer.style, {
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '3px',
            marginBottom: '15px',
            overflow: 'hidden'
        });
        
        const progressBar = document.createElement('div');
        Object.assign(progressBar.style, {
            height: '100%',
            backgroundColor: '#4a90e2',
            width: '0%',
            transition: 'width 0.5s ease'
        });
        this.progressBar = progressBar;
        
        progressBarContainer.appendChild(progressBar);
        this.tutorialContainer.appendChild(progressBarContainer);


        document.body.appendChild(this.tutorialContainer);
    }

    updateProgressText() {
        if (this.progressText) {
            this.progressText.textContent = `${this.currentStep + 1}/${this.tutorialSteps.length}`;
        }
        
        if (this.progressBar) {
            const progressPercentage = ((this.currentStep) / this.tutorialSteps.length) * 100;
            this.progressBar.style.width = `${progressPercentage}%`;
        }
    }

    show() {
        if (this.tutorialContainer) {
            this.tutorialContainer.style.display = 'block';
            this.isVisible = true;
            this._showCurrentStep();
        }
    }

    _complete() {
        this.hide();
        this.isCompleted = true;
        
        if (this.onComplete && typeof this.onComplete === 'function') {
            this.onComplete();
        }
    }

    hide() {
        if (this.tutorialContainer) {
            // Annuler toute animation en cours
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
                this.typingTimeout = null;
            }
            
            this.tutorialContainer.style.display = 'none';
            this.isVisible = false;
            
            // Émettre un événement personnalisé pour signaler que le tutoriel est terminé
            const tutorialCompletedEvent = new CustomEvent('tutorialCompleted', {
                detail: { skipped: this.currentStep < this.tutorialSteps.length }
            });
            document.dispatchEvent(tutorialCompletedEvent);
        }
    }

    // Animation d'écriture du texte
    _typeText(text) {
        // Annuler l'animation en cours si elle existe
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        
        // Réinitialiser le texte
        this.instructionText.textContent = "";
        
        let i = 0;
        const typeChar = () => {
            if (i < text.length) {
                this.instructionText.textContent += text.charAt(i);
                i++;
                this.typingTimeout = setTimeout(typeChar, this.typingSpeed);
            } else {
                this.typingTimeout = null;
            }
        };
        
        typeChar();
    }

    _showCurrentStep() {
        if (!this.isVisible || this.currentStep >= this.tutorialSteps.length) return;

        const currentTime = Date.now();
        if (currentTime - this.lastActionTime < this.stepTransitionDelay) {
            return;
        }

        const step = this.tutorialSteps[this.currentStep];
        // Animer l'écriture du texte au lieu de l'afficher immédiatement
        this._typeText(step.instruction);
        this.actionHoldStartTime = 0;
        
        this.updateProgressText();
    }

    update(inputMap, mouseMoved, isShooting, mouseX) {
        if (!this.isVisible || this.currentStep >= this.tutorialSteps.length) return;

        const currentTime = Date.now();
        const currentStep = this.tutorialSteps[this.currentStep];

        if (currentStep.checkComplete(inputMap, mouseMoved, isShooting, mouseX)) {
            this.lastActionTime = currentTime;
            this.currentStep++;
            this.updateProgressText();
            
            if (this.currentStep >= this.tutorialSteps.length) {
                // Animer le message de réussite final
                this._typeText("Excellent ! Vous avez terminé le tutoriel.");
                setTimeout(() => {
                    this._complete();
                }, 2000);
            } else {
                setTimeout(() => {
                    this._showCurrentStep();
                }, this.stepTransitionDelay);
            }
        }
    }

    cleanup() {
        if (this.tutorialContainer && this.tutorialContainer.parentNode) {
            this.tutorialContainer.parentNode.removeChild(this.tutorialContainer);
        }
        
        if (this.updateHandler) {
            this.scene.onBeforeRenderObservable.removeCallback(this.updateHandler);
        }
        
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
    }

    checkProximity() {
        // Méthode requise pour implémenter l'interface des niveaux
        // mais non utilisée dans le tutoriel
    }
} 
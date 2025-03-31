export class Tutorial {
    constructor(scene) {
        this.scene = scene;
        this.tutorialContainer = null;
        this.currentStep = 0;
        this.isVisible = false;
        this.lastActionTime = 0;
        this.actionHoldStartTime = 0;
        this.requiredHoldTime = 200;
        this.stepTransitionDelay = 100;
        this.mouseMoveThreshold = 50;
        this.lastMouseX = 0;
        this.typingSpeed = 30; // Vitesse d'écriture en millisecondes par caractère
        this.typingTimeout = null;
        this.tutorialSteps = [
            {
                instruction: "Pour avancer, maintenez Z",
                key: ["Z"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["z"])
            },
            {
                instruction: "Pour aller à gauche, maintenez Q",
                key: ["Q"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["q"])
            },
            {
                instruction: "Pour reculer, maintenez S",
                key: ["S"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["s"])
            },
            {
                instruction: "Pour aller à droite, maintenez D",
                key: ["D"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["d"])
            },
            {
                instruction: "Pour aller a la direction souhaitée, déplacez la souris. Appuyez sur ESPACE pour continuer.",
                key: ["🖱️ ← →", "ESPACE"],
                checkComplete: (inputMap) => inputMap[" "] || inputMap["space"]
            },
            {
                instruction: "Pour danser la samba, maintenez B",
                key: ["B"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["b"])
            },
            {
                instruction: "Pour tirer, cliquez avec le bouton gauche. Appuyez sur ESPACE pour continuer.",
                key: ["Clic", "ESPACE"],
                checkComplete: (inputMap) => inputMap[" "] || inputMap["space"]
            }
        ];
        this._createUI();
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
        
        if (this.currentStep === 4 || this.currentStep === 6) {
            return true;
        }
        
        switch (action) {
            case 'moveForward':
                return this.currentStep === 0;
            case 'moveLeft':
                return this.currentStep === 1;
            case 'moveBackward':
                return this.currentStep === 2;
            case 'moveRight':
                return this.currentStep === 3;
            case 'dance':
                return this.currentStep === 5;
            default:
                return false;
        }
    }

    _createUI() {
        this.tutorialContainer = document.createElement('div');
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

        const skipButton = document.createElement('button');
        skipButton.textContent = 'Passer le tutoriel';
        Object.assign(skipButton.style, {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            border: 'none',
            padding: '10px 20px',
            color: 'white',
            borderRadius: '5px',
            cursor: 'pointer',
            transition: 'background-color 0.3s',
            fontSize: '14px',
            marginTop: '5px',
            width: '100%'
        });

        skipButton.addEventListener('mouseenter', () => {
            skipButton.style.backgroundColor = 'rgba(255, 255, 255, 0.25)';
        });

        skipButton.addEventListener('mouseleave', () => {
            skipButton.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
        });

        skipButton.addEventListener('click', () => {
            this.hide();
        });

        this.tutorialContainer.appendChild(skipButton);
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

    hide() {
        if (this.tutorialContainer) {
            // Annuler toute animation en cours
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
                this.typingTimeout = null;
            }
            
            this.tutorialContainer.style.display = 'none';
            this.isVisible = false;
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
                    this.hide();
                }, 2000);
            } else {
                setTimeout(() => {
                    this._showCurrentStep();
                }, this.stepTransitionDelay);
            }
        }
    }
} 
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export class Tutorial {
    constructor(scene) {
        this.scene = scene;
        this.tutorialContainer = null;
        this.currentStep = 0;
        this.isVisible = false;
        this.isCompleted = false; // Indique si le tutoriel est terminé
        this.lastActionTime = 0;
        this.actionHoldStartTime = 0;
        this.requiredHoldTime = 200;
        this.stepTransitionDelay = 100;
        this.mouseMoveThreshold = 50;
        this.lastMouseX = 0;
        this.typingSpeed = 30; // Vitesse d'écriture en millisecondes par caractère
        this.typingTimeout = null;
        this.cinematicPlayed = false;
        this.tutorialSteps = [
            {
                instruction: "Pour avancer, maintenez Z ou utilisez le joystick gauche vers le haut ↑",
                key: ["Z", "↑"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["z"])
            },
            {
                instruction: "Pour aller à gauche, maintenez Q ou utilisez le joystick gauche vers la gauche ←",
                key: ["Q", "←"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["q"])
            },
            {
                instruction: "Pour reculer, maintenez S ou utilisez le joystick gauche vers le bas ↓",
                key: ["S", "↓"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["s"])
            },
            {
                instruction: "Pour aller à droite, maintenez D ou utilisez le joystick gauche vers la droite →",
                key: ["D", "→"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["d"])
            },
            {
                instruction: "Pour regarder autour de vous, déplacez la souris ou utilisez le joystick droit. Appuyez sur ESPACE continuer.",
                key: ["🖱️ ← →", "ESPACE", "X"],
                checkComplete: (inputMap) => inputMap[" "] || inputMap["space"] || inputMap["x"]
            },
            {
                instruction: "Pour danser la samba, maintenez B ou appuyez sur Triangle (△) sur la manette PS4",
                key: ["B", "△"],
                checkComplete: (inputMap) => this._checkKeyHold(inputMap["b"])
            },
            {
                instruction: "Pour tirer, cliquez avec le bouton gauche ou appuyez sur R2 sur la manette PS4. Appuyez sur ESPACE continuer.",
                key: ["Clic", "X/R1/R2", "ESPACE"],
                checkComplete: (inputMap) => {
                    if (inputMap[" "] || inputMap["space"] || inputMap["x"]) {
                        return true;
                    }
                    return false;
                }
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
            if (this.typingTimeout) {
                clearTimeout(this.typingTimeout);
                this.typingTimeout = null;
            }            
            this.tutorialContainer.style.display = 'none';
            this.isVisible = false;
            this.isCompleted = true;
        }
    }
    _typeText(text) {
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        this.instructionText.textContent = "";
        let i = 0;
        const typeChar = () => {
            if (i < text.length) {
                this.instructionText.textContent += text.charAt(i);
                i++;
                this.typingTimeout = setTimeout(typeChar, this.typingSpeed);
            } else {
                this.typingTimeout = null;                
                if (text === "Excellent ! Vous avez terminé le tutoriel.") {
                    setTimeout(() => {
                        this.hide();
                        if (!this.cinematicPlayed) {
                            this._playDogCinematic();
                        }
                    }, 3000);
                }
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
            } else {
                setTimeout(() => {
                    this._showCurrentStep();
                }, this.stepTransitionDelay);
            }
        }
    }

    _playDogCinematic() {
        this.cinematicPlayed = true;
        
        // Sauvegarder l'état original de la caméra
        const camera = this.scene.getCameraByName("camera");
        const hero = this.scene.getMeshByName("hero");
        const dog = this.scene.getMeshByName("levelDog");
        if (!camera || !hero || !dog) return;

        // Désactiver les contrôles de la caméra pendant la cinématique
        const originalCameraControls = camera.inputs.attached.pointers;
        if (originalCameraControls) {
            originalCameraControls.detachControl();
        }

        // Sauvegarder les propriétés originales de la caméra
        const originalAlpha = camera.alpha;
        const originalBeta = camera.beta;
        const originalRadius = camera.radius;
        const originalTarget = camera.target.clone();

        // Variable pour suivre si l'espace a été pressé
        let spacePressed = false;
        const keyListener = (event) => {
            if (event.code === 'Space' || event.key === ' ' || event.code === 'KeyX' || event.key === 'x') {
                spacePressed = true;
            }
        };
        window.addEventListener('keydown', keyListener);

        // Message indiquant l'emplacement du chien pendant la cinématique
        const dogLocationMessage = this._createDogLocationMessage();
        dogLocationMessage.style.display = 'block';
        
        // Ajout d'un message pour indiquer comment continuer
        const continueMessage = document.createElement("div");
        Object.assign(continueMessage.style, {
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "18px",
            fontWeight: "bold",
            textAlign: "center",
            zIndex: "1000",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)"
        });
        
        const keyIndicator = document.createElement("span");
        keyIndicator.textContent = "ESPACE";
        Object.assign(keyIndicator.style, {
            display: "inline-block",
            backgroundColor: "#4a90e2",
            color: "white",
            borderRadius: "4px",
            padding: "2px 8px",
            margin: "0 5px",
            fontWeight: "bold"
        });
        
        continueMessage.innerHTML = "Appuyez sur ";
        continueMessage.appendChild(keyIndicator);
        continueMessage.innerHTML += " pour continuer";
        document.body.appendChild(continueMessage);

        // Fonction d'animation de la cinématique
        const animateCinematic = () => {
            // Si espace a été pressé, faire la transition vers les contrôles normaux
            if (spacePressed) {
                // Supprimer les messages
                if (dogLocationMessage.parentNode) {
                    dogLocationMessage.parentNode.removeChild(dogLocationMessage);
                }
                if (continueMessage.parentNode) {
                    continueMessage.parentNode.removeChild(continueMessage);
                }
                
                // Restaurer les propriétés de la caméra progressivement
                const duration = 1000; // 1 seconde pour la transition
                const startTime = Date.now();
                
                const transitionToNormal = () => {
                    const currentTime = Date.now();
                    const elapsedTime = currentTime - startTime;
                    const ratio = Math.min(elapsedTime / duration, 1);
                    
                    if (ratio < 1) {
                        // Transition graduelle vers les paramètres originaux
                        camera.alpha = camera.alpha + (originalAlpha - camera.alpha) * 0.05;
                        camera.beta = camera.beta + (originalBeta - camera.beta) * 0.05;
                        camera.radius = camera.radius + (originalRadius - camera.radius) * 0.05;
                        
                        const currentTarget = camera.target.clone();
                        const targetDiff = originalTarget.subtract(currentTarget);
                        camera.target = currentTarget.add(targetDiff.scale(0.05));
                        
                        requestAnimationFrame(transitionToNormal);
                    } else {
                        // Restaurer complètement les contrôles
                        camera.alpha = originalAlpha;
                        camera.beta = originalBeta;
                        camera.radius = originalRadius;
                        camera.target.copyFrom(originalTarget);
                        
                        if (originalCameraControls) {
                            camera.inputs.attached.pointers = originalCameraControls;
                            originalCameraControls.attachControl();
                        }
                        
                        // Nettoyer l'écouteur d'événements
                        window.removeEventListener('keydown', keyListener);
                    }
                };
                
                transitionToNormal();
                return;
            }
            
            // Animation de la caméra autour du chien tant que l'espace n'est pas pressé
            const dogPosition = dog.position.clone();
            const offset = new Vector3(-7, 0.2, -1);
            camera.setTarget(dogPosition.add(offset));
            camera.radius = 12;
            camera.beta = Math.PI / 4;
            
            // Rotation lente continue autour du chien
            camera.alpha += 0.003;
            
            // Continuer l'animation
            requestAnimationFrame(animateCinematic);
        };
        
        // Démarrer l'animation
        animateCinematic();
    }

    _createDogLocationMessage() {
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            top: "auto",
            bottom: "50px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "15px 25px",
            borderRadius: "10px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
            display: "none",
            zIndex: "1000",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.5)",
            animation: "pulse-bottom 2s infinite",
            maxWidth: "80%"
        });
        
        // Ajouter une animation de pulsation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes pulse-bottom {
                0% { transform: translateX(-50%) scale(1); }
                50% { transform: translateX(-50%) scale(1.05); }
                100% { transform: translateX(-50%) scale(1); }
            }
        `;
        document.head.appendChild(style);
        
        const icon = document.createElement("span");
        icon.textContent = "🐕 ";
        icon.style.marginRight = "10px";
        
        const title = document.createElement("div");
        title.textContent = "Mission 1 : Retrouver RAY , votre nouveau compagnon de route.";
        Object.assign(title.style, {
            color: "#4a90e2",
            fontSize: "26px",
            marginBottom: "12px"
        });
        
        const text = document.createElement("div");
        text.textContent = "Il est quelque part dans la ville, peut-être bien caché…";
        Object.assign(text.style, {
            fontSize: "20px",
            marginBottom: "15px",
            color: "rgba(255, 255, 255, 0.9)"
        });
        
        message.appendChild(icon);
        message.appendChild(title);
        message.appendChild(text);
        document.body.appendChild(message);
        
        return message;
    }
} 
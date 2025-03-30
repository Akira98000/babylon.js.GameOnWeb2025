import * as BABYLON from '@babylonjs/core';
import { LoadingScreen } from './loadingScreen.js';

export class MainMenu {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(canvas, true, {
            adaptToDeviceRatio: true
        });
        this.scene = null;
        this.camera = null;
        this.isRotating = true;
        this.onPlayButtonClicked = null;
        this.loadingScreen = new LoadingScreen();
        this.isDisposed = false;
        this.showingPressAnyKey = true;

        this._createScene();

        const resizeHandler = () => {
            if (this.engine && !this.isDisposed) {
                this.engine.resize();
            }
        };

        window.addEventListener('resize', resizeHandler);
        this.resizeHandler = resizeHandler;
    }

    _createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera("MainCamera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas, true);
        this._createUI();
        this._startRendering();
    }

    _createUI() {
        if (document.getElementById('mainMenuContainer')) return;

        const menuContainer = document.createElement('div');
        menuContainer.id = 'mainMenuContainer';
        Object.assign(menuContainer.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", overflow: 'hidden'
        });

        const leftContainer = document.createElement('div');
        Object.assign(leftContainer.style, {
            width: '55%', height: '100%', background: 'linear-gradient(276deg, rgb(0, 0, 0), rgb(0 0 0 / 33%))', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 5%', position: 'relative', zIndex: '1'
        });

        const rightContainer = document.createElement('div');
        Object.assign(rightContainer.style, {
            width: '45%', height: '100%', position: 'relative', overflow: 'hidden', background:'black'
        });

        const imageElement = document.createElement('div');
        Object.assign(imageElement.style, {
            position: 'absolute', top: '0', right: '0', width: '100%', height: '100%', 
            backgroundImage: 'url("/image/imageLauncher.png")', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center right', 
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 20% 100%)'
        });

        imageElement.onload = () => {
            console.log("Image chargée avec succès");
        };
        imageElement.onerror = () => {
            console.error("Erreur de chargement de l'image");
        };

        const contentContainer = document.createElement('div');
        Object.assign(contentContainer.style, {
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '80%', width: '100%'
        });

        const gameTitle = document.createElement('h1');
        gameTitle.textContent = 'Dreamfall';
        Object.assign(gameTitle.style, {
            color: 'white', fontSize: '4rem', marginBottom: '0.01rem', textAlign: 'left', fontWeight: 'bold', letterSpacing: '2px', background: 'linear-gradient(to right, white, #86a8e7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', width: '100%'
        });

        const subtitle = document.createElement('h2');
        subtitle.textContent = 'The invasion began where dreams were born !';
        Object.assign(subtitle.style, {
            color: 'white', fontSize: '1.3rem', marginBottom: '3rem', marginTop: '0.01rem', textAlign: 'left', opacity: '0.9', width: '100%'
        });

        const pressAnyKeyContainer = document.createElement('div');
        pressAnyKeyContainer.id = 'pressAnyKeyContainer';
        Object.assign(pressAnyKeyContainer.style, {
            display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'left', 
            width: '100%', textAlign: 'left', marginTop: '1rem',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        });

        const pressAnyKeyText = document.createElement('div');
        pressAnyKeyText.textContent = 'PRESS ANY KEY TO GET STARTED';
        Object.assign(pressAnyKeyText.style, {
            color: 'white', fontSize: '0.9rem', fontWeight: 'light', letterSpacing: '2px',
            animation: 'pulse 1.5s infinite ease-in-out'
        });

        pressAnyKeyContainer.appendChild(pressAnyKeyText);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'buttonsContainer';
        Object.assign(buttonsContainer.style, {
            display: 'none',
            flexDirection: 'column', 
            gap: '1.5rem', 
            width: '100%', 
            alignItems: 'flex-start',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out'
        });

        const createButton = (text, isDisabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            Object.assign(button.style, {
                backgroundColor: isDisabled ? 'rgba(100, 100, 100, 0.3)' : 'rgba(100, 100, 100, 0.3)', color: 'white', border: 'none', padding: '15px 30px', width: '250px', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '15px', cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', boxShadow: isDisabled ? 'none' : '0 0 15px rgba(138, 43, 226, 0.5)', position: 'relative', overflow: 'hidden', textAlign: 'left'
            });

            if (!isDisabled) {
                button.addEventListener('mouseenter', () => {
                    button.style.background = 'linear-gradient(90deg, #ff8a00, #ff0080, #8a2be2, #4169e1, #00bfff)';
                    button.style.backgroundSize = '400% 100%';
                    button.style.animation = 'rainbowMove 3s ease infinite';
                    button.style.transform = 'translateX(10px)';
                    button.style.boxShadow = '0 0 20px rgba(138, 43, 226, 0.8), 0 0 30px rgba(70, 130, 180, 0.5)';
                });

                button.addEventListener('mouseleave', () => {
                    button.style.background = 'rgba(100, 100, 100, 0.3)';
                    button.style.animation = 'none';
                    button.style.transform = 'translateX(0)';
                    button.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
                });
            }

            return button;
        };

        const playButton = createButton('Play');
        const settingsButton = createButton('Settings', true);
        const creditsButton = createButton('Credits');

        playButton.addEventListener('click', () => {
            this.hide();
            this.loadingScreen.show();
            this._startGameLoading();
        });

        creditsButton.addEventListener('click', () => {
            this._showCredits();
        });

        buttonsContainer.appendChild(playButton);
        buttonsContainer.appendChild(settingsButton);
        buttonsContainer.appendChild(creditsButton);

        const creditsContainer = document.createElement('div');
        creditsContainer.id = 'creditsContainer';
        Object.assign(creditsContainer.style, {
            display: 'none',
            flexDirection: 'column',
            width: '100%',
            alignItems: 'flex-start',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
            color: 'white'
        });

        // Titre des crédits
        const creditsTitle = document.createElement('h2');
        creditsTitle.textContent = 'Credits';
        Object.assign(creditsTitle.style, {
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, white, #86a8e7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        });

        // Description du projet
        const projectDescription = document.createElement('div');
        projectDescription.innerHTML = 'Project created for the GameOnWeb 2025 competition<br>Theme: <strong>DreamLand</strong>';
        Object.assign(projectDescription.style, {
            fontSize: '1.2rem',
            marginBottom: '2rem'
        });

        // Conteneur pour la liste des créateurs
        const creatorsContainer = document.createElement('div');
        Object.assign(creatorsContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            width: '100%',
            marginBottom: '2rem'
        });

        // Fonction pour créer un profil de créateur
        const createCreatorProfile = (name, githubUsername, imageUrl) => {
            const profileContainer = document.createElement('div');
            Object.assign(profileContainer.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            });

            const profileImage = document.createElement('div');
            Object.assign(profileImage.style, {
                width: '60px',
                height: '60px',
                borderRadius: '20%',
                background: `url(${imageUrl}) center/cover`,
                boxShadow: '0 0 10px rgba(138, 43, 226, 0.5)'
            });

            const profileInfo = document.createElement('div');
            profileInfo.innerHTML = `<strong>${name}</strong><br><a href="https://github.com/${githubUsername}" target="_blank" style="color: #86a8e7; text-decoration: none;">@${githubUsername}</a>`;

            profileContainer.appendChild(profileImage);
            profileContainer.appendChild(profileInfo);
            return profileContainer;
        };

        const creator1 = createCreatorProfile('Akira Santhakumaran', 'Akira98000', '/image/creators/akira.jpg');
        const creator2 = createCreatorProfile('Germain Doglioli-Duppert', 'GermainDR', '/image/creators/germain.png');
        const creator3 = createCreatorProfile('Logan Laporte', 'pzygwg', '/image/creators/logan.jpg');

        creatorsContainer.appendChild(creator1);
        creatorsContainer.appendChild(creator2);
        creatorsContainer.appendChild(creator3);

        // Bouton de retour
        const backButton = document.createElement('button');
        backButton.innerHTML = '&larr; Back';
        Object.assign(backButton.style, {
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 0 15px rgba(138, 43, 226, 0.5)',
            marginTop: '1rem'
        });

        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = 'linear-gradient(90deg, #4169e1, #00bfff)';
            backButton.style.transform = 'scale(1.05)';
            backButton.style.boxShadow = '0 0 20px rgba(138, 43, 226, 0.8)';
        });

        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = 'rgba(100, 100, 100, 0.3)';
            backButton.style.transform = 'scale(1)';
            backButton.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
        });

        backButton.addEventListener('click', () => {
            this._hideCredits();
        });

        // Assemblage des éléments de crédits
        creditsContainer.appendChild(creditsTitle);
        creditsContainer.appendChild(projectDescription);
        creditsContainer.appendChild(creatorsContainer);
        creditsContainer.appendChild(backButton);

        contentContainer.appendChild(creditsContainer);

        const gameSubtitle = document.createElement('div');
        gameSubtitle.textContent = 'GameOnWeb 2025 : Dreamland Theme';
        Object.assign(gameSubtitle.style, {
            position: 'absolute', bottom: '2rem', left: '2rem', color: 'white', fontSize: '1rem'
        });

        const copyright = document.createElement('div');
        copyright.textContent = '© Team BabyGame - UnicA';
        Object.assign(copyright.style, {
            position: 'absolute', bottom: '1rem', left: '2rem', color: 'white', fontSize: '0.9rem'
        });

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes rainbowMove {0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; }}
            @keyframes pulse {0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; }}
            @keyframes fadeIn {0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); }}
            @keyframes fadeOut {0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); }}
        `;
        document.head.appendChild(styleSheet);

        contentContainer.appendChild(gameTitle);
        contentContainer.appendChild(subtitle);
        contentContainer.appendChild(pressAnyKeyContainer);
        contentContainer.appendChild(buttonsContainer);

        leftContainer.appendChild(contentContainer);
        leftContainer.appendChild(gameSubtitle);
        leftContainer.appendChild(copyright);

        rightContainer.appendChild(imageElement);

        menuContainer.appendChild(leftContainer);
        menuContainer.appendChild(rightContainer);

        document.body.appendChild(menuContainer);
        this.menuContainer = menuContainer;
        this.pressAnyKeyContainer = pressAnyKeyContainer;
        this.buttonsContainer = buttonsContainer;
        this.creditsContainer = creditsContainer;

        this._setupPressAnyKeyListener();
    }

    _setupPressAnyKeyListener() {
        const handleKeyPress = (event) => {
            if (this.showingPressAnyKey) {
                this._showMainMenu();
            }
        };

        const handleClick = (event) => {
            if (this.showingPressAnyKey) {
                this._showMainMenu();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('click', handleClick);

        this.handleKeyPress = handleKeyPress;
        this.handleClick = handleClick;
    }

    _showMainMenu() {
        this.showingPressAnyKey = false;
        if (this.pressAnyKeyContainer) {
            this.pressAnyKeyContainer.style.opacity = '0';
            this.pressAnyKeyContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.pressAnyKeyContainer.style.display = 'none';
                if (this.buttonsContainer) {
                    this.buttonsContainer.style.display = 'flex';
                    setTimeout(() => {
                        this.buttonsContainer.style.opacity = '1';
                        this.buttonsContainer.style.transform = 'translateY(0)';
                    }, 50);
                }
            }, 800);
        }
    }

    _startRendering() {
        this.engine.runRenderLoop(() => {
            if (!this.scene) return;
            if (this.isRotating) this.camera.alpha += 0.002;
            this.scene.render();
        });
    }

    _startGameLoading() {
        const loadingSteps = [
            { description: "Préparation des ressources...", duration: 300 },
            { description: "Chargement des textures...", duration: 500 },
            { description: "Initialisation du moteur de jeu...", duration: 400 },
            { description: "Configuration des contrôles...", duration: 200 },
            { description: "Préparation du niveau...", duration: 600 },
            { description: "Finalisation...", duration: 300 }
        ];

        const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0);
        let elapsedDuration = 0;

        const processNextStep = (stepIndex) => {
            if (this.isDisposed) return;
            if (stepIndex >= loadingSteps.length) {
                setTimeout(() => {
                    if (this.isDisposed) return;
                    this.loadingScreen.updateProgress(100, "Démarrage du jeu...");
                    setTimeout(() => {
                        if (this.isDisposed) return;
                        this.loadingScreen.hide();
                        const callback = this.onPlayButtonClicked;
                        this.dispose();
                        if (typeof callback === 'function') callback();
                    }, 500);
                }, 300);
                return;
            }

            const currentStep = loadingSteps[stepIndex];
            const startProgress = (elapsedDuration / totalDuration) * 100;
            const endProgress = ((elapsedDuration + currentStep.duration) / totalDuration) * 100;

            this.loadingScreen.updateProgress(startProgress, currentStep.description);

            let stepProgress = 0;
            const stepInterval = 30;
            const totalSteps = currentStep.duration / stepInterval;

            const updateStepProgress = () => {
                if (this.isDisposed) return;

                stepProgress++;
                const currentProgress = startProgress + ((endProgress - startProgress) * (stepProgress / totalSteps));
                this.loadingScreen.updateProgress(currentProgress, currentStep.description);

                if (stepProgress < totalSteps) {
                    setTimeout(updateStepProgress, stepInterval);
                } else {
                    elapsedDuration += currentStep.duration;
                    processNextStep(stepIndex + 1);
                }
            };

            setTimeout(updateStepProgress, stepInterval);
        };

        this.loadingScreen.show();
        setTimeout(() => processNextStep(0), 200);
    }

    show() {
        if (this.menuContainer) this.menuContainer.style.display = 'flex';
        this.isRotating = true;
    }

    hide() {
        if (this.menuContainer) this.menuContainer.style.display = 'none';
        this.isRotating = false;
    }

    dispose() {
        if (this.isDisposed) return;
        this.isDisposed = true;

        if (this.handleKeyPress) {
            window.removeEventListener('keydown', this.handleKeyPress);
            this.handleKeyPress = null;
        }

        if (this.handleClick) {
            window.removeEventListener('click', this.handleClick);
            this.handleClick = null;
        }

        if (this.engine) {
            try {
                this.engine.stopRenderLoop();
            } catch (e) {
                console.warn("Erreur lors de l'arrêt de la boucle de rendu:", e);
            }
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.menuContainer?.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
            this.menuContainer = null;
        }

        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }

        this.camera = null;
        this.engine = null;
    }

    _showCredits() {
        if (this.buttonsContainer && this.creditsContainer) {
            // Masquer les boutons avec animation
            this.buttonsContainer.style.opacity = '0';
            this.buttonsContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.buttonsContainer.style.display = 'none';
                
                // Afficher les crédits avec animation
                this.creditsContainer.style.display = 'flex';
                setTimeout(() => {
                    this.creditsContainer.style.opacity = '1';
                    this.creditsContainer.style.transform = 'translateY(0)';
                }, 50);
            }, 500);
        }
    }

    _hideCredits() {
        if (this.buttonsContainer && this.creditsContainer) {
            // Masquer les crédits avec animation
            this.creditsContainer.style.opacity = '0';
            this.creditsContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.creditsContainer.style.display = 'none';
                
                // Afficher les boutons avec animation
                this.buttonsContainer.style.display = 'flex';
                setTimeout(() => {
                    this.buttonsContainer.style.opacity = '1';
                    this.buttonsContainer.style.transform = 'translateY(0)';
                }, 50);
            }, 500);
        }
    }
}

import * as BABYLON from '@babylonjs/core';
import { loadMapParts } from '../scene/mapGestion.js';
import { createEnvironment } from '../scene/environment.js';
import { createEnvironmentParticles } from '../effects/visualEffects.js';
import { LoadingScreen } from './loadingScreen.js';

export class MainMenu {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(canvas, true, {
            limitFPS: 60,
            adaptToDeviceRatio: true
        });

        this.scene = null;
        this.camera = null;
        this.isRotating = true;
        this.onPlayButtonClicked = null;
        this.loadingScreen = new LoadingScreen();
        this.isDisposed = false;
        this.unicornMesh = null;
        this.salsaAnimation = null;

        this._createScene();

        const resizeHandler = () => {
            if (this.engine && !this.isDisposed) {
                this.engine.resize();
            }
        };
        
        window.addEventListener('resize', resizeHandler);
        this.resizeHandler = resizeHandler;
    }

    async _createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); 
        this.scene.collisionsEnabled = false; 
        this.scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
        this.scene.metadata = {};

        this.camera = new BABYLON.ArcRotateCamera(
            "menuCamera",
            Math.PI,
            Math.PI / 4,
            15,
            new BABYLON.Vector3(0, 3, 0),
            this.scene
        );

        this.camera.attachControl(this.canvas, false);
        this.camera.inputs.clear(); 
        this.scene.lights.forEach(light => light.dispose());
        createEnvironment(this.scene);
        await loadMapParts(this.scene);
        

        this.scene.freezeActiveMeshes(); 
        this.scene.skipPointerMovePicking = true; 
        this.scene.performancePriority = BABYLON.ScenePerformancePriority.Aggressive; 
        this._createUI();
        this._startRendering();
    }
    

    _createUI() {
        if (document.getElementById('mainMenuContainer')) return;

        // Créer le conteneur principal
        const menuContainer = document.createElement('div');
        menuContainer.id = 'mainMenuContainer';
        Object.assign(menuContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'none',
            zIndex: '1000',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
        });

        // Ajouter un overlay semi-transparent avec un dégradé
        const overlay = document.createElement('div');
        Object.assign(overlay.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)',
            zIndex: '999',
            pointerEvents: 'none'
        });



        // Créer un conteneur pour le titre et les boutons
        const contentContainer = document.createElement('div');
        Object.assign(contentContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '2rem',
            borderRadius: '20px',
            pointerEvents: 'auto',
            zIndex: '1001'
        });

        const gameTitle = document.createElement('h1');
        gameTitle.textContent = 'Dreamfall';
        Object.assign(gameTitle.style, {
            color: 'white',
            fontSize: '5rem',
            marginBottom: '0.01rem',
            textAlign: 'center',
            fontWeight: 'bold',
            letterSpacing: '2px',
            background: 'white',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
        });

        const subtitle = document.createElement('h2');
        subtitle.textContent = 'The invasion began where dreams were born ...';
        Object.assign(subtitle.style, {
            color: 'white',
            fontSize: '1.5rem',
            marginBottom: '3rem',
            marginTop: '0.01rem',
            textAlign: 'center',
            opacity: '0.9'
        });

        // Créer un conteneur pour les boutons
        const buttonsContainer = document.createElement('div');
        Object.assign(buttonsContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            width: '100%',
            alignItems: 'center'
        });

        // Fonction pour créer un bouton stylisé
        const createButton = (text, isDisabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            
            // Style de base du bouton
            Object.assign(button.style, {
                backgroundColor: isDisabled ? 'rgba(100, 100, 100, 0.3)' : 'rgba(70, 130, 180, 0.7)',
                color: 'white',
                border: 'none',
                padding: '15px 0',
                width: '250px',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                borderRadius: '15px',
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: isDisabled ? 'none' : '0 0 15px rgba(138, 43, 226, 0.5)',
                position: 'relative',
                overflow: 'hidden'
            });

            if (!isDisabled) {
                // Ajouter des événements pour l'effet arc-en-ciel au survol
                button.addEventListener('mouseenter', () => {
                    button.style.background = 'linear-gradient(90deg, #ff8a00, #ff0080, #8a2be2, #4169e1, #00bfff)';
                    button.style.backgroundSize = '400% 100%';
                    button.style.animation = 'rainbowMove 3s ease infinite';
                    button.style.transform = 'translateY(-5px)';
                    button.style.boxShadow = '0 0 20px rgba(138, 43, 226, 0.8), 0 0 30px rgba(70, 130, 180, 0.5)';
                });

                button.addEventListener('mouseleave', () => {
                    button.style.background = 'rgba(70, 130, 180, 0.7)';
                    button.style.animation = 'none';
                    button.style.transform = 'translateY(0)';
                    button.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
                });
            }

            return button;
        };

        const playButton = createButton('Play');
        const settingsButton = createButton('Settings', true);
        const creditsButton = createButton('Credits', true);

        playButton.addEventListener('click', () => {
            this.hide();
            this.loadingScreen.show();
            this._startGameLoading();
        });

        buttonsContainer.appendChild(playButton);
        buttonsContainer.appendChild(settingsButton);
        buttonsContainer.appendChild(creditsButton);

        const gameSubtitle = document.createElement('div');
        gameSubtitle.textContent = 'Jeu réalisé pour le GameOnWeb 2025 - Dreamland';
        Object.assign(gameSubtitle.style, {
            position: 'absolute',
            bottom: '2rem',
            left: '2rem',
            color: 'white',
            marginBottom: '0.5rem',   
            fontSize: '1rem',
        });

        const copyright = document.createElement('div');
        copyright.textContent = '© Team BabyGame - UnicA';
        Object.assign(copyright.style, {
            position: 'absolute',
            bottom: '1rem',
            left: '2rem',
            color: 'white',
            fontSize: '0.9rem'
        });

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes rainbowMove {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }
        `;
        
        document.head.appendChild(styleSheet);
        contentContainer.appendChild(gameTitle);
        contentContainer.appendChild(subtitle);
        contentContainer.appendChild(buttonsContainer);
        
        menuContainer.appendChild(contentContainer);
        menuContainer.appendChild(gameSubtitle);
        menuContainer.appendChild(copyright);
        
        document.body.appendChild(overlay);
        document.body.appendChild(menuContainer);
        this.menuContainer = menuContainer;
        this.overlay = overlay;
    }

    _startRendering() {
        this.engine.runRenderLoop(() => {
            if (!this.scene) return;

            if (this.isRotating) {
                this.camera.alpha += 0.002; 
            }

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
                // Chargement terminé, démarrer le jeu
                setTimeout(() => {
                    // Vérifier si le menu a été disposé entre-temps
                    if (this.isDisposed) return;
                    
                    this.loadingScreen.updateProgress(100, "Démarrage du jeu...");
                    
                    setTimeout(() => {
                        if (this.isDisposed) return;                        
                        this.loadingScreen.hide();
                        const callback = this.onPlayButtonClicked;
                        this.dispose();
                        if (typeof callback === 'function') {
                            callback();
                        }
                    }, 500);
                }, 300);
                return;
            }
            
            const currentStep = loadingSteps[stepIndex];
            const startProgress = (elapsedDuration / totalDuration) * 100;
            const endProgress = ((elapsedDuration + currentStep.duration) / totalDuration) * 100;
            
            // Mettre à jour le texte de l'étape
            this.loadingScreen.updateProgress(startProgress, currentStep.description);
            
            // Simuler la progression de cette étape
            let stepProgress = 0;
            const stepInterval = 30; // Mise à jour toutes les 30ms
            const totalSteps = currentStep.duration / stepInterval;
            
            const updateStepProgress = () => {
                if (this.isDisposed) return;
                
                stepProgress++;
                const currentProgress = startProgress + ((endProgress - startProgress) * (stepProgress / totalSteps));
                
                this.loadingScreen.updateProgress(currentProgress, currentStep.description);
                
                if (stepProgress < totalSteps) {
                    setTimeout(updateStepProgress, stepInterval);
                } else {
                    // Étape terminée, passer à la suivante
                    elapsedDuration += currentStep.duration;
                    processNextStep(stepIndex + 1);
                }
            };
            
            // Démarrer la progression de cette étape
            setTimeout(updateStepProgress, stepInterval);
        };
        this.loadingScreen.show();
        setTimeout(() => processNextStep(0), 200);
    }

    show() {
        if (this.menuContainer) this.menuContainer.style.display = 'flex';
        if (this.overlay) this.overlay.style.display = 'block';
        this.isRotating = true;
    }

    hide() {
        if (this.menuContainer) this.menuContainer.style.display = 'none';
        if (this.overlay) this.overlay.style.display = 'none';
        this.isRotating = false;
    }

    dispose() {
        // Éviter les appels multiples à dispose
        if (this.isDisposed) return;
        this.isDisposed = true;
        
        // Arrêter la boucle de rendu si le moteur existe encore
        if (this.engine) {
            try {
                this.engine.stopRenderLoop();
            } catch (e) {
                console.warn("Erreur lors de l'arrêt de la boucle de rendu:", e);
            }
        }

        // Supprimer l'écouteur d'événement de redimensionnement
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }
        
        // Nettoyer l'interface utilisateur
        if (this.menuContainer?.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
            this.menuContainer = null;
        }

        if (this.overlay?.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
            this.overlay = null;
        }

        // Nettoyer la scène
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        
        // Libérer la mémoire
        this.camera = null;
        this.engine = null;
    }
}
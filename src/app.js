import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import "@babylonjs/core/Debug/debugLayer";
import { setupCamera } from "./camera/cameraManager.js";
import { createEnvironmentParticles } from "./effects/visualEffects.js";
import { createPlayer } from "./joueur/player.js";
import { setupHUD, initializeHUDUpdates } from "./ui/fpsDisplay.js";
import { instructions } from "./ui/instruction.js";
import { loadMapParts } from "./scene/mapGestion.js";
import { initializeAnimations } from "./joueur/animations.js";
import { createEnvironment } from "./scene/environment.js";
import { setupControls } from "./evenement/controls.js";
import { setupTouchControls } from "./evenement/touchControls.js";
import { LevelManager } from "./levels/levelManager.js";
import { createMiniMap } from "./ui/miniMap.js"; 
import { MainMenu } from "./ui/mainMenu.js";
import { LoadingScreen } from "./ui/loadingScreen.js";
import { setupCompass } from "./ui/compass.js";
import { Tutorial } from "./ui/tutorial.js";
import { WelcomePage } from "./ui/welcomePage.js";
import { GamepadHelp } from "./ui/gamepadHelp.js";

let mainMenu = null;
let loadingScreen = null;
let isGameLoading = false;
let gameStarted = false;

// Fonction pour détecter les appareils mobiles
const isMobileDevice = () => {
  return (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
    (window.innerWidth <= 768) || 
    ('ontouchstart' in window) || 
    (navigator.maxTouchPoints > 0)
  );
};

const isOnMobile = isMobileDevice();
console.log("Est sur mobile:", isOnMobile);

const initBabylon = async () => {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true, {
    limitFPS: 60,
    adaptToDeviceRatio: true,
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === '-' && !gameStarted) {
      console.log("Mode développement activé: démarrage rapide du jeu");
      if (mainMenu) {
        mainMenu.hide();
      }
      if (!isGameLoading) {
        isGameLoading = true;
        gameStarted = true;
        startGame(canvas, engine, true);
      }
    }
  });

  if (isOnMobile) {
    console.log("Appareil mobile détecté: démarrage direct du jeu");
    isGameLoading = true;
    gameStarted = true;
    // Créer un écran de chargement même pour les appareils mobiles
    loadingScreen = new LoadingScreen();
    document.body.appendChild(loadingScreen.getElement());
    startGame(canvas, engine, true);
  } else {
    // Création du menu principal uniquement sur desktop
    mainMenu = new MainMenu(canvas);
    
    // Définir la fonction de callback pour le bouton Jouer
    // Cette fonction sera appelée APRÈS que le menu ait été nettoyé
    mainMenu.onPlayButtonClicked = () => {
      // Éviter les démarrages multiples
      if (isGameLoading) return;
      isGameLoading = true;
      gameStarted = true;
      
      // Démarrer le jeu
      startGame(canvas, engine);
    };
  }

  // Fonction pour démarrer le jeu
  async function startGame(canvas, engine, skipIntro = false) {
    try {
      // Initialiser le jeu
      const scene = new BABYLON.Scene(engine);
      scene.collisionsEnabled = true;
      scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
      scene.metadata = {};
      scene.metadata.isMobile = isOnMobile; // Ajouter l'info mobile aux métadonnées
      
      // Créer un écran de chargement indépendant si nécessaire
      // (dans notre cas, il est déjà géré par le menu principal)
      
      // Liste des tâches de chargement avec leur poids relatif et descriptions
      const loadingTasks = [
        { 
          name: "environment", 
          weight: 15, 
          description: "Chargement de l'environnement...",
          func: () => createEnvironment(scene) 
        },
        { 
          name: "camera", 
          weight: 5, 
          description: "Configuration de la caméra...",
          func: () => setupCamera(scene, canvas) 
        },
        { 
          name: "player", 
          weight: 20, 
          description: "Création du personnage...",
          func: async (camera) => await createPlayer(scene, camera, canvas) 
        },
        { 
          name: "animations", 
          weight: 10, 
          description: "Chargement des animations...",
          func: () => initializeAnimations(scene) 
        },
        { 
          name: "mapParts", 
          weight: 30, 
          description: "Génération de la carte...",
          func: async () => await loadMapParts(scene) 
        },
        { 
          name: "particles", 
          weight: 10, 
          description: "Création des effets visuels...",
          func: () => createEnvironmentParticles(scene) 
        },
        { 
          name: "level", 
          weight: 10, 
          description: "Initialisation du niveau...",
          func: async () => {
            const levelManager = new LevelManager(scene);
            await levelManager.levels[1].init();
            scene.metadata.levelManager = levelManager;
            return levelManager;
          }
        }
      ];
      
      // Calculer le poids total
      const totalWeight = loadingTasks.reduce((sum, task) => sum + task.weight, 0);
      let completedWeight = 0;
      
      // Exécuter les tâches de chargement séquentiellement
      let camera, player, animations, levelManager;
      
      for (let i = 0; i < loadingTasks.length; i++) {
        const task = loadingTasks[i];
        try {
          // Mettre à jour le texte de l'étape de chargement
          if (mainMenu && mainMenu.loadingScreen && !skipIntro) {
            mainMenu.loadingScreen.updateProgress(
              (completedWeight / totalWeight) * 100,
              task.description
            );
          } else if (loadingScreen && skipIntro) {
            // Utiliser l'écran de chargement indépendant pour mobile
            loadingScreen.updateProgress(
              (completedWeight / totalWeight) * 100,
              task.description
            );
          }
          
          // Pour la tâche du joueur, nous avons besoin de la caméra
          let result;
          if (task.name === "player" && camera) {
            result = await task.func(camera);
          } else {
            result = await task.func();
          }
          
          // Stocker les résultats importants
          if (task.name === "camera") camera = result;
          else if (task.name === "player") player = result;
          else if (task.name === "animations") animations = result;
          else if (task.name === "level") levelManager = result;
          
          // Mettre à jour la progression
          completedWeight += task.weight;
          const progress = (completedWeight / totalWeight) * 100;
          
          // Mettre à jour la barre de progression
          if (mainMenu && mainMenu.loadingScreen && !skipIntro) {
            mainMenu.loadingScreen.updateProgress(
              progress,
              i < loadingTasks.length - 1 
                ? "Chargement terminé : " + task.description.replace("Chargement ", "").replace("...", "")
                : "Finalisation..."
            );
          } else if (loadingScreen && skipIntro) {
            // Utiliser l'écran de chargement indépendant pour mobile
            loadingScreen.updateProgress(
              progress,
              i < loadingTasks.length - 1 
                ? "Chargement terminé : " + task.description.replace("Chargement ", "").replace("...", "")
                : "Finalisation..."
            );
          }
          
          // Petite pause pour permettre à l'interface de se mettre à jour
          if (!skipIntro) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } catch (error) {
          console.error(`Erreur lors du chargement de ${task.name}:`, error);
          
          // Afficher l'erreur dans l'écran de chargement
          if (mainMenu && mainMenu.loadingScreen && !skipIntro) {
            mainMenu.loadingScreen.updateProgress(
              (completedWeight / totalWeight) * 100,
              `Erreur: ${task.name} - Tentative de continuer...`
            );
          } else if (loadingScreen && skipIntro) {
            loadingScreen.updateProgress(
              (completedWeight / totalWeight) * 100,
              `Erreur: ${task.name} - Tentative de continuer...`
            );
          }
          
          // Pause avant de continuer
          if (!skipIntro) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      // Afficher un message de finalisation
      if (mainMenu && mainMenu.loadingScreen && !skipIntro) {
        mainMenu.loadingScreen.updateProgress(100, "Démarrage du jeu...");
      } else if (loadingScreen && skipIntro) {
        loadingScreen.updateProgress(100, "Démarrage du jeu...");
        // Supprimer l'écran de chargement après un court délai
        setTimeout(() => {
          if (loadingScreen) {
            loadingScreen.hide();
            loadingScreen = null;
          }
        }, 1000);
      }
      
      // Configurer les contrôles après avoir chargé le joueur et les animations
      const controls = setupControls(scene, player.hero, animations, camera, canvas);
      scene.metadata.controls = controls;
      
      // Configurer les contrôles tactiles si on est sur mobile
      let touchControls = null;
      if (isOnMobile) {
        touchControls = setupTouchControls(scene, canvas);
        scene.metadata.touchControls = touchControls;
        
        // Fusionner les inputs du tactile et du clavier
        const originalInputMap = controls.inputMap;
        const touchInputMap = touchControls.getInputMap();
        
        // Wrapper l'inputMap pour combiner les deux sources d'input
        const combinedInputMap = new Proxy({}, {
          get: function(target, prop) {
            return originalInputMap[prop] || touchInputMap[prop] || false;
          }
        });
        
        // Remplacer l'inputMap original par le combiné
        controls.inputMap = combinedInputMap;
      }
      
      // Stocker la référence au player pour permettre aux contrôles mobiles d'y accéder
      scene.metadata.player = player;
      
      // Configurer l'interface utilisateur
      const fpsDisplay = setupHUD();
      const hudControls = initializeHUDUpdates(fpsDisplay);
      
      // Stocker les références au HUD pour que d'autres composants puissent les utiliser
      scene.metadata.hudControls = hudControls;
      
      const instruction = instructions();
      const miniMap = createMiniMap();
      const compass = setupCompass();
      const tutorial = new Tutorial(scene);
      
      // Créer l'aide pour les manettes
      const gamepadHelp = new GamepadHelp();
      
      // Créer un bouton pour ouvrir l'aide manette
      const gamepadHelpButton = document.createElement('button');
      Object.assign(gamepadHelpButton.style, {
          position: 'absolute',
          bottom: '20px',
          right: '20px',
          padding: '10px 15px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          zIndex: '1500',
          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.3)',
          transition: 'background-color 0.2s'
      });
      
      gamepadHelpButton.innerHTML = '<span style="font-size: 20px;">🎮</span> Aide Manette';
      gamepadHelpButton.addEventListener('mouseenter', () => {
          gamepadHelpButton.style.backgroundColor = 'rgba(20, 20, 20, 0.9)';
      });
      gamepadHelpButton.addEventListener('mouseleave', () => {
          gamepadHelpButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      });
      gamepadHelpButton.addEventListener('click', () => {
          gamepadHelp.toggle();
      });
      
      document.body.appendChild(gamepadHelpButton);
      
      // Variables pour le tutoriel
      let mouseMoved = false;
      let currentMouseX = 0;
      
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
          mouseMoved = true;
          currentMouseX = pointerInfo.event.clientX;
        }
      });

      // Si on est en mode développement avec raccourci ou sur mobile, on skip le tutoriel
      if (skipIntro || isOnMobile) {
        console.log("Mode développement ou mobile: skip du tutoriel et de la page d'accueil");
        // Marquer le tutoriel comme complété pour éviter qu'il ne s'affiche
        tutorial.isCompleted = true;
      } else {
        // Créer et afficher la page d'accueil, puis afficher le tutoriel une fois terminé
        const welcomePage = new WelcomePage(() => {
          setTimeout(() => {
            tutorial.show();
          }, 500);
        });
        
        // Afficher la page d'accueil après un court délai
        setTimeout(() => {
          welcomePage.show();
        }, 1000);
      }

      // Ajouter la prise en charge des écrans tactiles pour le jeu
      if (isOnMobile) {
        // Gérer les clics/touches sur l'écran pour tirer
        canvas.addEventListener('touchstart', (event) => {
          event.preventDefault(); // Empêche le double-clic sur mobile
          
          // Si le tutoriel est visible et attend un appui sur espace, on simule cet appui
          if (tutorial.isVisible && (tutorial.currentStep === 4 || tutorial.currentStep === 6)) {
            // Simuler l'appui sur espace
            controls.inputMap[" "] = true;
            controls.inputMap["space"] = true;
            
            // Réinitialiser l'état après un court délai
            setTimeout(() => {
              controls.inputMap[" "] = false;
              controls.inputMap["space"] = false;
            }, 100);
          }
          
          // Continuer avec le tir
          if (isActionAllowed('shoot')) {
            scene.metadata.executeShot?.(player.hero.position, camera.getForwardRay().direction);
          }
        });

        // Fonction auxiliaire pour vérifier si une action est autorisée
        function isActionAllowed(action) {
          if (scene.metadata.tutorial && scene.metadata.tutorial.isVisible) {
            return scene.metadata.tutorial.isActionAllowed(action);
          }
          return true;
        }
      }

      // Stocker la référence au tutoriel dans les métadonnées de la scène pour y accéder depuis les contrôles
      scene.metadata.tutorial = tutorial;
      
      const mapBounds = {
        minX: -90,
        maxX: 90,
        minZ: -90,
        maxZ: 90
      };
      
      // Afficher les informations de la carte
      const mapToggleInfo = document.createElement('div');
      mapToggleInfo.id = 'mapToggleInfo';
      mapToggleInfo.textContent = 'Appuyez sur M pour afficher/masquer la carte';
      document.body.appendChild(mapToggleInfo);
      
      setTimeout(() => {
        mapToggleInfo.style.opacity = '0';
        setTimeout(() => {
          mapToggleInfo.style.display = 'none';
        }, 1000);
      }, 5000);
      
      // Configurer les contrôles supplémentaires
      if (scene.metadata.controls) {
        const originalHandleKeyDown = scene.metadata.controls.handleKeyDown;
        const originalHandleKeyUp = scene.metadata.controls.handleKeyUp;
        scene.metadata.controls.handleKeyDown = (event) => {
          originalHandleKeyDown(event);
        };
        
        scene.metadata.controls.handleKeyUp = (event) => {
          originalHandleKeyUp(event);
        };
      }
      
      // Ajouter un événement pour activer l'inspecteur de scène
      window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'i') {
          if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
          } else {
            scene.debugLayer.show();
          }
        }
        // Ajouter une touche pour ouvrir l'aide manette (touche G)
        if (event.key.toLowerCase() === 'g') {
          gamepadHelp.toggle();
        }
      });
      
      // Démarrer la boucle de rendu
      engine.runRenderLoop(() => {
        scene.render();
        player.handleShooting(animations);
        
        // Mettre à jour le tutoriel
        if (tutorial.isVisible) {
          tutorial.update(controls.inputMap, mouseMoved, player.isShooting, currentMouseX);
          
          // Réinitialiser le flag mouseMoved après chaque frame
          mouseMoved = false;
        }
        
        if (player.hero && levelManager) {
          levelManager.checkProximity(player.hero.position);
        }
        if (player.hero) {
          miniMap.updatePlayerPosition(player.hero.position, player.hero.rotation.y, mapBounds);
          compass.update(player.hero.rotation.y);
        }
        if (levelManager.currentLevel === 2) {
          miniMap.updateBananaMarkers(levelManager.levels[2].bananas, mapBounds);
        }
        
        // Mettre à jour directement le FPS avec la valeur du moteur
        fpsDisplay.updateFPS(engine.getFps());
      });
      
      window.addEventListener("resize", () => {
        engine.resize();
      });
    } catch (error) {
      console.error("Erreur lors du démarrage du jeu:", error);
    }
  }
};

// Initialiser Babylon.js
initBabylon();
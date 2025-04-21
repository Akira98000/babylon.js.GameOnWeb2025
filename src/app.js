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
import { LevelManager } from "./levels/levelManager.js";
import { createMiniMap } from "./ui/miniMap.js"; 
import { MainMenu } from "./ui/mainMenu.js";
import { LoadingScreen } from "./ui/loadingScreen.js";
import { setupCompass } from "./ui/compass.js";
import { WelcomePage } from "./ui/welcomePage.js";
import { LevelSelector } from "./ui/levelSelector.js";

let mainMenu = null;
let loadingScreen = null;
let isGameLoading = false;
let welcomePage = null;

const initBabylon = async () => {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true, {
    adaptToDeviceRatio: true,
  });

  // Vérifier si le jeu a déjà été démarré
  const gameStarted = localStorage.getItem('gameStarted');
  
  if (gameStarted === 'true') {
    // Si le jeu a déjà été démarré, passer directement au chargement
    startGame(canvas, engine);
  } else {
    // Sinon, afficher le menu principal
    mainMenu = new MainMenu(canvas);
    
    // Définir la fonction de callback pour le bouton Jouer
    // Cette fonction sera appelée APRÈS que le menu ait été nettoyé
    mainMenu.onPlayButtonClicked = () => {
      // Éviter les démarrages multiples
      if (isGameLoading) return;
      isGameLoading = true;
      
      // Stocker dans localStorage que le jeu a été démarré
      localStorage.setItem('gameStarted', 'true');
      
      // Démarrer le jeu
      startGame(canvas, engine);
    };
  }

  // Fonction pour démarrer le jeu
  async function startGame(canvas, engine) {
    try {
      // Marquer que le jeu est en cours de chargement
      isGameLoading = true;
      
      // Initialiser le jeu
      const scene = new BABYLON.Scene(engine);
      scene.collisionsEnabled = true;
      scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
      scene.metadata = {};
      
      // Créer un écran de chargement indépendant si le menu principal n'existe pas
      if (!mainMenu || !mainMenu.loadingScreen) {
        loadingScreen = new LoadingScreen(canvas);
        loadingScreen.show();
      }
      
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
          func: async (camera) => {
            const player = await createPlayer(scene, camera, canvas);
            scene.metadata.player = player; // Stocker la référence du joueur dans les métadonnées
            return player;
          }
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

            // Initialiser le sélecteur de niveau
            const levelSelector = new LevelSelector(levelManager);
            
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
          const updateLoadingProgress = (progress, description) => {
            if (mainMenu && mainMenu.loadingScreen) {
              mainMenu.loadingScreen.updateProgress(progress, description);
            } else if (loadingScreen) {
              loadingScreen.updateProgress(progress, description);
            }
          };
          
          // Mettre à jour la progression
          updateLoadingProgress(
            (completedWeight / totalWeight) * 100,
            task.description
          );
          
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
          updateLoadingProgress(
            progress,
            i < loadingTasks.length - 1 
              ? "Chargement terminé : " + task.description.replace("Chargement ", "").replace("...", "")
              : "Finalisation..."
          );
          
          // Petite pause pour permettre à l'interface de se mettre à jour
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Erreur lors du chargement de ${task.name}:`, error);
          
          // Afficher l'erreur dans l'écran de chargement
          if (mainMenu && mainMenu.loadingScreen) {
            mainMenu.loadingScreen.updateProgress(
              (completedWeight / totalWeight) * 100,
              `Erreur: ${task.name} - Tentative de continuer...`
            );
          } else if (loadingScreen) {
            loadingScreen.updateProgress(
              (completedWeight / totalWeight) * 100,
              `Erreur: ${task.name} - Tentative de continuer...`
            );
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (mainMenu && mainMenu.loadingScreen) {
        mainMenu.loadingScreen.updateProgress(100, "Démarrage du jeu...");
      } else if (loadingScreen) {
        loadingScreen.updateProgress(100, "Démarrage du jeu...");
      }
      
      if (loadingScreen) {
        loadingScreen.hide();
      }
      
      const controls = setupControls(scene, player.hero, animations, camera, canvas);
      scene.metadata.controls = controls;
      
      const fpsDisplay = setupHUD();
      const hudControls = initializeHUDUpdates(fpsDisplay);
      const instruction = instructions();
      const miniMap = createMiniMap();
      const compass = setupCompass();
      let mouseMoved = false;
      let currentMouseX = 0;
      
      scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
          mouseMoved = true;
          currentMouseX = pointerInfo.event.clientX;
        }
      });
      
      setTimeout(() => {
        welcomePage = new WelcomePage(() => {
          // Callback when welcome page is completed
          console.log("Welcome page completed");
        });
        welcomePage.show();
      }, 1000);

      const mapBounds = {
        minX: -90,
        maxX: 90,
        minZ: -90,
        maxZ: 90
      };
      
      const mapToggleInfo = document.createElement('div');
      mapToggleInfo.id = 'mapToggleInfo';
      mapToggleInfo.textContent = 'Appuyez sur M pour afficher/masquer la carte';
      document.body.appendChild(mapToggleInfo);
      
      const cameraResetInfo = document.createElement('div');
      cameraResetInfo.id = 'cameraResetInfo';
      cameraResetInfo.textContent = 'Appuyez sur R pour réinitialiser la caméra';
      cameraResetInfo.style.position = 'absolute';
      cameraResetInfo.style.bottom = '260px';
      cameraResetInfo.style.right = '20px';
      cameraResetInfo.style.color = 'white';
      cameraResetInfo.style.fontFamily = 'Arial, sans-serif';
      cameraResetInfo.style.fontSize = '14px';
      cameraResetInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      cameraResetInfo.style.padding = '5px 10px';
      cameraResetInfo.style.borderRadius = '5px';
      cameraResetInfo.style.transition = 'opacity 1s ease';
      document.body.appendChild(cameraResetInfo);
      
      // Ajouter des instructions de déplacement
      const movementInfo = document.createElement('div');
      movementInfo.id = 'movementInfo';
      movementInfo.innerHTML = 'Contrôles: <br>Z: Avancer<br>S: Se retourner et reculer<br>Q: Tourner et avancer à gauche<br>D: Tourner et avancer à droite<br>Souris: Contrôler la caméra<br>R: Réinitialiser caméra';
      movementInfo.style.position = 'absolute';
      movementInfo.style.bottom = '340px';
      movementInfo.style.right = '20px';
      movementInfo.style.color = 'white';
      movementInfo.style.fontFamily = 'Arial, sans-serif';
      movementInfo.style.fontSize = '14px';
      movementInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
      movementInfo.style.padding = '5px 10px';
      movementInfo.style.borderRadius = '5px';
      movementInfo.style.transition = 'opacity 1s ease';
      document.body.appendChild(movementInfo);
      
      setTimeout(() => {
        mapToggleInfo.style.opacity = '0';
        cameraResetInfo.style.opacity = '0';
        movementInfo.style.opacity = '0';
        setTimeout(() => {
          mapToggleInfo.style.display = 'none';
          cameraResetInfo.style.display = 'none';
          movementInfo.style.display = 'none';
        }, 1000);
      }, 8000);
      
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
        
        // Ajouter une touche pour réinitialiser le localStorage (retour au menu principal)
        if (event.key.toLowerCase() === 'l' && event.ctrlKey) {
          localStorage.removeItem('gameStarted');
          alert('LocalStorage réinitialisé. Rechargez la page pour accéder au menu principal.');
        }
      });
      
      // Démarrer la boucle de rendu
      engine.runRenderLoop(() => {
        scene.render();
        player.handleShooting(animations);
        
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
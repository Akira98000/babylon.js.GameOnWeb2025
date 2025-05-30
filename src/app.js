import * as BABYLON from "@babylonjs/core";
import "@babylonjs/loaders";
import "@babylonjs/inspector";
import "@babylonjs/core/Debug/debugLayer";
import { setupCamera } from "./camera/cameraManager.js";
import { createEnvironmentParticles } from "./effects/visualEffects.js";
import { createPlayer } from "./joueur/player.js";
import { setupHUD, initializeHUDUpdates } from "./ui/fpsDisplay.js";
import { loadMapParts } from "./scene/mapGestion.js";
import { initializeAnimations } from "./joueur/animations.js";
import { createEnvironment } from "./scene/environment.js";
import { setupControls } from "./evenement/controls.js";
import { LevelManager } from "./levels/levelManager.js";
import { MainMenu } from "./ui/mainMenu.js";
import { LoadingScreen } from "./ui/loadingScreen.js";
import { setupCompass } from "./ui/compass.js";
import { WelcomePage } from "./ui/welcomePage.js";
import { LevelSelector } from "./ui/levelSelector.js";
import { PauseMenu } from './ui/pauseMenu.js';
import { createHorrorMusic } from './music.js';
import { setupMinimap } from './ui/minimap.js';

let mainMenu = null;
let loadingScreen = null;
let isGameLoading = false;
let welcomePage = null;
let levelSelector = null;

const initBabylon = async () => {
  const canvas = document.getElementById("renderCanvas");
  const engine = new BABYLON.Engine(canvas, true, {
    adaptToDeviceRatio: true,
  });

  const gameStarted = sessionStorage.getItem('gameStarted');
  
  if (gameStarted === 'true') {
    startGame(canvas, engine);
  } else {
    mainMenu = new MainMenu(canvas);
    mainMenu.onPlayButtonClicked = () => {
      if (isGameLoading) return;
      isGameLoading = true;
      sessionStorage.setItem('gameStarted', 'true');
      startGame(canvas, engine);
    };
  }

  async function startGame(canvas, engine) {
    try {
      isGameLoading = true;
      const scene = new BABYLON.Scene(engine);
      scene.collisionsEnabled = true;
      scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
      scene.metadata = {
        shootingEnabled: false
      };
      
      if (!mainMenu || !mainMenu.loadingScreen) {
        loadingScreen = new LoadingScreen(canvas);
        loadingScreen.show();
      }
      
      const music = createHorrorMusic(scene);
      scene.metadata.music = music;
      
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
            scene.metadata.player = player; 
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
            levelManager.currentLevel = 0; 
            await levelManager.initCurrentLevel();
            scene.metadata.levelManager = levelManager;
            
            const pauseMenu = new PauseMenu(scene, levelManager);
            scene.metadata = scene.metadata || {};
            scene.metadata.pauseMenu = pauseMenu;
            
            return levelManager;
          }
        }
      ];
      
      const totalWeight = loadingTasks.reduce((sum, task) => sum + task.weight, 0);
      let completedWeight = 0;
      let camera, player, animations, levelManager;
      
      for (let i = 0; i < loadingTasks.length; i++) {
        const task = loadingTasks[i];
        try {
          const updateLoadingProgress = (progress, description) => {
            if (mainMenu && mainMenu.loadingScreen) {
              mainMenu.loadingScreen.updateProgress(progress, description);
            } else if (loadingScreen) {
              loadingScreen.updateProgress(progress, description);
            }
          };
          
          updateLoadingProgress(
            (completedWeight / totalWeight) * 100,
            task.description
          );
          
          let result;
          if (task.name === "player" && camera) {
            result = await task.func(camera);
          } else {
            result = await task.func();
          }
          
          if (task.name === "camera") camera = result;
          else if (task.name === "player") player = result;
          else if (task.name === "animations") animations = result;
          else if (task.name === "level") levelManager = result;
          
          completedWeight += task.weight;
          const progress = (completedWeight / totalWeight) * 100;
          
          updateLoadingProgress(
            progress,
            i < loadingTasks.length - 1 
              ? "Chargement terminé : " + task.description.replace("Chargement ", "").replace("...", "")
              : "Finalisation..."
          );
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (error) {
          console.error(`Erreur lors du chargement de ${task.name}:`, error);
          
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
      const compass = setupCompass();
      
      // Initialiser la minimap avec le joueur
      const minimap = setupMinimap(scene, player.hero);
      scene.metadata.minimap = minimap;
      
      // Lier la minimap au gestionnaire de niveaux
      if (levelManager) {
        levelManager.setMinimapInstance(minimap);
      }
      
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
      
      window.addEventListener('keydown', (event) => {
        if (event.key.toLowerCase() === 'i') {
          if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
          } else {
            scene.debugLayer.show();
          }
        }
        
        if (event.key.toLowerCase() === 'l') {
          if (event.ctrlKey) {
            sessionStorage.removeItem('gameStarted');
            alert('SessionStorage réinitialisé. Rechargez la page pour accéder au menu principal.');
          } else if (scene.metadata.levelManager) {
            const levelSelector = new LevelSelector(scene.metadata.levelManager);
            levelSelector.showModal();
          }
        }
      });
      
      engine.runRenderLoop(() => {
        scene.render();
        player.handleShooting(animations);
        
        if (player.hero && levelManager) {
          levelManager.checkProximity(player.hero.position);
        }
        if (player.hero) {
          compass.update(player.hero.rotation.y);
          
          // Mettre à jour la minimap avec la position et rotation du joueur
          if (minimap) {
            minimap.updateMinimap(player.hero.position, player.hero.rotation.y);
          }
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

initBabylon();
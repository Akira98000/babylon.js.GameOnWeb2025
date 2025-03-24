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

let mainMenu = null;
let loadingScreen = null;
let isGameLoading = false;

const initBabylon = async () => {
  const canvas = document.getElementById("renderCanvas");
  
  // Assurez-vous que le canvas est correctement dimensionné
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  // Initialiser le moteur avec des options optimisées pour mobile
  const engineOptions = {
    limitFPS: 60,
    adaptToDeviceRatio: true,
    antialias: false,
    powerPreference: "high-performance",
    failIfMajorPerformanceCaveat: false,
    useHighPrecisionMatrix: false,
    stencil: true,
    disableWebGL2Support: true,
    preserveDrawingBuffer: true
  };
  
  try {
    const engine = new BABYLON.Engine(canvas, true, engineOptions);
    
    // Désactiver les shaders avancés sur Safari
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isSafari || isIOS) {
      // Force le rendu
      engine.renderEvenInBackground = true;
      // Active le forceWebGL1 pour Safari/iOS
      engine.forceWebGL1 = true;
      // Désactiver certains éléments problématiques pour iOS/Safari
      BABYLON.SceneLoader.CleanBoneMatrixWeights = true;
      // Réduire la complexité des shaders
      engine.getCaps().highPrecisionShaderSupported = false;
    }
    
    // Vérifier si WebGL est disponible
    if (!BABYLON.Engine.isSupported()) {
      alert("Votre navigateur ne supporte pas WebGL, ce qui est nécessaire pour ce jeu.");
      return;
    }
    
    // Créer et afficher le menu principal
    mainMenu = new MainMenu(canvas);
    
    // Définir la fonction de callback pour le bouton Jouer
    mainMenu.onPlayButtonClicked = () => {
      // Éviter les démarrages multiples
      if (isGameLoading) return;
      isGameLoading = true;
      
      // Démarrer le jeu
      startGame(canvas, engine);
    };
  } catch (error) {
    console.error("Erreur lors de l'initialisation du moteur Babylon.js:", error);
    
    // Afficher un message d'erreur à l'utilisateur
    const errorMessage = document.createElement('div');
    errorMessage.style.position = 'absolute';
    errorMessage.style.top = '50%';
    errorMessage.style.left = '50%';
    errorMessage.style.transform = 'translate(-50%, -50%)';
    errorMessage.style.color = 'white';
    errorMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    errorMessage.style.padding = '20px';
    errorMessage.style.borderRadius = '5px';
    errorMessage.style.textAlign = 'center';
    errorMessage.style.maxWidth = '80%';
    errorMessage.innerHTML = `
      <h2>Erreur lors du chargement du jeu</h2>
      <p>Nous n'avons pas pu charger le jeu. Veuillez essayer les solutions suivantes:</p>
      <ul style="text-align: left;">
        <li>Rafraîchissez la page</li>
        <li>Utilisez un navigateur plus récent (Chrome, Firefox, Edge)</li>
        <li>Activez l'accélération matérielle dans votre navigateur</li>
        <li>Désactivez le mode économie d'énergie sur votre appareil</li>
      </ul>
    `;
    document.body.appendChild(errorMessage);
  }

  // Fonction pour démarrer le jeu
  async function startGame(canvas, engine) {
    try {
      // Initialiser le jeu
      const scene = new BABYLON.Scene(engine);
      scene.collisionsEnabled = true;
      scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
      scene.metadata = {};
      
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
          if (mainMenu && mainMenu.loadingScreen) {
            mainMenu.loadingScreen.updateProgress(
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
          if (mainMenu && mainMenu.loadingScreen) {
            mainMenu.loadingScreen.updateProgress(
              progress,
              i < loadingTasks.length - 1 
                ? "Chargement terminé : " + task.description.replace("Chargement ", "").replace("...", "")
                : "Finalisation..."
            );
          }
          
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
          }
          
          // Pause avant de continuer
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Afficher un message de finalisation
      if (mainMenu && mainMenu.loadingScreen) {
        mainMenu.loadingScreen.updateProgress(100, "Démarrage du jeu...");
      }
      
      // Configurer les contrôles après avoir chargé le joueur et les animations
      const controls = setupControls(scene, player.hero, animations, camera, canvas);
      scene.metadata.controls = controls;
      
      // Stocker la référence au player pour permettre aux contrôles mobiles d'y accéder
      scene.metadata.player = player;
      
      // Configurer l'interface utilisateur
      const fpsDisplay = setupHUD();
      const hudControls = initializeHUDUpdates(fpsDisplay);
      const instruction = instructions();
      const miniMap = createMiniMap();
      const compass = setupCompass();
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
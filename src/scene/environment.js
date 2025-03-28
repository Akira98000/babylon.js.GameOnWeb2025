import * as BABYLON from "@babylonjs/core";

export function createEnvironment(scene) {
  const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
  const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.disableLighting = true;
  skyboxMaterial.reflectionTexture = null;
  skybox.material = skyboxMaterial;

  const hemiLight = new BABYLON.HemisphericLight("hemiLight", new BABYLON.Vector3(0, 1, 0), scene);
  const dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(0, -1, 0), scene);
  const spotLight = new BABYLON.SpotLight(
    "spotLight",
    BABYLON.Vector3.Zero(),        
    BABYLON.Vector3.Down(),          
    Math.PI / 3,                 
    2,                         
    scene
  );
  spotLight.diffuse = new BABYLON.Color3(1, 1, 0.9);
  spotLight.specular = new BABYLON.Color3(1, 1, 1);
  spotLight.range = 100;
  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2;

  const stormRain = createRainParticles(scene);
  const stormLightning = createLightningEffect(scene);
  
  let stormActive = false;
  let lastLightningTime = 0;
  let lightningIntensity = 0;

  const morning = {
    clearColor: new BABYLON.Color4(0.98, 0.87, 0.89, 1), // Rose pâle
    fogColor: new BABYLON.Color3(0.98, 0.87, 0.89), // Rose pâle
    skyColor: new BABYLON.Color3(0.98, 0.87, 0.89), // Rose pâle
    fogDensity: 0.035, // Brouillard plus dense le matin
    hemiIntensity: 0.4,
    dirIntensity: 0.7,
    spotIntensity: 0,
    hemiDiffuse: new BABYLON.Color3(0.98, 0.85, 0.89),
    hemiGround: new BABYLON.Color3(0.7, 0.6, 0.62),
    dirDiffuse: new BABYLON.Color3(0.98, 0.85, 0.89)
  };

  const day = {
    clearColor: new BABYLON.Color4(1, 0.753, 0.796, 1),
    fogColor: new BABYLON.Color3(0, 0.753, 0.796),
    skyColor: new BABYLON.Color3(1, 1, 1),
    fogDensity: 0.024,
    hemiIntensity: 0.6,
    dirIntensity: 1,
    spotIntensity: 0,
    hemiDiffuse: new BABYLON.Color3(1, 1, 1),
    hemiGround: new BABYLON.Color3(0.5, 0.5, 0.5),
    dirDiffuse: new BABYLON.Color3(1, 1, 1)
  };

  const night = {
    clearColor: new BABYLON.Color4(0, 0, 0, 1),
    fogColor: new BABYLON.Color3(0, 0, 0.16),
    skyColor: new BABYLON.Color3(0, 0, 0.05),
    fogDensity: 0.0234,
    hemiIntensity: 0.1,
    dirIntensity: 0.3,
    spotIntensity: 50,
    hemiDiffuse: new BABYLON.Color3(1, 0.3, 0.3),
    hemiGround: new BABYLON.Color3(0.5, 0.2, 0.2),
    dirDiffuse: new BABYLON.Color3(1, 0.4, 0.4)
  };

  const startTime = Date.now();
  const cycleDuration = 240; 
  
  // Fonction pour activer/désactiver la tempête
  const toggleStorm = () => {
    stormActive = !stormActive;
    
    if (stormActive) {
      stormRain.start();
      // Ajouter un son de tempête si disponible
      if (scene.stormSound) {
        scene.stormSound.play();
      } else {
        // Essayer de charger le son de tempête
        try {
          scene.stormSound = new BABYLON.Sound("stormSound", "/son/storm.mp3", scene, 
            function() {
              // Succès - le son est chargé
              scene.stormSound.loop = true;
              scene.stormSound.volume = 0.5;
              scene.stormSound.play();
            }, 
            {
              volume: 0.5,
              loop: true
            }
          );
        } catch (e) {
          console.warn("Son de tempête non disponible:", e);
        }
      }
    } else {
      stormRain.stop();
      if (scene.stormSound) {
        scene.stormSound.stop();
      }
    }
    
    return stormActive;
  };

  // Activer la tempête lors du démarrage (ou commenter cette ligne pour la désactiver au démarrage)
  // toggleStorm();
  
  // Exposer la fonction pour que d'autres parties du code puissent l'appeler
  scene.toggleStorm = toggleStorm;

  scene.onBeforeRenderObservable.add(() => {
    const elapsed = (Date.now() - startTime) / 1000;
    const fakeHour = (elapsed % cycleDuration) / cycleDuration * 24;
    
    // Calculer les facteurs d'interpolation pour les transitions jour/nuit/matin
    const isMorning = fakeHour >= 5 && fakeHour < 8;
    const isDay = fakeHour >= 8 && fakeHour < 20;
    const isNight = !isMorning && !isDay;
    
    let skySettings;
    if (isMorning) {
      const morningProgress = (fakeHour - 5) / 3; // Progression 0-1 pendant les heures du matin (5h-8h)
      if (morningProgress < 0.5) {
        // Transition nuit -> matin
        const t = morningProgress * 2;
        skySettings = lerpSettings(night, morning, t);
      } else {
        // Transition matin -> jour
        const t = (morningProgress - 0.5) * 2;
        skySettings = lerpSettings(morning, day, t);
      }
    } else if (isDay) {
      // Milieu de journée - utiliser les paramètres de jour
      skySettings = day;
    } else {
      // Nuit - utiliser les paramètres de nuit
      skySettings = night;
    }
    
    // Appliquer les paramètres calculés
    scene.clearColor = skySettings.clearColor;
    scene.fogColor = skySettings.fogColor;
    scene.fogDensity = skySettings.fogDensity;
    skyboxMaterial.emissiveColor = skySettings.skyColor;
    hemiLight.intensity = skySettings.hemiIntensity;
    hemiLight.diffuse = skySettings.hemiDiffuse;
    hemiLight.groundColor = skySettings.hemiGround;
    dirLight.intensity = skySettings.dirIntensity;
    dirLight.diffuse = skySettings.dirDiffuse;
    spotLight.intensity = skySettings.spotIntensity;
    
    // Gestion des éclairs pendant la tempête
    if (stormActive) {
      const now = Date.now();
      
      // Générer des éclairs aléatoires
      if (now - lastLightningTime > 3000 + Math.random() * 7000) {
        lastLightningTime = now;
        lightningIntensity = 1.0;
        
        // Déclencher l'effet visuel d'éclair
        stormLightning.flash();
        
        // Jouer le son du tonnerre avec un délai aléatoire
        setTimeout(() => {
          try {
            const thunderSound = new BABYLON.Sound("thunder", "/son/thunder.mp3", scene, null, {
              volume: 0.3 + Math.random() * 0.5
            });
          } catch (e) {
            console.warn("Son de tonnerre non disponible:", e);
          }
        }, 500 + Math.random() * 2000);
      }
      
      // Faire diminuer progressivement l'intensité de l'éclair
      if (lightningIntensity > 0) {
        lightningIntensity -= 0.05;
        if (lightningIntensity < 0) lightningIntensity = 0;
        
        // Éclaircir temporairement la scène pendant l'éclair
        const lightningFactor = lightningIntensity * 0.3;
        hemiLight.intensity += lightningFactor;
        dirLight.intensity += lightningFactor;
      }
    }
  });
  
  // Retourner des données importantes pour permettre à d'autres parties du code d'interagir avec l'environnement
  return {
    toggleStorm,
    skybox
  };
}

// Fonction d'interpolation pour les transitions entre les différentes périodes de la journée
function lerpSettings(settingsA, settingsB, t) {
  return {
    clearColor: BABYLON.Color4.Lerp(settingsA.clearColor, settingsB.clearColor, t),
    fogColor: BABYLON.Color3.Lerp(settingsA.fogColor, settingsB.fogColor, t),
    skyColor: BABYLON.Color3.Lerp(settingsA.skyColor, settingsB.skyColor, t),
    fogDensity: BABYLON.Scalar.Lerp(settingsA.fogDensity, settingsB.fogDensity, t),
    hemiIntensity: BABYLON.Scalar.Lerp(settingsA.hemiIntensity, settingsB.hemiIntensity, t),
    dirIntensity: BABYLON.Scalar.Lerp(settingsA.dirIntensity, settingsB.dirIntensity, t),
    spotIntensity: BABYLON.Scalar.Lerp(settingsA.spotIntensity, settingsB.spotIntensity, t),
    hemiDiffuse: BABYLON.Color3.Lerp(settingsA.hemiDiffuse, settingsB.hemiDiffuse, t),
    hemiGround: BABYLON.Color3.Lerp(settingsA.hemiGround, settingsB.hemiGround, t),
    dirDiffuse: BABYLON.Color3.Lerp(settingsA.dirDiffuse, settingsB.dirDiffuse, t)
  };
}

function getBlendFactor(hour) {
  const radians = (hour / 24) * 2 * Math.PI;
  const cosValue = Math.cos(radians);
  return BABYLON.Scalar.Clamp((cosValue + 1) / 2, 0, 1);
}

function createRainParticles(scene) {
  const rainSystem = new BABYLON.ParticleSystem("simpleRain", 5000, scene);
  
  // Création d'une texture blanche simple pour la pluie
  const dynamicTexture = new BABYLON.DynamicTexture("dynamicRainTexture", {width: 2, height: 20}, scene, false);
  const ctx = dynamicTexture.getContext();
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 2, 20);
  dynamicTexture.update();
  rainSystem.particleTexture = dynamicTexture;
  
  // Configurer l'émetteur pour couvrir une large zone au-dessus du joueur
  rainSystem.emitter = new BABYLON.Vector3(0, 30, 0);
  rainSystem.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
  rainSystem.maxEmitBox = new BABYLON.Vector3(100, 0, 100);
  
  // Apparence des gouttes de pluie - blanc plus visible
  rainSystem.color1 = new BABYLON.Color4(1, 1, 1, 0.8);
  rainSystem.color2 = new BABYLON.Color4(1, 1, 1, 0.8);
  rainSystem.colorDead = new BABYLON.Color4(1, 1, 1, 0);
  
  // Taille des gouttes - plus visibles et plus longues
  rainSystem.minSize = 0.08;
  rainSystem.maxSize = 0.15;
  
  // Durée de vie et quantité
  rainSystem.minLifeTime = 1.0;
  rainSystem.maxLifeTime = 2.0;
  rainSystem.emitRate = 5000;
  
  // Gravité pour faire tomber la pluie tout droit
  rainSystem.gravity = new BABYLON.Vector3(0, -20, 0); // Augmentation de la gravité pour une chute plus rapide
  rainSystem.direction1 = new BABYLON.Vector3(0, -1, 0);
  rainSystem.direction2 = new BABYLON.Vector3(0, -1, 0);
  
  // Vitesse des gouttes - augmentée pour plus de visibilité du mouvement
  rainSystem.minEmitPower = 2;
  rainSystem.maxEmitPower = 4;
  
  // Mode de fusion pour les particules semi-transparentes
  rainSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  
  // Paramètres d'animation
  rainSystem.updateSpeed = 0.01;
  
  return rainSystem;
}

// Cette fonction n'est plus utilisée mais conservée en commentaire pour référence future
/*
function createWindParticles(scene) {
  const windSystem = new BABYLON.ParticleSystem("wind", 20, scene);
  const smokeTexture = new BABYLON.Texture("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAABmJLR0QA/wD/AP+gvaeTAAAAB3RJTUUH5AYEBTcNkpCVlwAAAYpJREFUWMPt1z9IVmEYBvDfKxXUULRFi0FCNAkNLQ3REK1BQehSBEIENUVQDdKgLUVDNQRqBS0tDRFRUxE1FEFD6OLU0L/F4d0+jl/v+3l/ON6Gd3o53/f83uc55/L83ZEifoTvmH2Uw3nRi/eRmXs4jJc4j+HI3BmMYjJDRGXEYRooxgpc4Dh2R2buYRVu1a2fQB+GamaqSMQ5pLQF8QOPMItFbMHzSPw41uBmTUYG0F9vJpOIcwxpNzDsX7/vQRELkfiPWIcbNWvDGKg3k03EOYR0CVciM9s0T3MdE5H8YxipcjOCwYyZdEI6iYE6MbtwGs+wHZuw+5H4j1iP61UZGcRQB5lUIuIjMmJrXyuU2uKnMB+J/4xNuFa1NtxBJpmQVp+R8ZZqTGMhEv8FW3C1ycxwB5lsQrr4jBxoMHyRYeZbh5mRFpluhJQq8BWnsAbbsD/DTDOJbLMZz05IN/Edr/Aem3EoEt9KoueEmUt46p9Xsgv3I/kLbTJJ7/PJbCnR+XOdH+lGJKfv8xv/LX4CdQErbphODboAAAAASUVORK5CYII=", scene);
  windSystem.particleTexture = smokeTexture;
  windSystem.emitter = new BABYLON.Vector3(0, 10, 0);
  windSystem.minEmitBox = new BABYLON.Vector3(-50, 0, -50);
  windSystem.maxEmitBox = new BABYLON.Vector3(50, 20, 50);
  windSystem.color1 = new BABYLON.Color4(0.9, 0.9, 1.0, 0.02);
  windSystem.color2 = new BABYLON.Color4(0.9, 0.9, 1.0, 0.03);
  windSystem.colorDead = new BABYLON.Color4(0.9, 0.9, 1.0, 0);
  windSystem.minSize = 2;
  windSystem.maxSize = 5;
  windSystem.minLifeTime = 2.0;
  windSystem.maxLifeTime = 5.0;
  windSystem.emitRate = 100;
  windSystem.gravity = new BABYLON.Vector3(15, 0, 5);
  windSystem.direction1 = new BABYLON.Vector3(1, 0, 0.3);
  windSystem.direction2 = new BABYLON.Vector3(1, 0.2, 0.3);
  windSystem.minEmitPower = 0.5;
  windSystem.maxEmitPower = 2;
  windSystem.minAngularSpeed = 0.05;
  windSystem.maxAngularSpeed = 0.2;
  windSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
  windSystem.updateSpeed = 0.008;  
  return windSystem;
}
*/

// Effet d'éclair pour la tempête
function createLightningEffect(scene) {
  // Créer une lumière pour l'éclair
  const lightningLight = new BABYLON.PointLight("lightningLight", new BABYLON.Vector3(0, 100, 0), scene);
  lightningLight.diffuse = new BABYLON.Color3(0.9, 0.9, 1.0);
  lightningLight.specular = new BABYLON.Color3(1, 1, 1);
  lightningLight.intensity = 0;
  lightningLight.range = 500;
  
  // Fonction pour déclencher un flash d'éclair
  const flash = () => {
    // Animation de l'intensité de la lumière pour simuler un éclair
    const keys = [];
    keys.push({ frame: 0, value: 0 });
    keys.push({ frame: 5, value: 6 });
    keys.push({ frame: 10, value: 0.5 });
    keys.push({ frame: 15, value: 4 });
    keys.push({ frame: 20, value: 0 });
    
    const anim = new BABYLON.Animation(
      "lightningAnim", 
      "intensity", 
      60, 
      BABYLON.Animation.ANIMATIONTYPE_FLOAT, 
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );
    anim.setKeys(keys);
    
    // Arrêter l'animation précédente si elle existe
    lightningLight.animations = [];
    lightningLight.animations.push(anim);
    
    // Démarrer l'animation
    scene.beginAnimation(lightningLight, 0, 20, false, 3);
    
    // Positionner l'éclair à un endroit aléatoire dans le ciel
    lightningLight.position = new BABYLON.Vector3(
      (Math.random() - 0.5) * 400,
      100,
      (Math.random() - 0.5) * 400
    );
  };
  
  return {
    light: lightningLight,
    flash
  };
}
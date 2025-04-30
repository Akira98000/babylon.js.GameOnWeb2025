import * as BABYLON from '@babylonjs/core'

// Configuration des animations
const ANIMATION_CONFIG = {
  running: { speedRatio: 0.9 },
  pistol: { priority: true, transitionTime: 0.08, initialWeight: 0.6 },
  default: { transitionTime: 0.05, initialWeight: 0.1 }
}

export const transitionToAnimation = (fromAnim, toAnim) => {
  if (!fromAnim || !toAnim || fromAnim === toAnim) return;
  
  const config = toAnim.name.includes("pistol") ? ANIMATION_CONFIG.pistol : ANIMATION_CONFIG.default;
  
  // Configuration de l'animation de départ
  if (fromAnim.name.includes("pistol")) {
    fromAnim.stop();
    fromAnim.setWeightForAllAnimatables(0);
  } else {
    fromAnim.setWeightForAllAnimatables(1);
  }
  
  // Configuration de l'animation d'arrivée
  if (toAnim.name.includes("running")) {
    toAnim.speedRatio = ANIMATION_CONFIG.running.speedRatio;
  }
  
  toAnim.start(!config.priority, 1.0, toAnim.from, toAnim.to, false);
  toAnim.setWeightForAllAnimatables(config.initialWeight);
  
  // Création de l'animation de transition
  const frames = 60 * config.transitionTime;
  const animationWeight = new BABYLON.Animation(
    "animationWeight",
    "weight",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  
  animationWeight.setKeys([
    { frame: 0, value: config.initialWeight },
    { frame: frames * 0.2, value: 0.8 },
    { frame: frames, value: 1 }
  ]);
  
  const easingFunction = new BABYLON.CircleEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
  animationWeight.setEasingFunction(easingFunction);
  
  toAnim._scene.beginDirectAnimation(
    { weight: config.initialWeight },
    [animationWeight],
    0,
    frames,
    false,
    1,
    () => {
      fromAnim.setWeightForAllAnimatables(0);
      toAnim.setWeightForAllAnimatables(1);
    }
  );
};

export const immediateTransition = (animations, toAnim) => {
  if (!toAnim) return;
  
  // Arrêt de toutes les animations
  Object.values(animations).forEach(anim => {
    if (anim) {
      anim.stop();
      anim.setWeightForAllAnimatables(0);
    }
  });
  
  // Configuration de la nouvelle animation
  if (toAnim.name.includes("running")) {
    toAnim.speedRatio = 1.4;
  }
  
  toAnim.start(!toAnim.name.includes("pistol"), 1.0, toAnim.from, toAnim.to, false);
  toAnim.setWeightForAllAnimatables(1);
  
  return toAnim;
};

export const initializeAnimations = (scene) => {
  // Vérification des animations disponibles dans la scène
  const availableAnimations = scene.animationGroups.map(ag => ag.name);
  console.log("Animations disponibles dans la scène:", availableAnimations);

  const animations = {
    walkAnim: scene.getAnimationGroupByName("running"),
    walkBackAnim: scene.getAnimationGroupByName("walkback"),
    idleAnim: scene.getAnimationGroupByName("idle"),
    sambaAnim: scene.getAnimationGroupByName("salsa"),
    shotgunAnim: scene.getAnimationGroupByName("pistolrun"),
    shootStandingAnim: scene.getAnimationGroupByName("pistolshootfix")
  };
  
  // Vérification des animations manquantes
  const missingAnims = Object.entries(animations)
    .filter(([key, anim]) => !anim)
    .map(([key]) => key);
  
  if (missingAnims.length > 0) {
    console.error("Animations manquantes:", missingAnims);
    console.error("Vérifiez que les noms des animations correspondent exactement à ceux du modèle 3D");
  }
  
  // Configuration des animations
  if (animations.walkAnim) {
    animations.walkAnim.speedRatio = 1.4;
    console.log("Animation de marche configurée avec speedRatio:", animations.walkAnim.speedRatio);
  }
  
  if (animations.shotgunAnim) {
    animations.shotgunAnim.speedRatio = 2.0;
    animations.shotgunAnim.metadata = { shootPoint: 0.15 };
    console.log("Animation de tir configurée avec speedRatio:", animations.shotgunAnim.speedRatio);
  }
  
  if (animations.shootStandingAnim) {
    animations.shootStandingAnim.speedRatio = 2.0;
    animations.shootStandingAnim.metadata = { shootPoint: 0.15 };
    console.log("Animation de tir debout configurée avec speedRatio:", animations.shootStandingAnim.speedRatio);
  }
  
  // Arrêt de toutes les animations sauf idle
  Object.entries(animations).forEach(([key, anim]) => {
    if (anim && key !== 'idleAnim') {
      anim.stop();
      anim.setWeightForAllAnimatables(0);
      console.log(`Animation ${key} arrêtée et poids réinitialisé`);
    }
  });
  
  // Démarrage de l'animation idle
  if (animations.idleAnim) {
    animations.idleAnim.start(true, 1.0, animations.idleAnim.from, animations.idleAnim.to, false);
    console.log("Animation idle démarrée");
  } else {
    console.error("Animation idle non trouvée - c'est une animation critique!");
  }
  
  return {
    ...animations,
    transitionToAnimation,
    immediateTransition: (toAnim) => immediateTransition(animations, toAnim)
  };
};
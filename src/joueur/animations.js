import * as BABYLON from '@babylonjs/core'

export const transitionToAnimation = (fromAnim, toAnim, transitionTime = 0.05) => {
  if (!fromAnim || !toAnim || fromAnim === toAnim) return;
  
  const isPriority = toAnim.name.includes("pistol");
  const actualTransitionTime = isPriority ? 0.08 : transitionTime;
  const loop = !isPriority;
  const initialWeight = isPriority ? 0.6 : 0.1;
  
  // Définir le speedRatio en fonction du type d'animation
  if (toAnim.name.includes("running")) {
    toAnim.speedRatio = 1.4; // Vitesse d'animation de course réduite
  }
  
  if (fromAnim.name.includes("pistol")) {
    fromAnim.stop();
    fromAnim.setWeightForAllAnimatables(0);
  } else {
    fromAnim.setWeightForAllAnimatables(1);
  }
  
  toAnim.start(loop, 1.0, toAnim.from, toAnim.to, false);
  toAnim.setWeightForAllAnimatables(initialWeight);
  
  const frames = 60 * actualTransitionTime;
  const keys = [
    { frame: 0, value: initialWeight },
    { frame: frames * 0.2, value: 0.8 },
    { frame: frames, value: 1 }
  ];
  
  const animationWeight = new BABYLON.Animation(
    "animationWeight",
    "weight",
    60,
    BABYLON.Animation.ANIMATIONTYPE_FLOAT,
    BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
  );
  animationWeight.setKeys(keys);
  
  const easingFunction = new BABYLON.CircleEase();
  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEIN);
  animationWeight.setEasingFunction(easingFunction);
  
  const scene = toAnim._scene;
  scene.beginDirectAnimation(
    { weight: initialWeight },
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
    const animKeys = ['walkAnim', 'walkBackAnim', 'idleAnim', 'sambaAnim', 'shotgunAnim', 'shootStandingAnim'];
  animKeys.forEach(key => {
    const anim = animations[key];
    if (anim) {
      anim.stop();
      anim.setWeightForAllAnimatables(0);
    }
  });
  
  // Définir le speedRatio pour l'animation de course
  if (toAnim.name.includes("running")) {
    toAnim.speedRatio = 1.4; // Vitesse d'animation de course réduite
  }
  
  const loop = !toAnim.name.includes("pistol");
  toAnim.start(loop, 1.0, toAnim.from, toAnim.to, false);
  toAnim.setWeightForAllAnimatables(1);
  
  return toAnim;
};

export const initializeAnimations = (scene) => {
  const availableAnimations = scene.animationGroups.map(ag => ag.name);
  console.log("Animation groups disponibles:", availableAnimations);
  
  const animations = {
    walkAnim: scene.getAnimationGroupByName("running"),
    walkBackAnim: scene.getAnimationGroupByName("walkback"),
    idleAnim: scene.getAnimationGroupByName("idle"),
    sambaAnim: scene.getAnimationGroupByName("salsa"),
    shotgunAnim: scene.getAnimationGroupByName("pistolrun"),
    shootStandingAnim: scene.getAnimationGroupByName("pistolshootfix")
  };
  
  // Vérifie que toutes les animations sont chargées
  const missingAnims = Object.entries(animations)
    .filter(([key, anim]) => !anim)
    .reduce((acc, [key]) => ({ ...acc, [key]: "NON TROUVÉE" }), {});
  if (Object.keys(missingAnims).length > 0) {
    console.warn("Certaines animations n'ont pas été chargées correctement", missingAnims);
  }
  
  if (animations.walkAnim) {
    animations.walkAnim.speedRatio = 1.4;
    // Forcer la mise à jour de la vitesse pour chaque animation ciblée
    if (animations.walkAnim.targetedAnimations?.length) {
      animations.walkAnim.targetedAnimations.forEach(targetedAnim => {
        targetedAnim.animation.framePerSecond = 60 * 1.4;
      });
    }
  }
  
  if (animations.shotgunAnim) {
    animations.shotgunAnim.speedRatio = 2.0;
    if (animations.shotgunAnim.targetedAnimations?.length) {
      animations.shotgunAnim.metadata = { shootPoint: 0.15 };
    }
  }
  
  if (animations.shootStandingAnim) {
    animations.shootStandingAnim.speedRatio = 2.0;
    if (animations.shootStandingAnim.targetedAnimations?.length) {
      animations.shootStandingAnim.metadata = { shootPoint: 0.15 };
    }
  }
  
  ["walkAnim", "walkBackAnim", "sambaAnim", "shotgunAnim", "shootStandingAnim"].forEach(key => {
    if (animations[key]) {
      animations[key].stop();
      animations[key].setWeightForAllAnimatables(0);
    }
  });
  
  if (animations.idleAnim) {
    animations.idleAnim.start(true, 1.0, animations.idleAnim.from, animations.idleAnim.to, false);
  }
  
  const immediateTransitionWrapper = (toAnim) => immediateTransition(animations, toAnim);
  
  return {
    ...animations,
    transitionToAnimation,
    immediateTransition: immediateTransitionWrapper
  };
};
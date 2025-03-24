import * as BABYLON from '@babylonjs/core'

export const transitionToAnimation = (fromAnim, toAnim, transitionTime = 0.25) => {
  if (!fromAnim || !toAnim) return;
  if (fromAnim === toAnim) return;
  const isPriorityAnimation = toAnim.name.includes("pistol");
  const actualTransitionTime = isPriorityAnimation ? 0.08 : transitionTime;
  const loop = !toAnim.name.includes("pistol");
  
  if (fromAnim.name.includes("pistol")) {
    fromAnim.stop();
    fromAnim.setWeightForAllAnimatables(0);
  } else {
    fromAnim.setWeightForAllAnimatables(1.0);
  }
  toAnim.start(loop, 1.0, toAnim.from, toAnim.to, false);
  
  if (isPriorityAnimation) {
    toAnim.setWeightForAllAnimatables(0.6);
  } else {
    toAnim.setWeightForAllAnimatables(0.1);
  }
  
  const frames = 30 * actualTransitionTime;
  const keys = [
    { frame: 0, value: isPriorityAnimation ? 0.6 : 0.1 },
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
    { weight: isPriorityAnimation ? 0.6 : 0.1 },
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
  
  const allAnims = [
    animations.walkAnim,
    animations.walkBackAnim,
    animations.idleAnim,
    animations.sambaAnim,
    animations.shotgunAnim,
    animations.shootStandingAnim
  ];
  
  allAnims.forEach(anim => {
    if (anim) {
      anim.stop();
      anim.setWeightForAllAnimatables(0);
    }
  });
  
  const loop = !toAnim.name.includes("pistol");
  toAnim.start(loop, 1.0, toAnim.from, toAnim.to, false);
  toAnim.setWeightForAllAnimatables(1);
  
  return toAnim;
};

export const initializeAnimations = (scene) => {
    const availableAnimations = scene.animationGroups.map(ag => ag.name);
    console.log("Animation groups disponibles:", availableAnimations);
    
    const walkAnim = scene.getAnimationGroupByName("running");
    const walkBackAnim = scene.getAnimationGroupByName("walkback");
    const idleAnim = scene.getAnimationGroupByName("idle");
    const sambaAnim = scene.getAnimationGroupByName("salsa");
    const shotgunAnim = scene.getAnimationGroupByName("pistolrun");
    const shootStandingAnim = scene.getAnimationGroupByName("pistolshootfix");
    
    if (!walkAnim || !walkBackAnim || !idleAnim || !sambaAnim || !shotgunAnim || !shootStandingAnim) {
      console.warn("Certaines animations n'ont pas été chargées correctement");
      const animStatus = {
        walkAnim: walkAnim ? walkAnim.name : "NON TROUVÉE",
        walkBackAnim: walkBackAnim ? walkBackAnim.name : "NON TROUVÉE",
        idleAnim: idleAnim ? idleAnim.name : "NON TROUVÉE",
        sambaAnim: sambaAnim ? sambaAnim.name : "NON TROUVÉE",
        shotgunAnim: shotgunAnim ? shotgunAnim.name : "NON TROUVÉE",
        shootStandingAnim: shootStandingAnim ? shootStandingAnim.name : "NON TROUVÉE"
      };
      console.log("Statut des animations:", animStatus);
    }

    if (shotgunAnim) {
      shotgunAnim.speedRatio = 2.0;
    }
    
    if (shootStandingAnim) {
      shootStandingAnim.speedRatio = 2.0;
    }
    
    if (shotgunAnim && shotgunAnim.targetedAnimations && shotgunAnim.targetedAnimations.length > 0) {
      shotgunAnim.metadata = { shootPoint: 0.15 };
    }
    
    if (shootStandingAnim && shootStandingAnim.targetedAnimations && shootStandingAnim.targetedAnimations.length > 0) {
      shootStandingAnim.metadata = { shootPoint: 0.15 };
    }

    if (walkAnim) walkAnim.stop();
    if (walkBackAnim) walkBackAnim.stop();
    if (sambaAnim) sambaAnim.stop();
    if (shotgunAnim) shotgunAnim.stop();
    if (shootStandingAnim) shootStandingAnim.stop();

    if (idleAnim) {
      idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
    }

    const immediateTransitionWrapper = (toAnim) => {
      return immediateTransition({
        walkAnim,
        walkBackAnim,
        idleAnim,
        sambaAnim,
        shotgunAnim,
        shootStandingAnim
      }, toAnim);
    };

    return {
      walkAnim,
      walkBackAnim,
      idleAnim,
      sambaAnim,
      shotgunAnim,
      shootStandingAnim,
      transitionToAnimation,
      immediateTransition: immediateTransitionWrapper
    };
};

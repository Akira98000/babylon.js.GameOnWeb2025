import * as BABYLON from '@babylonjs/core'

export const createBullet = (scene, startPosition, direction) => {
    // Créer une balle plus grosse et colorée
    const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", {
      diameter: 0.15, // Réduit encore la taille
      segments: 8 // Réduit la complexité géométrique
    }, scene);
    
    // Matériau coloré et brillant pour la balle
    const bulletMaterial = new BABYLON.StandardMaterial("bulletMaterial", scene);
    
    // Choisir une couleur aléatoire vive pour chaque balle
    // Utiliser des couleurs plus saturées
    const colors = [
        new BABYLON.Color3(1, 0, 0), // Rouge pur
        new BABYLON.Color3(0, 1, 0), // Vert pur
        new BABYLON.Color3(0, 0, 1), // Bleu pur
        new BABYLON.Color3(1, 1, 0), // Jaune pur
        new BABYLON.Color3(1, 0, 1), // Magenta pur
        new BABYLON.Color3(0, 1, 1)  // Cyan pur
    ];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Rendre les couleurs plus vives
    bulletMaterial.diffuseColor = randomColor;
    bulletMaterial.emissiveColor = randomColor; // Utiliser la couleur complète pour l'émission
    bulletMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    bulletMaterial.specularPower = 16; // Réduire pour un effet plus brillant
    
    // Ajouter un effet de brillance
    bulletMaterial.useGlossinessFromSpecularMapAlpha = true;
    bulletMaterial.useSpecularOverAlpha = true;
    
    // Augmenter la luminosité globale
    bulletMaterial.ambientColor = randomColor.scale(0.5);
    
    bullet.material = bulletMaterial;
    bullet.position = startPosition.clone();

    const speed = 15; // Vitesse légèrement réduite pour mieux voir les balles
    const bulletDirection = direction.clone().normalize();
    
    // Traînée de particules colorées derrière la balle
    const bulletTrail = new BABYLON.ParticleSystem("bulletTrail", 50, scene); // Réduit à 50
    bulletTrail.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    bulletTrail.emitter = bullet;
    bulletTrail.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    bulletTrail.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    
    // Utiliser la même couleur que la balle pour la traînée, mais avec une opacité plus élevée
    bulletTrail.color1 = new BABYLON.Color4(randomColor.r, randomColor.g, randomColor.b, 0.5); // Réduit l'opacité
    bulletTrail.color2 = new BABYLON.Color4(randomColor.r, randomColor.g, randomColor.b, 0.5);
    bulletTrail.colorDead = new BABYLON.Color4(randomColor.r, randomColor.g, randomColor.b, 0);
    
    // Augmenter la taille des particules de la traînée
    bulletTrail.minSize = 0.05;
    bulletTrail.maxSize = 0.1;
    bulletTrail.minLifeTime = 0.1;
    bulletTrail.maxLifeTime = 0.2;
    bulletTrail.emitRate = 50;
    bulletTrail.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    bulletTrail.gravity = new BABYLON.Vector3(0, 0, 0);
    
    bulletTrail.direction1 = new BABYLON.Vector3(0, 0, -0.05);
    bulletTrail.direction2 = new BABYLON.Vector3(0, 0, -0.05);
    
    bulletTrail.minEmitPower = 0.02;
    bulletTrail.maxEmitPower = 0.08;
    
    bulletTrail.minAngularSpeed = 0;
    bulletTrail.maxAngularSpeed = Math.PI / 4;
    
    bulletTrail.updateSpeed = 0.03;
    bulletTrail.start();
    
    const bulletLifetime = 1500; // Réduit encore à 1.5 secondes
    let elapsedTime = 0;
    
    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
      const movement = bulletDirection.scale(speed * scene.getEngine().getDeltaTime() / 1000);
      bullet.position.addInPlace(movement);
      
      // Faire tourner la balle pour un effet plus dynamique
      bullet.rotation.x += 0.1;
      bullet.rotation.y += 0.1;
      
      elapsedTime += scene.getEngine().getDeltaTime();
      const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.1);
      const hit = scene.pickWithRay(ray);
      
      // Si la balle touche quelque chose ou dépasse sa durée de vie
      if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime) {
        // Créer un simple système de particules pour l'explosion
        const impactParticles = new BABYLON.ParticleSystem("impactParticles", 50, scene); // Réduit à 50
        impactParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
        impactParticles.emitter = bullet.position.clone();
        
        // Utiliser la même couleur que la balle pour l'explosion, mais avec plusieurs teintes
        impactParticles.color1 = new BABYLON.Color4(randomColor.r, randomColor.g, randomColor.b, 0.5);
        impactParticles.color2 = new BABYLON.Color4(
          Math.min(randomColor.r + 0.2, 1), 
          Math.min(randomColor.g + 0.2, 1), 
          Math.min(randomColor.b + 0.2, 1), 
          0.5
        );
        impactParticles.colorDead = new BABYLON.Color4(randomColor.r, randomColor.g, randomColor.b, 0);
        
        // Configurer les propriétés de l'explosion pour des couleurs plus vives
        impactParticles.minSize = 0.05;
        impactParticles.maxSize = 0.15;
        impactParticles.minLifeTime = 0.2;
        impactParticles.maxLifeTime = 0.4;
        impactParticles.emitRate = 0; // Ne pas émettre en continu
        impactParticles.manualEmitCount = 50; // Émettre plus de particules
        impactParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; // Mode additif pour des couleurs plus vives
        impactParticles.gravity = new BABYLON.Vector3(0, -0.3, 0);
        impactParticles.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        impactParticles.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
        impactParticles.minEmitPower = 0.5;
        impactParticles.maxEmitPower = 1.5;
        impactParticles.minAngularSpeed = 0;
        impactParticles.maxAngularSpeed = Math.PI;
        impactParticles.updateSpeed = 0.02;
        
        // Démarrer l'explosion
        impactParticles.start();
        
        // Nettoyer après un délai
        setTimeout(() => {
          impactParticles.dispose();
        }, 500); // Réduit à 500ms
        
        // Nettoyer la balle et sa traînée
        scene.onBeforeRenderObservable.remove(bulletObserver);
        bulletTrail.stop();
        bulletTrail.dispose();
        bullet.dispose();
      }
    });
};
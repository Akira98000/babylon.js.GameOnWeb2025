import * as BABYLON from '@babylonjs/core'

export const createBullet = (scene, startPosition, direction, fromPlayer = false, fromEnemy = false, fromAlly = false) => {

  const bullet = BABYLON.MeshBuilder.CreateCylinder("bullet", { height: 0.03,
        diameter: 0.05,
        tessellation: 3
  }, scene);
    
    bullet.rotation.x = Math.PI / 2;
    const bulletMaterial = new BABYLON.StandardMaterial("bulletMaterial", scene);
    bulletMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    bulletMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    bulletMaterial.specularPower = 32; 
    bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
    bulletMaterial.freeze();
    bullet.material = bulletMaterial;
    bullet.position = startPosition.clone();
    
    // Définir le metadata de la balle avec les trois paramètres
    bullet.metadata = {
        fromPlayer: fromPlayer,
        fromEnemy: fromEnemy,
        fromAlly: fromAlly
    };
    
    console.log("Balle créée avec metadata:", bullet.metadata);

    // Augmentation de la vitesse des balles des alliés pour plus de précision
    const speed = fromAlly ? 40 : 30; // Balles d'allié plus rapides
    
    // S'assurer que la direction est correctement normalisée
    let bulletDirection = direction.clone();
    
    // S'assurer que la direction est toujours normalisée
    if (bulletDirection.lengthSquared() === 0) {
        console.warn("Direction de balle invalide (longueur nulle)");
        bulletDirection = new BABYLON.Vector3(0, 0, 1);
    }
    
    bulletDirection.normalize();
    
    // Couleur différente selon l'origine de la balle
    let bulletColor;
    if (fromPlayer) {
        bulletColor = new BABYLON.Color3(1, 0.5, 0); // Orange pour le joueur
        bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0.5, 0);
    } else if (fromAlly) {
        bulletColor = new BABYLON.Color3(0, 0.7, 1); // Bleu pour les alliés
        bulletMaterial.emissiveColor = new BABYLON.Color3(0, 0.7, 1);
    } else if (fromEnemy) {
        bulletColor = new BABYLON.Color3(1, 0, 0); // Rouge pour les ennemis
        bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
    }
    
    const distortionBlur = new BABYLON.HighlightLayer("distortion", scene, {
        mainTextureRatio: 0.1, 
        blurHorizontalSize: 0.5,
        blurVerticalSize: 0.5
    });
    distortionBlur.addMesh(bullet, bulletColor);

    const fireTrail = new BABYLON.ParticleSystem("fireTrail", 10, scene);
    fireTrail.particleTexture = new BABYLON.Texture("/assets/fire.png", scene);
    fireTrail.emitter = bullet;
    fireTrail.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    fireTrail.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    
    // Ajuster les couleurs des particules selon la source
    if (!fromPlayer && !fromAlly) {
        fireTrail.color1 = new BABYLON.Color4(1, 0, 0, 1);
        fireTrail.color2 = new BABYLON.Color4(1, 0.2, 0, 1);
    } else {
        fireTrail.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
        fireTrail.color2 = new BABYLON.Color4(1, 0.2, 0, 1);
    }
    
    fireTrail.colorDead = new BABYLON.Color4(0.7, 0, 0, 0);
    
    fireTrail.minSize = 0.2;
    fireTrail.maxSize = 0.3;
    fireTrail.minLifeTime = 0.02; 
    fireTrail.maxLifeTime = 0.05;
    fireTrail.emitRate = 30; 
    fireTrail.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    fireTrail.gravity = new BABYLON.Vector3(0, 0, 0);
    
    fireTrail.direction1 = new BABYLON.Vector3(-0.05, -0.05, -0.05);
    fireTrail.direction2 = new BABYLON.Vector3(0.05, 0.05, 0.05);
    
    fireTrail.minEmitPower = 0.2;
    fireTrail.maxEmitPower = 0.4;
    fireTrail.updateSpeed = 0.02; 
    
    const smokeTrail = new BABYLON.ParticleSystem("smokeTrail", 10, scene); 
    smokeTrail.particleTexture = new BABYLON.Texture("/assets/smoke.png", scene);
    smokeTrail.emitter = bullet;
    smokeTrail.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    smokeTrail.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    
    smokeTrail.color1 = new BABYLON.Color4(0.3, 0.3, 0.3, 0.15); 
    smokeTrail.color2 = new BABYLON.Color4(0.2, 0.2, 0.2, 0.1);
    smokeTrail.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
    
    smokeTrail.minSize = 0.3;
    smokeTrail.maxSize = 0.5;
    smokeTrail.minLifeTime = 0.2; 
    smokeTrail.maxLifeTime = 0.3; 
    smokeTrail.emitRate = 25; 
    smokeTrail.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;
    smokeTrail.gravity = new BABYLON.Vector3(0, 0.1, 0);
    smokeTrail.updateSpeed = 0.02; 
    
    fireTrail.start();
    smokeTrail.start();
    
    const bulletLifetime = fromAlly ? 1500 : 1000; // Durée de vie prolongée pour les balles d'allié
    let elapsedTime = 0;
    
    const light = new BABYLON.PointLight("bulletLight", bullet.position, scene);
    light.diffuse = bulletColor;
    light.intensity = 0.5; 
    light.range = 0.5;
    
    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
        const movement = bulletDirection.scale(speed * scene.getEngine().getDeltaTime() / 1000);
        bullet.position.addInPlace(movement);
        light.position = bullet.position;
        
        bullet.rotate(bulletDirection, 0.5, BABYLON.Space.WORLD);
        
        elapsedTime += scene.getEngine().getDeltaTime();
        
        // Rayon de détection de collision légèrement plus long pour plus de précision
        const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.15);
        const hit = scene.pickWithRay(ray);
        
        if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime) {
            scene.onBeforeRenderObservable.remove(bulletObserver);
            distortionBlur.dispose();
            fireTrail.stop();
            smokeTrail.stop();
            fireTrail.dispose();
            smokeTrail.dispose();
            light.dispose();
            bullet.dispose();
        }
    });

    return bullet; // Retourner la balle créée
};
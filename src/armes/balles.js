import * as BABYLON from '@babylonjs/core'

export const createBullet = (scene, startPosition, direction, fromPlayer = false, fromEnemy = false, fromAlly = false) => {
    // Version simplifiée pour optimiser les FPS
    
    // Création d'une simple sphère avec moins de segments
    const bullet = BABYLON.MeshBuilder.CreateSphere("bullet", { 
        diameter: 0.3,
        segments: 6  // Réduit pour améliorer les performances
    }, scene);
    
    // Important: désactiver les collisions
    bullet.checkCollisions = false;
    bullet.isPickable = !fromPlayer;
    
    // Matériau très simple sans effet coûteux
    const bulletMaterial = new BABYLON.StandardMaterial("bulletMaterial", scene);
    bulletMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // Désactiver la spécularité 
    
    if (fromEnemy) {
        bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
    } else {
        bulletMaterial.emissiveColor = new BABYLON.Color3(0, 0.7, 1);
    }
    
    bulletMaterial.freeze();
    bullet.material = bulletMaterial;
    bullet.position = startPosition.clone();
    
    // Métadonnées minimales
    bullet.metadata = {
        fromPlayer: fromPlayer === true,
        fromEnemy: fromEnemy === true,
        fromAlly: fromAlly === true
    };
    
    // Définir la vitesse des balles - augmentation des vitesses pour assurer une bonne distance
    const speed = fromPlayer ? 70 : (fromAlly ? 60 : (fromEnemy ? 50 : 40));
    let bulletDirection = direction.clone();
    
    if (bulletDirection.lengthSquared() === 0) {
        bulletDirection = new BABYLON.Vector3(0, 0, 1);
    }
    
    bulletDirection.normalize();
    
    // Durée de vie des balles - augmentée pour assurer une portée suffisante
    const bulletLifetime = fromPlayer ? 3000 : (fromAlly ? 2500 : 2000);
    let elapsedTime = 0;
    
    // Distance maximale que la balle peut parcourir
    const maxDistance = fromPlayer ? 100 : (fromAlly ? 80 : (fromEnemy ? 60 : 40));
    let distanceTraveled = 0;
    
    // Observateur simplifié pour le mouvement et les collisions
    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
        const deltaTime = scene.getEngine().getDeltaTime() / 1000;
        const movement = bulletDirection.scale(speed * deltaTime);
        bullet.position.addInPlace(movement);
        
        // Suivi de la distance parcourue
        distanceTraveled += movement.length();
        elapsedTime += scene.getEngine().getDeltaTime();
        
        // Détection de collision simplifiée
        if (fromPlayer) {
            const playerMeshes = ["hero", "playerHitbox"];
            const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.15);
            const predicate = (mesh) => {
                return !playerMeshes.includes(mesh.name) && mesh.name !== "bullet";
            };
            const hit = scene.pickWithRay(ray, predicate);
            
            if ((hit.hit && hit.pickedMesh) || elapsedTime > bulletLifetime || distanceTraveled > maxDistance) {
                scene.onBeforeRenderObservable.remove(bulletObserver);
                bullet.dispose();
            }
        } else {
            const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.15);
            const hit = scene.pickWithRay(ray);
            
            if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime || distanceTraveled > maxDistance) {
                scene.onBeforeRenderObservable.remove(bulletObserver);
                bullet.dispose();
            }
        }
    });

    // Nettoyage simplifié
    setTimeout(() => {
        if (!bullet.isDisposed) {
            scene.onBeforeRenderObservable.remove(bulletObserver);
            bullet.dispose();
        }
    }, bulletLifetime + 100);

    return bullet;
};


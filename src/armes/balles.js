import * as BABYLON from '@babylonjs/core'

export const createBullet = (scene, startPosition, direction, fromPlayer = false, fromEnemy = false, fromAlly = false) => {
    const bullet = BABYLON.MeshBuilder.CreateCylinder("bullet", { 
        height: 0.1,
        diameter: 0.1,
        tessellation: 3
    }, scene);
    
    bullet.rotation.x = Math.PI / 2;
    const bulletMaterial = new BABYLON.StandardMaterial("bulletMaterial", scene);
    bulletMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    bulletMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    bulletMaterial.specularPower = 32; 
    
    // Définir la couleur émissive en fonction du tireur
    if (fromEnemy) {
        bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0);
    } else {
        // Pour le joueur et les alliés
        bulletMaterial.emissiveColor = new BABYLON.Color3(0, 0.7, 1);
    }
    
    bulletMaterial.freeze();
    bullet.material = bulletMaterial;
    bullet.position = startPosition.clone();
    bullet.metadata = {
        fromPlayer: fromPlayer,
        fromEnemy: fromEnemy,
        fromAlly: fromAlly
    };
    
    const speed = fromAlly ? 40 : 30;
    let bulletDirection = direction.clone();
    
    if (bulletDirection.lengthSquared() === 0) {
        console.warn("Direction de balle invalide (longueur nulle)");
        bulletDirection = new BABYLON.Vector3(0, 0, 1);
    }
    
    bulletDirection.normalize();
    
    const bulletLifetime = fromAlly ? 1500 : 1000;
    let elapsedTime = 0;
    
    const light = new BABYLON.PointLight("bulletLight", bullet.position, scene);
    if (fromEnemy) {
        light.diffuse = new BABYLON.Color3(1, 0, 0); // Rouge pour les ennemis
    } else {
        light.diffuse = new BABYLON.Color3(0, 0.7, 1); // Bleu pour le joueur et les alliés
    }
    light.intensity = 0.5;
    light.range = 0.5;
    
    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
        const movement = bulletDirection.scale(speed * scene.getEngine().getDeltaTime() / 1000);
        bullet.position.addInPlace(movement);
        light.position = bullet.position;
        
        elapsedTime += scene.getEngine().getDeltaTime();
        
        const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.15);
        const hit = scene.pickWithRay(ray);
        
        if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime) {
            scene.onBeforeRenderObservable.remove(bulletObserver);
            light.dispose();
            bullet.dispose();
        }
    });

    setTimeout(() => {
        if (!bullet.isDisposed) {
            bullet.dispose();
        }
    }, 2000);

    return bullet;
};
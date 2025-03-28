import * as BABYLON from '@babylonjs/core'

export const createBullet = (scene, startPosition, direction) => {
    const bullet = BABYLON.MeshBuilder.CreateCylinder("bullet", {
        height: 0.03,
        diameter: 0.05,
        tessellation: 3
    }, scene);
    bullet.rotation.x = Math.PI / 2;
    bullet.position = startPosition.clone();
    bullet.isPickable = false; // optimisation : évite les checks inutiles

    const bulletMaterial = new BABYLON.StandardMaterial("bulletMaterial", scene);
    bulletMaterial.diffuseColor = new BABYLON.Color3(0.7, 0.7, 0.7);
    bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
    bulletMaterial.freeze(); // gèle les propriétés pour gain perfs
    bullet.material = bulletMaterial;

    const speed = 30;
    const bulletDirection = direction.clone().normalize();

    const fireTrail = new BABYLON.ParticleSystem("fireTrail", 5, scene); // réduction du count
    fireTrail.particleTexture = new BABYLON.Texture("/assets/fire.png", scene);
    fireTrail.emitter = bullet;
    fireTrail.minEmitBox = fireTrail.maxEmitBox = BABYLON.Vector3.Zero();
    fireTrail.color1 = new BABYLON.Color4(1, 0.5, 0, 0.8);
    fireTrail.color2 = new BABYLON.Color4(1, 0.2, 0, 0.6);
    fireTrail.colorDead = new BABYLON.Color4(0.7, 0, 0, 0);
    fireTrail.minSize = 0.1;
    fireTrail.maxSize = 0.2;
    fireTrail.minLifeTime = 0.02;
    fireTrail.maxLifeTime = 0.04;
    fireTrail.emitRate = 15; // plus bas = moins de stress GPU
    fireTrail.gravity = BABYLON.Vector3.Zero();
    fireTrail.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
    fireTrail.updateSpeed = 0.03;
    fireTrail.minEmitPower = 0.2;
    fireTrail.maxEmitPower = 0.3;

    const smokeTrail = new BABYLON.ParticleSystem("smokeTrail", 5, scene); // réduction
    smokeTrail.particleTexture = new BABYLON.Texture("/assets/smoke.png", scene);
    smokeTrail.emitter = bullet;
    smokeTrail.minEmitBox = smokeTrail.maxEmitBox = BABYLON.Vector3.Zero();
    smokeTrail.color1 = new BABYLON.Color4(0.3, 0.3, 0.3, 0.1);
    smokeTrail.color2 = new BABYLON.Color4(0.2, 0.2, 0.2, 0.05);
    smokeTrail.colorDead = new BABYLON.Color4(0.1, 0.1, 0.1, 0);
    smokeTrail.minSize = 0.2;
    smokeTrail.maxSize = 0.3;
    smokeTrail.minLifeTime = 0.1;
    smokeTrail.maxLifeTime = 0.2;
    smokeTrail.emitRate = 10;
    smokeTrail.gravity = new BABYLON.Vector3(0, 0.05, 0);
    smokeTrail.updateSpeed = 0.03;
    smokeTrail.blendMode = BABYLON.ParticleSystem.BLENDMODE_STANDARD;

    fireTrail.start();
    smokeTrail.start();

    let elapsedTime = 0;
    const bulletLifetime = 800; // durée plus courte = moins de mémoire

    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
        const delta = scene.getEngine().getDeltaTime();
        const movement = bulletDirection.scale(speed * delta / 1000);
        bullet.position.addInPlace(movement);
        elapsedTime += delta;

        const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.1);
        const hit = scene.pickWithRay(ray);

        if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime) {
            // Explosion light (ultra simplifiée)
            const explosion = new BABYLON.ParticleSystem("explosion", 20, scene);
            explosion.particleTexture = new BABYLON.Texture("/assets/explosion.png", scene);
            explosion.emitter = bullet.position.clone();
            explosion.color1 = new BABYLON.Color4(1, 0.4, 0, 1);
            explosion.color2 = new BABYLON.Color4(1, 0.1, 0, 1);
            explosion.colorDead = new BABYLON.Color4(0.2, 0.2, 0.2, 0);
            explosion.minSize = 0.3;
            explosion.maxSize = 0.5;
            explosion.minLifeTime = 0.1;
            explosion.maxLifeTime = 0.2;
            explosion.emitRate = 0;
            explosion.manualEmitCount = 20;
            explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            explosion.gravity = BABYLON.Vector3.Zero();
            explosion.updateSpeed = 0.03;
            explosion.minEmitBox = new BABYLON.Vector3(-0.05, -0.05, -0.05);
            explosion.maxEmitBox = new BABYLON.Vector3(0.05, 0.05, 0.05);
            explosion.direction1 = new BABYLON.Vector3(-1, -1, -1);
            explosion.direction2 = new BABYLON.Vector3(1, 1, 1);
            explosion.minEmitPower = 0.5;
            explosion.maxEmitPower = 1;

            explosion.start();
            setTimeout(() => {
                explosion.dispose();
            }, 100);

            scene.onBeforeRenderObservable.remove(bulletObserver);
            fireTrail.stop();
            smokeTrail.stop();
            fireTrail.dispose();
            smokeTrail.dispose();
            bullet.dispose();
        }
    });
};
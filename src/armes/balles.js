import * as BABYLON from '@babylonjs/core'

export const createBullet = (scene, startPosition, direction) => {

  const bullet = BABYLON.MeshBuilder.CreateCylinder("bullet", {
        height: 0.03,
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

    const speed = 30;
    const bulletDirection = direction.clone().normalize();
    
    const distortionBlur = new BABYLON.HighlightLayer("distortion", scene, {
        mainTextureRatio: 0.1, 
        blurHorizontalSize: 0.5,
        blurVerticalSize: 0.5
    });
    distortionBlur.addMesh(bullet, new BABYLON.Color3(1, 0.5, 0));

    const fireTrail = new BABYLON.ParticleSystem("fireTrail", 10, scene);
    fireTrail.particleTexture = new BABYLON.Texture("/assets/fire.png", scene);
    fireTrail.emitter = bullet;
    fireTrail.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    fireTrail.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    
    fireTrail.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
    fireTrail.color2 = new BABYLON.Color4(1, 0.2, 0, 1);
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
    
    const bulletLifetime = 1000;
    let elapsedTime = 0;
    
    const light = new BABYLON.PointLight("bulletLight", bullet.position, scene);
    light.diffuse = new BABYLON.Color3(1, 0.5, 0);
    light.intensity = 0.5; 
    light.range = 0.5; 
    
    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
        const movement = bulletDirection.scale(speed * scene.getEngine().getDeltaTime() / 1000);
        bullet.position.addInPlace(movement);
        light.position = bullet.position;
        
        bullet.rotate(bulletDirection, 0.5, BABYLON.Space.WORLD);
        
        elapsedTime += scene.getEngine().getDeltaTime();
        const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.1);
        const hit = scene.pickWithRay(ray);
        
        if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime) {
            const explosion = new BABYLON.ParticleSystem("explosion", 75, scene); 
            explosion.particleTexture = new BABYLON.Texture("/assets/explosion.png", scene);
            explosion.emitter = bullet.position.clone();
            
            explosion.color1 = new BABYLON.Color4(1, 0.5, 0, 1);
            explosion.color2 = new BABYLON.Color4(1, 0.2, 0, 1);
            explosion.colorDead = new BABYLON.Color4(0.2, 0.2, 0.2, 0);
            
            explosion.minSize = 0.3;
            explosion.maxSize = 0.7; 
            explosion.minLifeTime = 0.1; 
            explosion.maxLifeTime = 0.2; 
            
            explosion.emitRate = 0;
            explosion.manualEmitCount = 100; 
            explosion.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            explosion.gravity = new BABYLON.Vector3(0, 0.5, 0); 
            
            explosion.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
            explosion.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
            explosion.direction1 = new BABYLON.Vector3(-1, -1, -1);
            explosion.direction2 = new BABYLON.Vector3(1, 1, 1);
            explosion.minEmitPower = 0.5;
            explosion.maxEmitPower = 1; 
            explosion.updateSpeed = 0.02; 
            
            const shockwave = new BABYLON.ParticleSystem("shockwave", 10, scene); 
            shockwave.particleTexture = new BABYLON.Texture("/assets/shockwave.png", scene);
            shockwave.emitter = bullet.position.clone();
            shockwave.minEmitBox = new BABYLON.Vector3(0, 0, 0);
            shockwave.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
            
            shockwave.color1 = new BABYLON.Color4(1, 0.5, 0, 0.15);
            shockwave.color2 = new BABYLON.Color4(1, 0.2, 0, 0.15);
            shockwave.colorDead = new BABYLON.Color4(0, 0, 0, 0);
            
            shockwave.minSize = 0.1;
            shockwave.maxSize = 0.5; 
            shockwave.minLifeTime = 0.1;
            shockwave.maxLifeTime = 0.2;
            shockwave.emitRate = 0;
            shockwave.manualEmitCount = 10; 
            shockwave.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            shockwave.updateSpeed = 0.02;
            
            const explosionLight = new BABYLON.PointLight("explosionLight", bullet.position, scene);
            explosionLight.diffuse = new BABYLON.Color3(1, 0.5, 0);
            explosionLight.intensity = 5; 
            explosionLight.range = 3;
            
            explosion.start();
            shockwave.start();
            
            setTimeout(() => {
                explosion.dispose();
                shockwave.dispose();
                explosionLight.dispose();
            }, 100);
            
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
};
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
    bulletMaterial.emissiveColor = new BABYLON.Color3(1, 0.3, 0);
    bulletMaterial.freeze();
    bullet.material = bulletMaterial;
    bullet.position = startPosition.clone();
    const speed = 30;
    const bulletDirection = direction.clone().normalize();
    const bulletLifetime = 1000;
    let elapsedTime = 0;

    const bulletObserver = scene.onBeforeRenderObservable.add(() => {
        const delta = scene.getEngine().getDeltaTime();
        const movement = bulletDirection.scale(speed * delta / 1000);
        bullet.position.addInPlace(movement);
        bullet.rotate(bulletDirection, 0.5, BABYLON.Space.WORLD);

        elapsedTime += scene.getEngine().getDeltaTime();
        const ray = new BABYLON.Ray(bullet.position, bulletDirection, 0.1);
        const hit = scene.pickWithRay(ray);

        if ((hit.hit && hit.pickedMesh && hit.pickedMesh.name !== "bullet") || elapsedTime > bulletLifetime) {
            scene.onBeforeRenderObservable.remove(bulletObserver);
            bullet.dispose();
        }
    });
};
import * as BABYLON from '@babylonjs/core';

export class Level1AnimationSequence {
    constructor(scene) {
        this.scene = scene;
        this.camera = scene.activeCamera;
        this.originalCameraPosition = null;
        this.originalCameraTarget = null;
        this.player = null;
        this.dog = null;
        this.dogPosition = new BABYLON.Vector3(0, 0, 6);
        this.sequenceDuration = 6000; 
    }

    async setup() {
        // Trouver le joueur et le chien
        this.player = this.scene.getMeshByName("hero");
        
        // Charger le chien s'il n'est pas déjà chargé
        if (!this.scene.getMeshByName("levelDog")) {
            const dogResult = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'Dogtest.glb', this.scene);
            this.dog = dogResult.meshes[0];
            this.dog.name = 'levelDog';
            this.dog.scaling.set(1.3, 1.3, 1.3);
            this.dog.position = this.dogPosition.clone();
            
            // Démarrer l'animation idle du chien
            const dogAnimations = {
                idle: this.scene.getAnimationGroupByName("Idle_2")
            };
            
            if (dogAnimations.idle) {
                dogAnimations.idle.start(true);
            } else {
                // Si l'animation n'est pas immédiatement disponible, réessayer
                setTimeout(() => {
                    const anim = this.scene.getAnimationGroupByName("Idle_2");
                    if (anim) anim.start(true);
                }, 100);
            }
        } else {
            this.dog = this.scene.getMeshByName("levelDog");
        }
        
        // Si le niveau est déjà initialisé avec une carte
        const groundMeshes = this.scene.getMeshByName("ground");
        if (!groundMeshes) {
            // Créer un sol temporaire si nécessaire
            const ground = BABYLON.MeshBuilder.CreateGround("tempGround", {
                width: 100, 
                height: 100
            }, this.scene);
            ground.position.y = -0.1;
            ground.isVisible = false;
        }
        
        // Désactiver temporairement les contrôles du joueur
        if (this.scene.metadata && this.scene.metadata.controls) {
            this.scene.metadata.controls.enabled = false;
        }
        
        // Sauvegarder la position et la cible originales de la caméra
        if (this.camera) {
            if (this.camera.position) {
                this.originalCameraPosition = this.camera.position.clone();
            }
            if (this.camera.target) {
                this.originalCameraTarget = this.camera.target.clone();
            }
        }
    }

    async run() {
        await this.setup();
        
        return new Promise(async (resolve) => {
            if (!this.dog || !this.camera) {
                console.error("Impossible d'exécuter la séquence : chien ou caméra non trouvé");
                resolve();
                return;
            }
            
            console.log("Démarrage de la séquence d'animation du niveau 1");
            
            // Position pour la caméra focalisée sur le chien
            const dogCameraPosition = new BABYLON.Vector3(
                this.dog.position.x - 3,
                this.dog.position.y + 2,
                this.dog.position.z - 3
            );
            
            // Animation de la caméra vers le chien
            this._animateCamera(this.camera.position.clone(), dogCameraPosition, this.dog.position.clone(), 2000);
            
            // Après 3 secondes, animer la caméra vers le joueur
            setTimeout(() => {
                if (this.player) {
                    const playerFocusPosition = new BABYLON.Vector3(
                        this.player.position.x - 3,
                        this.player.position.y + 2,
                        this.player.position.z - 3
                    );
                    
                    this._animateCamera(this.camera.position.clone(), playerFocusPosition, this.player.position.clone(), 2000);
                }
                
                // Après la séquence complète, restaurer la caméra et activer les contrôles
                setTimeout(() => {
                    this._restoreCamera();
                    
                    // Réactiver les contrôles du joueur
                    if (this.scene.metadata && this.scene.metadata.controls) {
                        this.scene.metadata.controls.enabled = true;
                    }
                    
                    console.log("Fin de la séquence d'animation du niveau 1");
                    resolve();
                }, 2500);
            }, 3000);
        });
    }
    
    _animateCamera(fromPosition, toPosition, targetPosition, duration) {
        // Créer les animations pour la position de la caméra
        const frameRate = 30;
        const positionAnimation = new BABYLON.Animation(
            "cameraPositionAnimation",
            "position",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        const positionKeys = [
            { frame: 0, value: fromPosition },
            { frame: frameRate * (duration / 1000), value: toPosition }
        ];
        
        positionAnimation.setKeys(positionKeys);
        
        // Créer les animations pour la cible de la caméra
        const targetAnimation = new BABYLON.Animation(
            "cameraTargetAnimation",
            "target",
            frameRate,
            BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        const targetKeys = [
            { frame: 0, value: this.camera.target.clone() },
            { frame: frameRate * (duration / 1000), value: targetPosition }
        ];
        
        targetAnimation.setKeys(targetKeys);
        
        // Appliquer les animations à la caméra
        this.camera.animations = [positionAnimation, targetAnimation];
        this.scene.beginAnimation(this.camera, 0, frameRate * (duration / 1000), false);
    }
    
    _restoreCamera() {
        if (this.camera && this.originalCameraPosition && this.originalCameraTarget) {
            this._animateCamera(
                this.camera.position.clone(),
                this.originalCameraPosition,
                this.originalCameraTarget,
                1500
            );
        }
    }
} 
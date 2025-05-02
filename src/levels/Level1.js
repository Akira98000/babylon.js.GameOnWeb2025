import * as BABYLON from '@babylonjs/core';
import { GameMessages } from '../utils/GameMessages.js';

export class Level1 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.isPlayerNearDog = false;
        this.playerIsMoving = false;
        this.onComplete = null;
        // Initialiser le gestionnaire d'événements clavier
        this.keyHandler = this._handleKeyPress.bind(this);
    }

    async init() {
        if (this.dog) return;
        
        try {
            const dogResult = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'Dogtest.glb', this.scene);
            this.dog = dogResult.meshes[0];
            this.dog.name = 'levelDog';
            this.dog.scaling.set(1.3, 1.3, 1.3);
            this.dog.position.set(0, 0, 6);
            
            this.dogAnimations = this._getDogAnimations();
            
            this._tryStartAnimation(this.dogAnimations.idle);
            this.proximityArea = this._createProximityArea(this.dog.position);
            
            window.addEventListener("keydown", this.keyHandler);
            
            if (!this.dogAnimations.idle || !this.dogAnimations.walk) {
                setTimeout(() => {
                    this.dogAnimations = this._getDogAnimations();
                    this._tryStartAnimation(this.dogAnimations.idle);
                }, 100);
            }
        } catch (error) {
            console.error("Erreur lors de l'initialisation du niveau 1:", error);
        }
    }

    _getDogAnimations() {
        return {
            idle: this.scene.getAnimationGroupByName("Idle_2"),
            walk: this.scene.getAnimationGroupByName("Run")
        };
    }

    _tryStartAnimation(animationGroup) {
        if (animationGroup) animationGroup.start(true);
    }

    _createProximityArea(position) {
        const area = BABYLON.MeshBuilder.CreateSphere("dogProximity", { diameter: 6, segments: 8 }, this.scene);
        area.isVisible = false;
        area.position.copyFrom(position);
        area.position.y += 1;
        area.isPickable = false;
        return area;
    }

    _showProximityMessage() {
        GameMessages.showProximityMessage(
            "Ray vous aime bien !",
            "🐕",
            "Appuyez sur <strong style=\"color:rgb(255, 255, 255)\">K</strong> pour adopter Ray et en faire votre ami fidèle.",
            "dogMessage"
        );
    }

    _hideProximityMessage() {
        GameMessages.hideMessage("dogMessage");
    }

    checkProximity(playerPosition) {
        if (!this.proximityArea || this.isCompleted) return;
        if (!playerPosition) return;
        const wasNear = this.isPlayerNearDog;
        const distanceSquared = BABYLON.Vector3.DistanceSquared(playerPosition, this.proximityArea.position);
        this.isPlayerNearDog = distanceSquared < 16;
        
        // Si le joueur est proche, afficher le message
        if (this.isPlayerNearDog) {
            this._showProximityMessage();
        } else {
            // Cacher le message quand le joueur s'éloigne
            this._hideProximityMessage();
        }
    }

    _handleKeyPress(event) {
        if (event.key.toLowerCase() === 'k' && this.isPlayerNearDog && !this.isCompleted) {
            this._completeLevel();
        }
    }

    _completeLevel() {
        this.isCompleted = true;
        this._hideProximityMessage();
        window.removeEventListener("keydown", this.keyHandler);

        const hero = this.scene.getMeshByName("hero");
        if (hero && this.dog) {
            this.scene.onBeforeRenderObservable.add(() => {
                if (!this.isCompleted || !this.dog) return;

                const targetPosition = hero.position.clone();
                const right = new BABYLON.Vector3(Math.sin(hero.rotation.y - Math.PI / 2), 0, Math.cos(hero.rotation.y - Math.PI / 2));
                targetPosition.addInPlace(right.scale(0.5));
                const isPlayerMoving = this._detectPlayerMovement(hero);

                if (isPlayerMoving !== this.playerIsMoving) {
                    this.playerIsMoving = isPlayerMoving;
                    if (this.dogAnimations) {
                        if (isPlayerMoving) {
                            this.dogAnimations.idle?.stop();
                            this.dogAnimations.walk?.start(true);
                        } else {
                            this.dogAnimations.walk?.stop();
                            this.dogAnimations.idle?.start(true);
                        }
                    }
                }

                this.dog.position = BABYLON.Vector3.Lerp(this.dog.position, targetPosition, 0.26);
                this._rotateDogToHero(hero.rotation.y);
            });
        }

        // Afficher les confettis avant de passer au niveau suivant
        GameMessages.showCelebrationMessage(
            "Niveau Complété", 
            "🐕", 
            "Ray est maintenant votre fidèle compagnon et vous suivra partout dans vos aventures !",
            () => {
                if (this.onComplete && typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }
        );
    }

    _detectPlayerMovement(hero) {
        if (this.scene.metadata.controls?.isPlayerMoving) {
            return this.scene.metadata.controls.isPlayerMoving();
        }
        if (!this.prevHeroPosition) {
            this.prevHeroPosition = hero.position.clone();
        }
        const movementSquared = BABYLON.Vector3.DistanceSquared(this.prevHeroPosition, hero.position);
        this.prevHeroPosition = hero.position.clone();
        return movementSquared > 0.0001;
    }

    _rotateDogToHero(heroRotationY) {
        this.dog.rotation.y = heroRotationY;
        this.dog.getChildMeshes().forEach(child => {
            if (child instanceof BABYLON.AbstractMesh) child.rotation.y = heroRotationY;
        });
        const modelNode = this.dog.getChildMeshes().find(mesh =>
            mesh.name.includes("Armature") || mesh.name.includes("model") || mesh.name.includes("Animal")
        );
        if (modelNode) modelNode.rotation.y = heroRotationY;
    }

    cleanup() {
        window.removeEventListener("keydown", this.keyHandler);
    }
}
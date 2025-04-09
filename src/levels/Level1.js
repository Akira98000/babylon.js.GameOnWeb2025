import * as BABYLON from '@babylonjs/core';

export class Level1 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.isPlayerNearDog = false;
        this.playerIsMoving = false;
        this.onComplete = null; 
        this.messageElement = this._createMessage("Press 'K' to adopt the dog", "proximityMessage");
        this.keyHandler = this._handleKeyPress.bind(this);
    }

    async init() {
        if (this.dog) return;
        const dogResult = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'Dogtest.glb', this.scene);
        this.dog = dogResult.meshes[0];
        this.dog.name = 'levelDog';
        this.dog.scaling.set(0.9,0.9,0.9);
        this.dog.position.set(-60, 0, -10);
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
        const area = BABYLON.MeshBuilder.CreateSphere("dogProximity", { diameter: 4, segments: 8 }, this.scene);
        area.isVisible = false;
        area.position.copyFrom(position);
        area.position.y += 1;
        area.isPickable = false;
        return area;
    }

    _handleKeyPress(event) {
        if (event.key.toLowerCase() === 'k' && this.isPlayerNearDog && !this.isCompleted) {
            this._completeLevel();
        }
    }

    _completeLevel() {
        this.isCompleted = true;
        this._toggleMessage(this.messageElement, false);
        this._displayMessage("Level 1 Completed! Dog adopted!", "green", 3000);
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

        if (this.onComplete && typeof this.onComplete === 'function') {
            this.onComplete();
        }
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

    checkProximity(playerPosition) {
        if (!this.proximityArea || this.isCompleted) return;
        this.isPlayerNearDog = BABYLON.Vector3.DistanceSquared(playerPosition, this.proximityArea.position) < 16;
        this._toggleMessage(this.messageElement, this.isPlayerNearDog);
    }

    _createMessage(text, id) {
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            bottom: "30%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.39)",
            color: "white",
            padding: "15px 20px",
            borderRadius: "5px",
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            display: "none"
        });
        message.id = id;
        message.textContent = text;
        document.body.appendChild(message);
        return message;
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "block" : "none";
    }

    _displayMessage(text, color, duration = 3000) {
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: `rgba(${color === "green" ? "50,205,50" : "0,128,0"},0.8)`,
            color: "white",
            padding: "20px",
            borderRadius: "10px",
            fontFamily: "Arial, sans-serif",
            fontSize: "24px",
            zIndex: "1000"
        });
        message.textContent = text;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), duration);
    }

    _createDogPointer() {
        this.pointerLine = BABYLON.MeshBuilder.CreateLines("dogPointer", {
            points: [this.dog.position.clone(), this.dog.position.add(new BABYLON.Vector3(0, 20, 0))],
            updatable: true
        }, this.scene);
        this.pointerLine.color = new BABYLON.Color3(1, 0, 0);
    }
}
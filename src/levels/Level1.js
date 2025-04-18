import * as BABYLON from '@babylonjs/core';

export class Level1 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.isPlayerNearDog = false;
        this.playerIsMoving = false;
        this.onComplete = null; 
        this.messageElement = this._createMessage("", "proximityMessage");
        this.keyHandler = this._handleKeyPress.bind(this);
    }

    async init() {
        if (this.dog) return;
        const dogResult = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'Dogtest.glb', this.scene);
        this.dog = dogResult.meshes[0];
        this.dog.name = 'levelDog';
        this.dog.scaling.set(1.3,1.3,1.3);
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
        this._displayCompletionMessage();
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
        const wasNear = this.isPlayerNearDog;
        this.isPlayerNearDog = BABYLON.Vector3.DistanceSquared(playerPosition, this.proximityArea.position) < 16;
        
        if (this.isPlayerNearDog !== wasNear) {
            if (this.isPlayerNearDog) {
                this._showProximityMessage();
            } else {
                this._toggleMessage(this.messageElement, false);
            }
        }
    }

    _showProximityMessage() {
        if (!this.messageElement) {
            this.messageElement = this._createMessage("", "proximityMessage");
        }
        
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Ray vous aime bien !";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "🐕";
        }
        
        if (this.messageElement.textElement) {
            this.messageElement.textElement.innerHTML = "Appuyez sur <strong>K</strong> pour adopter Ray et en faire votre ami fidèle.";
        }
        
        this.messageElement.style.display = "flex";
    }

    _createMessage(text, id) {
        let element = document.getElementById(id);
        if (element) return element;

        const container = document.createElement("div");
        container.id = id;
        Object.assign(container.style, {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: "25px",
            borderRadius: "15px",
            color: "white",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: "none",
            zIndex: "1000",
            maxWidth: "600px",
            width: "80%",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            flexDirection: "column",
            alignItems: "center"
        });

        // Créer le titre
        const title = document.createElement("h2");
        title.style.marginBottom = "15px";
        title.style.textAlign = "center";
        container.appendChild(title);
        container.title = title;

        // Créer l'icône
        const icon = document.createElement("div");
        icon.style.fontSize = "48px";
        icon.style.marginBottom = "15px";
        icon.style.textAlign = "center";
        container.appendChild(icon);
        container.icon = icon;

        // Créer l'élément de texte
        const textElement = document.createElement("div");
        textElement.style.marginBottom = "20px";
        textElement.style.lineHeight = "1.5";
        textElement.style.textAlign = "center";
        container.appendChild(textElement);
        container.textElement = textElement;

        // Créer le bouton OK
        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        Object.assign(okButton.style, {
            padding: "10px 25px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            display: "none",
            transition: "all 0.3s ease"
        });
        container.appendChild(okButton);
        container.okButton = okButton;

        document.body.appendChild(container);
        return container;
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "flex" : "none";
    }

    _displayCompletionMessage() {
        const completionText = "Félicitations ! Ray est maintenant votre fidèle compagnon et vous suivra partout dans vos aventures. Il restera à vos côtés quoi qu'il arrive !";
        
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Un Nouvel Ami !";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "❤️";
        }
        
        if (this.messageElement.textElement) {
            this.messageElement.textElement.innerHTML = "";
        }
        
        this.messageElement.style.display = "flex";
        this.messageElement.style.opacity = "0";
        
        let opacity = 0;
        const fadeInterval = setInterval(() => {
            opacity += 0.05;
            if (opacity >= 1) {
                opacity = 1;
                clearInterval(fadeInterval);
                this._animateText(completionText);
            }
            this.messageElement.style.opacity = opacity;
        }, 20);
    }

    _animateText(text) {
        let index = 0;
        const textInterval = setInterval(() => {
            if (index < text.length) {
                this.messageElement.textElement.innerHTML += text.charAt(index);
                index++;
            } else {
                clearInterval(textInterval);
                this.messageElement.okButton.style.display = "block";
                
                this.messageElement.okButton.style.opacity = "0";
                this.messageElement.okButton.style.transform = "translateY(20px)";
                
                setTimeout(() => {
                    this.messageElement.okButton.style.opacity = "1";
                    this.messageElement.okButton.style.transform = "translateY(0)";
                    
                    setTimeout(() => {
                        if (this.messageElement.style.display !== "none") {
                            this._fadeOutElement(this.messageElement);
                        }
                    }, 15000);
                }, 300);
            }
        }, 30);
    }

    _fadeOutElement(element) {
        let opacity = 1;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            if (opacity <= 0) {
                opacity = 0;
                clearInterval(fadeInterval);
                element.style.display = "none";
            }
            element.style.opacity = opacity;
        }, 20);
    }

    cleanup() {
        window.removeEventListener("keydown", this.keyHandler);
    }
}
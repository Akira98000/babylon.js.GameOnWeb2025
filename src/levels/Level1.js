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
        this.tutorialComplete = false;
        this.messageShown = false;
        this.tutorialCompletedHandler = this._onTutorialCompleted.bind(this);
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
        
        // Ajouter un écouteur pour l'événement tutorialCompleted
        document.addEventListener('tutorialCompleted', this.tutorialCompletedHandler);
        
        // Vérifier également si le tutoriel existe ou non
        this._checkTutorialStatus();
        
        if (!this.dogAnimations.idle || !this.dogAnimations.walk) {
            setTimeout(() => {
                this.dogAnimations = this._getDogAnimations();
                this._tryStartAnimation(this.dogAnimations.idle);
            }, 100);
        }
    }
    
    _onTutorialCompleted(event) {
        if (!this.messageShown) {
            this._displayStoryMessage();
            this.tutorialComplete = true;
        }
        // Supprimer l'écouteur pour éviter les appels multiples
        document.removeEventListener('tutorialCompleted', this.tutorialCompletedHandler);
    }
    
    _checkTutorialStatus() {
        // Vérifier si le tutoriel est déjà terminé (container n'existe plus)
        const tutorialContainer = document.getElementById('tutorialContainer') || 
                                  document.querySelector('.tutorial-container');
        
        if (!tutorialContainer) {
            // Si le tutoriel n'existe pas ou est déjà terminé, afficher le message immédiatement
            this._displayStoryMessage();
            this.tutorialComplete = true;
            return;
        }
        
        // Observer les changements pour détecter quand le tutoriel est caché ou supprimé
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    // Vérifier si le tutoriel est maintenant caché
                    if (tutorialContainer.style.display === 'none' || 
                        tutorialContainer.classList.contains('hidden')) {
                        this._displayStoryMessage();
                        this.tutorialComplete = true;
                        observer.disconnect();
                    }
                }
            });
        });
        
        // Observer les changements d'attributs du tutoriel
        observer.observe(tutorialContainer, { attributes: true });
        
        // Écouter l'événement d'appui sur la touche Échap
        const escapeHandler = (event) => {
            if (event.key === 'Escape' && !this.tutorialComplete) {
                this._displayStoryMessage();
                this.tutorialComplete = true;
                window.removeEventListener('keydown', escapeHandler);
            }
        };
        
        window.addEventListener('keydown', escapeHandler);
        
        // Surveiller également les clics sur le bouton "Passer le tutoriel"
        const skipButton = document.getElementById('skipTutorialButton') || 
                           document.querySelector('.skip-tutorial') || 
                           document.querySelector('button:contains("Passer")');
        
        if (skipButton) {
            skipButton.addEventListener('click', () => {
                this._displayStoryMessage();
                this.tutorialComplete = true;
            });
        }
        
        setTimeout(() => {
            if (!this.messageShown) {
                this._displayStoryMessage();
                this.tutorialComplete = true;
            }
        }, 20000);
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
        // S'assurer que messageElement est correctement initialisé
        if (!this.messageElement) {
            this.messageElement = this._createMessage("", "proximityMessage");
        }
        
        // Mettre à jour le message pour adopter Ray
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
        if (element) {
            // Vérifier si les propriétés nécessaires existent déjà
            if (!element.title) {
                // Recréer les éléments manquants
                const header = element.querySelector("div");
                if (header) {
                    const title = header.querySelector("div:nth-child(2)");
                    const icon = header.querySelector("div:nth-child(1)");
                    if (title) element.title = title;
                    if (icon) element.icon = icon;
                }
            }
            return element;
        }
        
        const container = document.createElement("div");
        container.id = id;
        
        // Style moderne similaire au tutoriel
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
            gap: "20px"
        });
        
        // En-tête du popup
        const header = document.createElement("div");
        Object.assign(header.style, {
            display: "flex",
            alignItems: "center",
            marginBottom: "20px",
            gap: "15px"
        });
        
        const icon = document.createElement("div");
        Object.assign(icon.style, {
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#4a90e2",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "24px"
        });
        icon.textContent = "🐕";
        
        const title = document.createElement("div");
        Object.assign(title.style, {
            fontSize: "22px",
            fontWeight: "bold"
        });
        title.textContent = "Mission";
        
        header.appendChild(icon);
        header.appendChild(title);
        container.appendChild(header);
        
        // Conteneur du message
        const messageContainer = document.createElement("div");
        Object.assign(messageContainer.style, {
            display: "flex",
            alignItems: "flex-start",
            gap: "15px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px"
        });
        
        // Avatar
        const avatar = document.createElement("div");
        Object.assign(avatar.style, {
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            backgroundColor: "#4a90e2",
            backgroundImage: "url('/assets/avatar.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            flexShrink: "0"
        });
        
        // Texte du message
        const textElement = document.createElement("div");
        Object.assign(textElement.style, {
            fontSize: "18px",
            lineHeight: "1.6",
            color: "rgba(255, 255, 255, 0.9)",
            fontWeight: "400"
        });
        textElement.innerHTML = text;
        
        messageContainer.appendChild(avatar);
        messageContainer.appendChild(textElement);
        container.appendChild(messageContainer);
        
        // Bouton OK
        const okButton = document.createElement("button");
        okButton.textContent = "Compris !";
        Object.assign(okButton.style, {
            padding: "12px 0",
            fontSize: "18px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            transition: "all 0.3s ease",
            width: "100%",
            marginTop: "10px",
            display: "none"
        });
        
        okButton.onmouseover = function() {
            this.style.backgroundColor = "#45a049";
            this.style.transform = "translateY(-2px)";
            this.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.2)";
        };
        
        okButton.onmouseout = function() {
            this.style.backgroundColor = "#4CAF50";
            this.style.transform = "translateY(0)";
            this.style.boxShadow = "none";
        };
        
        okButton.onclick = () => {
            this._fadeOutElement(container);
        };
        
        container.appendChild(okButton);
        document.body.appendChild(container);
        
        // Stocker les références aux éléments internes
        container.textElement = textElement;
        container.okButton = okButton;
        container.title = title;
        container.icon = icon;
        
        return container;
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "flex" : "none";
    }

    _displayStoryMessage() {
        if (this.messageShown) return; // Éviter d'afficher le message plusieurs fois
        this.messageShown = true;
        
        const storyText = "Votre mission est de vous faire ami avec Ray, un chien adorable qui cherche un nouveau compagnon. Approchez-vous de lui et appuyez sur K pour l'adopter !";
        
        // S'assurer que messageElement est correctement initialisé
        if (!this.messageElement) {
            this.messageElement = this._createMessage("", "proximityMessage");
        }
        
        // Vérifier si title et icon existent
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Rencontrez Ray";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "🐕";
        }
        
        if (this.messageElement.textElement) {
            this.messageElement.textElement.innerHTML = "";
        }
        
        this.messageElement.style.display = "flex";
        this.messageElement.style.opacity = "0";
        
        // Animation d'entrée
        let opacity = 0;
        const fadeInterval = setInterval(() => {
            opacity += 0.05;
            if (opacity >= 1) {
                opacity = 1;
                clearInterval(fadeInterval);
                this._animateText(storyText);
            }
            this.messageElement.style.opacity = opacity;
        }, 20);
    }
    
    _displayCompletionMessage() {
        const completionText = "Félicitations ! Ray est maintenant votre fidèle compagnon et vous suivra partout dans vos aventures. Il restera à vos côtés quoi qu'il arrive !";
        
        // Vérifier si title et icon existent
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
        
        // Animation d'entrée
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
        
        // Animation confetti
        this._createConfetti();
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
                
                // Animation d'entrée du bouton
                this.messageElement.okButton.style.opacity = "0";
                this.messageElement.okButton.style.transform = "translateY(20px)";
                
                setTimeout(() => {
                    this.messageElement.okButton.style.opacity = "1";
                    this.messageElement.okButton.style.transform = "translateY(0)";
                    
                    // Fermer automatiquement après un délai
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
    
    _createConfetti() {
        const confettiContainer = document.createElement("div");
        confettiContainer.style.position = "fixed";
        confettiContainer.style.top = "0";
        confettiContainer.style.left = "0";
        confettiContainer.style.width = "100%";
        confettiContainer.style.height = "100%";
        confettiContainer.style.pointerEvents = "none";
        confettiContainer.style.zIndex = "999";
        document.body.appendChild(confettiContainer);
        
        const colors = ["#ffcf00", "#9c6d00", "#ff9e00", "#ff7300", "#ff4800"];
        
        // Créer des confettis
        for (let i = 0; i < 150; i++) {
            setTimeout(() => {
                const confetti = document.createElement("div");
                const size = Math.random() * 10 + 5;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                confetti.style.position = "absolute";
                confetti.style.width = `${size}px`;
                confetti.style.height = `${size}px`;
                confetti.style.backgroundColor = color;
                confetti.style.borderRadius = Math.random() > 0.5 ? "50%" : "0";
                confetti.style.top = "-20px";
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.opacity = Math.random() + 0.5;
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                confetti.style.transition = "transform 1s ease";
                
                confettiContainer.appendChild(confetti);
                
                // Animation de chute
                let speed = 1 + Math.random() * 3;
                let posY = -20;
                let posX = parseFloat(confetti.style.left);
                let rotate = 0;
                let opacity = parseFloat(confetti.style.opacity);
                
                const fall = setInterval(() => {
                    posY += speed;
                    posX += Math.sin(posY / 30) * 2;
                    rotate += 5;
                    confetti.style.top = `${posY}px`;
                    confetti.style.left = `${posX}%`;
                    confetti.style.transform = `rotate(${rotate}deg)`;
                    
                    if (posY > window.innerHeight) {
                        clearInterval(fall);
                        confetti.remove();
                    }
                    
                    if (posY > window.innerHeight * 0.7) {
                        opacity -= 0.01;
                        confetti.style.opacity = opacity;
                    }
                }, 16);
            }, i * 50);
        }
        
        // Supprimer le conteneur après quelques secondes
        setTimeout(() => {
            confettiContainer.remove();
        }, 10000);
    }

    // Ajouter une méthode de nettoyage pour supprimer les écouteurs d'événements
    cleanup() {
        document.removeEventListener('tutorialCompleted', this.tutorialCompletedHandler);
        window.removeEventListener("keydown", this.keyHandler);
    }
}
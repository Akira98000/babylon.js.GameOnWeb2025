import * as BABYLON from '@babylonjs/core';

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
        // Créer ou afficher le message
        if (!document.getElementById("dogMessage")) {
            const messageDiv = document.createElement("div");
            messageDiv.id = "dogMessage";
            messageDiv.innerHTML = `
                <div style="
                    position: fixed;
                    top: 40%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background-color: rgba(0, 0, 0, 0.75);
                    color: white;
                    padding: 15px 20px;
                    border-radius: 10px;
                    text-align: center;
                    z-index: 10000;
                    width: 60%;
                    max-width: 400px;
                    font-family: Arial, sans-serif;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(4px);
                ">
                    <h2 style="margin: 5px 0; font-size: 22px; color:rgb(255, 255, 255);">Ray vous aime bien !</h2>
                    <p style="margin: 8px 0; font-size: 16px;">Appuyez sur <strong style="color:rgb(255, 255, 255);">K</strong> pour adopter Ray et en faire votre ami fidèle.</p>
                </div>
            `;
            document.body.appendChild(messageDiv);
        } else {
            document.getElementById("dogMessage").style.display = "block";
        }
    }

    _hideProximityMessage() {
        const message = document.getElementById("dogMessage");
        if (message) {
            message.style.display = "none";
        }
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
        this._showConfetti().then(() => {
            if (this.onComplete && typeof this.onComplete === 'function') {
                this.onComplete();
            }
        });
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

    // Fonction pour afficher les confettis
    async _showConfetti() {
        return new Promise((resolve) => {
            // Vérifier si la bibliothèque canvas-confetti est déjà chargée
            if (typeof confetti === 'undefined') {
                // Charger la bibliothèque canvas-confetti depuis CDN
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
                script.async = true;
                
                script.onload = () => {
                    this._launchConfetti(resolve);
                };
                
                script.onerror = () => {
                    console.error("Impossible de charger la bibliothèque confetti");
                    resolve(); // Continuer même en cas d'erreur
                };
                
                document.head.appendChild(script);
            } else {
                this._launchConfetti(resolve);
            }
        });
    }

    // Fonction pour lancer les confettis
    _launchConfetti(callback) {
        const duration = 6000; // Durée totale de l'animation en ms
        const end = Date.now() + duration;
        
        // Créer un message de célébration avec le même style que les instructions du jeu
        const celebrationMsg = document.createElement("div");
        celebrationMsg.id = 'celebration-message';
        Object.assign(celebrationMsg.style, {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            padding: "25px",
            borderRadius: "15px",
            color: "white",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: "block",
            zIndex: "1000",
            width: "80%",
            maxWidth: "400px",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            textAlign: "center",
            opacity: "1"
        });

        // Titre avec icône
        const header = document.createElement("div");
        Object.assign(header.style, {
            display: "flex",
            alignItems: "center",
            marginBottom: "15px",
            gap: "15px",
            justifyContent: "center"
        });

        const icon = document.createElement("div");
        icon.textContent = "🐕";
        Object.assign(icon.style, {
            fontSize: "48px"
        });
        
        const title = document.createElement("div");
        title.textContent = "Niveau Complété";
        Object.assign(title.style, {
            fontSize: "24px",
            fontWeight: "bold"
        });
        
        header.appendChild(icon);
        header.appendChild(title);
        celebrationMsg.appendChild(header);
        
        // Instructions
        const messageText = document.createElement("div");
        messageText.innerHTML = "Ray est maintenant votre fidèle compagnon et vous suivra partout dans vos aventures !";
        Object.assign(messageText.style, {
            fontSize: "16px",
            lineHeight: "1.5",
            marginBottom: "20px",
            padding: "0 10px"
        });
        celebrationMsg.appendChild(messageText);
        
        // Bouton OK (initialement masqué)
        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        Object.assign(okButton.style, {
            padding: "8px 20px",
            backgroundColor: "rgba(255, 255, 255, 0.2)",
            border: "none",
            borderRadius: "5px",
            color: "white",
            cursor: "pointer",
            fontSize: "16px",
            width: "100%",
            marginTop: "10px",
            transition: "background-color 0.3s",
            display: "none"
        });
        
        okButton.addEventListener("mouseenter", () => {
            okButton.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
        });
        
        okButton.addEventListener("mouseleave", () => {
            okButton.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
        });
        
        okButton.addEventListener("click", () => {
            if (celebrationMsg.parentNode) {
                celebrationMsg.parentNode.removeChild(celebrationMsg);
            }
            callback(); // Passer au niveau suivant lorsque l'utilisateur clique sur OK
        });
        
        celebrationMsg.appendChild(okButton);
        document.body.appendChild(celebrationMsg);
        
        // Fonction pour créer différents types d'effets de confettis
        const runConfettiEffect = () => {
            // Effet de canon au centre
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6, x: 0.5 },
                colors: ['#FFD700', '#FFA500', '#FF4500', '#87CEEB', '#7FFF00', '#FF69B4']
            });
            
            // Effet latéral gauche
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0, y: 0.65 },
                    colors: ['#1E90FF', '#32CD32', '#FFD700', '#FF69B4']
                });
            }, 250);
            
            // Effet latéral droit
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1, y: 0.65 },
                    colors: ['#FF4500', '#9370DB', '#00CED1', '#FF69B4']
                });
            }, 400);
        };
        
        // Lancer le premier effet immédiatement
        runConfettiEffect();
        
        // Lancer des effets supplémentaires à intervalles
        const interval = setInterval(() => {
            if (Date.now() > end) {
                clearInterval(interval);
                
                // Un dernier effet spécial à la fin
                confetti({
                    particleCount: 200,
                    spread: 160,
                    origin: { y: 0.6 },
                    colors: ['#FFD700', '#FFA500', '#FF4500', '#87CEEB', '#32CD32'],
                    gravity: 0.5,
                    scalar: 2,
                    drift: 1,
                    ticks: 300
                });
                
                // Afficher le bouton OK après la fin de l'animation
                setTimeout(() => {
                    // Afficher le bouton pour permettre à l'utilisateur de continuer
                    okButton.style.display = "block";
                    okButton.style.opacity = "0";
                    
                    // Animer l'apparition du bouton
                    let opacity = 0;
                    const fadeInInterval = setInterval(() => {
                        opacity += 0.1;
                        if (opacity >= 1) {
                            opacity = 1;
                            clearInterval(fadeInInterval);
                        }
                        okButton.style.opacity = opacity;
                    }, 50);
                    
                    // Si l'utilisateur ne clique pas sur le bouton après un certain temps,
                    // passer automatiquement au niveau suivant
                    setTimeout(() => {
                        if (celebrationMsg.parentNode) {
                            celebrationMsg.parentNode.removeChild(celebrationMsg);
                            callback(); // Passer au niveau suivant automatiquement
                        }
                    }, 5000);
                }, 1500);
                return;
            }
            
            // Lancer des effets différents à chaque intervalle
            runConfettiEffect();
        }, 1200);
    }
}
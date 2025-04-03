import * as BABYLON from '@babylonjs/core';

export class Level1 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.isPlayerNearDog = false;
        this.playerIsMoving = false;
        this.onComplete = null; // Callback à appeler lorsque le niveau est terminé
        this.messageElement = this._createMessage("Press 'K' to adopt the dog", "proximityMessage");
        this.keyHandler = this._handleKeyPress.bind(this);
        this.cinematicPlayed = false;
        this.missionReminderElement = this._createMissionReminder();
    }

    async init() {
        if (this.dog) return;
        const dogResult = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'dog.glb', this.scene);
        this.dog = dogResult.meshes[0];
        this.dog.name = 'levelDog';
        this.dog.scaling.set(0.4, 0.4, 0.4);
        this.dog.position.set(-60, 0, -10);

        // Chargement et lancement des animations
        this.dogAnimations = this._getDogAnimations();
        this._tryStartAnimation(this.dogAnimations.idle);

        // Définition de la zone de proximité
        this.proximityArea = this._createProximityArea(this.dog.position);

        // Gestion du clavier
        window.addEventListener("keydown", this.keyHandler);

        // Vérification des animations après le chargement
        if (!this.dogAnimations.idle || !this.dogAnimations.walk) {
            setTimeout(() => {
                this.dogAnimations = this._getDogAnimations();
                this._tryStartAnimation(this.dogAnimations.idle);
            }, 100);
        }
    }

    _getDogAnimations() {
        return {
            idle: this.scene.getAnimationGroupByName("AnimalArmature|Idle_Eating"),
            walk: this.scene.getAnimationGroupByName("AnimalArmature|Walk")
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
        this._toggleMessage(this.missionReminderElement, false);
        this._displayMessage("Mission 1 completé ! Chien adoptée!", "green", 3000);
        window.removeEventListener("keydown", this.keyHandler);

        // Faire suivre le chien par le héros
        const hero = this.scene.getMeshByName("hero");
        if (hero && this.dog) {
            this.scene.onBeforeRenderObservable.add(() => {
                if (!this.isCompleted || !this.dog) return;

                const targetPosition = hero.position.clone();
                const forward = new BABYLON.Vector3(Math.sin(hero.rotation.y), 0, Math.cos(hero.rotation.y));
                const right = new BABYLON.Vector3(Math.sin(hero.rotation.y - Math.PI / 2), 0, Math.cos(hero.rotation.y + Math.PI / 2));
                targetPosition.subtractInPlace(forward.scale(1.2));
                targetPosition.subtractInPlace(right.scale(0.8));

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

                this.dog.position = BABYLON.Vector3.Lerp(this.dog.position, targetPosition, 0.06);
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
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "15px 25px",
            borderRadius: "10px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "16px",
            display: "none",
            zIndex: "1000",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            textAlign: "center"
        });
        
        message.id = id;
        
        // Créer un conteneur pour le texte
        const textContent = document.createElement("div");
        textContent.textContent = text;
        Object.assign(textContent.style, {
            fontWeight: "500",
            letterSpacing: "0.5px",
            color: "rgba(255, 255, 255, 0.95)"
        });
        
        // Ajouter une icône ou un indicateur visuel
        const keyIndicator = document.createElement("div");
        keyIndicator.textContent = "K";
        Object.assign(keyIndicator.style, {
            display: "inline-block",
            backgroundColor: "#4a90e2",
            color: "white",
            borderRadius: "4px",
            padding: "2px 8px",
            margin: "0 5px",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)"
        });
        
        // Animation subtile quand le message apparaît
        message.onanimationend = () => message.classList.remove("fadeIn");
        message.classList = "fadeIn";
        
        // Ajouter les éléments au message
        message.appendChild(textContent);
        
        // Si le message contient le mot "K", remplacer par l'indicateur visuel
        if (text.includes("K")) {
            const parts = text.split("'K'");
            message.innerHTML = "";
            const beforeText = document.createElement("span");
            beforeText.textContent = parts[0];
            const afterText = document.createElement("span");
            afterText.textContent = parts[1];
            
            message.appendChild(beforeText);
            message.appendChild(keyIndicator);
            message.appendChild(afterText);
        }
        
        document.body.appendChild(message);
        
        // Ajouter un style CSS pour l'animation
        if (!document.getElementById("proximityMessageStyles")) {
            const style = document.createElement("style");
            style.id = "proximityMessageStyles";
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; transform: translate(-50%, 20px); }
                    to { opacity: 1; transform: translate(-50%, 0); }
                }
                .fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
                #${id} {
                    animation: pulse 2s infinite;
                }
                @keyframes pulse {
                    0% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
                    50% { box-shadow: 0 4px 12px rgba(74, 144, 226, 0.4); }
                    100% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return message;
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "block" : "none";
    }

    _displayMessage(text, color, duration = 3000) {
        // Création du conteneur principal
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: `rgba(${color === "green" ? "50,205,50" : "0,128,0"},0.9)`,
            color: "white",
            padding: "25px 40px",
            borderRadius: "15px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "26px",
            fontWeight: "bold",
            zIndex: "1000",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            backdropFilter: "blur(5px)",
            border: "2px solid rgba(255,255,255,0.3)",
            textAlign: "center",
            maxWidth: "80%",
            opacity: "0",
            transition: "opacity 0.5s ease, transform 0.5s ease",
            animation: "message-appear 0.5s forwards"
        });

        // Ajouter une icône en fonction du message
        const iconContainer = document.createElement("div");
        Object.assign(iconContainer.style, {
            fontSize: "48px",
            marginBottom: "15px"
        });
        
        // Si c'est un message de réussite, on ajoute une icône de trophée
        if (text.includes("Completed") || text.includes("adopted")) {
            iconContainer.textContent = "🏆";
        } else {
            iconContainer.textContent = "✅";
        }

        // Texte du message
        const textElement = document.createElement("div");
        textElement.textContent = text;
        Object.assign(textElement.style, {
            textShadow: "0 1px 3px rgba(0,0,0,0.3)"
        });

        // Assembler le message
        message.appendChild(iconContainer);
        message.appendChild(textElement);
        document.body.appendChild(message);

        // Ajouter les styles d'animation
        if (!document.getElementById("successMessageStyles")) {
            const style = document.createElement("style");
            style.id = "successMessageStyles";
            style.textContent = `
                @keyframes message-appear {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    100% { opacity: 1; transform: translate(-50%, 0); }
                }
                @keyframes confetti-fall {
                    0% { transform: translateY(-10vh) rotate(0deg); }
                    100% { transform: translateY(100vh) rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        // Créer et ajouter les confettis
        this._createConfetti();

        // Animation de disparition
        setTimeout(() => {
            Object.assign(message.style, {
                opacity: "0",
                transform: "translate(-50%, -20px)"
            });
            setTimeout(() => message.remove(), 500);
        }, duration - 500);
    }

    _createConfetti() {
        // Conteneur pour les confettis
        const confettiContainer = document.createElement("div");
        Object.assign(confettiContainer.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: "999",
            overflow: "hidden"
        });
        document.body.appendChild(confettiContainer);

        // Couleurs pour les confettis
        const colors = [
            "#f44336", "#e91e63", "#9c27b0", "#673ab7", 
            "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", 
            "#009688", "#4caf50", "#8bc34a", "#cddc39", 
            "#ffeb3b", "#ffc107", "#ff9800", "#ff5722"
        ];

        // Créer 150 confettis
        for (let i = 0; i < 150; i++) {
            const confetti = document.createElement("div");
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 10 + 5; // Taille entre 5 et 15px
            const left = Math.random() * 100; // Position horizontale aléatoire
            const duration = Math.random() * 3 + 2; // Durée entre 2 et 5 secondes
            const delay = Math.random() * 0.5; // Délai entre 0 et 0.5 secondes

            // Formes aléatoires (cercle, carré ou rectangle)
            const shape = Math.floor(Math.random() * 3);
            let borderRadius = "50%"; // Cercle par défaut
            let width = `${size}px`;
            let height = `${size}px`;

            if (shape === 1) {
                borderRadius = "0"; // Carré
            } else if (shape === 2) {
                borderRadius = "0"; // Rectangle
                height = `${size * 0.4}px`;
            }

            Object.assign(confetti.style, {
                position: "absolute",
                backgroundColor: color,
                width: width,
                height: height,
                left: `${left}%`,
                top: "-10px",
                borderRadius: borderRadius,
                opacity: Math.random() * 0.6 + 0.4,
                animation: `confetti-fall ${duration}s linear ${delay}s 1`,
                zIndex: "999",
                transform: `rotate(${Math.random() * 360}deg)`
            });

            confettiContainer.appendChild(confetti);
        }

        // Supprimer le conteneur après l'animation
        setTimeout(() => confettiContainer.remove(), 6000);
    }

    _createMissionReminder() {
        const missionBar = document.createElement("div");
        missionBar.id = "missionReminder";
        Object.assign(missionBar.style, {
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "15px 25px",
            borderRadius: "10px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "16px",
            display: "none",
            zIndex: "1000",
            width: "auto",
            textAlign: "center",
            backdropFilter: "blur(5px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
        });

        const objective = document.createElement("div");
        objective.textContent = "Veuillez retrouver Ray, votre nouveau compagnon de route.";
        Object.assign(objective.style, {
            fontWeight: "bold",
            marginBottom: "8px",
            fontSize: "18px",
            color: "#4a90e2"
        });

        const description = document.createElement("div");
        description.textContent = "Trouvez le chien errant et appuyez sur 'K' pour l'adopter";
        Object.assign(description.style, {
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.9)"
        });

        missionBar.appendChild(objective);
        missionBar.appendChild(description);
        document.body.appendChild(missionBar);
        return missionBar;
    }
}
import * as BABYLON from '@babylonjs/core';

export class Level2 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.bananas = [];
        this.friendCount = 0;
        this.proximityThreshold = 5;
        this._messageElement = this._createMessage("Appuyez sur F pour devenir ami", "bananaProximityMessage");
        this._keyHandler = this._handleKeyDown.bind(this);
        this.onComplete = null; // Callback à appeler lorsque le niveau est terminé
    }

    async init() {
        const positions = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(-40, 0, -90),
            new BABYLON.Vector3(-90, 0, 40)
        ];
        

        await Promise.all(positions.map(async (pos, i) => {
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'banana.glb', this.scene);
            const banana = result.meshes[0];
            banana.name = `banana_${i}`;
            banana.scaling.scaleInPlace(0.5);
            banana.position = pos;
            banana.checkCollisions = true;

            this._playAnimation(result.animationGroups, "hello");

            this.bananas.push({ mesh: banana, isFriend: false });
        }));

        window.addEventListener("keydown", this._keyHandler);
    }

    checkProximity(playerPosition) {
        if (this.isCompleted) return;
        const bananaNearby = this.bananas.some(bananaObj => 
            !bananaObj.isFriend && BABYLON.Vector3.Distance(playerPosition, bananaObj.mesh.position) < this.proximityThreshold
        );
        this._toggleMessage(this._messageElement, bananaNearby);
    }

    _handleKeyDown(evt) {
        if (evt.key.toLowerCase() !== 'f' || this.isCompleted) return;

        for (const bananaObj of this.bananas) {
            if (bananaObj.isFriend) continue;
            const playerPos = this.scene.getMeshByName("hero").position;
            if (BABYLON.Vector3.Distance(playerPos, bananaObj.mesh.position) < this.proximityThreshold) {
                bananaObj.isFriend = true;
                this.friendCount++;
                this._displayMessage(`Vous êtes devenu ami avec une CoolBanane ! (${this.friendCount}/3)`, "green", 3000);
                break;
            }
        }
        if (this.friendCount >= 3) this._completeMission();
    }

    _completeMission() {
        if (this.isCompleted) return;
        this.isCompleted = true;
        
        // Masquer tous les messages d'interaction
        this._toggleMessage(this._messageElement, false);
        
        // Supprimer tous les autres messages qui pourraient être affichés
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"], [class*="message"]');
        allMessages.forEach(element => {
            if (element !== this._messageElement) {
                element.style.display = "none";
            }
        });
        
        // Afficher le message de réussite
        const successMessage = this._displayMessage("Vous avez fait ami-ami avec toutes les bananes !", "#00ff00", 3000);
        
        // Supprimer l'écouteur d'événements
        window.removeEventListener("keydown", this._keyHandler);
        
        // Appeler le callback onComplete après un court délai
        setTimeout(() => {
            // S'assurer une dernière fois que tous les messages sont masqués
            this._toggleMessage(this._messageElement, false);
            
            // Supprimer tous les messages, y compris le message de succès
            document.querySelectorAll('[id^="bananaProximity"], [id^="message"], [class*="message"]').forEach(el => {
                el.style.display = "none";
            });
            
            if (successMessage && successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
            
            // Appeler le callback pour passer au niveau 3
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
        }, 3000);
    }

    _playAnimation(animationGroups, name) {
        if (animationGroups && animationGroups.length > 0) {
            animationGroups.forEach(group => {
                if (group.name.toLowerCase().includes(name)) {
                    group.start(true);
                }
            });
        } else {
            const anim = this.scene.getAnimationGroupByName(name);
            if (anim) anim.start(true);
        }
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "block" : "none";
    }

    _createMessage(text, id) {
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            bottom: "40%",
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
        keyIndicator.textContent = "F";
        Object.assign(keyIndicator.style, {
            display: "inline-block",
            backgroundColor: "#FFC107", // Couleur jaune pour la banane
            color: "black",
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
        
        // Si le message contient le mot "F", remplacer par l'indicateur visuel
        if (text.includes("F")) {
            const parts = text.split("F");
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
                    50% { box-shadow: 0 4px 12px rgba(255, 193, 7, 0.4); }
                    100% { box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
                }
            `;
            document.head.appendChild(style);
        }
        
        return message;
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
        if (text.includes("ami-ami") || text.includes("bananes")) {
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

        // Créer et ajouter les confettis si c'est un message de réussite
        if (text.includes("ami-ami") || text.includes("toutes les bananes")) {
            this._createConfetti();
        }

        // Animation de disparition
        setTimeout(() => {
            Object.assign(message.style, {
                opacity: "0",
                transform: "translate(-50%, -20px)"
            });
            setTimeout(() => message.remove(), 500);
        }, duration - 500);
        
        return message;
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
}
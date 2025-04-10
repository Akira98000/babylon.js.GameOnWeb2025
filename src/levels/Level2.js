import * as BABYLON from '@babylonjs/core';

export class Level2 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.bananas = [];
        this.friendCount = 0;
        this.proximityThreshold = 5;
        this.messageElement = this._createMessage("", "bananaProximityMessage");
        this._keyHandler = this._handleKeyDown.bind(this);
        this.onComplete = null; 
    }

    async init() {
        const positions = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, 2),
        ];
        
        // Afficher le message d'introduction
        this._displayStoryMessage();

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
        
        let nearbyBanana = null;
        for (const bananaObj of this.bananas) {
            if (!bananaObj.isFriend) {
                const distance = BABYLON.Vector3.Distance(playerPosition, bananaObj.mesh.position);
                if (distance < this.proximityThreshold) {
                    nearbyBanana = bananaObj;
                    break;
                }
            }
        }
        
        if (nearbyBanana) {
            this._showProximityMessage();
        } else {
            this._toggleMessage(this.messageElement, false);
        }
    }

    _handleKeyDown(evt) {
        if (evt.key.toLowerCase() !== 'f' || this.isCompleted) return;

        for (const bananaObj of this.bananas) {
            if (bananaObj.isFriend) continue;
            const playerPos = this.scene.getMeshByName("hero").position;
            if (BABYLON.Vector3.Distance(playerPos, bananaObj.mesh.position) < this.proximityThreshold) {
                bananaObj.isFriend = true;
                this.friendCount++;
                this._showFriendshipMessage();
                break;
            }
        }
        if (this.friendCount >= 3) this._completeMission();
    }

    _completeMission() {
        if (this.isCompleted) return;
        this.isCompleted = true;
        
        // Masquer tous les messages d'interaction
        this._toggleMessage(this.messageElement, false);
        
        // Supprimer tous les autres messages qui pourraient être affichés
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"], [class*="message"]');
        allMessages.forEach(element => {
            if (element !== this.messageElement) {
                element.style.display = "none";
            }
        });
        
        // Afficher le message de réussite
        this._displayCompletionMessage();
        
        // Supprimer l'écouteur d'événements
        window.removeEventListener("keydown", this._keyHandler);
        
        // Appeler le callback onComplete après un court délai
        setTimeout(() => {
            // S'assurer une dernière fois que tous les messages sont masqués
            this._toggleMessage(this.messageElement, false);
            
            // Appeler le callback pour passer au niveau 3
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
        }, 5000);
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
    
    _showProximityMessage() {
        // S'assurer que messageElement est correctement initialisé
        if (!this.messageElement) {
            this.messageElement = this._createMessage("", "bananaProximityMessage");
        }
        
        // Mettre à jour le message pour devenir ami
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Une banane sympathique !";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "🍌";
        }
        
        if (this.messageElement.textElement) {
            this.messageElement.textElement.innerHTML = "Appuyez sur <strong>F</strong> pour devenir ami avec cette banane.";
        }
        
        this.messageElement.style.display = "flex";
    }
    
    _showFriendshipMessage() {
        // Créer un message flottant temporaire
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "fixed",
            top: "30%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: "rgba(76, 175, 80, 0.9)",
            color: "white",
            padding: "15px 25px",
            borderRadius: "10px",
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            fontSize: "20px",
            fontWeight: "bold",
            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
            zIndex: "1001",
            opacity: "0",
            transition: "opacity 0.3s, transform 0.3s"
        });
        
        message.textContent = `Nouvelle amitié forgée ! (${this.friendCount}/3)`;
        document.body.appendChild(message);
        
        // Animation d'entrée
        setTimeout(() => {
            message.style.opacity = "1";
            message.style.transform = "translate(-50%, -60%)";
            
            // Animation de sortie
            setTimeout(() => {
                message.style.opacity = "0";
                message.style.transform = "translate(-50%, -70%)";
                
                setTimeout(() => {
                    message.remove();
                }, 500);
            }, 2000);
        }, 0);
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "flex" : "none";
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
        icon.textContent = "🍌";
        
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

    _displayStoryMessage() {
        const storyText = "Votre mission est de vous faire des amis dans cette carte ! Approchez-vous des bananes et appuyez sur F pour lier amitié avec elles. Trouvez et liez-vous d'amitié avec 3 bananes pour réussir le niveau.";
        
        // S'assurer que messageElement est correctement initialisé
        if (!this.messageElement) {
            this.messageElement = this._createMessage("", "bananaProximityMessage");
        }
        
        // Vérifier si title et icon existent
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Faites-vous des Amis !";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "👋";
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
        const completionText = "Félicitations ! Vous avez réussi à vous faire des amis avec toutes les bananes. Votre sociabilité est impressionnante et les bananes parlent déjà de vous en bien !";
        
        // Vérifier si title et icon existent
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Mission Accomplie !";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "🎉";
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
        
        const colors = ["#ffcc00", "#ffea00", "#ffff00", "#aaff00", "#55ff00"];
        
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
}
export class GameMessages {
    static showProximityMessage(title, icon, text, id = `proximityMessage_${Date.now()}`) {
        const existingMessage = document.getElementById(id);
        if (existingMessage) {
            existingMessage.parentNode.removeChild(existingMessage);
        }
        
        const messageDiv = document.createElement("div");
        messageDiv.id = id;
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
                <h2 style="margin: 5px 0; font-size: 22px; color: #FFEB3B;">${title}</h2>
                <div style="font-size: 38px; margin: 10px 0;">${icon}</div>
                <p style="margin: 8px 0; font-size: 16px;">${text}</p>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        return messageDiv;
    }
    
    /**
     * Cache un message existant
     * @param {string} id - ID du message à cacher
     */
    static hideMessage(id) {
        const message = document.getElementById(id);
        if (message) {
            message.style.display = "none";
        }
    }
    
    /**
     * Affiche un message temporaire qui disparaît après une durée spécifiée
     * @param {string} title - Titre du message
     * @param {string} icon - Emoji à afficher
     * @param {string} text - Texte du message
     * @param {number} duration - Durée d'affichage en ms (par défaut 3000)
     * @param {string} color - Couleur du titre (par défaut #4CAF50)
     * @returns {HTMLElement} - L'élément de message créé
     */
    static showTemporaryMessage(title, icon, text, duration = 3000, color = "#4CAF50") {
        const messageId = `tempMessage_${Date.now()}`;
        const messageDiv = document.createElement("div");
        messageDiv.id = messageId;
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
                <h2 style="margin: 5px 0; font-size: 22px; color: ${color};">${title}</h2>
                <div style="font-size: 38px; margin: 10px 0;">${icon}</div>
                <p style="margin: 8px 0; font-size: 16px;">${text}</p>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Auto-fermeture après durée spécifiée
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.style.opacity = "0";
                messageDiv.style.transition = "opacity 1s";
                setTimeout(() => {
                    if (messageDiv.parentNode) {
                        messageDiv.parentNode.removeChild(messageDiv);
                    }
                }, 1000);
            }
        }, duration);
        
        return messageDiv;
    }
    
    /**
     * Affiche un message avec bouton de confirmation
     * @param {string} title - Titre du message
     * @param {string} icon - Emoji à afficher
     * @param {string} text - Texte du message
     * @param {string} buttonText - Texte du bouton (par défaut "Compris !")
     * @param {Function} onConfirm - Fonction à exécuter quand le bouton est cliqué
     * @param {number} autoCloseDelay - Délai avant fermeture auto (ms, 0 pour désactiver)
     * @returns {HTMLElement} - L'élément de message créé
     */
    static showConfirmMessage(title, icon, text, buttonText = "Compris !", onConfirm = null, autoCloseDelay = 15000) {
        const messageId = `confirmMessage_${Date.now()}`;
        const messageDiv = document.createElement("div");
        messageDiv.id = messageId;
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
                <h2 style="margin: 5px 0; font-size: 22px; color: #FFFFFF;">${title}</h2>
                <div style="font-size: 38px; margin: 10px 0;">${icon}</div>
                <p style="margin: 8px 0; font-size: 16px;">${text}</p>
                <button id="${messageId}_button" style="
                    padding: 8px 20px;
                    background-color: rgba(255, 255, 255, 0.2);
                    border: none;
                    border-radius: 5px;
                    color: white;
                    cursor: pointer;
                    font-size: 16px;
                    width: 100%;
                    margin-top: 10px;
                    transition: background-color 0.3s;
                ">${buttonText}</button>
            </div>
        `;
        
        document.body.appendChild(messageDiv);
        
        // Ajouter des événements au bouton
        const button = document.getElementById(`${messageId}_button`);
        if (button) {
            button.addEventListener("mouseover", () => {
                button.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
            });
            
            button.addEventListener("mouseout", () => {
                button.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            });
            
            button.addEventListener("click", () => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
                if (onConfirm && typeof onConfirm === 'function') {
                    onConfirm();
                }
            });
        }
        
        // Auto-fermeture après délai si spécifié
        if (autoCloseDelay > 0) {
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, autoCloseDelay);
        }
        
        return messageDiv;
    }
    
    /**
     * Affiche un message de célébration avec confettis
     * @param {string} title - Titre du message
     * @param {string} icon - Emoji à afficher
     * @param {string} text - Texte du message
     * @param {Function} onComplete - Fonction à exécuter quand le joueur continue
     */
    static showCelebrationMessage(title, icon, text, onComplete) {
        // Charger la bibliothèque de confettis si nécessaire
        this._loadConfettiLibrary().then(() => {
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

            const iconElement = document.createElement("div");
            iconElement.textContent = icon;
            Object.assign(iconElement.style, {
                fontSize: "48px"
            });
            
            const titleElement = document.createElement("div");
            titleElement.textContent = title;
            Object.assign(titleElement.style, {
                fontSize: "24px",
                fontWeight: "bold"
            });
            
            header.appendChild(iconElement);
            header.appendChild(titleElement);
            celebrationMsg.appendChild(header);
            
            // Instructions
            const messageText = document.createElement("div");
            messageText.innerHTML = text;
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
                if (onComplete && typeof onComplete === 'function') {
                    onComplete(); // Passer au niveau suivant lorsque l'utilisateur clique sur OK
                }
            });
            
            celebrationMsg.appendChild(okButton);
            document.body.appendChild(celebrationMsg);
            
            this._launchConfetti(6000, () => {
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
                            if (onComplete && typeof onComplete === 'function') {
                                onComplete(); // Passer au niveau suivant automatiquement
                            }
                        }
                    }, 5000);
                }, 1500);
            });
        });
    }
    
    /**
     * Charge la bibliothèque canvas-confetti si elle n'est pas déjà chargée
     * @returns {Promise} - Promise résolue quand la bibliothèque est chargée
     */
    static _loadConfettiLibrary() {
        return new Promise((resolve) => {
            if (typeof confetti !== 'undefined') {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.browser.min.js';
            script.async = true;
            
            script.onload = () => {
                resolve();
            };
            
            script.onerror = () => {
                console.error("Impossible de charger la bibliothèque confetti");
                resolve(); // Continuer même en cas d'erreur
            };
            
            document.head.appendChild(script);
        });
    }
    
    /**
     * Lance les effets de confettis
     * @param {number} duration - Durée de l'animation en ms
     * @param {Function} onComplete - Fonction à exécuter à la fin
     */
    static _launchConfetti(duration, onComplete) {
        const end = Date.now() + duration;
        
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
                
                if (onComplete && typeof onComplete === 'function') {
                    onComplete();
                }
                return;
            }
            
            // Lancer des effets différents à chaque intervalle
            runConfettiEffect();
        }, 1200);
    }
} 
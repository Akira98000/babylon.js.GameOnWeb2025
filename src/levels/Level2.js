import * as BABYLON from '@babylonjs/core';
import { GameMessages } from '../utils/GameMessages.js';

export class Level2 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.bananas = [];
        this.friendCount = 0;
        this.proximityThreshold = 5;
        this._keyHandler = this._handleKeyDown.bind(this);
        this.onComplete = null; 
    }

    async init() {
        const positions = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, 2),
        ];
        
        // Suppression de l'affichage du message d'introduction
        // this._displayStoryMessage();

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
        
        // Assurons-nous d'avoir une position valide
        if (!playerPosition) return;
        
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
            this._hideProximityMessage();
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
                // Masquer le message de proximité
                this._hideProximityMessage();
                // Afficher le message d'amitié
                this._showFriendshipMessage();
                break;
            }
        }
        if (this.friendCount >= 3) this._completeMission();
    }

    _completeMission() {
        if (this.isCompleted) return;
        this.isCompleted = true;
        
        // Masquer le message de proximité
        this._hideProximityMessage();
        
        // Afficher le message de réussite et les confettis
        GameMessages.showCelebrationMessage(
            "Niveau Complété",
            "🍌",
            "Félicitations ! Vous avez réussi à vous faire des amis avec toutes les bananes.",
            () => {
                // Nettoyer les bananes avant de passer au niveau suivant
                this._cleanupBananas();
                
                // Appeler le callback pour passer au niveau 3
                if (typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }
        );
        
        // Supprimer l'écouteur d'événements
        window.removeEventListener("keydown", this._keyHandler);
    }

    _cleanupBananas() {
        console.log("Nettoyage des bananes du niveau 2");
        
        // Supprimer tous les meshes de bananes
        for (const bananaObj of this.bananas) {
            if (bananaObj.mesh) {
                // Nettoyer les animations si elles existent
                const animations = this.scene.animationGroups.filter(
                    anim => anim.targetedAnimations.some(
                        targetAnim => targetAnim.target === bananaObj.mesh
                    )
                );
                
                for (const anim of animations) {
                    anim.stop();
                }
                
                // Supprimer le mesh
                bananaObj.mesh.dispose();
            }
        }
        
        // Vider le tableau des bananes
        this.bananas = [];
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
        GameMessages.showProximityMessage(
            "Une banane sympathique !",
            "🍌",
            "Appuyez sur <strong style=\"color: #FFEB3B;\">F</strong> pour devenir ami avec cette banane.",
            "bananaMessage"
        );
    }

    _hideProximityMessage() {
        GameMessages.hideMessage("bananaMessage");
    }

    _showFriendshipMessage() {
        GameMessages.showTemporaryMessage(
            "Nouvelle amitié forgée !",
            "🍌",
            `(${this.friendCount}/3)`,
            2000,
            "#4CAF50"
        );
    }

    _showConfetti() {
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
        icon.textContent = "🍌";
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
        messageText.innerHTML = "Félicitations ! Vous avez réussi à vous faire des amis avec toutes les bananes.";
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
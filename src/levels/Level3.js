import * as BABYLON from '@babylonjs/core';

export class Level3 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.cinematicPlayed = false;
        this.messageElement = this._createMessage("", "storyMessage");
        this.apocalypseParticles = null;
    }

    async init() {
        if (this.cinematicPlayed) return;
        
        // Masquer tous les messages d'interaction qui pourraient être encore visibles
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"]');
        allMessages.forEach(element => {
            if (element.id !== "storyMessage") {
                element.style.display = "none";
            }
        });
        
        // Masquer également le rappel de mission pendant la cinématique
        const missionReminder = document.getElementById("missionReminder");
        if (missionReminder) {
            missionReminder.style.display = "none";
        }
        
        const hero = this.scene.getMeshByName("hero");
        const camera = this.scene.getCameraByName("camera");
        const originalCameraControls = camera.inputs.attached.pointers;
        camera.inputs.attached.pointers.detachControl();
        
        const originalAlpha = camera.alpha;
        const originalBeta = camera.beta;
        const originalRadius = camera.radius;
        const originalTarget = camera.target.clone();
        
        // Créer les particules apocalyptiques
        this._createApocalypseParticles();
        
        // Commencer la cinématique immédiatement
        // La musique est déjà gérée par le levelManager
        this._playCinematic(hero, camera, originalAlpha, originalBeta, originalRadius, originalTarget, originalCameraControls);
    }
    
    _createApocalypseParticles() {
        // Particules de cendres tombantes
        const ashParticles = new BABYLON.ParticleSystem("ashParticles", 2000, this.scene);
        ashParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        ashParticles.emitter = new BABYLON.Vector3(0, 30, 0);
        ashParticles.minEmitBox = new BABYLON.Vector3(-100, 20, -100);
        ashParticles.maxEmitBox = new BABYLON.Vector3(100, 30, 100);
        ashParticles.color1 = new BABYLON.Color4(0.3, 0.3, 0.3, 0.2);
        ashParticles.color2 = new BABYLON.Color4(0.5, 0.5, 0.5, 0.2);
        ashParticles.colorDead = new BABYLON.Color4(0.2, 0.2, 0.2, 0);
        ashParticles.minSize = 0.1;
        ashParticles.maxSize = 0.5;
        ashParticles.minLifeTime = 5;
        ashParticles.maxLifeTime = 10;
        ashParticles.emitRate = 200;
        ashParticles.gravity = new BABYLON.Vector3(0, -0.1, 0);
        ashParticles.direction1 = new BABYLON.Vector3(-1, -1, -1);
        ashParticles.direction2 = new BABYLON.Vector3(1, -1, 1);
        ashParticles.minAngularSpeed = 0;
        ashParticles.maxAngularSpeed = Math.PI;
        ashParticles.minEmitPower = 0.1;
        ashParticles.maxEmitPower = 0.3;
        ashParticles.updateSpeed = 0.01;
        
        // Particules d'étincelles rouges
        const emberParticles = new BABYLON.ParticleSystem("emberParticles", 500, this.scene);
        emberParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        emberParticles.emitter = new BABYLON.Vector3(0, 20, 0);
        emberParticles.minEmitBox = new BABYLON.Vector3(-100, 0, -100);
        emberParticles.maxEmitBox = new BABYLON.Vector3(100, 20, 100);
        emberParticles.color1 = new BABYLON.Color4(1, 0.3, 0, 0.8);
        emberParticles.color2 = new BABYLON.Color4(1, 0.5, 0, 0.8);
        emberParticles.colorDead = new BABYLON.Color4(0.7, 0.3, 0, 0);
        emberParticles.minSize = 0.1;
        emberParticles.maxSize = 0.3;
        emberParticles.minLifeTime = 2;
        emberParticles.maxLifeTime = 5;
        emberParticles.emitRate = 50;
        emberParticles.gravity = new BABYLON.Vector3(0, 0.05, 0); // Légère flottaison vers le haut
        emberParticles.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        emberParticles.direction2 = new BABYLON.Vector3(0.5, 1, 0.5);
        emberParticles.minAngularSpeed = 0;
        emberParticles.maxAngularSpeed = Math.PI;
        emberParticles.minEmitPower = 0.2;
        emberParticles.maxEmitPower = 0.6;
        emberParticles.updateSpeed = 0.01;
        emberParticles.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        
        // Stocker les particules pour pouvoir les démarrer/arrêter plus tard
        this.apocalypseParticles = {
            ash: ashParticles,
            embers: emberParticles,
            start: function() {
                ashParticles.start();
                emberParticles.start();
            },
            stop: function() {
                ashParticles.stop();
                emberParticles.stop();
            }
        };
    }

    async _playCinematic(hero, camera, originalAlpha, originalBeta, originalRadius, originalTarget, originalCameraControls) {        
        // Définir les durées des différentes phases
        const skyTransitionDuration = 5000; // 5 secondes pour la transition du ciel
        const cameraPanDelay = 5000; // Attendre 5 secondes avant de commencer le mouvement de caméra
        const cameraPanDuration = 8000; // 8 secondes pour le mouvement de caméra
        
        const startTime = Date.now();
        const originalSkyColor = this.scene.clearColor.clone();
        const targetSkyColor = new BABYLON.Color4(0.8, 0.2, 0.1, 1); // Rouge-orange
        
        const originalFogColor = this.scene.fogColor.clone();
        const targetFogColor = new BABYLON.Color3(0.8, 0.2, 0.1); // Rouge-orange
        
        // Démarrer les particules apocalyptiques
        if (this.apocalypseParticles) {
            this.apocalypseParticles.start();
        }
        
        // Fonction pour animer la cinématique
        const animate = () => {
            const currentTime = Date.now();
            const elapsedTime = currentTime - startTime;
            
            // Phase 1: Transition de la couleur du ciel (0-5s)
            if (elapsedTime < skyTransitionDuration) {
                const skyRatio = elapsedTime / skyTransitionDuration;
                
                // Interpolation des couleurs
                const currentSkyColor = new BABYLON.Color4(
                    originalSkyColor.r + (targetSkyColor.r - originalSkyColor.r) * skyRatio,
                    originalSkyColor.g + (targetSkyColor.g - originalSkyColor.g) * skyRatio,
                    originalSkyColor.b + (targetSkyColor.b - originalSkyColor.b) * skyRatio,
                    1
                );
                
                const currentFogColor = new BABYLON.Color3(
                    originalFogColor.r + (targetFogColor.r - originalFogColor.r) * skyRatio,
                    originalFogColor.g + (targetFogColor.g - originalFogColor.g) * skyRatio,
                    originalFogColor.b + (targetFogColor.b - originalFogColor.b) * skyRatio
                );
                
                this.scene.clearColor = currentSkyColor;
                this.scene.fogColor = currentFogColor;
                
                // Augmenter progressivement la densité du brouillard
                this.scene.fogDensity = 0.024 + (0.05 - 0.024) * skyRatio;
            }
            
            // Phase 2: Animation de la caméra (après cameraPanDelay)
            if (elapsedTime > cameraPanDelay && elapsedTime < cameraPanDelay + cameraPanDuration) {
                const cameraRatio = (elapsedTime - cameraPanDelay) / cameraPanDuration;
                
                // Phase 2.1: Focus sur le héros (0-25%)
                if (cameraRatio < 0.25) {
                    const phase1Ratio = cameraRatio / 0.25;
                    camera.radius = originalRadius - (originalRadius * 0.3 * phase1Ratio);
                    camera.target = hero.position.clone();
                    camera.target.y += 1;
                }
                // Phase 2.2: Élévation et rotation (25-75%)
                else if (cameraRatio < 0.75) {
                    const phase2Ratio = (cameraRatio - 0.25) / 0.5;
                    camera.radius = originalRadius * 0.7 + (originalRadius * 1.3 * phase2Ratio);
                    camera.beta = originalBeta - (originalBeta * 0.3 * phase2Ratio);
                    camera.alpha = originalAlpha + (Math.PI * 2 * phase2Ratio);
                }
                // Phase 2.3: Vue panoramique (75-100%)
                else {
                    const phase3Ratio = (cameraRatio - 0.75) / 0.25;
                    camera.beta = originalBeta * 0.7 - (originalBeta * 0.2 * phase3Ratio);
                    camera.radius = originalRadius * 2 + (originalRadius * phase3Ratio);
                }
            }
            
            // Continuer l'animation si nécessaire
            if (elapsedTime < cameraPanDelay + cameraPanDuration) {
                requestAnimationFrame(animate);
            } else {
                // Afficher le message une fois l'animation terminée
                setTimeout(() => {
                    this._displayStoryMessage();
                    
                    // Restaurer les contrôles de la caméra après quelques secondes
                    setTimeout(() => {
                        camera.inputs.attached.pointers = originalCameraControls;
                        camera.inputs.attached.pointers.attachControl();
                        this.cinematicPlayed = true;
                    }, 20000); // 20 secondes pour lire le message
                }, 1000);
            }
        };
        
        // Démarrer l'animation
        animate();
    }
    
    _displayStoryMessage() {
        const storyText = "Le ciel s'assombrit... Une catastrophe approche. Vous êtes le dernier espoir de ce monde. Votre mission est de trouver les artefacts perdus avant que les ténèbres ne consument tout. Le temps presse, héros...";
        
        this.messageElement.textElement.innerHTML = "";
        this.messageElement.style.display = "flex"; // Utiliser flex pour centrer le contenu
        
        // Animation de texte lettre par lettre
        let index = 0;
        const textInterval = setInterval(() => {
            if (index < storyText.length) {
                this.messageElement.textElement.innerHTML += storyText.charAt(index);
                index++;
            } else {
                clearInterval(textInterval);
                
                // Afficher le bouton OK une fois le texte complet
                this.messageElement.okButton.style.display = "block";
                
                // Si l'utilisateur ne clique pas sur OK, fermer automatiquement après un délai
                setTimeout(() => {
                    if (this.messageElement.style.display !== "none") {
                        this._fadeOutElement(this.messageElement);
                    }
                }, 15000);
            }
        }, 50);
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
        }, 100);
    }
    
    _createMessage(text, id) {
        let element = document.getElementById(id);
        if (element) {
            return element;
        }
        
        const container = document.createElement("div");
        container.id = id;
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.backgroundColor = "rgba(0, 0, 0, 0.85)";
        container.style.display = "none";
        container.style.zIndex = "1000";
        container.style.flexDirection = "column";
        container.style.justifyContent = "center";
        container.style.alignItems = "center";
        
        // Créer l'élément de texte
        const textElement = document.createElement("div");
        textElement.innerHTML = text;
        textElement.style.color = "white";
        textElement.style.fontFamily = "Arial, sans-serif";
        textElement.style.fontSize = "28px";
        textElement.style.textAlign = "center";
        textElement.style.maxWidth = "80%";
        textElement.style.padding = "30px";
        textElement.style.margin = "0 auto";
        textElement.style.marginBottom = "40px";
        
        const okButton = document.createElement("button");
        okButton.textContent = "OK";
        okButton.style.padding = "10px 30px";
        okButton.style.fontSize = "20px";
        okButton.style.backgroundColor = "#4CAF50";
        okButton.style.color = "white";
        okButton.style.border = "none";
        okButton.style.borderRadius = "5px";
        okButton.style.cursor = "pointer";
        okButton.style.marginTop = "30px";
        okButton.style.display = "none"; 
        
        okButton.onmouseover = function() {
            this.style.backgroundColor = "#45a049";
        };
        okButton.onmouseout = function() {
            this.style.backgroundColor = "#4CAF50";
        };
        
        okButton.onclick = () => {
            this._fadeOutElement(container);
        };
        
        container.appendChild(textElement);
        container.appendChild(okButton);
        
        document.body.appendChild(container);
        
        container.textElement = textElement;
        container.okButton = okButton;
        
        return container;
    }
    
    checkProximity(playerPosition) {

    }
} 
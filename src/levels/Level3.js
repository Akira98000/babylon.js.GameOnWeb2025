import * as BABYLON from '@babylonjs/core';
import gsap from 'gsap';
import { GameMessages } from '../utils/GameMessages.js';

export class Level3 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.colorCollectibles = [];
        this.collectedColors = [];
        this.rainbows = [];
        this.messageElement = this._createMessage("", "storyMessage");
        this.colorToCollect = 6; 
        this.originalMaterials = new Map();
        this.colorIntensity = 0;
        this.onComplete = null;
        this.canvas = null;
    }

    async init() {
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"]');
        allMessages.forEach(element => {
            if (element.id !== "storyMessage") {
                element.style.display = "none";
            }
        });
        
        // Récupérer le canvas de rendu
        this.canvas = this.scene.getEngine().getRenderingCanvas();
        this._applyBlackAndWhiteEffect();
        this._displayStoryMessage();
        this._createColorCollectibles();
    }
    
    _applyBlackAndWhiteEffect() {
        if (this.canvas) {
            // Appliquer le filtre grayscale à 100%
            this.canvas.style.filter = 'grayscale(1)';
            // Assurer une transition douce lors des changements futurs
            this.canvas.style.transition = 'filter 0.5s ease';
        }
    }
    
    _restoreColors(intensity) {
        this.colorIntensity = intensity;
        
        if (this.canvas) {
            // Utiliser GSAP pour animer la transition
            gsap.to(this.canvas, {
                duration: 1.0, 
                filter: `grayscale(${1 - intensity})`,
                ease: "power2.out"
            });
        }
    }
    
    _createColorCollectibles() {
        const positions = [
            new BABYLON.Vector3(-119.13, 0, -84.04),
            new BABYLON.Vector3(-82.74, 0, 0.05),
            new BABYLON.Vector3(-61.83, 0, -32.81),
            new BABYLON.Vector3(-52.35, 0, 43.03),
            new BABYLON.Vector3(8.42, 0, 16.16),
            new BABYLON.Vector3(-24.84, 0, -48.70)
        ];
        
        const colors = [
            new BABYLON.Color3(1, 0, 0),     
            new BABYLON.Color3(1, 0.5, 0),  
            new BABYLON.Color3(1, 1, 0),   
            new BABYLON.Color3(0, 1, 0),    
            new BABYLON.Color3(0, 0, 1),     
            new BABYLON.Color3(0.5, 0, 0.5) 
        ];
        
        for (let i = 0; i < this.colorToCollect; i++) {
            const sphere = BABYLON.MeshBuilder.CreateSphere(`colorCollectible${i}`, { diameter: 3 }, this.scene);
            sphere.position = positions[i];
            const material = new BABYLON.StandardMaterial(`colorMaterial${i}`, this.scene);
            material.diffuseColor = colors[i];
            material.emissiveColor = colors[i].scale(0.5);
            material.specularPower = 128;
            sphere.material = material;
            this._animateCollectible(sphere);
            this.colorCollectibles.push({
                mesh: sphere,
                color: colors[i],
                collected: false,
                index: i
            });
            this._createCollectibleParticles(sphere, colors[i]);
        }
    }
    
    _animateCollectible(mesh) {
        const rotationAnimation = new BABYLON.Animation(
            "rotationAnimation",
            "rotation.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const rotationKeys = [];
        rotationKeys.push({ frame: 0, value: 0 });
        rotationKeys.push({ frame: 100, value: 2 * Math.PI });
        rotationAnimation.setKeys(rotationKeys);
        
        const positionAnimation = new BABYLON.Animation(
            "positionAnimation",
            "position.y",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
        );
        
        const baseY = mesh.position.y;
        const positionKeys = [];
        positionKeys.push({ frame: 0, value: baseY });
        positionKeys.push({ frame: 50, value: baseY + 0.5 });
        positionKeys.push({ frame: 100, value: baseY });
        positionAnimation.setKeys(positionKeys);
        
        mesh.animations = [rotationAnimation, positionAnimation];
        this.scene.beginAnimation(mesh, 0, 100, true);
    }
    
    _createCollectibleParticles(mesh, color) {
        const particleSystem = new BABYLON.ParticleSystem(`particles${mesh.name}`, 50, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        particleSystem.emitter = mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
        
        particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1.0);
        particleSystem.color2 = new BABYLON.Color4(color.r, color.g, color.b, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);
        
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.2;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.0;
        particleSystem.emitRate = 10;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
        particleSystem.minEmitPower = 0.3;
        particleSystem.maxEmitPower = 0.7;
        particleSystem.updateSpeed = 0.02;
        
        particleSystem.start();
    }
    
    _createRainbow(startPosition, endPosition, color, index) {
        const points = [];
        const segments = 10;
        const height = 40;
        
        const distance = BABYLON.Vector3.Distance(startPosition, endPosition);
        const direction = BABYLON.Vector3.Normalize(endPosition.subtract(startPosition));
        const scaledDirection = direction.scale(distance * 1.5);
        const newEndPosition = startPosition.add(scaledDirection);
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = startPosition.x + (newEndPosition.x - startPosition.x) * t;
            const z = startPosition.z + (newEndPosition.z - startPosition.z) * t;
            const y = startPosition.y + height * Math.sin(Math.PI * t);
            points.push(new BABYLON.Vector3(x, y, z));
        }
        
        const rainbow = BABYLON.MeshBuilder.CreateTube(`rainbow${index}`, {
            path: points,
            radius: 1.5,
            tessellation: 8,
            updatable: false
        }, this.scene);
        
        const material = new BABYLON.StandardMaterial(`rainbowMaterial${index}`, this.scene);
        material.diffuseColor = color;
        material.emissiveColor = color.scale(0.5);
        material.alpha = 0.8;
        rainbow.material = material;
        
        return rainbow;
    }
    
    _createRainbowParticles(points, color) {
        for (let i = 0; i < points.length; i += 4) {
            const particleSystem = new BABYLON.ParticleSystem(`rainbowParticles${i}`, 50, this.scene);
            particleSystem.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
            particleSystem.emitter = points[i];
            
            particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 0.8);
            particleSystem.color2 = new BABYLON.Color4(color.r, color.g, color.b, 0.8);
            particleSystem.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);
            
            particleSystem.minSize = 0.1;
            particleSystem.maxSize = 0.2;
            particleSystem.minLifeTime = 0.5;
            particleSystem.maxLifeTime = 1.0;
            particleSystem.emitRate = 10;
            particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
            particleSystem.direction1 = new BABYLON.Vector3(-0.2, -0.2, -0.2);
            particleSystem.direction2 = new BABYLON.Vector3(0.2, 0.2, 0.2);
            particleSystem.minEmitPower = 0.1;
            particleSystem.maxEmitPower = 0.2;
            
            particleSystem.start();
        }
    }
    
    _displayStoryMessage() {
        const storyText = "La ville a perdu ses couleurs ! Récupérez les 6 orbes de couleur dispersées dans la ville pour créer des arcs-en-ciel et redonner vie à ce monde terne.";
        
        this.messageElement = GameMessages.showConfirmMessage(
            "Monde Sans Couleurs",
            "🎨",
            storyText,
            "Compris !",
            null,
            15000
        );
    }
    
    _displayCompletionMessage() {
        // Forcer la restauration complète des couleurs
        this.forceRestoreColors();
        
        // Afficher le message de réussite
        GameMessages.showTemporaryMessage(
            "Mission Accomplie !",
            "🌈",
            "Félicitations ! Vous avez restauré toutes les couleurs du monde !",
            5000,
            "#4CAF50"
        );
        
        // Créer les confettis
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
                this.messageElement.okButton.style.opacity = "0";
                this.messageElement.okButton.style.transform = "translateY(20px)";
                
                setTimeout(() => {
                    this.messageElement.okButton.style.opacity = "1";
                    this.messageElement.okButton.style.transform = "translateY(0)";
                    setTimeout(() => {
                        if (this.messageElement.style.display !== "none") {
                            this._fadeOutElement(this.messageElement);
                            if (this.messageElement.title.textContent === "Mission Accomplie !") {
                                this.isCompleted = true;
                            }
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
    
    _createMessage(text, id) {
        let element = document.getElementById(id);
        if (element) {
            if (!element.title) {
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
        icon.textContent = "🌈";
        
        const title = document.createElement("div");
        Object.assign(title.style, {
            fontSize: "22px",
            fontWeight: "bold"
        });
        title.textContent = "Mission";
        
        header.appendChild(icon);
        header.appendChild(title);
        container.appendChild(header);
        
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
        
        container.textElement = textElement;
        container.okButton = okButton;
        container.title = title;
        container.icon = icon;
        
        return container;
    }
    
    checkProximity(playerPosition) {
        for (const collectible of this.colorCollectibles) {
            if (!collectible.collected) {
                const distance = BABYLON.Vector3.Distance(playerPosition, collectible.mesh.position);
                
                if (distance < 2) {
                    collectible.collected = true;
                    
                    // Supprimer le marqueur de la carte avant de disposer du mesh
                    if (this.scene.metadata && this.scene.metadata.minimap && this.scene.metadata.minimap.removeMarkerByPosition) {
                        this.scene.metadata.minimap.removeMarkerByPosition({
                            x: collectible.mesh.position.x,
                            z: collectible.mesh.position.z
                        });
                    }
                    
                    collectible.mesh.dispose();
                    this.collectedColors.push(collectible.color);
                    
                    const cityCenter = new BABYLON.Vector3(0, 0, 0);
                    const rainbow = this._createRainbow(cityCenter, collectible.mesh.position, collectible.color, collectible.index);
                    this.rainbows.push(rainbow);
                    
                    const colorNames = ["rouge", "orange", "jaune", "vert", "bleu", "violet"];
                    const message = `Vous avez récupéré la couleur ${colorNames[collectible.index]} ! (${this.collectedColors.length}/${this.colorToCollect})`;
                    this._showFloatingMessage(message, playerPosition);
                    
                    // Calculer le ratio de restauration des couleurs
                    const colorRatio = this.collectedColors.length / this.colorToCollect;
                    this._restoreColors(colorRatio);
                    
                    if (this.collectedColors.length >= this.colorToCollect) {
                        this._createFinalRainbow();
                        this._displayCompletionMessage();
                        
                        // Forcer la restauration complète des couleurs après un court délai
                        setTimeout(() => {
                            this.forceRestoreColors();
                        }, 100);
                        
                        // Vérifier si le niveau est terminé
                        this._checkCompletion();
                    }
                }
            }
        }
    }
    
    _showFloatingMessage(text, position) {
        GameMessages.showTemporaryMessage(
            "Couleur Récupérée !",
            "🎨",
            text,
            3000,
            "#4CAF50"
        );
    }
    
    _createFinalRainbow() {
        this.forceRestoreColors();
        
        const segments = 30;
        const radius = 100;
        const centerPoint = new BABYLON.Vector3(0, 0, 0);
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = 30 + 10 * Math.sin((i / segments) * Math.PI * 4);
            points.push(new BABYLON.Vector3(x, y, z));
        }
        
        const finalRainbow = BABYLON.MeshBuilder.CreateTube("finalRainbow", {
            path: points,
            radius: 2,
            tessellation: 8,
            updatable: false
        }, this.scene);
        
        const rainbowMaterial = new BABYLON.StandardMaterial("rainbowMaterial", this.scene);
        const rainbowTexture = new BABYLON.ProceduralTexture("rainbowTexture", 128, "rainbowShader", this.scene);
        
        BABYLON.Effect.ShadersStore["rainbowShaderFragmentShader"] = `
            precision highp float;
            varying vec2 vUV;
            void main() {
                float frequency = 6.0;
                float phase = vUV.x * frequency;
                
                vec3 color;
                float hue = mod(phase, 1.0);
                float saturation = 1.0;
                float value = 1.0;
                
                float h = hue * 6.0;
                float i = floor(h);
                float f = h - i;
                float p = value * (1.0 - saturation);
                float q = value * (1.0 - f * saturation);
                float t = value * (1.0 - (1.0 - f) * saturation);
                
                if (i == 0.0) color = vec3(value, t, p);
                else if (i == 1.0) color = vec3(q, value, p);
                else if (i == 2.0) color = vec3(p, value, t);
                else if (i == 3.0) color = vec3(p, q, value);
                else if (i == 4.0) color = vec3(t, p, value);
                else color = vec3(value, p, q);
                
                gl_FragColor = vec4(color, 0.8);
            }
        `;
        
        rainbowMaterial.diffuseTexture = rainbowTexture;
        rainbowMaterial.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
        rainbowMaterial.alpha = 0.8;
        
        finalRainbow.material = rainbowMaterial;
        
        for (let i = 0; i < points.length; i += 6) {
            this._createColorfulParticles(points[i]);
        }
        
        this.rainbows.push(finalRainbow);
    }
    
    _createColorfulParticles(position) {
        const particleSystem = new BABYLON.ParticleSystem("rainbowParticles", 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        particleSystem.emitter = position;
        particleSystem.updateFunction = (particles) => {
            for (let index = 0; index < particles.length; index++) {
                const particle = particles[index];
                const ageRatio = particle.age / particle.lifeTime;
                const hue = (ageRatio + particle.id / particles.length) % 1;
                const h = hue * 6;
                const i = Math.floor(h);
                const f = h - i;
                const p = 0;
                const q = 1 - f;
                const t = f;
                let r, g, b;
                
                if (i % 6 === 0) { r = 1; g = t; b = p; }
                else if (i % 6 === 1) { r = q; g = 1; b = p; }
                else if (i % 6 === 2) { r = p; g = 1; b = t; }
                else if (i % 6 === 3) { r = p; g = q; b = 1; }
                else if (i % 6 === 4) { r = t; g = p; b = 1; }
                else { r = 1; g = p; b = q; }
        
                particle.color.r = r;
                particle.color.g = g;
                particle.color.b = b;
            }
        };
        
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.2;
        particleSystem.minLifeTime = 0.8;
        particleSystem.maxLifeTime = 2;
        particleSystem.emitRate = 25;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        particleSystem.gravity = new BABYLON.Vector3(0, -0.03, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-0.5, 0.5, -0.5);
        particleSystem.direction2 = new BABYLON.Vector3(0.5, 0.5, 0.5);
        particleSystem.minEmitPower = 0.1;
        particleSystem.maxEmitPower = 0.3;
        
        particleSystem.start();
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
        
        const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const confetti = document.createElement("div");
                const size = Math.random() * 8 + 4;
                const color = colors[Math.floor(Math.random() * colors.length)];
                
                confetti.style.position = "absolute";
                confetti.style.width = `${size}px`;
                confetti.style.height = `${size}px`;
                confetti.style.backgroundColor = color;
                confetti.style.borderRadius = "50%";
                confetti.style.top = "-20px";
                confetti.style.left = `${Math.random() * 100}%`;
                confetti.style.opacity = "0.8";
                
                confettiContainer.appendChild(confetti);
                
                let speed = 1 + Math.random() * 2;
                let posY = -20;
                let posX = parseFloat(confetti.style.left);
                
                const fall = setInterval(() => {
                    posY += speed;
                    posX += Math.sin(posY / 30);
                    confetti.style.top = `${posY}px`;
                    confetti.style.left = `${posX}%`;
                    
                    if (posY > window.innerHeight) {
                        clearInterval(fall);
                        confetti.remove();
                    }
                }, 20);
            }, i * 80);
        }
        
        setTimeout(() => {
            confettiContainer.remove();
        }, 8000);
    }

    // Nettoyage des ressources lors de la sortie du niveau
    cleanup() {
        // Restaurer le canvas à son état normal (suppression du filtre)
        if (this.canvas) {
            this.canvas.style.filter = '';
            this.canvas.style.transition = '';
        }
        
        // Nettoyer les collectibles de couleur
        for (const collectible of this.colorCollectibles) {
            if (collectible.mesh && !collectible.mesh.isDisposed()) {
                collectible.mesh.dispose();
            }
        }
        
        // Nettoyer les arcs-en-ciel
        for (const rainbow of this.rainbows) {
            if (rainbow && !rainbow.isDisposed()) {
                rainbow.dispose();
            }
        }
        
        // Vider les tableaux
        this.colorCollectibles = [];
        this.collectedColors = [];
        this.rainbows = [];
        
        // Supprimer le message si présent
        if (this.messageElement && this.messageElement.parentNode) {
            this.messageElement.parentNode.removeChild(this.messageElement);
        }
    }

    // Méthode pour forcer la restauration complète des couleurs
    forceRestoreColors() {
        console.log("Forçage de la restauration des couleurs");
        
        if (this.canvas) {
            // Animation GSAP pour restauration instantanée des couleurs
            gsap.to(this.canvas, {
                duration: 0.3,
                filter: 'grayscale(0)', 
                ease: "power4.out"
            });
        }
        
        this.colorIntensity = 1.0;
    }

    _checkCompletion() {
        if (this.collectedColors.length === this.colorToCollect && !this.isCompleted) {
            this.isCompleted = true;
            GameMessages.showTemporaryMessage(
                "Félicitations !",
                "🌈",
                "Vous avez restauré toutes les couleurs !",
                5000,
                "#4CAF50"
            );
            
            // Ajouter un message de transition vers le niveau 4
            setTimeout(() => {
                GameMessages.showTemporaryMessage(
                    "Alerte !",
                    "⚠️",
                    "Le monde retrouve ses couleurs... mais une menace approche...",
                    4000,
                    "#FFEB3B"
                );
            }, 5000);
            
            // Ajouter un effet sonore d'alerte
            setTimeout(() => {
                this._playAlertSound();
            }, 8500);
            
            // Nettoyer les arcs-en-ciel avant de passer au niveau suivant
            setTimeout(() => {
                this._cleanupRainbows();
            }, 8900);
            
            setTimeout(() => {
                if (this.onComplete && typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }, 9000);
        }
    }
    
    _cleanupRainbows() {
        console.log("Suppression des arcs-en-ciel du niveau 3");
        
        // Nettoyer les arcs-en-ciel
        for (const rainbow of this.rainbows) {
            if (rainbow && !rainbow.isDisposed()) {
                rainbow.dispose();
            }
        }
        
        // Supprimer également les particules associées aux arcs-en-ciel
        for (let particleSystem of this.scene.particleSystems) {
            if (particleSystem.name.startsWith("rainbowParticles")) {
                particleSystem.dispose();
            }
        }
        
        // Vider le tableau des arcs-en-ciel
        this.rainbows = [];
    }
    
    _playAlertSound() {
        try {
            const alertSound = new BABYLON.Sound("alertSound", "/son/alert.mp3", this.scene, null, {
                volume: 0.7,
                autoplay: true
            });
        } catch (error) {
            console.warn("Impossible de jouer le son d'alerte:", error);
        }
    }

    _showMessage(text, duration) {
        GameMessages.showTemporaryMessage(
            "Alerte !",
            "⚠️",
            text,
            duration,
            "#FFEB3B"
        );
    }
} 
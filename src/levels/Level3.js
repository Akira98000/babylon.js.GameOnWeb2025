import * as BABYLON from '@babylonjs/core';

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
        this.blackAndWhitePostProcess = null;
        this.colorIntensity = 0;
        this.onComplete = null;
    }

    async init() {
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"]');
        allMessages.forEach(element => {
            if (element.id !== "storyMessage") {
                element.style.display = "none";
            }
        });
        
        this._applyBlackAndWhiteEffect();
        this._storeAndConvertMaterials();
        this._displayStoryMessage();
        this._createColorCollectibles();
    }
    
    _applyBlackAndWhiteEffect() {
        const camera = this.scene.getCameraByName("camera");
        if (camera) {
            BABYLON.Effect.ShadersStore["blackAndWhiteFragmentShader"] = `
                #ifdef GL_ES
                precision highp float;
                #endif
                
                varying vec2 vUV;
                uniform sampler2D textureSampler;
                uniform float colorIntensity;
                
                void main(void) {
                    vec3 color = texture2D(textureSampler, vUV).rgb;
                    float gray = dot(color, vec3(0.3, 0.59, 0.11));
                    vec3 bwColor = vec3(gray, gray, gray);
                    gl_FragColor = vec4(mix(bwColor, color, colorIntensity), 1.0);
                }
            `;
            
            this.blackAndWhitePostProcess = new BABYLON.PostProcess(
                "BlackAndWhite", 
                "blackAndWhite", 
                ["colorIntensity"], 
                null, 
                1.0, 
                camera
            );
            
            this.blackAndWhitePostProcess.onApply = (effect) => {
                effect.setFloat("colorIntensity", this.colorIntensity);
            };
        }
    }
    
    _storeAndConvertMaterials() {
        this.scene.meshes.forEach(mesh => {
            if (mesh.material) {
                // Stocker le matériau original pour pouvoir le restaurer plus tard
                this.originalMaterials.set(mesh.id, mesh.material.clone());
                
                // Ne pas convertir les orbes de couleur
                if (!mesh.name.includes("colorCollectible")) {
                    const bwMaterial = new BABYLON.StandardMaterial(`bw_${mesh.material.name || mesh.id}`, this.scene);
                    
                    // Gestion des matériaux avec texture
                    if (mesh.material.diffuseTexture) {
                        bwMaterial.diffuseTexture = mesh.material.diffuseTexture.clone();
                        bwMaterial.diffuseTexture.onLoad = () => {
                            BABYLON.Effect.ShadersStore[`grayscale_${mesh.id}FragmentShader`] = `
                                #ifdef GL_ES
                                precision highp float;
                                #endif
                                
                                varying vec2 vUV;
                                uniform sampler2D textureSampler;
                                
                                void main(void) {
                                    vec3 color = texture2D(textureSampler, vUV).rgb;
                                    float gray = dot(color, vec3(0.3, 0.59, 0.11));
                                    gl_FragColor = vec4(gray, gray, gray, 1.0);
                                }
                            `;
                            
                            const effect = new BABYLON.PostProcess(
                                `grayscale_${mesh.id}`,
                                `grayscale_${mesh.id}`,
                                [],
                                ["textureSampler"],
                                1.0
                            );
                            
                            bwMaterial.diffuseTexture.postProcess = effect;
                        };
                    } else {
                        // Gestion des matériaux avec couleur
                        const color = mesh.material.diffuseColor || new BABYLON.Color3(0.5, 0.5, 0.5);
                        const gray = (color.r * 0.3 + color.g * 0.59 + color.b * 0.11);
                        bwMaterial.diffuseColor = new BABYLON.Color3(gray, gray, gray);
                    }
                    
                    // Copier les autres propriétés importantes du matériau
                    bwMaterial.alpha = mesh.material.alpha;
                    bwMaterial.backFaceCulling = mesh.material.backFaceCulling;
                    
                    // Copier les propriétés d'émission et de spécularité si elles existent
                    if (mesh.material.emissiveColor) {
                        const emissiveColor = mesh.material.emissiveColor;
                        const emissiveGray = (emissiveColor.r * 0.3 + emissiveColor.g * 0.59 + emissiveColor.b * 0.11);
                        bwMaterial.emissiveColor = new BABYLON.Color3(emissiveGray, emissiveGray, emissiveGray);
                    }
                    
                    if (mesh.material.specularColor) {
                        const specularColor = mesh.material.specularColor;
                        const specularGray = (specularColor.r * 0.3 + specularColor.g * 0.59 + specularColor.b * 0.11);
                        bwMaterial.specularColor = new BABYLON.Color3(specularGray, specularGray, specularGray);
                        bwMaterial.specularPower = mesh.material.specularPower || 64;
                    }
                    
                    // Appliquer le nouveau matériau en noir et blanc
                    mesh.material = bwMaterial;
                }
            }
        });
    }
    
    _restoreColors(intensity) {
        this.colorIntensity = intensity;
        
        // Mise à jour du post-process pour la transition progressive
        if (this.blackAndWhitePostProcess) {
            this.blackAndWhitePostProcess.onApply = (effect) => {
                effect.setFloat("colorIntensity", this.colorIntensity);
            };
        }
        
        // Si toutes les couleurs sont collectées (intensité = 1.0), supprimer le post-process
        if (intensity >= 1.0 && this.blackAndWhitePostProcess) {
            this.blackAndWhitePostProcess.dispose();
            this.blackAndWhitePostProcess = null;
        }
        
        this.originalMaterials.forEach((originalMaterial, meshId) => {
            const mesh = this.scene.getMeshByID(meshId);
            if (mesh && !mesh.name.includes("colorCollectible")) {
                if (intensity >= 1.0) {
                    // Restaurer complètement le matériau original
                    mesh.material = originalMaterial;
                } else {
                    // Transition progressive entre noir et blanc et couleur
                    if (mesh.material.diffuseColor && originalMaterial.diffuseColor) {
                        const originalColor = originalMaterial.diffuseColor;
                        const gray = (originalColor.r * 0.3 + originalColor.g * 0.59 + originalColor.b * 0.11);
                        const grayColor = new BABYLON.Color3(gray, gray, gray);
                        mesh.material.diffuseColor = BABYLON.Color3.Lerp(
                            grayColor,
                            originalColor,
                            intensity
                        );
                    }
                }
            }
        });
    }
    
    _createColorCollectibles() {
        const positions = [
            //new BABYLON.Vector3(100, 1, 100),  
            //new BABYLON.Vector3(-100, 1, 100),
            //new BABYLON.Vector3(-100, 1, -100),
            //new BABYLON.Vector3(100, 1, -100), 
            //new BABYLON.Vector3(0, 1, 100),   
            //new BABYLON.Vector3(0, 1, -100)
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(0, 0, 1),
            new BABYLON.Vector3(0, 0, 2),
            new BABYLON.Vector3(0, 0, 3),
            new BABYLON.Vector3(0, 0, 4),
            new BABYLON.Vector3(0, 0, 5)
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
        const particleSystem = new BABYLON.ParticleSystem(`particles${mesh.name}`, 100, this.scene);
        particleSystem.particleTexture = new BABYLON.Texture("/assets/flare.png", this.scene);
        particleSystem.emitter = mesh;
        particleSystem.minEmitBox = new BABYLON.Vector3(-0.2, -0.2, -0.2);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0.2, 0.2, 0.2);
        
        particleSystem.color1 = new BABYLON.Color4(color.r, color.g, color.b, 1.0);
        particleSystem.color2 = new BABYLON.Color4(color.r, color.g, color.b, 1.0);
        particleSystem.colorDead = new BABYLON.Color4(color.r, color.g, color.b, 0);
        
        particleSystem.minSize = 0.1;
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 1.5;
        particleSystem.emitRate = 20;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        particleSystem.gravity = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minAngularSpeed = 0;
        particleSystem.maxAngularSpeed = Math.PI;
        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1;
        particleSystem.updateSpeed = 0.01;
        
        particleSystem.start();
    }
    
    _createRainbow(startPosition, endPosition, color, index) {
        const points = [];
        const segments = 20;
        const height = 50; // Hauteur maximale de l'arc augmentée
        
        // Ajuster les positions pour couvrir une plus grande distance
        const distance = BABYLON.Vector3.Distance(startPosition, endPosition);
        const direction = BABYLON.Vector3.Normalize(endPosition.subtract(startPosition));
        const scaledDirection = direction.scale(distance * 2); // Doubler la distance
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
            tessellation: 16, 
            updatable: true
        }, this.scene);
        
        const material = new BABYLON.StandardMaterial(`rainbowMaterial${index}`, this.scene);
        material.diffuseColor = color;
        material.emissiveColor = color.scale(0.7); 
        material.alpha = 0.8;
        rainbow.material = material;
        
        this._createRainbowParticles(points, color);
        
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
        
        // S'assurer que messageElement est correctement initialisé
        if (!this.messageElement) {
            this.messageElement = this._createMessage("", "storyMessage");
        }
        
        // Vérifier si title et icon existent
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Monde Sans Couleurs";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "🎨";
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
        // Forcer la restauration complète des couleurs immédiatement
        this.forceRestoreColors();
        
        const completionText = "Magnifique ! Vous avez restauré les couleurs de la ville. Les arcs-en-ciel brillent de mille feux et la vie reprend son cours normal.";
        if (this.messageElement.title && typeof this.messageElement.title.textContent !== 'undefined') {
            this.messageElement.title.textContent = "Mission Accomplie !";
        }
        
        if (this.messageElement.icon && typeof this.messageElement.icon.textContent !== 'undefined') {
            this.messageElement.icon.textContent = "✨";
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
                    }
                }
            }
        }
    }
    
    _showFloatingMessage(text, position) {
        const messageDiv = document.createElement("div");
        messageDiv.style.position = "fixed";
        messageDiv.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
        messageDiv.style.color = "white";
        messageDiv.style.padding = "10px";
        messageDiv.style.borderRadius = "5px";
        messageDiv.style.fontFamily = "Arial, sans-serif";
        messageDiv.style.fontSize = "18px";
        messageDiv.style.top = "30%";
        messageDiv.style.left = "50%";
        messageDiv.style.transform = "translate(-50%, -50%)";
        messageDiv.style.zIndex = "1001";
        messageDiv.innerHTML = text;
        
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.style.opacity = "0";
            messageDiv.style.transition = "opacity 1s";
            setTimeout(() => {
                document.body.removeChild(messageDiv);
            }, 1000);
        }, 3000);
    }
    
    _createFinalRainbow() {
        // Forcer la restauration complète des couleurs
        this.forceRestoreColors();
        
        // Créer un grand arc-en-ciel circulaire au-dessus de la ville
        const segments = 60;
        // Augmenter le rayon pour couvrir toute la longueur de la carte
        const radius = 100; // Valeur augmentée pour couvrir la carte entière
        const centerPoint = new BABYLON.Vector3(0, 0, 0);
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            // Augmenter la hauteur pour rendre l'arc-en-ciel plus visible
            const y = 30 + 10 * Math.sin((i / segments) * Math.PI * 4);
            points.push(new BABYLON.Vector3(x, y, z));
        }
        
        const finalRainbow = BABYLON.MeshBuilder.CreateTube("finalRainbow", {
            path: points,
            radius: 2, // Augmenter l'épaisseur du tube
            tessellation: 12,
            updatable: true
        }, this.scene);
        
        const rainbowMaterial = new BABYLON.StandardMaterial("rainbowMaterial", this.scene);
        const rainbowTexture = new BABYLON.ProceduralTexture("rainbowTexture", 256, "rainbowShader", this.scene);
        
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
        
        // Créer des particules d'arc-en-ciel autour du grand arc
        for (let i = 0; i < points.length; i += 3) {
            this._createColorfulParticles(points[i]);
        }
        
        this.rainbows.push(finalRainbow);
    }
    
    _createColorfulParticles(position) {
        const particleSystem = new BABYLON.ParticleSystem("rainbowParticles", 200, this.scene);
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
        particleSystem.maxSize = 0.3;
        particleSystem.minLifeTime = 1;
        particleSystem.maxLifeTime = 3;
        particleSystem.emitRate = 50;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        particleSystem.gravity = new BABYLON.Vector3(0, -0.05, 0);
        particleSystem.direction1 = new BABYLON.Vector3(-1, 1, -1);
        particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
        particleSystem.minEmitPower = 0.2;
        particleSystem.maxEmitPower = 0.6;
        
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

    // Nettoyage des ressources lors de la sortie du niveau
    cleanup() {
        // Supprimer le post-process noir et blanc s'il existe encore
        if (this.blackAndWhitePostProcess) {
            this.blackAndWhitePostProcess.dispose();
            this.blackAndWhitePostProcess = null;
        }
        
        // Restaurer tous les matériaux originaux
        this.originalMaterials.forEach((originalMaterial, meshId) => {
            const mesh = this.scene.getMeshByID(meshId);
            if (mesh) {
                mesh.material = originalMaterial;
            }
        });
        
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
        this.originalMaterials.clear();
        
        // Supprimer le message si présent
        if (this.messageElement && this.messageElement.parentNode) {
            this.messageElement.parentNode.removeChild(this.messageElement);
        }
    }

    // Méthode pour forcer la restauration complète des couleurs
    forceRestoreColors() {
        console.log("Forçage de la restauration des couleurs");
        
        // Supprimer le post-process complètement
        if (this.blackAndWhitePostProcess) {
            try {
                this.blackAndWhitePostProcess.dispose();
            } catch (e) {
                console.error("Erreur lors de la suppression du post-process:", e);
            }
            this.blackAndWhitePostProcess = null;
        }
        
        // Restaurer tous les matériaux originaux
        this.originalMaterials.forEach((originalMaterial, meshId) => {
            try {
                const mesh = this.scene.getMeshByID(meshId);
                if (mesh && !mesh.isDisposed()) {
                    mesh.material = originalMaterial;
                }
            } catch (e) {
                console.error(`Erreur lors de la restauration du matériau pour le mesh ${meshId}:`, e);
            }
        });
        
        // S'assurer que la scène est correctement mise à jour
        this.colorIntensity = 1.0;
        this.scene.render();
    }

    _checkCompletion() {
        if (this.collectedColors.length === this.colorToCollect && !this.isCompleted) {
            this.isCompleted = true;
            this._showMessage("Félicitations ! Vous avez restauré toutes les couleurs !", 5000);
            
            // Ajouter un message de transition vers le niveau 4
            setTimeout(() => {
                this._showMessage("Mais attention ! Les pizzas maléfiques arrivent...", 4000);
            }, 5000);
            
            setTimeout(() => {
                if (this.onComplete && typeof this.onComplete === 'function') {
                    this.onComplete();
                }
            }, 9000);
        }
    }
} 
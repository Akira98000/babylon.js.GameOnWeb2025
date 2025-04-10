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
        this.originalMaterials = new Map(); // Stocker les matériaux originaux
        this.blackAndWhitePostProcess = null;
        this.colorIntensity = 0; // 0 = noir et blanc, 1 = couleur complète
    }

    async init() {
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"]');
        allMessages.forEach(element => {
            if (element.id !== "storyMessage") {
                element.style.display = "none";
            }
        });
        
        // Convertir la scène en noir et blanc
        this._applyBlackAndWhiteEffect();
        
        // Stocker les matériaux originaux et les remplacer par du noir et blanc
        this._storeAndConvertMaterials();

        this._displayStoryMessage();
        this._createColorCollectibles();
    }
    
    _applyBlackAndWhiteEffect() {
        // Créer un post-process noir et blanc
        const camera = this.scene.getCameraByName("camera");
        if (camera) {
            // Créer un shader personnalisé pour l'effet noir et blanc
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
            
            // Créer le post-process avec notre shader
            this.blackAndWhitePostProcess = new BABYLON.PostProcess(
                "BlackAndWhite", 
                "blackAndWhite", 
                ["colorIntensity"], 
                null, 
                1.0, 
                camera
            );
            
            // Définir l'intensité de couleur initiale (0 = noir et blanc)
            this.blackAndWhitePostProcess.onApply = (effect) => {
                effect.setFloat("colorIntensity", this.colorIntensity);
            };
        }
    }
    
    _storeAndConvertMaterials() {
        // Parcourir tous les meshes de la scène
        this.scene.meshes.forEach(mesh => {
            if (mesh.material) {
                // Stocker le matériau original
                this.originalMaterials.set(mesh.id, mesh.material);
                
                // Ne pas convertir les orbes de couleur
                if (!mesh.name.includes("colorCollectible")) {
                    // Créer un nouveau matériau noir et blanc
                    const bwMaterial = new BABYLON.StandardMaterial(`bw_${mesh.material.name}`, this.scene);
                    
                    if (mesh.material.diffuseTexture) {
                        bwMaterial.diffuseTexture = mesh.material.diffuseTexture.clone();
                        // Appliquer un filtre noir et blanc à la texture
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
                        // Sans texture, convertir la couleur directement
                        const color = mesh.material.diffuseColor || new BABYLON.Color3(0.5, 0.5, 0.5);
                        const gray = (color.r * 0.3 + color.g * 0.59 + color.b * 0.11);
                        bwMaterial.diffuseColor = new BABYLON.Color3(gray, gray, gray);
                    }
                    
                    // Copier les autres propriétés importantes
                    bwMaterial.alpha = mesh.material.alpha;
                    bwMaterial.backFaceCulling = mesh.material.backFaceCulling;
                    
                    // Appliquer le nouveau matériau
                    mesh.material = bwMaterial;
                }
            }
        });
    }
    
    _restoreColors(intensity) {
        // Mettre à jour l'intensité des couleurs dans le post-process
        this.colorIntensity = intensity;
        
        // Restaurer partiellement les matériaux originaux en fonction de l'intensité
        this.originalMaterials.forEach((originalMaterial, meshId) => {
            const mesh = this.scene.getMeshByID(meshId);
            if (mesh && !mesh.name.includes("colorCollectible")) {
                if (intensity >= 1.0) {
                    // Restaurer complètement le matériau original
                    mesh.material = originalMaterial;
                } else {
                    // Ajuster l'intensité des couleurs dans le matériau actuel
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
            //new BABYLON.Vector3(100, 1, 100),  // Coin Nord-Est
            //new BABYLON.Vector3(-100, 1, 100), // Coin Nord-Ouest
            //new BABYLON.Vector3(-100, 1, -100), // Coin Sud-Ouest
            //new BABYLON.Vector3(100, 1, -100), // Coin Sud-Est
            //new BABYLON.Vector3(0, 1, 100),    // Nord
            //new BABYLON.Vector3(0, 1, -100)     // Sud
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
            radius: 1.5, // Augmenter l'épaisseur du tube
            tessellation: 16, // Augmenter la qualité
            updatable: true
        }, this.scene);
        
        const material = new BABYLON.StandardMaterial(`rainbowMaterial${index}`, this.scene);
        material.diffuseColor = color;
        material.emissiveColor = color.scale(0.7); // Augmenter la luminosité
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
        this.messageElement.textElement.innerHTML = "";
        this.messageElement.style.display = "flex";
        let index = 0;
        const textInterval = setInterval(() => {
            if (index < storyText.length) {
                this.messageElement.textElement.innerHTML += storyText.charAt(index);
                index++;
            } else {
                clearInterval(textInterval);
                this.messageElement.okButton.style.display = "block";
                setTimeout(() => {
                    if (this.messageElement.style.display !== "none") {
                        this._fadeOutElement(this.messageElement);
                    }
                }, 10000);
            }
        }, 50);
    }
    
    _displayCompletionMessage() {
        const completionText = "Magnifique ! Vous avez restauré les couleurs de la ville. Les arcs-en-ciel brillent de mille feux et la vie reprend son cours normal.";
        this.messageElement.textElement.innerHTML = "";
        this.messageElement.style.display = "flex";
        let index = 0;
        const textInterval = setInterval(() => {
            if (index < completionText.length) {
                this.messageElement.textElement.innerHTML += completionText.charAt(index);
                index++;
            } else {
                clearInterval(textInterval);
                this.messageElement.okButton.style.display = "block";
                
                setTimeout(() => {
                    if (this.messageElement.style.display !== "none") {
                        this._fadeOutElement(this.messageElement);
                        this.isCompleted = true;
                    }
                }, 10000);
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
                        // Restaurer complètement les couleurs
                        this._restoreColors(1.0);
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
} 
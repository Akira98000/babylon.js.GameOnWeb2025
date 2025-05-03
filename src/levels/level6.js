import { Vector3, SceneLoader, MeshBuilder, StandardMaterial, Color3, Texture, Animation, TransformNode } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";
import { loadDamagedMapForLevel6 } from "../scene/mapGestion.js";

export class Level6 {
    constructor(scene) {
        this.scene = scene;
        this.rocketParts = [];
        this.collectedParts = 0;
        this.positions = [
            new Vector3(1.5, 0.5, 1.5),
            new Vector3(-1.5, 0.5, 2),
            new Vector3(2, 0.5, -1.5),
            new Vector3(-1, 0.5, -2),
            new Vector3(2.5, 0.5, 0.5)
        ];
        this.assemblyPosition = new Vector3(7.34, 0.10, -12.16);
        this.playerCoordinatesElement = this._createCoordinatesDisplay();
        this.messageElement = this._createMessage();
        this._keyHandler = this._handleKeyDown.bind(this);
        this.isPuzzleActive = false;
        this.isPuzzleComplete = false;
        this.puzzleUI = null;
        this.puzzlePieces = [];
        this.completedRocket = null;
        this.countdownElement = null;
        this.countdownValue = 10;
        this.isCountdownActive = false;
        this.isPlayerInRocket = false;
        this.isGameOver = false;
    }

    async initialize() {
        // Charger la carte endommagée pour le niveau 6
        try {
            await loadDamagedMapForLevel6(this.scene);
            console.log("Carte endommagée chargée pour le niveau 6");
            this._showMessage("Bienvenue dans la ville détruite...", 3000);
        } catch (error) {
            console.error("Erreur lors du chargement de la carte endommagée:", error);
        }

        await this.loadRocketParts();
        this.setupInputs();
        this.createAssemblyZone();
        this.scene.onBeforeRenderObservable.add(() => {
            this._updatePlayerCoordinates();
            this._checkAssemblyZone();
        });
    }

    _createCoordinatesDisplay() {
        const element = document.createElement("div");
        element.id = "playerCoordinates";
        element.style.position = "absolute";
        element.style.bottom = "10px";
        element.style.left = "10px";
        element.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        element.style.color = "white";
        element.style.padding = "5px 10px";
        element.style.borderRadius = "5px";
        element.style.fontFamily = "Arial, sans-serif";
        element.style.fontSize = "14px";
        element.style.zIndex = "1000";
        document.body.appendChild(element);
        return element;
    }

    _createMessage() {
        const message = document.createElement("div");
        message.id = "rocketPartMessage";
        message.style.position = "absolute";
        message.style.top = "20%";
        message.style.left = "50%";
        message.style.transform = "translate(-50%, -50%)";
        message.style.color = "white";
        message.style.fontSize = "24px";
        message.style.fontFamily = "Arial, sans-serif";
        message.style.textAlign = "center";
        message.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        message.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        message.style.padding = "10px 20px";
        message.style.borderRadius = "5px";
        message.style.display = "none";
        document.body.appendChild(message);
        return message;
    }

    _updatePlayerCoordinates() {
        const playerPosition = this.scene.metadata?.player?.hero?.position;
        if (playerPosition) {
            const x = playerPosition.x.toFixed(2);
            const y = playerPosition.y.toFixed(2);
            const z = playerPosition.z.toFixed(2);
            this.playerCoordinatesElement.textContent = `Position: X: ${x}, Y: ${y}, Z: ${z}`;
        }
    }

    async loadRocketParts() {
        const result = await SceneLoader.ImportMeshAsync("", "personnage/", "rocket.glb", this.scene);
        
        for (let i = 0; i < 5; i++) {
            const rocketPart = result.meshes[0].clone(`rocketPart${i}`);
            rocketPart.position = this.positions[i];
            rocketPart.scaling = new Vector3(0.15, 0.15, 0.15);
            rocketPart.isPickable = true;
            this.rocketParts.push(rocketPart);
        }

        result.meshes[0].setEnabled(false);
    }

    setupInputs() {
        window.addEventListener("keydown", this._keyHandler);
    }

    _handleKeyDown(event) {
        if (event.key.toLowerCase() === "k") {
            console.log("Touche K pressée");
            
            if (this.isPuzzleComplete && !this.isPlayerInRocket) {
                this._tryEnterRocket();
            } else {
                this.tryCollectPart();
            }
        }
    }

    createAssemblyZone() {
        const zone = MeshBuilder.CreateBox("assemblyZone", { width: 3, height: 0.1, depth: 3 }, this.scene);
        zone.position = this.assemblyPosition;
        zone.visibility = 0.3;
        
        const material = new StandardMaterial("zoneMaterial", this.scene);
        material.diffuseColor = new Color3(0, 1, 0);
        material.alpha = 0.3;
        zone.material = material;
        
        zone.isPickable = false;
        this.assemblyZone = zone;
    }

    _checkAssemblyZone() {
        if (this.collectedParts === 5 && !this.isPuzzleComplete) {
            const playerPosition = this.scene.metadata?.player?.hero?.position;
            if (playerPosition) {
                const distance = Vector3.Distance(playerPosition, this.assemblyPosition);
                if (distance < 3) {
                    if (!this.isPuzzleActive) {
                        this._showPuzzleUI();
                    }
                } else if (this.isPuzzleActive) {
                    this._hidePuzzleUI();
                    this._showMessage("Dirigez-vous vers la zone verte pour assembler la fusée", 1000);
                }
            }
        }
    }

    _showPuzzleUI() {
        this.isPuzzleActive = true;
        const puzzleUI = document.createElement("div");
        puzzleUI.id = "puzzleUI";
        puzzleUI.style.position = "absolute";
        puzzleUI.style.top = "50%";
        puzzleUI.style.left = "50%";
        puzzleUI.style.transform = "translate(-50%, -50%)";
        puzzleUI.style.width = "800px";
        puzzleUI.style.height = "600px";
        puzzleUI.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
        puzzleUI.style.borderRadius = "10px";
        puzzleUI.style.display = "flex";
        puzzleUI.style.padding = "20px";
        puzzleUI.style.zIndex = "1000";
        
        // Créer la zone de pièces de puzzle à gauche
        const piecesContainer = document.createElement("div");
        piecesContainer.style.width = "33%";
        piecesContainer.style.marginRight = "20px";
        piecesContainer.style.overflowY = "auto";
        piecesContainer.style.display = "flex";
        piecesContainer.style.flexDirection = "column";
        piecesContainer.style.alignItems = "center";
        piecesContainer.style.gap = "10px";
        piecesContainer.style.justifyContent = "space-around";
        
        // Créer la grille du puzzle à droite
        const puzzleGrid = document.createElement("div");
        puzzleGrid.style.display = "grid";
        puzzleGrid.style.gridTemplateColumns = "repeat(3, 1fr)";
        puzzleGrid.style.gridTemplateRows = "repeat(3, 1fr)";
        puzzleGrid.style.gap = "5px";
        puzzleGrid.style.flex = "1";
        
        // Créer les emplacements du puzzle
        for (let i = 0; i < 9; i++) {
            const cell = document.createElement("div");
            cell.classList.add("puzzle-cell");
            cell.dataset.index = i;
            cell.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            cell.style.borderRadius = "5px";
            cell.style.aspectRatio = "1";
            cell.style.width = "100%";
            cell.style.display = "flex";
            cell.style.justifyContent = "center";
            cell.style.alignItems = "center";
            
            cell.addEventListener("dragover", (e) => {
                e.preventDefault();
                cell.style.backgroundColor = "rgba(0, 255, 0, 0.3)";
            });
            
            cell.addEventListener("dragleave", () => {
                cell.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
            });
            
            cell.addEventListener("drop", (e) => {
                e.preventDefault();
                const pieceId = e.dataTransfer.getData("text/plain");
                const piece = document.getElementById(pieceId);
                
                // Vérifier si la cellule est déjà occupée
                if (cell.children.length === 0) {
                    cell.appendChild(piece);
                    cell.style.backgroundColor = "rgba(255, 255, 255, 0.2)";
                    
                    // Vérifier si le puzzle est complété
                    this._checkPuzzleCompletion();
                }
            });
            
            puzzleGrid.appendChild(cell);
        }
        
        // Créer les pièces du puzzle
        for (let i = 0; i < 9; i++) {
            const piece = document.createElement("div");
            piece.id = `puzzle-piece-${i}`;
            piece.classList.add("puzzle-piece");
            piece.draggable = true;
            piece.dataset.correctPosition = i;
            
            // Découper l'image en morceaux
            piece.style.width = "95%";
            piece.style.height = "0";
            piece.style.paddingBottom = "95%";
            piece.style.position = "relative";
            piece.style.backgroundColor = "#ddd";
            piece.style.backgroundImage = "url('/image/fusee.avif')";
            
            // Calculer la position de l'image pour ce morceau
            const row = Math.floor(i / 3);
            const col = i % 3;
            piece.style.backgroundPosition = `${-col * 100}% ${-row * 100}%`;
            piece.style.backgroundSize = "300% 300%";
            piece.style.cursor = "grab";
            piece.style.borderRadius = "5px";
            piece.style.margin = "5px";
            
            piece.addEventListener("dragstart", (e) => {
                e.dataTransfer.setData("text/plain", piece.id);
                piece.style.opacity = "0.5";
            });
            
            piece.addEventListener("dragend", () => {
                piece.style.opacity = "1";
            });
            
            this.puzzlePieces.push(piece);
            piecesContainer.appendChild(piece);
        }
        
        puzzleUI.appendChild(piecesContainer);
        puzzleUI.appendChild(puzzleGrid);
        this._shufflePuzzlePieces(piecesContainer);
        
        document.body.appendChild(puzzleUI);
        this.puzzleUI = puzzleUI;
    }
    
    _shufflePuzzlePieces(container) {
        for (let i = this.puzzlePieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            container.appendChild(this.puzzlePieces[j]);
        }
    }
    
    _checkPuzzleCompletion() {
        const cells = document.querySelectorAll(".puzzle-cell");
        let isComplete = true;
        
        cells.forEach((cell, index) => {
            if (cell.children.length === 0) {
                isComplete = false;
                return;
            }
            
            const piece = cell.children[0];
            if (parseInt(piece.dataset.correctPosition) !== index) {
                isComplete = false;
            }
        });
        
        if (isComplete) {
            this._completePuzzle();
        }
    }
    
    _completePuzzle() {
        this.isPuzzleComplete = true;
        this._showMessage("Félicitations ! Vous avez assemblé la fusée !", 3000);
        
        // Charger et afficher le modèle de fusée
        SceneLoader.ImportMeshAsync("", "personnage/", "rocket.glb", this.scene).then((result) => {
            this.completedRocket = result.meshes[0];
            this.completedRocket.position = this.assemblyPosition;
            this.completedRocket.scaling = new Vector3(1.05, 1.05, 1.05);
        });

        setTimeout(() => {
            this._hidePuzzleUI();
            this._showMessage("Appuyez sur K près de la fusée pour y entrer", 3000);
        }, 3000);
    }
    
    _hidePuzzleUI() {
        if (this.puzzleUI) {
            document.body.removeChild(this.puzzleUI);
            this.puzzleUI = null;
            this.isPuzzleActive = false;
        }
    }

    tryCollectPart() {
        if (this.collectedParts >= 5) {
            this._showMessage("Dirigez-vous vers la zone verte pour assembler la fusée", 2000);
            return;
        }

        const playerPosition = this.scene.metadata?.player?.hero?.position;
        if (!playerPosition) {
            console.log("Position du héros non trouvée");
            return;
        }
        
        for (let i = 0; i < this.rocketParts.length; i++) {
            const part = this.rocketParts[i];
            if (!part.isEnabled()) continue;

            const distance = Vector3.Distance(playerPosition, part.position);
            if (distance < 3) {
                part.setEnabled(false);
                this.collectedParts++;
                this._showMessage(`Pièce de fusée collectée ! (${this.collectedParts}/5)`, 2000);
                if (this.collectedParts === 5) {
                    setTimeout(() => {
                        this._showMessage("Toutes les pièces collectées ! Dirigez-vous vers la zone verte.", 3000);
                    }, 2000);
                }
                break;
            }
        }
    }

    _showMessage(text, duration = 2000) {
        if (this.messageElement) {
            this.messageElement.textContent = text;
            this.messageElement.style.display = "block";
            setTimeout(() => {
                this.messageElement.style.display = "none";
            }, duration);
        }
    }

    _tryEnterRocket() {
        const playerPosition = this.scene.metadata?.player?.hero?.position;
        if (!playerPosition) return;

        const distance = Vector3.Distance(playerPosition, this.assemblyPosition);
        if (distance < 3 && this.completedRocket) {
            this.isPlayerInRocket = true;
            
            // Cacher le joueur
            if (this.scene.metadata?.player?.hero) {
                this.scene.metadata.player.hero.setEnabled(false);
            }
            
            // Configurer la caméra pour voir la fusée de loin
            const camera = this.scene.activeCamera;
            if (camera) {
                // Détacher la caméra de son parent actuel si elle en a un
                if (camera.parent) {
                    camera.parent = null;
                }
                
                // Créer un noeud parent pour la caméra à distance de la fusée
                const cameraParent = new TransformNode("cameraParent", this.scene);
                // Positionner la caméra à distance, sur le côté et un peu en hauteur
                cameraParent.position = new Vector3(-15, 3, -15);
                cameraParent.parent = this.completedRocket;
                
                // Attacher la caméra au noeud parent
                camera.parent = cameraParent;
                camera.setTarget(this.completedRocket.position);
                
                // Désactiver les contrôles de la caméra
                if (camera.inputs) {
                    camera.inputs.clear();
                }
            }
            
            // Créer et démarrer le compte à rebours
            this._createCountdown();
            this._startCountdown();
        }
    }
    
    _createCountdown() {
        this.countdownElement = document.createElement("div");
        this.countdownElement.id = "rocketCountdown";
        this.countdownElement.style.position = "absolute";
        this.countdownElement.style.top = "50%";
        this.countdownElement.style.left = "50%";
        this.countdownElement.style.transform = "translate(-50%, -50%)";
        this.countdownElement.style.color = "white";
        this.countdownElement.style.fontSize = "72px";
        this.countdownElement.style.fontFamily = "Arial, sans-serif";
        this.countdownElement.style.textAlign = "center";
        this.countdownElement.style.textShadow = "2px 2px 4px rgba(0,0,0,0.7)";
        this.countdownElement.style.zIndex = "1000";
        document.body.appendChild(this.countdownElement);
    }
    
    _startCountdown() {
        this.isCountdownActive = true;
        this.countdownValue = 10;
        this.countdownElement.textContent = this.countdownValue;
        const camera = this.scene.activeCamera;
        const initialY = camera.parent ? camera.parent.position.y : 0;
        
        if (camera && camera.parent) {
            const cameraRotation = new Animation(
                "cameraRotation",
                "rotation.y",
                10,  
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CYCLE
            );
            
            const rotationKeyFrames = [
                { frame: 0, value: 0 },
                { frame: 100, value:0 }  // 2π = 360°
            ];
            
            cameraRotation.setKeys(rotationKeyFrames);
            camera.parent.animations = [cameraRotation];
            camera.parent.position.y += 3;
            
            // Démarrer l'animation de rotation
            this.scene.beginAnimation(camera.parent, 0, 100, true);  // true = boucle
        }
        
        const countdownInterval = setInterval(() => {
            this.countdownValue--;
            this.countdownElement.textContent = this.countdownValue;
            
            if (this.countdownValue <= 0) {
                clearInterval(countdownInterval);
                this.isCountdownActive = false;
                
                // Arrêter l'animation panoramique mais garder la caméra attachée à la fusée
                if (camera && camera.parent) {
                    this.scene.stopAnimation(camera.parent);
                    
                    // Garder la rotation à 0 mais conserver l'élévation pour une meilleure vue
                    camera.parent.rotation.y = 0;
                    // Ne pas ramener la caméra à sa position initiale - on garde l'élévation
                }
                
                this._launchRocket();
            }
        }, 1000);
    }
    
    _launchRocket() {
        // Supprimer l'élément de compte à rebours
        if (this.countdownElement && this.countdownElement.parentNode) {
            this.countdownElement.parentNode.removeChild(this.countdownElement);
            this.countdownElement = null;
        }
        this._showMessage("Décollage !", 3000);
        if (this.completedRocket) {
            const frameRate = 30;
            const rocketAnimation = new Animation(
                "rocketLaunch",
                "position.y",
                frameRate,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            
            const keyFrames = [
                { frame: 0, value: this.completedRocket.position.y },
                { frame: frameRate * 4, value: this.completedRocket.position.y + 30 }
            ];
            
            rocketAnimation.setKeys(keyFrames);
            this.completedRocket.animations = [rocketAnimation];
            
            // La caméra est déjà attachée à la fusée et positionnée pour voir la fusée au loin
            // Elle va naturellement suivre la fusée pendant le décollage
            const camera = this.scene.activeCamera;
            if (camera && camera.parent) {
                // Ajouter une légère rotation de la caméra pour plus de dynamisme pendant le décollage
                const cameraRotation = new Animation(
                    "cameraRotation",
                    "position.x",
                    frameRate,
                    Animation.ANIMATIONTYPE_FLOAT,
                    Animation.ANIMATIONLOOPMODE_CONSTANT
                );
                
                const rotationKeyFrames = [
                    { frame: 0, value: camera.parent.position.x },
                    { frame: frameRate * 4, value: camera.parent.position.x + 5 }
                ];
                
                cameraRotation.setKeys(rotationKeyFrames);
                camera.parent.animations = [cameraRotation];
                
                // Lancer l'animation de la caméra
                this.scene.beginAnimation(camera.parent, 0, frameRate * 4, false);
            }
            
            // Lancer l'animation
            this.scene.beginAnimation(this.completedRocket, 0, frameRate * 4, false, 1, () => {
                // Animation terminée, fin du jeu
                this.isGameOver = true;
                setTimeout(() => {
                    this._endGame();
                }, 1000);
            });
        }
    }

    _endGame() {
        // Créer l'écran de fin
        const endScreen = document.createElement("div");
        endScreen.style.position = "fixed";
        endScreen.style.top = "0";
        endScreen.style.left = "0";
        endScreen.style.width = "100%";
        endScreen.style.height = "100%";
        endScreen.style.backgroundColor = "black";
        endScreen.style.display = "flex";
        endScreen.style.flexDirection = "column";
        endScreen.style.justifyContent = "center";
        endScreen.style.alignItems = "center";
        endScreen.style.color = "white";
        endScreen.style.fontFamily = "Arial, sans-serif";
        endScreen.style.zIndex = "1000";

        // Ajouter le titre
        const title = document.createElement("h1");
        title.textContent = "Mission Accomplie !";
        title.style.fontSize = "48px";
        title.style.marginBottom = "20px";
        endScreen.appendChild(title);

        // Ajouter le message
        const message = document.createElement("p");
        message.textContent = "Vous avez réussi à assembler et lancer la fusée avec succès !";
        message.style.fontSize = "24px";
        message.style.textAlign = "center";
        endScreen.appendChild(message);

        // Ajouter le score ou le temps (si vous en avez)
        const stats = document.createElement("p");
        stats.textContent = "Félicitations pour avoir terminé le jeu par la team BabyGame !";
        stats.style.fontSize = "20px";
        endScreen.appendChild(stats);

        // Ajouter l'écran de fin au document
        document.body.appendChild(endScreen);

        // Nettoyer la scène Babylon.js
        if (this.scene) {
            this.scene.dispose();
        }

        // Supprimer le canvas de Babylon.js
        const canvas = document.getElementById("renderCanvas");
        if (canvas) {
            canvas.remove();
        }

        // Nettoyer tous les éléments UI restants
        if (this.playerCoordinatesElement && this.playerCoordinatesElement.parentNode) {
            this.playerCoordinatesElement.parentNode.removeChild(this.playerCoordinatesElement);
        }
        if (this.messageElement && this.messageElement.parentNode) {
            this.messageElement.parentNode.removeChild(this.messageElement);
        }
        if (this.puzzleUI && this.puzzleUI.parentNode) {
            this.puzzleUI.parentNode.removeChild(this.puzzleUI);
        }
    }

    checkProximity(playerPosition) {
        if (!playerPosition) {
            return false;
        }

        // Vérifier la proximité avec les pièces de fusée
        for (let i = 0; i < this.rocketParts.length; i++) {
            const part = this.rocketParts[i];
            if (!part.isEnabled()) continue;

            const distance = Vector3.Distance(playerPosition, part.position);
            
            if (distance < 3) {
                this._showMessage("Appuyez sur K pour collecter la pièce de fusée", 1000);
                return true;
            }
        }
        
        // Vérifier la proximité avec la fusée assemblée
        if (this.isPuzzleComplete && this.completedRocket && !this.isPlayerInRocket) {
            const distance = Vector3.Distance(playerPosition, this.assemblyPosition);
            if (distance < 3) {
                this._showMessage("Appuyez sur K pour entrer dans la fusée", 1000);
                return true;
            }
        }
        
        return false;
    }

    dispose() {
        for (const part of this.rocketParts) {
            if (part) {
                part.dispose();
            }
        }
        
        if (this.completedRocket) {
            this.completedRocket.dispose();
        }

        if (this.assemblyZone) {
            this.assemblyZone.dispose();
        }

        if (this.playerCoordinatesElement && this.playerCoordinatesElement.parentNode) {
            this.playerCoordinatesElement.parentNode.removeChild(this.playerCoordinatesElement);
        }

        if (this.messageElement && this.messageElement.parentNode) {
            this.messageElement.parentNode.removeChild(this.messageElement);
        }
        
        if (this.puzzleUI && this.puzzleUI.parentNode) {
            this.puzzleUI.parentNode.removeChild(this.puzzleUI);
        }
        
        if (this.countdownElement && this.countdownElement.parentNode) {
            this.countdownElement.parentNode.removeChild(this.countdownElement);
        }

        window.removeEventListener("keydown", this._keyHandler);
    }
} 
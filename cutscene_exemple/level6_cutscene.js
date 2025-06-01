/*
VOICI UN EXEMPLE DE CINÉMATIQUE
Ceci est simplement un exemple de la manière dont nous créons une cinématique dans notre projet.

Tous les niveaux de cinématiques sont construits selon cette architecture.
Vous pouvez consulter l'exemple du niveau 6 pour voir comment les scènes sont séquencées.

Enfin, nous enregistrons simplement la cinématique et l'intégrons dans le jeu.
Mais toutes les cinématiques sont réalisées avec BabylonJS et non avec Blender.
*/

/*import { Vector3, SceneLoader, MeshBuilder, StandardMaterial, Color3, Texture, Animation, TransformNode, ArcRotateCamera, Path3D, Quaternion, Space } from "@babylonjs/core";
import "@babylonjs/loaders/glTF";

export class Level6_cutscene {
    constructor(scene) {
        this.scene = scene;
        this.characters = [];
        this.characterModels = ["pnj1.glb", "pnj2.glb", "pnj3.glb"];
        this.queen = null;
        this.unicorn = null;
        this.cameraAnimation = null;
        this.isAnimationComplete = false;
        this.frameRate = 30;
        this.onComplete = null;
    }

    async initialize() {
        // Créer une nouvelle caméra dédiée à cette séquence
        this.createCamera();
        
        // Charger les modèles
        await this.loadModels();
        
        // Démarrer la séquence d'animation
        this.startCutscene();
        
        // Observer la fin de l'animation
        this.scene.onBeforeRenderObservable.add(() => {
            this._checkAnimationStatus();
        });
    }

    // Méthode d'initialisation alternative pour maintenir la compatibilité
    async init() {
        return this.initialize();
    }

    createCamera() {
        // Désactiver la caméra existante si elle existe
        if (this.scene.activeCamera) {
            this.scene.activeCamera.detachControl();
        }
        
        // Définir la couleur du ciel en bleu foncé
        this.scene.clearColor = new Color3(0.05, 0.05, 0.15); // Bleu foncé
        
        // Créer une nouvelle caméra pour la séquence
        this.camera = new ArcRotateCamera("cutsceneCamera", -Math.PI / 2, Math.PI / 3, 10, new Vector3(0, 0, 0), this.scene);
        this.scene.activeCamera = this.camera;
        
        // Désactiver les contrôles utilisateur
        this.camera.inputs.clear();
    }

    async loadModels() {
        try {
            // Position centrale du groupe
            const groupCenter = new Vector3(8.60, 0.10, 16.80);

            // Chargement de la reine
            const queenResult = await SceneLoader.ImportMeshAsync("", "personnage/", "queen.glb", this.scene);
            this.queen = queenResult.meshes[0];
            this.queen.position = groupCenter.clone(); // La reine est au centre du groupe
            this.queen.rotation = new Vector3(0, 0, 0); // Rotation à 180° (face à l'opposé de la caméra)
            this.queen.scaling = new Vector3(0.4, 0.4, 0.4);
            
            // Chargement de la licorne
            const unicornResult = await SceneLoader.ImportMeshAsync("", "personnage/", "licorn.glb", this.scene);
            this.unicorn = unicornResult.meshes[0];
            // Position de la licorne relative au centre du groupe
            this.unicorn.position = groupCenter.add(new Vector3(0, 0, 1.5)); // 1.5 mètres devant la reine
            this.unicorn.rotation = new Vector3(0, Math.PI, 0); // Rotation à 180° (face à la reine)
            this.unicorn.scaling = new Vector3(0.4, 0.4, 0.4);
            
            // Chargement et positionnement aléatoire des PNJ en demi-cercle derrière la reine
            for (let i = 0; i < 10; i++) {
                // Sélection aléatoire du modèle
                const modelIndex = Math.floor(Math.random() * this.characterModels.length);
                const modelName = this.characterModels[modelIndex];
                
                // Position en demi-cercle derrière la reine (z négatif)
                const angle = (Math.PI / 2) + (Math.random() * Math.PI); // Demi-cercle derrière (π/2 à 3π/2)
                const distance = 2 + Math.random() * 3; // Entre 2 et 5 mètres de distance
                const x = Math.cos(angle) * distance;
                const z = Math.sin(angle) * distance; // Les valeurs seront négatives car sin(π/2 à 3π/2) est négatif
                
                const result = await SceneLoader.ImportMeshAsync("", "personnage/", modelName, this.scene);
                const character = result.meshes[0];
                // Position relative au centre du groupe
                character.position = groupCenter.add(new Vector3(x, 0, z));
                character.scaling = new Vector3(0.4, 0.4, 0.4);
                
                // Orientation des PNJ vers la reine
                const directionToQueen = groupCenter.subtract(character.position);
                const angle2 = Math.atan2(directionToQueen.x, directionToQueen.z);
                character.rotation = new Vector3(0, angle2, 0);
                
                this.characters.push(character);
            }
            
            // Jouer l'animation de victoire pour tous les personnages
            this._playAnimation("victory", [this.queen, ...this.characters]);
            
        } catch (error) {
            console.error("Erreur lors du chargement des modèles:", error);
        }
    }

    startCutscene() {
        // Préparation du chemin de la caméra
        this._setupCameraAnimation();
        
        // Démarrer l'animation de la caméra
        this.scene.beginAnimation(this.camera, 0, this.frameRate * 10, false, 0.5, () => {
            // Une fois que la caméra a terminé son trajet initial, faire tourner la reine vers la licorne
            this._rotateQueenToUnicorn(() => {
                // Animation de remerciement après la rotation
                this._playQueenThankAnimation();
                
                // Marquer l'animation comme terminée
                setTimeout(() => {
                    this.isAnimationComplete = true;
                    if (this.onComplete && typeof this.onComplete === 'function') {
                        this.onComplete();
                    }
                }, 5000); // 5 secondes après le remerciement
            });
        });
    }

    _setupCameraAnimation() {
        // Position centrale du groupe pour la caméra
        const groupCenter = new Vector3(8.60, 0.10, 16.80);
        
        // Définir le chemin de la caméra pour une vue panoramique
        const cameraPath = [
            groupCenter.add(new Vector3(-10, 5, 10)), // Vue d'ensemble du groupe depuis l'avant
            groupCenter.add(new Vector3(-8, 4, -8)), // Vue arrière pour montrer les PNJ derrière la reine
            groupCenter.add(new Vector3(0, 6, -12)), // Vue élevée montrant la disposition en demi-cercle
            groupCenter.add(new Vector3(8, 4, -8)), // Vue de côté
            groupCenter.add(new Vector3(8, 3, 5)), // Vue de face montrant la reine et la licorne
            groupCenter.add(new Vector3(3, 1.8, 1.5)) // Plan rapproché sur la reine et la licorne
        ];
        
        // Créer un chemin 3D
        const path3d = new Path3D(cameraPath);
        const tangents = path3d.getTangents();
        
        // Animation pour la position de la caméra
        const positionAnimation = new Animation(
            "cameraPosition",
            "position",
            this.frameRate,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Animation pour le target de la caméra
        const targetAnimation = new Animation(
            "cameraTarget",
            "target",
            this.frameRate,
            Animation.ANIMATIONTYPE_VECTOR3,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        // Calculer les keyframes pour la position
        const positionKeys = [];
        const targetKeys = [];
        
        cameraPath.forEach((position, index) => {
            // Position key
            positionKeys.push({
                frame: index * this.frameRate * 2, // 2 secondes par position
                value: position
            });
            
            // Target key - varie selon la position de la caméra
            if (index < 3) {
                // Premières positions: focus sur la reine
                targetKeys.push({
                    frame: index * this.frameRate * 2,
                    value: groupCenter.add(new Vector3(0, 1, 0)) // Position de la reine légèrement surélevée
                });
            } else {
                // Dernières positions: focus sur l'interaction reine-licorne
                targetKeys.push({
                    frame: index * this.frameRate * 2,
                    value: groupCenter.add(new Vector3(0, 1, 0.75)) // Point entre la reine et la licorne (ajusté pour la nouvelle distance)
                });
            }
        });
        
        // Définir les keyframes des animations
        positionAnimation.setKeys(positionKeys);
        targetAnimation.setKeys(targetKeys);
        
        // Appliquer les animations à la caméra
        this.camera.animations = [positionAnimation, targetAnimation];
    }

    _rotateQueenToUnicorn(callback) {
        // Animation pour tourner la reine vers la licorne
        const rotationAnimation = new Animation(
            "queenRotation",
            "rotation.y",
            this.frameRate,
                Animation.ANIMATIONTYPE_FLOAT,
                Animation.ANIMATIONLOOPMODE_CONSTANT
            );
            
        const rotationKeys = [
            { frame: 0, value: Math.PI }, // Position initiale (face à la caméra)
            { frame: this.frameRate * 2, value: 0 } // Position finale (face à la licorne)
        ];
        
        rotationAnimation.setKeys(rotationKeys);
        this.queen.animations = [rotationAnimation];
        
        // Lancer l'animation de rotation
        this.scene.beginAnimation(this.queen, 0, this.frameRate * 2, false, 1, callback);
    }

    _playQueenThankAnimation() {
        // Jouer l'animation de remerciement pour la reine
        // Cette méthode assume que l'animation "thank" existe dans le modèle
        // Sinon, on pourrait créer une animation personnalisée pour lever les bras
        this._playAnimation("thank", [this.queen]);
    }

    _playAnimation(animationName, meshes) {
        // Cette fonction joue une animation spécifique sur un ensemble de meshes
        // Comme il s'agit d'une simulation, nous supposons que l'animation existe
        meshes.forEach(mesh => {
            if (mesh.skeleton) {
                mesh.skeleton.beginAnimation(animationName, true, 1.0);
            }
        });
    }

    _checkAnimationStatus() {
        // Vérifier si l'animation est terminée pour effectuer des actions de nettoyage
        if (this.isAnimationComplete) {
            // Si nécessaire, des actions de nettoyage peuvent être effectuées ici
        }
    }

    dispose() {
        // Nettoyer les ressources
        if (this.queen) {
            this.queen.dispose();
        }
        
        if (this.unicorn) {
            this.unicorn.dispose();
        }
        
        this.characters.forEach(character => {
            if (character) {
                character.dispose();
            }
        });
        
        // Arrêter les observations
        this.scene.onBeforeRenderObservable.clear();
    }
} 
*/

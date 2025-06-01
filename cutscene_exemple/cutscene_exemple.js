/*
VOICI UN EXEMPLE DE CINÉMATIQUE
Ceci est simplement un exemple de la manière dont nous créons une cinématique dans notre projet.

Tous les niveaux de cinématiques sont construits selon cette architecture.
Vous pouvez consulter l'exemple du niveau 6 pour voir comment les scènes sont séquencées.

Enfin, nous enregistrons simplement la cinématique et l'intégrons dans le jeu.
Mais toutes les cinématiques sont réalisées avec BabylonJS et non avec Blender.
*/

/*import * as BABYLON from '@babylonjs/core';

export class CutScene_exemple {
    constructor(scene, title, duration = 3000) {
        this.scene = scene;
        this.title = title;
        this.duration = duration;
        this.onComplete = null;
        this.overlayElement = null;
    }
    
    async init() {
        return new Promise((resolve) => {
            // Créer un élément div pour l'overlay noir
            this.overlayElement = document.createElement("div");
            this.overlayElement.id = "cutSceneOverlay";
            Object.assign(this.overlayElement.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "black",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "2000",
                opacity: "0",
                transition: "opacity 0.5s ease-in-out"
            });
            
            // Créer un élément pour le titre
            const titleElement = document.createElement("h1");
            titleElement.textContent = this.title;
            Object.assign(titleElement.style, {
                color: "white",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: "5rem",
                textAlign: "center",
                opacity: "0",
                transform: "translateY(20px)",
                transition: "opacity 1s ease-in-out, transform 1s ease-in-out"
            });
            
            this.overlayElement.appendChild(titleElement);
            document.body.appendChild(this.overlayElement);
            
            // Animer l'apparition
            setTimeout(() => {
                this.overlayElement.style.opacity = "1";
                
                setTimeout(() => {
                    titleElement.style.opacity = "1";
                    titleElement.style.transform = "translateY(0)";
                    
                    // Planifier la disparition après la durée spécifiée
                    setTimeout(() => {
                        titleElement.style.opacity = "0";
                        titleElement.style.transform = "translateY(-20px)";
                        
                        setTimeout(() => {
                            this.overlayElement.style.opacity = "0";
                            
                            setTimeout(() => {
                                // Supprimer l'élément du DOM
                                if (this.overlayElement.parentNode) {
                                    this.overlayElement.parentNode.removeChild(this.overlayElement);
                                }
                                this.overlayElement = null;
                                
                                // Appeler la fonction de callback si elle existe
                                if (this.onComplete && typeof this.onComplete === 'function') {
                                    this.onComplete();
                                }
                                
                                resolve();
                            }, 500);
                        }, 1000);
                    }, this.duration);
                }, 500);
            }, 100);
        });
    }
    
    cleanup() {
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
    }
}*/
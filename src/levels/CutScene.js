import * as BABYLON from '@babylonjs/core';

export class CutScene {
    constructor(scene, title, duration = 3000, sceneNumber = 1) {
        this.scene = scene;
        this.title = title;
        this.duration = duration;
        this.sceneNumber = sceneNumber;
        this.onComplete = null;
        this.overlayElement = null;
        this.videoElement = null;
        this.topLetterbox = null;
        this.bottomLetterbox = null;
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
            
            // Pour le niveau tutoriel (niveau 0), on saute la vidéo
            if (this.sceneNumber === 0) {
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
                            
                            // Faire disparaître l'overlay
                            this.overlayElement.style.opacity = "0";
                            
                            // Supprimer l'overlay
                            setTimeout(() => {
                                if (this.overlayElement && this.overlayElement.parentNode) {
                                    this.overlayElement.parentNode.removeChild(this.overlayElement);
                                }
                                this.overlayElement = null;
                                
                                if (this.onComplete && typeof this.onComplete === 'function') {
                                    this.onComplete();
                                }
                                resolve();
                            }, 500);
                        }, this.duration);
                    }, 500);
                }, 100);
            } else {
                // Pour les autres niveaux, préchargement de la vidéo pendant que le titre est affiché
                this._preloadVideo();
                
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
                            
                            // Lancer immédiatement la vidéo et faire disparaître l'overlay simultanément
                            this.overlayElement.style.opacity = "0";
                            
                            // Supprimer l'overlay et démarrer la vidéo instantanément
                            if (this.overlayElement.parentNode) {
                                this.overlayElement.parentNode.removeChild(this.overlayElement);
                            }
                            this.overlayElement = null;
                            
                            // Lancer la vidéo immédiatement
                            this.playVideo().then(() => {
                                if (this.onComplete && typeof this.onComplete === 'function') {
                                    this.onComplete();
                                }
                                resolve();
                            });
                        }, this.duration);
                    }, 500);
                }, 100);
            }
        });
    }
    
    _preloadVideo() {
        const preloadVideo = document.createElement("video");
        preloadVideo.src = `scene/scene${this.sceneNumber}.mov`;
        preloadVideo.style.display = "none";
        preloadVideo.preload = "auto";
        document.body.appendChild(preloadVideo);

        preloadVideo.onloadeddata = () => {
            if (preloadVideo.parentNode) {
                preloadVideo.parentNode.removeChild(preloadVideo);
            }
        };
        
        preloadVideo.onerror = () => {
            console.warn(`Impossible de précharger la vidéo pour le niveau ${this.sceneNumber}`);
            if (preloadVideo.parentNode) {
                preloadVideo.parentNode.removeChild(preloadVideo);
            }
        };
    }
    
    async playVideo() {
        return new Promise((resolve) => {
            const videoContainer = document.createElement("div");
            videoContainer.id = "videoContainer";
            Object.assign(videoContainer.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "black",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: "1900",
                overflow: "hidden"
            });
            
            this.videoElement = document.createElement("video");
            this.videoElement.src = `scene/scene${this.sceneNumber}.mov`;
            this.videoElement.muted = false;
            this.videoElement.controls = false;
            
            this.videoElement.onerror = () => {
                console.warn(`Erreur lors de la lecture de la vidéo pour le niveau ${this.sceneNumber}`);
                this.cleanup();
                resolve();
            };
            
            Object.assign(this.videoElement.style, {
                width: "100%",
                height: "auto",
                maxHeight: "100%",
                opacity: "0",
                transition: "opacity 0.3s ease-in-out"
            });
            
            this.topLetterbox = document.createElement("div");
            this.bottomLetterbox = document.createElement("div");
            
            const letterboxCommonStyle = {
                position: "absolute",
                left: "0",
                width: "100%",
                backgroundColor: "black",
                height: "0",
                transition: "height 0.7s ease-in-out",
                zIndex: "1950"
            };
            
            Object.assign(this.topLetterbox.style, {
                ...letterboxCommonStyle,
                top: "0"
            });
            
            Object.assign(this.bottomLetterbox.style, {
                ...letterboxCommonStyle,
                bottom: "0"
            });
            
            videoContainer.appendChild(this.videoElement);
            document.body.appendChild(videoContainer);
            document.body.appendChild(this.topLetterbox);
            document.body.appendChild(this.bottomLetterbox);
            
            const letterboxHeight = "15%"; 
            this.topLetterbox.style.height = letterboxHeight;
            this.bottomLetterbox.style.height = letterboxHeight;
            
            requestAnimationFrame(() => {
                this.videoElement.style.opacity = "1";
                this.videoElement.play()
                    .catch(error => {
                        console.warn(`Erreur de lecture de la vidéo pour le niveau ${this.sceneNumber}:`, error);
                        this.cleanup();
                        resolve();
                    });
                
                // Événement de fin de vidéo
                this.videoElement.onended = () => {
                    // Faire disparaître la vidéo
                    this.videoElement.style.opacity = "0";
                    
                    // Faire disparaître les bandes letterbox
                    this.topLetterbox.style.height = "0";
                    this.bottomLetterbox.style.height = "0";
                    
                    // Nettoyer après la transition
                    setTimeout(() => {
                        this.cleanup();
                        resolve();
                    }, 700);
                };
            });
        });
    }
    
    cleanup() {
        // Supprimer tous les éléments du DOM
        if (this.overlayElement && this.overlayElement.parentNode) {
            this.overlayElement.parentNode.removeChild(this.overlayElement);
        }
        
        if (this.videoElement && this.videoElement.parentNode) {
            const videoContainer = this.videoElement.parentNode;
            if (videoContainer.parentNode) {
                videoContainer.parentNode.removeChild(videoContainer);
            }
        }
        
        if (this.topLetterbox && this.topLetterbox.parentNode) {
            this.topLetterbox.parentNode.removeChild(this.topLetterbox);
        }
        
        if (this.bottomLetterbox && this.bottomLetterbox.parentNode) {
            this.bottomLetterbox.parentNode.removeChild(this.bottomLetterbox);
        }
    }
} 
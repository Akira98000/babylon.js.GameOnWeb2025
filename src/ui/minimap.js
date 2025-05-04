import * as BABYLON from '@babylonjs/core';

export function setupMinimap(scene, player) {
    // Créer le conteneur principal de la minimap
    const minimapContainer = document.createElement("div");
    Object.assign(minimapContainer.style, {
        position: "absolute",
        top: "70px",  
        left: "15px",
        width: "150px",
        height: "150px",
        borderRadius: "50%",
        overflow: "hidden",
        border: "2px solid rgba(255, 255, 255, 0.3)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
        transition: "all 0.3s ease",
        zIndex: "998"
    });

    const mapImageContainer = document.createElement("div");
    Object.assign(mapImageContainer.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        backgroundImage: "url('/image/map_game.png')",
        backgroundSize: "400%", 
        backgroundPosition: "center",
        filter: "brightness(0.8)",
        transition: "all 0.3s ease"
    });
    minimapContainer.appendChild(mapImageContainer);

    // Indicateur de position du joueur
    const playerIndicator = document.createElement("div");
    Object.assign(playerIndicator.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "20px",
        height: "20px",
        backgroundImage: "url('/image/gameIcon.png')",
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        transform: "translate(-50%, -50%) rotate(0deg)",
        zIndex: "2",
        transition: "transform 0.2s ease"
    });
    minimapContainer.appendChild(playerIndicator);

    // Overlay pour l'effet de radar
    const radarOverlay = document.createElement("div");
    radarOverlay.className = "radar-sweep";
    Object.assign(radarOverlay.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "radial-gradient(circle, rgba(0,200,0,0.1) 0%, rgba(0,200,0,0.2) 70%, rgba(0,150,0,0.3) 100%)",
        borderRadius: "50%",
        pointerEvents: "none"
    });
    minimapContainer.appendChild(radarOverlay);

    // Bordure circulaire de la minimap
    const minimapBorder = document.createElement("div");
    minimapBorder.className = "minimap-border";
    Object.assign(minimapBorder.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        borderRadius: "50%",
        pointerEvents: "none",
        zIndex: "3"
    });
    minimapContainer.appendChild(minimapBorder);
    
    // Étiquette de la minimap
    const minimapLabel = document.createElement("div");
    Object.assign(minimapLabel.style, {
        position: "absolute",
        bottom: "-25px",
        left: "50%",
        transform: "translateX(-50%)",
        color: "rgba(255, 255, 255, 0.8)",
        fontSize: "12px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        whiteSpace: "nowrap",
        textShadow: "0 0 2px rgba(0, 0, 0, 0.8)"
    });
    minimapLabel.textContent = "Appuyez sur M pour agrandir";
    minimapContainer.appendChild(minimapLabel);

    document.body.appendChild(minimapContainer);

    // Mode agrandi
    let isExpanded = false;

    // Fonction pour basculer entre le mode minimap et carte complète
    const toggleExpandedMap = () => {
        isExpanded = !isExpanded;

        if (isExpanded) {
            // Mode carte complète
            Object.assign(minimapContainer.style, {
                top: "50%",
                left: "50%",
                width: "80%",
                height: "80%",
                transform: "translate(-50%, -50%)",
                borderRadius: "10px",
                zIndex: "1001"
            });

            Object.assign(mapImageContainer.style, {
                backgroundSize: "contain",
                backgroundPosition: "center"
            });
            
            // Masquer l'étiquette en mode agrandi
            minimapLabel.style.display = "none";

            // Ajouter un bouton de fermeture
            if (!minimapContainer.querySelector('.close-button')) {
                const closeButton = document.createElement("div");
                closeButton.className = "close-button";
                Object.assign(closeButton.style, {
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "30px",
                    height: "30px",
                    backgroundColor: "rgba(0, 0, 0, 0.7)",
                    borderRadius: "50%",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    cursor: "pointer",
                    zIndex: "5"
                });
                closeButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>`;
                closeButton.addEventListener("click", (e) => {
                    e.stopPropagation();
                    toggleExpandedMap();
                });
                minimapContainer.appendChild(closeButton);
            }

            // Fond semi-transparent pour bloquer les interactions avec le jeu
            const mapOverlay = document.createElement("div");
            mapOverlay.className = "map-overlay";
            Object.assign(mapOverlay.style, {
                position: "fixed",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                zIndex: "1000"
            });
            document.body.appendChild(mapOverlay);

            // Légende de la carte
            const mapLegend = document.createElement("div");
            mapLegend.className = "map-legend";
            Object.assign(mapLegend.style, {
                position: "absolute",
                bottom: "20px",
                left: "20px",
                color: "white",
                padding: "10px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: "5px",
                zIndex: "5",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: "14px"
            });
            mapLegend.innerHTML = `
                <div style="display: flex; align-items: center; margin-bottom: 5px;">
                    <div style="width: 20px; height: 20px; background-image: url('/image/gameIcon.png'); background-size: contain; margin-right: 10px;"></div>
                    <span>Votre position</span>
                </div>
                <div style="margin-top: 10px; font-size: 12px; opacity: 0.8;">
                    Appuyez sur <strong>M</strong> ou cliquez sur <strong>✕</strong> pour fermer
                </div>
            `;
            minimapContainer.appendChild(mapLegend);

            // Titre de la carte
            const mapTitle = document.createElement("div");
            mapTitle.className = "map-title";
            Object.assign(mapTitle.style, {
                position: "absolute",
                top: "10px",
                left: "50%",
                transform: "translateX(-50%)",
                color: "white",
                padding: "5px 15px",
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                borderRadius: "15px",
                zIndex: "5",
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: "16px",
                fontWeight: "bold"
            });
            mapTitle.textContent = "CARTE DE LA VILLE";
            minimapContainer.appendChild(mapTitle);

            // Désactiver la rotation du joueur en mode carte
            playerIndicator.style.transform = "translate(-50%, -50%)";
            
            // Mettre en pause les contrôles du jeu
            if (scene.metadata && scene.metadata.controls) {
                minimapContainer.previousControlsEnabled = scene.metadata.controls.enabled;
                scene.metadata.controls.enabled = false;
            }

        } else {
            // Retour au mode minimap
            Object.assign(minimapContainer.style, {
                top: "70px",
                left: "15px",
                width: "150px",
                height: "150px",
                transform: "none",
                borderRadius: "50%",
                zIndex: "998"
            });

            Object.assign(mapImageContainer.style, {
                backgroundSize: "400%",
                backgroundPosition: "center"
            });
            
            // Afficher à nouveau l'étiquette
            minimapLabel.style.display = "block";

            // Supprimer le bouton de fermeture
            const closeButton = minimapContainer.querySelector('.close-button');
            if (closeButton) {
                minimapContainer.removeChild(closeButton);
            }

            // Supprimer l'overlay
            const mapOverlay = document.querySelector('.map-overlay');
            if (mapOverlay) {
                document.body.removeChild(mapOverlay);
            }

            // Supprimer la légende
            const mapLegend = minimapContainer.querySelector('.map-legend');
            if (mapLegend) {
                minimapContainer.removeChild(mapLegend);
            }

            // Supprimer le titre
            const mapTitle = minimapContainer.querySelector('.map-title');
            if (mapTitle) {
                minimapContainer.removeChild(mapTitle);
            }

            // Réactiver les contrôles du jeu
            if (scene.metadata && scene.metadata.controls && minimapContainer.previousControlsEnabled !== undefined) {
                scene.metadata.controls.enabled = minimapContainer.previousControlsEnabled;
            }
        }
    };

    // Cliquer sur la minimap pour l'agrandir
    minimapContainer.addEventListener("click", () => {
        if (!isExpanded) {
            toggleExpandedMap();
        }
    });

    // Écouteur d'événement pour la touche 'M'
    const handleKeyDown = (event) => {
        if (event.key.toLowerCase() === 'm') {
            toggleExpandedMap();
        }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Mettre à jour la position et rotation sur la minimap
    const updateMinimap = (playerPosition, playerRotation) => {
        // Calculer la position sur la minimap
        const mapSize = { width: 180, height: 180 }; // Taille totale supposée de la carte du jeu
        const mapCenter = { x: 0, y: 0 }; // Centre de la carte du jeu
        
        // Normaliser la position du joueur par rapport aux limites de la carte
        const normalizedX = (playerPosition.x - mapCenter.x) / mapSize.width;
        const normalizedZ = (playerPosition.z - mapCenter.z) / mapSize.height;
        
        // Déplacer l'arrière-plan de la minimap en fonction de la position normalisée
        // (inversion de la position pour le déplacement de l'arrière-plan)
        const backgroundPosX = 50 - normalizedX * 100;
        const backgroundPosY = 50 + normalizedZ * 100;
        mapImageContainer.style.backgroundPosition = `${backgroundPosX}% ${backgroundPosY}%`;
        
        // Rotation de l'indicateur du joueur (seulement en mode minimap)
        if (!isExpanded) {
            playerIndicator.style.transform = `translate(-50%, -50%) rotate(${playerRotation}rad)`;
        }
    };

    // Nettoyer les écouteurs d'événements lors de la suppression
    const dispose = () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (document.body.contains(minimapContainer)) {
            document.body.removeChild(minimapContainer);
        }
        const mapOverlay = document.querySelector('.map-overlay');
        if (mapOverlay) {
            document.body.removeChild(mapOverlay);
        }
    };

    return {
        updateMinimap,
        toggleExpandedMap,
        dispose,
        get isExpanded() {
            return isExpanded;
        }
    };
} 
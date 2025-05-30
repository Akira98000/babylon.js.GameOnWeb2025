import * as BABYLON from '@babylonjs/core';

const LEVEL_POINTS = {
    1: {
        name: "Ray le Chien",
        icon: "🐕",
        worldPosition: { x: -67.99, z: -4.70 }, 
        color: "#FFD700",
        description: "Trouvez Ray et devenez amis"
    },
    2: [
        {
            name: "Banane 1",
            icon: "🍌", 
            worldPosition: { x: 7.30, z: 16.13 },
            color: "#FFFF00",
            description: "Banane 1/3"
        },
        {
            name: "Banane 2",
            icon: "🍌", 
            worldPosition: { x: -123.26, z: 11.07 },
            color: "#FFFF00",
            description: "Banane 2/3"
        },
        {
            name: "Banane 3",
            icon: "🍌", 
            worldPosition: { x: -39.77, z: -87.75 },
            color: "#FFFF00",
            description: "Banane 3/3"
        }
    ],
    '2b': {
        name: "Le Magicien",
        icon: "🧙‍♂️",
        worldPosition: { x: -67.99, z: -4.70 },
        color: "#9932CC",
        description: "Apprenez la magie"
    },
    3: [
        {
            name: "Orbe Rouge",
            icon: "🔴",
            worldPosition: { x: -119.13, z: -84.04 },
            color: "#FF0000",
            description: "Orbe Rouge (1/6)"
        },
        {
            name: "Orbe Orange",
            icon: "🟠",
            worldPosition: { x: -82.74, z: 0.05 },
            color: "#FF8000",
            description: "Orbe Orange (2/6)"
        },
        {
            name: "Orbe Jaune",
            icon: "🟡",
            worldPosition: { x: -61.83, z: -32.81 },
            color: "#FFFF00",
            description: "Orbe Jaune (3/6)"
        },
        {
            name: "Orbe Vert",
            icon: "🟢",
            worldPosition: { x: -52.35, z: 43.03 },
            color: "#00FF00",
            description: "Orbe Vert (4/6)"
        },
        {
            name: "Orbe Bleu",
            icon: "🔵",
            worldPosition: { x: 8.42, z: 16.16 },
            color: "#0000FF",
            description: "Orbe Bleu (5/6)"
        },
        {
            name: "Orbe Violet",
            icon: "🟣",
            worldPosition: { x: -24.84, z: -48.70 },
            color: "#8000FF",
            description: "Orbe Violet (6/6)"
        }
    ],
    4: {
        name: "Zone de Combat",
        type: "zone",
        icon: "⚔️",
        worldPosition: { x: -0, z: -15 },
        zoneSize: { width: 100, height: 155 }, 
        color: "#ff2d00",
        description: "Zone de combat contre les pizzas maléfiques"
    },
    5: [
        {
            name: "Quartier Centre-Sud",
            type: "zone",
            icon: "",
            worldPosition: { x: -1.84, z: -84.43 },
            zoneSize: { width: 200, height: 200 }, 
            color: "#ff2d00",
            description: "Libérez le quartier Centre-Sud (1/3)"
        },
        {
            name: "Quartier Est",
            type: "zone",
            icon: "",
            worldPosition: { x: -111.76, z: -83.29 },
            zoneSize: { width: 200, height: 200}, 
            color: "#ff2d00",
            description: "Libérez le quartier Est (2/3)"
        },
        {
            name: "Quartier Nord",
            type: "zone",
            icon: "",
            worldPosition: { x: -61.82, z: -30.11 },
            zoneSize: { width: 200, height: 200 }, 
            color: "#ff2d00",
            description: "Libérez le quartier Nord (3/3)"
        },
        {
            name: "La Reine",
            icon: "👑",
            worldPosition: { x: 8.45, z: -12.91 },
            color: "#FFD700",
            description: "Libérez la Reine (Appuyez sur K)"
        }
    ],
    6: {
        name: "Fusée",
        icon: "🚀",
        worldPosition: { x: 7.34, z: -12.16 },
        color: "#DC143C",
        description: "Atteignez la fusée"
    }
};

export function setupMinimap(scene, player) {
    const miniMapContainer = document.createElement('div');
    miniMapContainer.id = 'miniMapContainer';
    Object.assign(miniMapContainer.style, {
        position: 'absolute',
        top: '70px',
        left: '15px',
        width: '150px',
        height: '150px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '50%',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
        zIndex: '998',
        transition: 'all 0.3s ease'
    });
    
    miniMapContainer.classList.add('radar-sweep', 'minimap-border');
    
    const mapImage = document.createElement('div');
    mapImage.id = 'miniMapImage';
    Object.assign(mapImage.style, {
        width: '100%',
        height: '100%',
        backgroundImage: 'url("/image/map_game.png")',
        backgroundSize: '400%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.9)'
    });
    
    const playerMarker = document.createElement('div');
    playerMarker.id = 'playerMarker';
    Object.assign(playerMarker.style, {
        position: 'absolute',
        width: '12px',
        height: '12px',
        top: '50%',       
        left: '50%',       
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 5px 2px rgba(255, 255, 255, 0.7)',
        zIndex: '999'
    });
    
    const playerIcon = document.createElement('img');
    playerIcon.src = '/image/gameIcon.png';
    Object.assign(playerIcon.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover'
    });
    playerMarker.appendChild(playerIcon);

    // Conteneur pour les points de niveau sur la minimap
    const levelPointsContainer = document.createElement('div');
    levelPointsContainer.id = 'levelPointsContainer';
    Object.assign(levelPointsContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
    });
    
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
    
    miniMapContainer.appendChild(mapImage);
    miniMapContainer.appendChild(levelPointsContainer);
    miniMapContainer.appendChild(playerMarker);
    miniMapContainer.appendChild(minimapLabel);
    document.body.appendChild(miniMapContainer);
    
    let isExpanded = false;
    let expandedContainer = null;
    let levelMarkers = [];
    let expandedLevelMarkers = [];
    
    const initialPosition = {
        x: 24,  
        z: 55  
    };

    // Fonction pour créer un marqueur de niveau
    const createLevelMarker = (levelData, isExpanded = false) => {
        // Si c'est une zone, créer un marqueur de zone
        if (levelData.type === 'zone') {
            return createZoneMarker(levelData, isExpanded);
        }
        
        const marker = document.createElement('div');
        marker.className = 'level-marker';
        
        const size = isExpanded ? '16px' : '8px';
        const fontSize = isExpanded ? '10px' : '6px';
        
        Object.assign(marker.style, {
            position: 'absolute',
            width: size,
            height: size,
            backgroundColor: levelData.color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: `0 0 ${isExpanded ? '6px' : '3px'} 1px ${levelData.color}`,
            zIndex: isExpanded ? '1002' : '999',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: fontSize,
            animation: 'pulse 2s infinite'
        });
        
        marker.textContent = levelData.icon;
        
        // Ajouter une animation de pulsation
        if (!document.getElementById('level-marker-styles')) {
            const style = document.createElement('style');
            style.id = 'level-marker-styles';
            style.textContent = `
                @keyframes pulse {
                    0% { transform: translate(-50%, -50%) scale(1); }
                    50% { transform: translate(-50%, -50%) scale(1.2); }
                    100% { transform: translate(-50%, -50%) scale(1); }
                }
                .level-marker:hover {
                    transform: translate(-50%, -50%) scale(1.3) !important;
                    z-index: 1003 !important;
                }
                @keyframes zoneGlow {
                    0% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); }
                    50% { box-shadow: 0 0 20px rgba(255, 0, 0, 0.6); }
                    100% { box-shadow: 0 0 10px rgba(255, 0, 0, 0.3); }
                }
                .zone-marker {
                    animation: zoneGlow 3s infinite;
                }
            `;
            document.head.appendChild(style);
        }
        
        // Tooltip pour les marqueurs étendus
        if (isExpanded) {
            marker.title = `${levelData.name}: ${levelData.description}`;
            marker.style.cursor = 'pointer';
            marker.style.pointerEvents = 'auto';
        }
        
        return marker;
    };

    // Fonction pour créer un marqueur de zone
    const createZoneMarker = (levelData, isExpanded = false) => {
        const zoneMarker = document.createElement('div');
        zoneMarker.className = 'zone-marker';
        
        // Calculer la taille de la zone sur la carte
        const zoomFactor = isExpanded ? 0.5 : 0.8;
        const zoneWidth = (levelData.zoneSize.width * zoomFactor * 2); // Facteur d'échelle pour la carte
        const zoneHeight = (levelData.zoneSize.height * zoomFactor * 2);
        
        Object.assign(zoneMarker.style, {
            position: 'absolute',
            width: `${zoneWidth}px`,
            height: `${zoneHeight}px`,
            backgroundColor: levelData.color,
            opacity: '0.3',
            border: `2px solid ${levelData.color}`,
            borderRadius: '8px',
            transform: 'translate(-50%, -50%)',
            zIndex: isExpanded ? '1001' : '998', // Sous les autres marqueurs
            pointerEvents: isExpanded ? 'auto' : 'none'
        });
        
        // Ajouter une icône au centre de la zone
        if (isExpanded) {
            const centerIcon = document.createElement('div');
            centerIcon.textContent = levelData.icon;
            Object.assign(centerIcon.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '16px',
                color: levelData.color,
                textShadow: '0 0 4px rgba(0, 0, 0, 0.8)',
                zIndex: '1002'
            });
            zoneMarker.appendChild(centerIcon);
            
            // Tooltip pour la zone
            zoneMarker.title = `${levelData.name}: ${levelData.description}`;
            zoneMarker.style.cursor = 'pointer';
        }
        
        return zoneMarker;
    };

    // Stockage des marqueurs collectés pour le niveau 3
    let collectedLevel3Markers = new Set();

    // Fonction pour supprimer un marqueur spécifique par position (pour le niveau 3)
    const removeMarkerByPosition = (worldPosition) => {
        const tolerance = 1; // Tolérance pour la comparaison des positions
        
        // Marquer cette position comme collectée
        const positionKey = `${worldPosition.x.toFixed(2)}_${worldPosition.z.toFixed(2)}`;
        collectedLevel3Markers.add(positionKey);
        
        // Supprimer le marqueur de la carte étendue s'il existe
        if (isExpanded && expandedContainer) {
            expandedLevelMarkers.forEach((marker, index) => {
                const markerData = marker.dataset;
                if (markerData && markerData.worldX && markerData.worldZ) {
                    const markerX = parseFloat(markerData.worldX);
                    const markerZ = parseFloat(markerData.worldZ);
                    
                    if (Math.abs(markerX - worldPosition.x) < tolerance && 
                        Math.abs(markerZ - worldPosition.z) < tolerance) {
                        marker.remove();
                        expandedLevelMarkers.splice(index, 1);
                    }
                }
            });
        }
    };

    // Fonction pour mettre à jour les positions des marqueurs de niveau
    const updateLevelMarkers = () => {
        // Obtenir le niveau actuel depuis le gestionnaire de niveau
        const currentLevel = scene.metadata?.levelManager?.currentLevel || 0;
        
        // Minimap markers - Supprimés (pas de points sur la minimap)
        levelMarkers.forEach(marker => marker.remove());
        levelMarkers = [];
        
        // Expanded map markers
        if (isExpanded && expandedContainer) {
            expandedLevelMarkers.forEach(marker => marker.remove());
            expandedLevelMarkers = [];
            
            Object.entries(LEVEL_POINTS).forEach(([levelKey, levelData]) => {
                const isSubLevel = levelKey.includes('b');
                const levelNumber = isSubLevel ? parseInt(levelKey.replace('b', '')) : parseInt(levelKey);
                
                let shouldShow = false;
                if (isSubLevel) {
                    // Pour les sous-niveaux comme 2b, les afficher seulement si c'est le niveau actuel
                    shouldShow = currentLevel === levelKey;
                } else {
                    // Pour les niveaux normaux, afficher seulement si c'est le niveau actuel
                    shouldShow = currentLevel === levelNumber;
                }
                
                if (shouldShow) {
                    // Gérer les niveaux avec plusieurs points (comme les bananes)
                    const pointsToShow = Array.isArray(levelData) ? levelData : [levelData];
                    
                    pointsToShow.forEach(pointData => {
                        // Pour le niveau 3, vérifier si ce marqueur a été collecté
                        if (currentLevel === 3) {
                            const positionKey = `${pointData.worldPosition.x.toFixed(2)}_${pointData.worldPosition.z.toFixed(2)}`;
                            if (collectedLevel3Markers.has(positionKey)) {
                                return; // Ne pas afficher ce marqueur s'il a été collecté
                            }
                        }
                        
                        const marker = createLevelMarker(pointData, true);
                        
                        // Stocker les données de position dans le marqueur pour la suppression
                        marker.dataset.worldX = pointData.worldPosition.x;
                        marker.dataset.worldZ = pointData.worldPosition.z;
                        
                        // Calculer la position sur la carte étendue
                        const zoomFactor = 0.5;
                        const adjustedPosX = initialPosition.x + pointData.worldPosition.z;
                        const adjustedPosZ = initialPosition.z + pointData.worldPosition.x;
                        
                        const posX = 50 + (adjustedPosX * zoomFactor);
                        const posY = 50 + (adjustedPosZ * zoomFactor);
                        
                        const clampedPosX = Math.max(5, Math.min(95, posX));
                        const clampedPosY = Math.max(5, Math.min(95, posY));
                        
                        marker.style.left = `${clampedPosX}%`;
                        marker.style.top = `${clampedPosY}%`;
                        
                        // Mettre en évidence le niveau actuel
                        marker.style.boxShadow = `0 0 12px 3px ${pointData.color}`;
                        
                        expandedContainer.appendChild(marker);
                        expandedLevelMarkers.push(marker);
                    });
                }
            });
        }
    };
    
    const updateMinimap = (playerPosition, playerRotation) => {
        if (!isExpanded) {
            const zoomFactorMinimap = 0.8; 
            const adjustedPosX = initialPosition.x + playerPosition.z; 
            const adjustedPosZ = initialPosition.z + playerPosition.x; 
            
            const bgPosX = 50 + (adjustedPosX * zoomFactorMinimap);
            const bgPosY = 50 + (adjustedPosZ * zoomFactorMinimap);
            const clampedX = Math.max(0, Math.min(100, bgPosX));
            const clampedY = Math.max(0, Math.min(100, bgPosY));

            mapImage.style.backgroundPosition = `${clampedX}% ${clampedY}%`;
        } else if (expandedContainer) {
            const expandedMapImage = expandedContainer.querySelector('#expandedMapImage');
            const expandedPlayerMarker = expandedContainer.querySelector('#expandedPlayerMarker');
            
            if (expandedPlayerMarker) {
                const zoomFactor = 0.5; 
                const adjustedPosX = initialPosition.x + playerPosition.z;
                const adjustedPosZ = initialPosition.z + playerPosition.x;
                
                const posX = 50 + (adjustedPosX * zoomFactor);
                const posY = 50 + (adjustedPosZ * zoomFactor);
                
                const clampedPosX = Math.max(5, Math.min(95, posX));
                const clampedPosY = Math.max(5, Math.min(95, posY));
                
                expandedPlayerMarker.style.left = `${clampedPosX}%`;
                expandedPlayerMarker.style.top = `${clampedPosY}%`;
            }
        }
        
        // Mettre à jour les marqueurs de niveau
        updateLevelMarkers();
    };
    
    const toggleExpandedMap = () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
            miniMapContainer.style.opacity = '0';
            miniMapContainer.style.transform = 'scale(0.5)';
            
            setTimeout(() => {
                miniMapContainer.style.display = 'none';
            }, 300);
            
            expandedContainer = document.createElement('div');
            expandedContainer.id = 'expandedMapContainer';
            Object.assign(expandedContainer.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '80%',
                height: '80%',
                transform: 'translate(-50%, -50%) scale(0.8)',
                opacity: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '10px',
                overflow: 'hidden',
                zIndex: '1001',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
                transition: 'all 0.3s ease'
            });
            
            const expandedMapImage = document.createElement('img');
            expandedMapImage.id = 'expandedMapImage';
            expandedMapImage.src = '/image/map_game.png';
            Object.assign(expandedMapImage.style, {
                width: '100%',
                height: '100%',
                objectFit: 'contain'
            });
            
            const expandedPlayerMarker = document.createElement('div');
            expandedPlayerMarker.id = 'expandedPlayerMarker';
            Object.assign(expandedPlayerMarker.style, {
                position: 'absolute',
                width: '20px',
                height: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                borderRadius: '50%',
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 0 8px 3px rgba(255, 255, 255, 0.7)',
                zIndex: '1002'
            });
            
            const expandedPlayerIcon = document.createElement('img');
            expandedPlayerIcon.src = '/image/gameIcon.png';
            Object.assign(expandedPlayerIcon.style, {
                width: '100%',
                height: '100%',
                objectFit: 'cover'
            });
            
            const mapTitle = document.createElement('div');
            mapTitle.textContent = 'CARTE DE LA VILLE';
            Object.assign(mapTitle.style, {
                position: 'absolute',
                top: '15px',
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'white',
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                fontSize: '20px',
                fontWeight: 'bold',
                padding: '5px 15px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                borderRadius: '15px',
                zIndex: '1003'
            });
            
            const closeButton = document.createElement('div');
            closeButton.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
            Object.assign(closeButton.style, {
                position: 'absolute',
                top: '15px',
                right: '15px',
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'pointer',
                zIndex: '1003',
                transition: 'all 0.2s ease',
                border: '1px solid rgba(255, 255, 255, 0.3)'
            });
            
            closeButton.addEventListener('mouseover', () => {
                closeButton.style.backgroundColor = 'rgba(255, 50, 50, 0.7)';
                closeButton.style.transform = 'scale(1.1)';
            });
            
            closeButton.addEventListener('mouseout', () => {
                closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
                closeButton.style.transform = 'scale(1)';
            });
            
            closeButton.addEventListener('click', toggleExpandedMap);
            
            const overlay = document.createElement('div');
            overlay.id = 'mapOverlay';
            Object.assign(overlay.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: '1000',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            });
            
            expandedPlayerMarker.appendChild(expandedPlayerIcon);
            expandedContainer.appendChild(expandedMapImage);
            expandedContainer.appendChild(expandedPlayerMarker);
            expandedContainer.appendChild(mapTitle);
            expandedContainer.appendChild(closeButton);
            
            document.body.appendChild(overlay);
            document.body.appendChild(expandedContainer);
            
            // Mettre à jour les marqueurs de niveau pour la carte étendue
            updateLevelMarkers();
            
            setTimeout(() => {
                overlay.style.opacity = '1';
                expandedContainer.style.opacity = '1';
                expandedContainer.style.transform = 'translate(-50%, -50%) scale(1)';
            }, 50);

            if (scene.metadata && scene.metadata.controls) {
                expandedContainer.previousControlsEnabled = scene.metadata.controls.enabled;
                scene.metadata.controls.enabled = false;
            }
        } else {
            if (expandedContainer) {
                expandedContainer.style.opacity = '0';
                expandedContainer.style.transform = 'translate(-50%, -50%) scale(0.8)';
                
                setTimeout(() => {
                    document.body.removeChild(expandedContainer);
                    expandedContainer = null;
                    
                    miniMapContainer.style.display = 'block';
                    miniMapContainer.style.opacity = '0';
                    miniMapContainer.style.transform = 'scale(0.5)';
                    
                    setTimeout(() => {
                        miniMapContainer.style.opacity = '1';
                        miniMapContainer.style.transform = 'scale(1)';
                    }, 50);
                }, 300);
            }
            
            const overlay = document.getElementById('mapOverlay');
            if (overlay) {
                overlay.style.opacity = '0';
                setTimeout(() => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                }, 300);
            }
            
            if (scene.metadata && scene.metadata.controls && expandedContainer && expandedContainer.previousControlsEnabled !== undefined) {
                scene.metadata.controls.enabled = expandedContainer.previousControlsEnabled;
            }
        }
    };
    
    miniMapContainer.addEventListener('click', () => {
        if (!isExpanded) {
            toggleExpandedMap();
        }
    });
    
    const handleKeyDown = (event) => {
        if (event.key.toLowerCase() === 'm') {
            toggleExpandedMap();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    
    const dispose = () => {
        window.removeEventListener('keydown', handleKeyDown);
        
        // Nettoyer les marqueurs de niveau
        levelMarkers.forEach(marker => marker.remove());
        expandedLevelMarkers.forEach(marker => marker.remove());
        levelMarkers = [];
        expandedLevelMarkers = [];
        
        // Supprimer les styles CSS ajoutés
        const styleElement = document.getElementById('level-marker-styles');
        if (styleElement) {
            styleElement.remove();
        }
        
        if (document.body.contains(miniMapContainer)) {
            document.body.removeChild(miniMapContainer);
        }
        if (expandedContainer && document.body.contains(expandedContainer)) {
            document.body.removeChild(expandedContainer);
        }
        const overlay = document.getElementById('mapOverlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
    };
    
    // Initialiser les marqueurs de niveau au démarrage
    updateLevelMarkers();
    
    return {
        updateMinimap,
        toggleExpandedMap,
        updateLevelMarkers,
        removeMarkerByPosition,
        dispose,
        get isExpanded() {
            return isExpanded;
        }
    };
} 
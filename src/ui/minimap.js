import * as BABYLON from '@babylonjs/core';

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
    
    const mapImage = document.createElement('div');
    mapImage.id = 'miniMapImage';
    Object.assign(mapImage.style, {
        width: '100%',
        height: '100%',
        backgroundImage: 'url("/image/map_game.png")',
        backgroundSize: '400%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        transition: 'background-position 0.2s ease',
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
    
    const playerDirection = document.createElement('div');
    playerDirection.id = 'playerDirection';
    Object.assign(playerDirection.style, {
        position: 'absolute',
        top: '-8px',
        left: '50%',
        width: '0',
        height: '0',
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderBottom: '8px solid rgba(0, 200, 0, 0.8)',
        transform: 'translateX(-50%)',
        transformOrigin: 'bottom center'
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
    
    playerMarker.appendChild(playerDirection);
    miniMapContainer.appendChild(mapImage);
    miniMapContainer.appendChild(playerMarker);
    miniMapContainer.appendChild(minimapLabel);
    document.body.appendChild(miniMapContainer);
    
    let isExpanded = false;
    let expandedContainer = null;
    
    const updateMinimap = (playerPosition, playerRotation) => {
        console.log(`Position joueur: x=${playerPosition.x.toFixed(2)}, z=${playerPosition.z.toFixed(2)}`);
        
        const mapBounds = {
            minX: -90,
            maxX: 90,
            minZ: -90,
            maxZ: 90
        };
        
        const adjustedPosition = {
            x: playerPosition.x + 50,
            z: playerPosition.z + 19 
        };
        
        const correctedPosition = {
            x: adjustedPosition.z,  
            z: -adjustedPosition.x  
        };
        
        console.log(`Position corrigée: x=${correctedPosition.x.toFixed(2)}, z=${correctedPosition.z.toFixed(2)}`);
        
        const grandMapPosition = {
            x: correctedPosition.x,
            z: correctedPosition.z
        };
        
        if (!isExpanded) {
            const normalizedX = (grandMapPosition.x - mapBounds.minZ) / (mapBounds.maxZ - mapBounds.minZ);
            const normalizedZ = (grandMapPosition.z - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX);
            const bgPosX = 50 - normalizedX * 100; 
            const bgPosY = 50 - normalizedZ * 100; 
            mapImage.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;
            playerDirection.style.transform = `translateX(-50%) rotate(${-playerRotation + Math.PI/2}rad)`;
        }
        else if (expandedContainer) {
            const expandedMapImage = expandedContainer.querySelector('#expandedMapImage');
            const expandedPlayerMarker = expandedContainer.querySelector('#expandedPlayerMarker');
            const expandedDirection = expandedContainer.querySelector('#expandedPlayerDirection');
            
            if (expandedPlayerMarker && expandedDirection) {
                const { offsetWidth: w, offsetHeight: h } = expandedContainer;
                const normalizedX = (grandMapPosition.x - mapBounds.minZ) / (mapBounds.maxZ - mapBounds.minZ);
                const normalizedZ = (grandMapPosition.z - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX);
                const percentX = normalizedX;
                const percentZ = 1 - normalizedZ;
                expandedPlayerMarker.style.left = `${percentX * w}px`;
                expandedPlayerMarker.style.top = `${percentZ * h}px`;
                expandedDirection.style.transform = `translateX(-50%) rotate(${-playerRotation + Math.PI/2}rad)`;
            }
        }
    };
    
    const toggleExpandedMap = () => {
        isExpanded = !isExpanded;
        if (isExpanded) {
            expandedContainer = document.createElement('div');
            expandedContainer.id = 'expandedMapContainer';
            Object.assign(expandedContainer.style, {
                position: 'fixed',
                top: '50%',
                left: '50%',
                width: '80%',
                height: '80%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid rgba(255, 255, 255, 0.5)',
                borderRadius: '10px',
                overflow: 'hidden',
                zIndex: '1001',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.8)'
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
            
            const expandedPlayerDirection = document.createElement('div');
            expandedPlayerDirection.id = 'expandedPlayerDirection';
            Object.assign(expandedPlayerDirection.style, {
                position: 'absolute',
                top: '-10px',
                left: '50%',
                width: '0',
                height: '0',
                borderLeft: '6px solid transparent',
                borderRight: '6px solid transparent',
                borderBottom: '12px solid rgba(0, 200, 0, 0.8)',
                transform: 'translateX(-50%)',
                transformOrigin: 'bottom center'
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
                zIndex: '1003'
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
                zIndex: '1000'
            });
            
            expandedPlayerMarker.appendChild(expandedPlayerIcon);
            expandedPlayerMarker.appendChild(expandedPlayerDirection);
            expandedContainer.appendChild(expandedMapImage);
            expandedContainer.appendChild(expandedPlayerMarker);
            expandedContainer.appendChild(mapTitle);
            expandedContainer.appendChild(closeButton);
            
            document.body.appendChild(overlay);
            document.body.appendChild(expandedContainer);
            miniMapContainer.style.display = 'none';

            if (scene.metadata && scene.metadata.controls) {
                expandedContainer.previousControlsEnabled = scene.metadata.controls.enabled;
                scene.metadata.controls.enabled = false;
            }
        } else {
            if (expandedContainer) {
                document.body.removeChild(expandedContainer);
                expandedContainer = null;
            }
            const overlay = document.getElementById('mapOverlay');
            if (overlay) {
                document.body.removeChild(overlay);
            }
            miniMapContainer.style.display = 'block';
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
    
    return {
        updateMinimap,
        toggleExpandedMap,
        dispose,
        get isExpanded() {
            return isExpanded;
        }
    };
} 
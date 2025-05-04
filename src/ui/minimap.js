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
    miniMapContainer.appendChild(playerMarker);
    miniMapContainer.appendChild(minimapLabel);
    document.body.appendChild(miniMapContainer);
    
    let isExpanded = false;
    let expandedContainer = null;
    
    const initialPosition = {
        x: 24,  
        z: 55  
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
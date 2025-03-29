export function createMiniMap() {
    const miniMapContainer = document.createElement('div');
    miniMapContainer.id = 'miniMapContainer';
    Object.assign(miniMapContainer.style, {
        position: 'absolute',
        top: '15px',
        right: '15px',
        width: '180px',
        height: '180px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(5px)',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
        overflow: 'hidden',
        zIndex: '10',
        transition: 'opacity 0.3s ease'
    });
    
    const mapImage = document.createElement('img');
    mapImage.id = 'miniMapImage';
    mapImage.src = '/map/ui/map_aerial.jpg'; 
    Object.assign(mapImage.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: '0.9',
        filter: 'contrast(1.1) brightness(0.9)'
    });
    
    const mapTitleContainer = document.createElement('div');
    Object.assign(mapTitleContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        zIndex: '12'
    });
    
    const mapIcon = document.createElement('div');
    mapIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.5 3L20.34 3.03L15 5.1L9 3L3.36 4.9C3.15 4.97 3 5.15 3 5.38V20.5C3 20.78 3.22 21 3.5 21L3.66 20.97L9 18.9L15 21L20.64 19.1C20.85 19.03 21 18.85 21 18.62V3.5C21 3.22 20.78 3 20.5 3ZM15 19L9 16.89V5L15 7.11V19Z" fill="white"/>
    </svg>`;
    Object.assign(mapIcon.style, {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        minWidth: '16px'
    });
    
    const mapTitle = document.createElement('div');
    mapTitle.textContent = 'CARTE';
    Object.assign(mapTitle.style, {
        color: 'white',
        fontSize: '12px',
        fontWeight: 'bold',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    });
    
    mapTitleContainer.appendChild(mapIcon);
    mapTitleContainer.appendChild(mapTitle);
    
    const playerMarker = document.createElement('div');
    playerMarker.id = 'playerMarker';
    Object.assign(playerMarker.style, {
        position: 'absolute',
        width: '10px',
        height: '10px',
        backgroundColor: '#7FFF7F',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 5px 2px rgba(127, 255, 127, 0.5)',
        zIndex: '11',
        transition: 'left 0.2s ease, top 0.2s ease'
    });
    
    const playerDirection = document.createElement('div');
    playerDirection.id = 'playerDirection';
    Object.assign(playerDirection.style, {
        position: 'absolute',
        top: '-2px',
        left: '50%',
        width: '0',
        height: '0',
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderBottom: '8px solid #7FFF7F',
        transform: 'translateX(-50%)',
        transformOrigin: 'bottom center',
        transition: 'transform 0.2s ease'
    });
    
    playerMarker.appendChild(playerDirection);
    miniMapContainer.appendChild(mapImage);
    miniMapContainer.appendChild(mapTitleContainer);
    miniMapContainer.appendChild(playerMarker);
    document.body.appendChild(miniMapContainer);
    
    const bananaMarkers = {};

    const updatePlayerPosition = ({ x, z }, rotation, { minX, maxX, minZ, maxZ }) => {
        const { offsetWidth: w, offsetHeight: h } = miniMapContainer;
        const percentX = (x - minX) / (maxX - minX);
        const percentZ = 1 - (z - minZ) / (maxZ - minZ);
        playerMarker.style.left = `${percentX * w}px`;
        playerMarker.style.top = `${percentZ * h}px`;
        playerDirection.style.transform = `translateX(-50%) rotate(${-rotation}rad)`;
    };

    const updateBananaMarkers = (bananas, { minX, maxX, minZ, maxZ }) => {
        const { offsetWidth: w, offsetHeight: h } = miniMapContainer;
        bananas.forEach(({ mesh: { position, name } }) => {
            if (!bananaMarkers[name]) {
                const marker = document.createElement('div');
                Object.assign(marker.style, {
                    position: 'absolute',
                    width: '8px',
                    height: '8px',
                    backgroundColor: '#FFFF7F',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 0 5px 2px rgba(255, 255, 127, 0.5)',
                    zIndex: '11'
                });
                miniMapContainer.appendChild(marker);
                bananaMarkers[name] = marker;
            }
            const percentX = (position.x - minX) / (maxX - minX);
            const percentZ = 1 - (position.z - minZ) / (maxZ - minZ);
            bananaMarkers[name].style.left = `${percentX * w}px`;
            bananaMarkers[name].style.top = `${percentZ * h}px`;
        });
    };
    
    const toggleHotkey = document.createElement('div');
    Object.assign(toggleHotkey.style, {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        color: 'rgba(255, 255, 255, 0.7)',
        padding: '3px 6px',
        borderRadius: '4px',
        fontSize: '10px',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        zIndex: '12'
    });
    toggleHotkey.textContent = 'M';
    miniMapContainer.appendChild(toggleHotkey);
    
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'm') {
            if (miniMapContainer.style.display === 'none') {
                miniMapContainer.style.display = 'block';
                miniMapContainer.style.opacity = '0';
                setTimeout(() => {
                    miniMapContainer.style.opacity = '1';
                }, 10);
            } else {
                miniMapContainer.style.opacity = '0';
                setTimeout(() => {
                    miniMapContainer.style.display = 'none';
                }, 300);
            }
        }
    });
    
    return { container: miniMapContainer, updatePlayerPosition, updateBananaMarkers };
}

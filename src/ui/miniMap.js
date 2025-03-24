export function createMiniMap() {
    const miniMapContainer = document.createElement('div');
    miniMapContainer.id = 'miniMapContainer';
    Object.assign(miniMapContainer.style, {
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '150px',
        height: '150px',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        border: '2px solid rgba(255, 255, 255, 0.5)',
        borderRadius: '5px',
        overflow: 'hidden',
        zIndex: '10'
    });
    
    const mapImage = document.createElement('img');
    mapImage.id = 'miniMapImage';
    mapImage.src = '/map/ui/map_aerial.jpg'; 
    Object.assign(mapImage.style, {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        opacity: '0.8'
    });
    
    const playerMarker = document.createElement('div');
    playerMarker.id = 'playerMarker';
    Object.assign(playerMarker.style, {
        position: 'absolute',
        width: '10px',
        height: '10px',
        backgroundColor: '#ff3366',
        borderRadius: '50%',
        transform: 'translate(-50%, -50%)',
        boxShadow: '0 0 5px 2px rgba(255, 255, 255, 0.7)',
        zIndex: '11'
    });
    
    const playerDirection = document.createElement('div');
    playerDirection.id = 'playerDirection';
    Object.assign(playerDirection.style, {
        position: 'absolute',
        top: '0',
        left: '50%',
        width: '0',
        height: '0',
        borderLeft: '4px solid transparent',
        borderRight: '4px solid transparent',
        borderBottom: '8px solid #ff3366',
        transform: 'translateX(-50%)',
        transformOrigin: 'bottom center'
    });
    
    playerMarker.appendChild(playerDirection);
    miniMapContainer.appendChild(mapImage);
    miniMapContainer.appendChild(playerMarker);
    document.body.appendChild(miniMapContainer);
    
    const bananaMarkers = {};

    const updatePlayerPosition = ({ x, z }, rotation, { minX, maxX, minZ, maxZ }) => {
        const { offsetWidth: w, offsetHeight: h } = miniMapContainer;
        const percentX = (x - minX) / (maxX - minX);
        const percentZ = 1 - (z - minZ) / (maxZ - minZ);
        playerMarker.style.left = `${percentX * w + 42}px`;
        playerMarker.style.top = `${percentZ * h - 20}px`;
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
                    backgroundColor: 'yellow',
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: '11'
                });
                miniMapContainer.appendChild(marker);
                bananaMarkers[name] = marker;
            }
            const percentX = (position.x - minX) / (maxX - minX);
            const percentZ = 1 - (position.z - minZ) / (maxZ - minZ);
            bananaMarkers[name].style.left = `${percentX * w + 42}px`;
            bananaMarkers[name].style.top = `${percentZ * h - 20}px`;
        });
    };
    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'm') {
            miniMapContainer.style.display = miniMapContainer.style.display === 'none' ? 'block' : 'none';
        }
    });
    return { container: miniMapContainer, updatePlayerPosition, updateBananaMarkers };
}

export const createControlsOverlay = () => {
    let isOverlayVisible = false;
    let overlayElement = null;
    let instructionElement = null;

    // Données des contrôles
    const controls = [
        { key: 'Z / W', description: 'Avancer' },
        { key: 'S', description: 'Reculer' },
        { key: 'Q / A', description: 'Gauche' },
        { key: 'D', description: 'Droite' },
        { key: 'CLIC GAUCHE', description: 'Tirer' },
        { key: 'M', description: 'Minimap' },
        { key: 'ESC', description: 'Menu pause' },
        { key: 'P', description: 'Afficher/Masquer contrôles' },
        { key: 'T', description: 'Téléportation si bloqué' },
        { key: 'F ou K', description: 'Interagir sur les missions' }
    ];

    // Créer l'indicateur en bas à droite
    const createInstructions = () => {
        if (!instructionElement) {
            instructionElement = document.createElement('div');
            instructionElement.id = 'controlsInstruction';
            instructionElement.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                color: white;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 14px;
                background: rgba(15, 15, 30, 0.8);
                padding: 10px 18px;
                border-radius: 8px;
                border: 1px solid rgba(138, 43, 226, 0.6);
                z-index: 1000;
                pointer-events: none;
            `;
            instructionElement.innerHTML = `
                Pour voir les commandes: appuyez sur <span style="color: #86a8e7; font-weight: bold;">P</span>
            `;
            document.body.appendChild(instructionElement);
        }
    };

    // Créer l'overlay des contrôles
    const createOverlay = () => {
        if (!overlayElement) {
            overlayElement = document.createElement('div');
            overlayElement.id = 'controlsOverlay';
            overlayElement.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                z-index: 2000;
                display: none;
                justify-content: center;
                align-items: center;
                opacity: 0;
            `;

            // Conteneur principal
            const container = document.createElement('div');
            container.style.cssText = `
                background: rgba(15, 15, 30, 0.95);
                border-radius: 15px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                position: relative;
            `;

            // Titre simple
            const title = document.createElement('h1');
            title.style.cssText = `
                color: white;
                text-align: center;
                margin: 0 0 30px 0;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                font-size: 32px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 2px;
                background: linear-gradient(to right, white, #86a8e7);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            `;
            title.textContent = 'CONTRÔLES';
            container.appendChild(title);

            // Grille des contrôles
            const controlsGrid = document.createElement('div');
            controlsGrid.style.cssText = `
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 15px;
                margin-bottom: 30px;
            `;

            // Ajouter chaque contrôle
            controls.forEach((control) => {
                const controlItem = document.createElement('div');
                controlItem.style.cssText = `
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: rgba(30, 30, 50, 0.7);
                    padding: 15px 20px;
                    border-radius: 8px;
                `;

                controlItem.addEventListener('mouseenter', () => {
                    controlItem.style.background = 'rgba(138, 43, 226, 0.3)';
                    controlItem.style.borderColor = 'rgba(138, 43, 226, 0.8)';
                });

                controlItem.addEventListener('mouseleave', () => {
                    controlItem.style.background = 'rgba(30, 30, 50, 0.7)';
                    controlItem.style.borderColor = 'rgba(138, 43, 226, 0.4)';
                });

                const keyElement = document.createElement('span');
                keyElement.style.cssText = `
                    color: #86a8e7;
                    font-weight: bold;
                    font-size: 16px;
                    font-family: 'Courier New', monospace;
                `;
                keyElement.textContent = control.key;

                const descElement = document.createElement('span');
                descElement.style.cssText = `
                    color: white;
                    font-size: 16px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                `;
                descElement.textContent = control.description;

                controlItem.appendChild(keyElement);
                controlItem.appendChild(descElement);
                controlsGrid.appendChild(controlItem);
            });

            container.appendChild(controlsGrid);

            // Instructions de fermeture
            const closeInstruction = document.createElement('p');
            closeInstruction.style.cssText = `
                color: rgba(255, 255, 255, 0.8);
                text-align: center;
                margin: 0;
                font-size: 16px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            closeInstruction.innerHTML = `
                Appuyez sur <span style="color: #86a8e7; font-weight: bold;">P</span> pour fermer
            `;
            container.appendChild(closeInstruction);

            overlayElement.appendChild(container);
            document.body.appendChild(overlayElement);
        }
    };

    // Afficher l'overlay
    const showOverlay = () => {
        if (overlayElement) {
            isOverlayVisible = true;
            overlayElement.style.display = 'flex';
            overlayElement.style.opacity = '1';
            
            // Cacher l'instruction
            if (instructionElement) {
                instructionElement.style.display = 'none';
            }
        }
    };

    // Cacher l'overlay
    const hideOverlay = () => {
        if (overlayElement) {
            isOverlayVisible = false;
            overlayElement.style.opacity = '0';
            overlayElement.style.display = 'none';
            
            // Réafficher l'instruction
            if (instructionElement) {
                instructionElement.style.display = 'block';
            }
        }
    };

    // Toggle l'overlay
    const toggleOverlay = () => {
        if (isOverlayVisible) {
            hideOverlay();
        } else {
            showOverlay();
        }
    };

    // Event listener pour les touches
    const handleKeyPress = (event) => {
        if (event.key.toLowerCase() === 'p' || (event.key === 'Escape' && isOverlayVisible)) {
            event.preventDefault();
            toggleOverlay();
        }
    };

    // Initialiser
    const init = () => {
        createInstructions();
        createOverlay();
        document.addEventListener('keydown', handleKeyPress);
    };

    // Nettoyer
    const dispose = () => {
        document.removeEventListener('keydown', handleKeyPress);
        if (overlayElement) {
            overlayElement.remove();
            overlayElement = null;
        }
        if (instructionElement) {
            instructionElement.remove();
            instructionElement = null;
        }
    };

    return {
        init,
        dispose,
        show: showOverlay,
        hide: hideOverlay,
        toggle: toggleOverlay,
        get isVisible() {
            return isOverlayVisible;
        }
    };
}; 
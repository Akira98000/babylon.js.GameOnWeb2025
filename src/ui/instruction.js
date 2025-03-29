export function instructions() {
    const instructions = document.createElement('div');
    Object.assign(instructions.style, {
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        color: 'white',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: '14px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        maxWidth: '300px',
        zIndex: '1000',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        transform: 'translateY(0)'
    });

    const keyStyle = {
        default: {
            backgroundColor: 'rgba(40, 40, 40, 0.8)',
            border: '1px solid rgba(80, 80, 80, 0.8)',
            borderBottom: '3px solid rgba(30, 30, 30, 0.8)',
            borderRadius: '5px',
            color: 'white',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
            fontWeight: 'bold',
            textAlign: 'center',
            height: '30px',
            minWidth: '30px',
            padding: '0 8px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            margin: '2px',
            transition: 'all 0.1s ease'
        },
        movement: {
            backgroundColor: 'rgba(70, 130, 180, 0.8)',
            borderColor: 'rgba(100, 160, 210, 0.8)',
            borderBottomColor: 'rgba(50, 100, 150, 0.8)'
        },
        action: {
            backgroundColor: 'rgba(220, 100, 100, 0.8)',
            borderColor: 'rgba(250, 130, 130, 0.8)',
            borderBottomColor: 'rgba(180, 70, 70, 0.8)'
        },
        mouse: {
            backgroundColor: 'rgba(100, 180, 100, 0.8)',
            borderColor: 'rgba(130, 210, 130, 0.8)',
            borderBottomColor: 'rgba(70, 150, 70, 0.8)'
        }
    };

    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
        backgroundColor: 'rgba(70, 131, 180, 0)',
        padding: '12px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    });
    instructions.appendChild(titleBar);

    const toggleButton = document.createElement('div');
    toggleButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/></svg>';
    Object.assign(toggleButton.style, {
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '20px',
        height: '20px',
        borderRadius: '4px',
        transition: 'background-color 0.2s ease'
    });

    let isMinimized = true;
    const controlsContent = document.createElement('div');
    controlsContent.style.display = 'none'; // minimisé par défaut

    toggleButton.addEventListener('mouseover', () => {
        toggleButton.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
    });

    toggleButton.addEventListener('mouseout', () => {
        toggleButton.style.backgroundColor = 'transparent';
    });

    toggleButton.addEventListener('click', () => {
        isMinimized = !isMinimized;
        if (isMinimized) {
            controlsContent.style.display = 'none';
            toggleButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H13v6h-2v-6H5v-2h6V5h2v6h6v2z" fill="white"/></svg>';
            instructions.style.transform = 'translateY(0)';
        } else {
            controlsContent.style.display = 'block';
            toggleButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 13H5v-2h14v2z" fill="white"/></svg>';
            instructions.style.transform = 'translateY(0)';
        }
    });

    titleBar.appendChild(toggleButton);

    Object.assign(controlsContent.style, {
        padding: '15px'
    });
    instructions.appendChild(controlsContent);

    function createKey(label, type = 'default') {
        const keyElement = document.createElement('div');
        keyElement.textContent = label;
        Object.assign(keyElement.style, keyStyle.default);
        if (type !== 'default' && keyStyle[type]) {
            Object.entries(keyStyle[type]).forEach(([prop, value]) => {
                keyElement.style[prop] = value;
            });
        }
        return keyElement;
    }

    function createControlLine(keyConfig, description) {
        const line = document.createElement('div');
        Object.assign(line.style, {
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px'
        });

        const keysContainer = document.createElement('div');
        Object.assign(keysContainer.style, {
            display: 'flex',
            flexWrap: 'wrap',
            marginRight: '12px',
            minWidth: '110px'
        });

        keyConfig.forEach(config => {
            const { label, type } = typeof config === 'string'
                ? { label: config, type: 'default' }
                : config;
            keysContainer.appendChild(createKey(label, type));
        });

        const descElement = document.createElement('div');
        descElement.textContent = description;
        Object.assign(descElement.style, {
            flexGrow: '1',
            fontSize: '13px'
        });

        line.appendChild(keysContainer);
        line.appendChild(descElement);
        return line;
    }

    const movementSection = document.createElement('div');
    Object.assign(movementSection.style, {
        marginBottom: '15px'
    });

    movementSection.appendChild(createControlLine([
        { label: 'Z', type: 'movement' },
        { label: 'Q', type: 'movement' },
        { label: 'S', type: 'movement' },
        { label: 'D', type: 'movement' }
    ], 'Se déplacer'));

    movementSection.appendChild(createControlLine([
        { label: '🖱️', type: 'mouse' }
    ], 'Orienter la caméra'));

    controlsContent.appendChild(movementSection);

    const actionSection = document.createElement('div');
    Object.assign(actionSection.style, {
        marginBottom: '15px'
    });

    actionSection.appendChild(createControlLine([
        { label: 'Clic', type: 'mouse' }
    ], 'Tirer'));

    actionSection.appendChild(createControlLine([
        { label: 'B', type: 'action' }
    ], 'Samba'));

    actionSection.appendChild(createControlLine([
        { label: 'K', type: 'action' }
    ], 'Interagir'));

    controlsContent.appendChild(actionSection);

    document.body.appendChild(instructions);

    return instructions;
}
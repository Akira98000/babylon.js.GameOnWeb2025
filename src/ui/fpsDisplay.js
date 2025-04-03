export function setupHUD() {
    // Créer le conteneur principal
    const hudContainer = document.createElement("div");
    Object.assign(hudContainer.style, {
        position: "absolute",
        top: "15px",
        left: "15px", 
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "15px",
        padding: "8px 12px",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(5px)",
        borderRadius: "8px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
        color: "white",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        fontSize: "12px",
        zIndex: "999",
        transition: "opacity 0.3s ease"
    });

    // Créer le conteneur pour le FPS
    const fpsContainer = document.createElement("div");
    Object.assign(fpsContainer.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    });

    const fpsIcon = document.createElement("div");
    fpsIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="white"/>
    </svg>`;
    Object.assign(fpsIcon.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        minWidth: "16px",
        position: "relative",
        overflow: "visible"
    });
    fpsContainer.appendChild(fpsIcon);

    const fpsValue = document.createElement("div");
    fpsValue.id = "fps-value";
    fpsValue.textContent = "0 FPS";
    Object.assign(fpsValue.style, {
        fontWeight: "bold",
        minWidth: "60px"
    });
    fpsContainer.appendChild(fpsValue);

    const pingContainer = document.createElement("div");
    Object.assign(pingContainer.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    });

    const networkBars = document.createElement("div");
    Object.assign(networkBars.style, {
        display: "flex",
        alignItems: "flex-end",
        gap: "2px",
        height: "15px",
        minWidth: "16px"
    });

    for (let i = 0; i < 4; i++) {
        const bar = document.createElement("div");
        const height = (i + 1) * 3 + 3;
        Object.assign(bar.style, {
            width: "3px",
            height: height + "px",
            backgroundColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: "1px",
            transition: "background-color 0.3s ease",
            minWidth: "3px",
            display: "block",
            flexShrink: "0"
        });
        bar.id = `network-bar-${i}`;
        networkBars.appendChild(bar);
    }
    pingContainer.appendChild(networkBars);

    const pingValue = document.createElement("div");
    pingValue.id = "ping-value";
    pingValue.textContent = "-- ms";
    Object.assign(pingValue.style, {
        fontWeight: "bold",
        minWidth: "55px"
    });
    pingContainer.appendChild(pingValue);

    hudContainer.appendChild(fpsContainer);
    hudContainer.appendChild(pingContainer);

    const separator = document.createElement("div");
    Object.assign(separator.style, {
        width: "1px",
        height: "15px",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        margin: "0 5px"
    });
    hudContainer.insertBefore(separator, pingContainer);
    
    // Indicateur de manette
    const gamepadContainer = document.createElement("div");
    Object.assign(gamepadContainer.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    });
    
    const gamepadIcon = document.createElement("div");
    gamepadIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.5,7 L17.5,11 L15.5,11 L15.5,13 L13.5,13 L13.5,11 L11.5,11 L11.5,13 L9.5,13 L9.5,11 L7.5,11 L7.5,7 C7.5,5.9 8.4,5 9.5,5 L15.5,5 C16.6,5 17.5,5.9 17.5,7 Z M22,9 L22,15 C22,16.66 20.66,18 19,18 C18.07,18 17.22,17.59 16.63,16.92 L15.15,15 L9.85,15 L8.37,16.92 C7.78,17.59 6.93,18 6,18 C4.34,18 3,16.66 3,15 L3,9 C3,7.34 4.34,6 6,6 C6.93,6 7.78,6.41 8.37,7.08 L9.85,9 L15.15,9 L16.63,7.08 C17.22,6.41 18.07,6 19,6 C20.66,6 22,7.34 22,9 Z M5,10 L4,10 L4,12 L2,12 L2,13 L4,13 L4,15 L5,15 L5,13 L7,13 L7,12 L5,12 L5,10 Z M19,10 C18.45,10 18,10.45 18,11 C18,11.55 18.45,12 19,12 C19.55,12 20,11.55 20,11 C20,10.45 19.55,10 19,10 Z M19,8 C18.45,8 18,8.45 18,9 C18,9.55 18.45,10 19,10 C19.55,10 20,9.55 20,9 C20,8.45 19.55,8 19,8 Z" fill="rgba(255, 255, 255, 0.7)"/>
    </svg>`;
    Object.assign(gamepadIcon.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        minWidth: "16px",
        position: "relative",
        overflow: "visible",
        opacity: "0.5"
    });
    gamepadContainer.appendChild(gamepadIcon);
    
    const gamepadStatus = document.createElement("div");
    gamepadStatus.id = "gamepad-status";
    gamepadStatus.textContent = "Aucune manette";
    Object.assign(gamepadStatus.style, {
        fontWeight: "bold",
        minWidth: "70px",
        color: "rgba(255, 255, 255, 0.5)"
    });
    gamepadContainer.appendChild(gamepadStatus);
    
    const gamepadSeparator = document.createElement("div");
    Object.assign(gamepadSeparator.style, {
        width: "1px",
        height: "15px",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        margin: "0 5px"
    });
    
    // Ajouter l'indicateur de manette au HUD
    hudContainer.appendChild(gamepadSeparator);
    hudContainer.appendChild(gamepadContainer);

    document.body.appendChild(hudContainer);

    hudContainer.fpsValue = fpsValue;
    hudContainer.pingValue = pingValue;
    hudContainer.networkBars = Array.from(networkBars.children);
    hudContainer.gamepadStatus = gamepadStatus;
    hudContainer.gamepadIcon = gamepadIcon;

    hudContainer.updateFPS = function(fps) {
        fpsValue.textContent = `${Math.round(fps)} FPS`;
        if (fps >= 50) {
            fpsValue.style.color = "#7FFF7F";
        } else if (fps >= 30) {
            fpsValue.style.color = "#FFFF7F";
        } else {
            fpsValue.style.color = "#FF7F7F";
        }
    };

    hudContainer.updatePing = function(ping) {
        if (ping === undefined || ping === null) {
            pingValue.textContent = "-- ms";
            this.networkBars.forEach(bar => {
                bar.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
            });
            return;
        }

        ping = Number(ping);
        pingValue.textContent = `${ping} ms`;

        let pingColor;
        let activeBars = 0;

        if (ping < 50) {
            pingColor = "#7FFF7F";
            activeBars = 4;
        } else if (ping < 100) {
            pingColor = "#BFFF7F";
            activeBars = 3;
        } else if (ping < 150) {
            pingColor = "#FFFF7F";
            activeBars = 2;
        } else if (ping < 200) {
            pingColor = "#FFBF7F";
            activeBars = 1;
        } else {
            pingColor = "#FF7F7F";
            activeBars = 0;
        }

        pingValue.style.color = pingColor;

        this.networkBars.forEach((bar, index) => {
            bar.style.backgroundColor = index < activeBars ? pingColor : "rgba(255, 255, 255, 0.3)";
        });
    };

    hudContainer.updateGamepadStatus = function(connected, gamepadName = "") {
        if (connected) {
            gamepadStatus.textContent = "Manette PS4";
            gamepadStatus.style.color = "#7FFF7F";
            gamepadIcon.querySelector("path").setAttribute("fill", "#7FFF7F");
            gamepadIcon.style.opacity = "1";
        } else {
            gamepadStatus.textContent = "Aucune manette";
            gamepadStatus.style.color = "rgba(255, 255, 255, 0.5)";
            gamepadIcon.querySelector("path").setAttribute("fill", "rgba(255, 255, 255, 0.7)");
            gamepadIcon.style.opacity = "0.5";
        }
    };

    return hudContainer;
}

export function initializeHUDUpdates(hud) {
    let lastPingUpdate = 0;
    let currentPing = null;

    function getNetworkPing() {
        const now = performance.now();
        if (now - lastPingUpdate > 2000) {
            lastPingUpdate = now;
            currentPing = Math.floor(Math.random() * 180) + 20;
        }
        return currentPing;
    }

    const pingUpdateInterval = setInterval(() => {
        const ping = getNetworkPing();
        hud.updatePing(ping);
        
        // Vérifier l'état de la manette
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        const hasGamepad = gamepads && gamepads.some(pad => pad && pad.connected);
        hud.updateGamepadStatus(hasGamepad);
    }, 2000);

    return {
        setFPS: (value) => hud.updateFPS(value),
        setPing: (value) => hud.updatePing(value),
        setGamepadStatus: (connected, name) => hud.updateGamepadStatus(connected, name),
        stop: () => clearInterval(pingUpdateInterval)
    };
}
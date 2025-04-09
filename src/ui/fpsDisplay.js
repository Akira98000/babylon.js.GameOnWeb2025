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

    document.body.appendChild(hudContainer);

    hudContainer.fpsValue = fpsValue;
    hudContainer.pingValue = pingValue;
    hudContainer.networkBars = Array.from(networkBars.children);

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
    }, 2000);

    return {
        setFPS: (value) => hud.updateFPS(value),
        setPing: (value) => hud.updatePing(value),
        stop: () => clearInterval(pingUpdateInterval)
    };
}
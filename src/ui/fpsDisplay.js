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

    hudContainer.appendChild(fpsContainer);

    document.body.appendChild(hudContainer);

    hudContainer.fpsValue = fpsValue;

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



    return hudContainer;
}

export function initializeHUDUpdates(hud) {
    return {
        setFPS: (value) => hud.updateFPS(value)
    };
}
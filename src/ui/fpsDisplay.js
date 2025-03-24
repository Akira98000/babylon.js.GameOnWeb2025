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

    // Icône pour le FPS
    const fpsIcon = document.createElement("div");
    fpsIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM12.5 7H11V13L16.2 16.2L17 14.9L12.5 12.2V7Z" fill="white"/>
    </svg>`;
    // Assurez-vous que l'icône est bien visible
    Object.assign(fpsIcon.style, {
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "16px",
        height: "16px",
        minWidth: "16px", // Garantir une largeur minimale
        position: "relative", // Pour un meilleur positionnement
        overflow: "visible" // Pour s'assurer que le SVG n'est pas coupé
    });
    fpsContainer.appendChild(fpsIcon);

    // Affichage du FPS
    const fpsValue = document.createElement("div");
    fpsValue.id = "fps-value";
    fpsValue.textContent = "0 FPS";
    Object.assign(fpsValue.style, {
        fontWeight: "bold",
        minWidth: "60px"
    });
    fpsContainer.appendChild(fpsValue);

    // Conteneur pour le ping
    const pingContainer = document.createElement("div");
    Object.assign(pingContainer.style, {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    });

    // Créer l'indicateur de barres de réseau
    const networkBars = document.createElement("div");
    Object.assign(networkBars.style, {
        display: "flex",
        alignItems: "flex-end",
        gap: "2px",
        height: "15px",
        minWidth: "16px" // Assurer une largeur minimale pour l'indicateur de réseau
    });

    // Créer 4 barres pour l'indicateur de réseau
    for (let i = 0; i < 4; i++) {
        const bar = document.createElement("div");
        const height = (i + 1) * 3 + 3; // Hauteur progressive des barres
        Object.assign(bar.style, {
            width: "3px",
            height: height + "px",
            backgroundColor: "rgba(255, 255, 255, 0.3)", // Couleur par défaut
            borderRadius: "1px",
            transition: "background-color 0.3s ease",
            minWidth: "3px", // Garantir une largeur minimale
            display: "block", // S'assurer que l'élément est affiché comme un bloc
            flexShrink: "0" // Empêcher le rétrécissement des barres
        });
        bar.id = `network-bar-${i}`;
        networkBars.appendChild(bar);
    }
    pingContainer.appendChild(networkBars);

    // Affichage du ping
    const pingValue = document.createElement("div");
    pingValue.id = "ping-value";
    pingValue.textContent = "-- ms";
    Object.assign(pingValue.style, {
        fontWeight: "bold",
        minWidth: "55px"
    });
    pingContainer.appendChild(pingValue);

    // Ajouter les conteneurs au HUD
    hudContainer.appendChild(fpsContainer);
    hudContainer.appendChild(pingContainer);

    // Ajouter un séparateur vertical
    const separator = document.createElement("div");
    Object.assign(separator.style, {
        width: "1px",
        height: "15px",
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        margin: "0 5px"
    });
    // Insérer le séparateur entre les deux éléments
    hudContainer.insertBefore(separator, pingContainer);

    // Bouton de fermeture
    const closeButton = document.createElement("div");
    closeButton.textContent = "×";
    Object.assign(closeButton.style, {
        marginLeft: "8px",
        cursor: "pointer",
        fontSize: "16px",
        fontWeight: "bold",
        opacity: "0.7",
        transition: "opacity 0.2s ease"
    });
    
    closeButton.addEventListener("mouseover", () => {
        closeButton.style.opacity = "1";
    });
    
    closeButton.addEventListener("mouseout", () => {
        closeButton.style.opacity = "0.7";
    });
    
    closeButton.addEventListener("click", () => {
        hudContainer.style.opacity = "0";
        setTimeout(() => {
            hudContainer.style.display = "none";
        }, 300);
    });
    
    hudContainer.appendChild(closeButton);
    
    // Ajouter le HUD au corps du document
    document.body.appendChild(hudContainer);
    
    // Stocker les références aux éléments qui seront mis à jour
    hudContainer.fpsValue = fpsValue;
    hudContainer.pingValue = pingValue;
    hudContainer.networkBars = Array.from(networkBars.children);

    // Méthode pour mettre à jour l'affichage des FPS
    hudContainer.updateFPS = function(fps) {
        fpsValue.textContent = `${Math.round(fps)} FPS`;
        
        // Changer la couleur en fonction de la valeur
        if (fps >= 50) {
            fpsValue.style.color = "#7FFF7F"; // Vert
        } else if (fps >= 30) {
            fpsValue.style.color = "#FFFF7F"; // Jaune
        } else {
            fpsValue.style.color = "#FF7F7F"; // Rouge
        }
    };

    // Méthode pour mettre à jour l'affichage du ping
    hudContainer.updatePing = function(ping) {
        // Si le ping est undefined ou null, on affiche -- ms
        if (ping === undefined || ping === null) {
            pingValue.textContent = "-- ms";
            // Toutes les barres sont grisées
            this.networkBars.forEach(bar => {
                bar.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
            });
            return;
        }
        
        // Convertir ping en nombre pour s'assurer qu'il est traité correctement
        ping = Number(ping);
        pingValue.textContent = `${ping} ms`;
        
        // Changer la couleur en fonction de la valeur du ping
        let pingColor;
        let activeBars = 0;
        
        if (ping < 50) {
            pingColor = "#7FFF7F"; // Vert
            activeBars = 4;
        } else if (ping < 100) {
            pingColor = "#BFFF7F"; // Vert-jaune
            activeBars = 3;
        } else if (ping < 150) {
            pingColor = "#FFFF7F"; // Jaune
            activeBars = 2;
        } else if (ping < 200) {
            pingColor = "#FFBF7F"; // Orange
            activeBars = 1;
        } else {
            pingColor = "#FF7F7F"; // Rouge
            activeBars = 0;
        }
        
        pingValue.style.color = pingColor;
        
        // Mettre à jour les barres
        this.networkBars.forEach((bar, index) => {
            if (index < activeBars) {
                bar.style.backgroundColor = pingColor;
            } else {
                bar.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
            }
        });
    };
  
    return hudContainer;
}

// Ajouter cette nouvelle fonction d'initialisation
export function initializeHUDUpdates(hud) {
    // Simulation d'une fonction pour obtenir le ping (à remplacer par votre vrai mécanisme)
    let lastPingUpdate = 0;
    let currentPing = null;
    
    function getNetworkPing() {
        // Remplacez cette fonction par votre véritable méthode d'obtention du ping
        // Simulation de ping qui change toutes les 2 secondes
        const now = performance.now();
        if (now - lastPingUpdate > 2000) {
            lastPingUpdate = now;
            // Simulation d'un ping entre 20 et 200ms
            currentPing = Math.floor(Math.random() * 180) + 20;
        }
        return currentPing;
    }
    
    // Mettre à jour le ping toutes les 2 secondes
    const pingUpdateInterval = setInterval(() => {
        const ping = getNetworkPing();
        hud.updatePing(ping);
    }, 2000);
    
    return {
        // Retourne des méthodes pour contrôler manuellement l'affichage
        setFPS: (value) => hud.updateFPS(value),
        setPing: (value) => hud.updatePing(value),
        // Méthode pour arrêter les mises à jour
        stop: () => clearInterval(pingUpdateInterval)
    };
}
  
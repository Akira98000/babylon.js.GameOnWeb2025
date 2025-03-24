
export const createCompass = () => {
    const compass = document.createElement('div');
    compass.id = 'compass';
    document.body.appendChild(compass);
    
    const compassMarkersContainer = document.createElement('div');
    compassMarkersContainer.classList.add('compass-markers-container');
    compass.appendChild(compassMarkersContainer);
    
    const directions = [
        { label: 'N', angle: 0, value: '0' },
        { label: 'NE', angle: 45, value: '45' },
        { label: 'E', angle: 90, value: '90' },
        { label: 'SE', angle: 135, value: '135' },
        { label: 'S', angle: 180, value: '180' },
        { label: 'SW', angle: 225, value: '225' },
        { label: 'W', angle: 270, value: '270' },
        { label: 'NW', angle: 315, value: '315' }
    ];
    
    directions.forEach(direction => {
        const markerContainer = document.createElement('div');
        markerContainer.classList.add('compass-marker-container');
        markerContainer.dataset.angle = direction.angle;
        
        const marker = document.createElement('div');
        marker.classList.add('compass-marker');
        marker.textContent = direction.label;
        
        const valueLabel = document.createElement('div');
        valueLabel.classList.add('compass-value');
        valueLabel.textContent = direction.value;
        
        
        markerContainer.appendChild(marker);
        markerContainer.appendChild(valueLabel);
        compassMarkersContainer.appendChild(markerContainer);
    });
    
    // Ajouter des graduations numériques tous les 15 degrés
    for (let angle = 15; angle < 360; angle += 15) {
        if (angle % 45 !== 0) { // Éviter de dupliquer les points cardinaux principaux
            // Créer le trait de graduation
            const minorMarker = document.createElement('div');
            minorMarker.classList.add('compass-minor-marker');
            minorMarker.dataset.angle = angle;
            compassMarkersContainer.appendChild(minorMarker);
            
            // Ajouter la valeur numérique des graduations intermédiaires
            const valueLabel = document.createElement('div');
            valueLabel.classList.add('compass-value', 'compass-minor-value');
            valueLabel.textContent = angle.toString();
            valueLabel.dataset.angle = angle;
            compassMarkersContainer.appendChild(valueLabel);
        }
    }
    
    // Ajouter l'indicateur central (la pointe au milieu)
    const centerIndicator = document.createElement('div');
    centerIndicator.classList.add('compass-center-indicator');
    compass.appendChild(centerIndicator);
    
    // Fonction pour mettre à jour la position des marqueurs en fonction de la rotation du joueur
    const updateCompass = (playerRotationY) => {
        // Convertir la rotation en degrés (Babylon utilise des radians)
        // Ajuster pour que 0 soit au Nord et que la rotation soit dans le sens des aiguilles d'une montre
        let degrees = ((playerRotationY * 180 / Math.PI) + 90) % 360;
        if (degrees < 0) degrees += 360;
        
        // Déterminer quels marqueurs doivent être visibles
        // Récupérer tous les éléments avec des angles
        const allMarkers = compassMarkersContainer.querySelectorAll('[data-angle]');
        
        allMarkers.forEach(marker => {
            // Obtenir l'angle du marqueur
            const markerAngle = parseInt(marker.dataset.angle);
            
            // Calculer la différence d'angle entre la direction du joueur et le marqueur
            let diff = (markerAngle - degrees + 360) % 360;
            if (diff > 180) diff = diff - 360;
            
            // Déterminer si le marqueur doit être visible (dans une plage de ±50 degrés)
            const visible = Math.abs(diff) <= 50;
            
            // Calculer la position horizontale en fonction de la différence d'angle
            const position = diff * 5; // 5px par degré pour l'échelle
            
            // Appliquer les styles
            marker.style.display = visible ? 'block' : 'none';
            
            if (visible) {
                marker.style.transform = `translateX(${position}px)`;
                if (marker.classList.contains('compass-marker-container')) {
                    marker.style.left = '50%';
                } else if (marker.classList.contains('compass-minor-marker') || 
                           marker.classList.contains('compass-minor-value')) {
                    marker.style.left = '50%';
                }
                
                // Ajuster l'opacité en fonction de la proximité au centre
                const opacity = 1 - Math.abs(diff) / 50 * 0.6; // Diminution progressive de l'opacité
                marker.style.opacity = opacity.toFixed(2);
            }
        });
        
        // Afficher la direction exacte actuelle au-dessus de l'indicateur
        const currentDegrees = Math.round(degrees);
        centerIndicator.setAttribute('data-degrees', currentDegrees);
    };
    
    return {
        element: compass,
        update: updateCompass
    };
};

// Ajouter les styles CSS nécessaires pour la boussole
const addCompassStyles = () => {
    const compassStyle = document.createElement('style');
    compassStyle.textContent = `
        #compass {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 40px;
            margin: 0 auto;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            overflow: hidden;
            pointer-events: none;
            z-index: 1000;
        }
        
        .compass-markers-container {
            position: relative;
            height: 100%;
            width: 100%;
            max-width: 500px;
            margin: 0 auto;
        }
        
        .compass-marker-container {
            position: absolute;
            top: 3px;
            height: 30px;
            text-align: center;
            width: 30px;
            transform: translateX(-50%);
            transition: transform 0.1s ease-out, opacity 0.1s ease-out;
        }
        
        .compass-marker {
            font-size: 16px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(0, 0, 0, 0.7);
            letter-spacing: 0px;
            font-family: 'Arial', sans-serif;
            line-height: 1;
            margin-bottom: 2px;
        }
        
        .compass-value {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.8);
            font-family: 'Arial', sans-serif;
            line-height: 1;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
        }
        
        .compass-minor-value {
            position: absolute;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            transition: transform 0.1s ease-out, opacity 0.1s ease-out;
        }
        
        .compass-minor-marker {
            position: absolute;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            width: 1px;
            height: 8px;
            background-color: rgba(255, 255, 255, 0.5);
            transition: transform 0.1s ease-out, opacity 0.1s ease-out;
        }
        
        .compass-center-indicator {
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 8px solid white;
            z-index: 1001;
        }
        
        .compass-center-indicator::after {
            content: attr(data-degrees) "°";
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
        }
        
        /* Styles spécifiques pour les points cardinaux principaux */
        .compass-marker-container[data-angle="0"] .compass-marker,
        .compass-marker-container[data-angle="90"] .compass-marker,
        .compass-marker-container[data-angle="180"] .compass-marker,
        .compass-marker-container[data-angle="270"] .compass-marker {
            color: #fff;
            font-size: 18px;
        }
        
        /* Style spécifique pour les inter-cardinaux */
        .compass-marker-container[data-angle="45"] .compass-marker,
        .compass-marker-container[data-angle="135"] .compass-marker,
        .compass-marker-container[data-angle="225"] .compass-marker,
        .compass-marker-container[data-angle="315"] .compass-marker {
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
        }
    `;
    document.head.appendChild(compassStyle);
};

// Fonction principale qui crée la boussole et ajoute les styles
export const setupCompass = () => {
    addCompassStyles();
    return createCompass();
}; 
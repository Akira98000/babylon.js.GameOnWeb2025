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

    for (let angle = 15; angle < 360; angle += 15) {
        if (angle % 45 !== 0) {
            const minorMarker = document.createElement('div');
            minorMarker.classList.add('compass-minor-marker');
            minorMarker.dataset.angle = angle;
            compassMarkersContainer.appendChild(minorMarker);

            const valueLabel = document.createElement('div');
            valueLabel.classList.add('compass-value', 'compass-minor-value');
            valueLabel.textContent = angle.toString();
            valueLabel.dataset.angle = angle;
            compassMarkersContainer.appendChild(valueLabel);
        }
    }

    const centerIndicator = document.createElement('div');
    centerIndicator.classList.add('compass-center-indicator');
    compass.appendChild(centerIndicator);

    const updateCompass = (playerRotationY) => {
        let degrees = ((playerRotationY * 180 / Math.PI) + 90) % 360;
        if (degrees < 0) degrees += 360;

        const allMarkers = compassMarkersContainer.querySelectorAll('[data-angle]');

        allMarkers.forEach(marker => {
            const markerAngle = parseInt(marker.dataset.angle);
            let diff = (markerAngle - degrees + 360) % 360;
            if (diff > 180) diff = diff - 360;

            const visible = Math.abs(diff) <= 50;
            const position = diff * 5;

            marker.style.display = visible ? 'block' : 'none';

            if (visible) {
                marker.style.transform = `translateX(${position}px)`;
                marker.style.left = '50%';

                const opacity = 1 - Math.abs(diff) / 50 * 0.6;
                marker.style.opacity = opacity.toFixed(2);
            }
        });

        const currentDegrees = Math.round(degrees);
        centerIndicator.setAttribute('data-degrees', currentDegrees);
    };

    return {
        element: compass,
        update: updateCompass
    };
};

export const setupCompass = () => {
    return createCompass();
};
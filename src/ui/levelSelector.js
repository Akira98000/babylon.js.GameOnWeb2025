export class LevelSelector {
    constructor(levelManager) {
        this.levelManager = levelManager;
        this.container = null;
        this.isVisible = false;
        this.createUI();
    }

    createUI() {
        // Créer le conteneur principal
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.display = 'none';

        // Créer le bouton pour chaque niveau
        for (let i = 0; i <= 6; i++) {
            const button = document.createElement('button');
            button.textContent = i === 0 ? `Tutoriel` : `Niveau ${i}`;
            button.style.display = 'block';
            button.style.margin = '5px';
            button.style.padding = '5px 10px';
            button.style.backgroundColor = '#4CAF50';
            button.style.border = 'none';
            button.style.color = 'white';
            button.style.cursor = 'pointer';
            button.style.borderRadius = '3px';

            button.addEventListener('click', () => {
                this.levelManager.goToLevel(i);
            });

            this.container.appendChild(button);
        }

        // Ajouter au document
        document.body.appendChild(this.container);

        // Ajouter un écouteur pour la touche 'L'
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'l') {
                this.toggle();
            }
        });
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
} 
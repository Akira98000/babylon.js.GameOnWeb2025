export class LevelSelector {
    constructor(levelManager) {
        this.levelManager = levelManager;
        this.container = null;
        this.modalContainer = null;
        this.isVisible = false;
        this.createUI();
        this.createModal();
    }

    createUI() {
        // Créer le conteneur principal (bouton d'ouverture)
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '10px';
        this.container.style.right = '10px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.zIndex = '1000';
        
        // Créer un bouton pour ouvrir le sélecteur de niveau
        const openButton = document.createElement('button');
        openButton.textContent = 'Niveaux';
        openButton.style.padding = '5px 10px';
        openButton.style.backgroundColor = '#4CAF50';
        openButton.style.border = 'none';
        openButton.style.color = 'white';
        openButton.style.cursor = 'pointer';
        openButton.style.borderRadius = '3px';
        openButton.style.fontWeight = 'bold';

        openButton.addEventListener('click', () => {
            this.showModal();
        });

        this.container.appendChild(openButton);

        // Ajouter au document
        document.body.appendChild(this.container);

        // Ajouter un écouteur pour la touche 'L'
        window.addEventListener('keydown', (event) => {
            if (event.key.toLowerCase() === 'l') {
                this.showModal();
            }
        });
    }

    createModal() {
        // Créer le modal container
        this.modalContainer = document.createElement('div');
        this.modalContainer.id = 'level-selector-modal';
        this.modalContainer.style.position = 'fixed';
        this.modalContainer.style.top = '0';
        this.modalContainer.style.left = '0';
        this.modalContainer.style.width = '100%';
        this.modalContainer.style.height = '100%';
        this.modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.modalContainer.style.display = 'none';
        this.modalContainer.style.justifyContent = 'center';
        this.modalContainer.style.alignItems = 'center';
        this.modalContainer.style.zIndex = '2000';
        
        // Créer le contenu du modal
        const modalContent = document.createElement('div');
        modalContent.style.backgroundColor = '#222';
        modalContent.style.width = '80%';
        modalContent.style.maxWidth = '900px';
        modalContent.style.maxHeight = '80%';
        modalContent.style.borderRadius = '10px';
        modalContent.style.padding = '20px';
        modalContent.style.overflowY = 'auto';
        modalContent.style.position = 'relative';
        modalContent.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)';
        
        // Titre
        const title = document.createElement('h1');
        title.textContent = 'Sélection des Niveaux';
        title.style.color = '#fff';
        title.style.textAlign = 'center';
        title.style.marginBottom = '20px';
        title.style.borderBottom = '2px solid #333';
        title.style.paddingBottom = '10px';
        modalContent.appendChild(title);
        
        // Grille de niveaux
        const levelGrid = document.createElement('div');
        levelGrid.style.display = 'grid';
        levelGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
        levelGrid.style.gap = '15px';
        levelGrid.style.marginBottom = '20px';
        
        // Informations sur les niveaux
        const levelInfo = [
            { name: "Tutoriel", icon: "💡", description: "Apprenez les contrôles de base du jeu." },
            { name: "La Rencontre", icon: "🐕", description: "Trouvez Ray le chien et faites-en votre ami fidèle." },
            { name: "Exploration", icon: "🍌", description: "Trouvez les trois bananes cachées dans le monde." },
            { name: "La Catastrophe", icon: "⚠️", description: "La nuit tombe et les zombies apparaissent !" },
            { name: "La Menace", icon: "🧟", description: "Combattez les hordes de zombies et sauvez la ville." },
            { name: "Les Quartiers", icon: "🏙️", description: "Explorez les différents quartiers de la ville." },
            { name: "L'Ultime Combat", icon: "🚀", description: "Assemblez la fusée et préparez-vous pour l'ultime évasion." }
        ];
        
        // Créer chaque carte de niveau
        for (let i = 0; i <= 6; i++) {
            const levelCard = document.createElement('div');
            levelCard.style.backgroundColor = '#333';
            levelCard.style.borderRadius = '8px';
            levelCard.style.padding = '15px';
            levelCard.style.cursor = 'pointer';
            levelCard.style.transition = 'transform 0.2s, background-color 0.2s';
            levelCard.style.position = 'relative';
            levelCard.style.overflow = 'hidden';
            levelCard.style.border = '2px solid #444';
            
            // En-tête avec icône
            const header = document.createElement('div');
            header.style.display = 'flex';
            header.style.alignItems = 'center';
            header.style.marginBottom = '10px';
            
            const icon = document.createElement('span');
            icon.textContent = levelInfo[i].icon;
            icon.style.fontSize = '24px';
            icon.style.marginRight = '10px';
            
            const levelTitle = document.createElement('h2');
            levelTitle.textContent = levelInfo[i].name;
            levelTitle.style.color = '#fff';
            levelTitle.style.margin = '0';
            
            header.appendChild(icon);
            header.appendChild(levelTitle);
            levelCard.appendChild(header);
            
            // Description
            const description = document.createElement('p');
            description.textContent = levelInfo[i].description;
            description.style.color = '#ccc';
            description.style.margin = '0 0 15px 0';
            levelCard.appendChild(description);
            
            // Bouton de lancement
            const playButton = document.createElement('button');
            playButton.textContent = "Jouer";
            playButton.style.backgroundColor = '#4CAF50';
            playButton.style.color = 'white';
            playButton.style.border = 'none';
            playButton.style.padding = '8px 15px';
            playButton.style.borderRadius = '5px';
            playButton.style.cursor = 'pointer';
            playButton.style.width = '100%';
            playButton.style.fontWeight = 'bold';
            levelCard.appendChild(playButton);
            
            // Écouter les événements
            levelCard.addEventListener('mouseenter', () => {
                levelCard.style.transform = 'translateY(-5px)';
                levelCard.style.backgroundColor = '#3a3a3a';
                levelCard.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
            });
            
            levelCard.addEventListener('mouseleave', () => {
                levelCard.style.transform = 'translateY(0)';
                levelCard.style.backgroundColor = '#333';
                levelCard.style.boxShadow = 'none';
            });
            
            playButton.addEventListener('click', () => {
                this.levelManager.goToLevel(i);
                this.hideModal();
            });
            
            levelGrid.appendChild(levelCard);
        }
        
        modalContent.appendChild(levelGrid);
        
        // Bouton fermer
        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.position = 'absolute';
        closeButton.style.top = '10px';
        closeButton.style.right = '10px';
        closeButton.style.backgroundColor = 'transparent';
        closeButton.style.border = 'none';
        closeButton.style.color = '#fff';
        closeButton.style.fontSize = '24px';
        closeButton.style.cursor = 'pointer';
        closeButton.addEventListener('click', () => {
            this.hideModal();
        });
        modalContent.appendChild(closeButton);
        
        this.modalContainer.appendChild(modalContent);
        document.body.appendChild(this.modalContainer);
        
        // Fermer le modal en cliquant en dehors
        this.modalContainer.addEventListener('click', (event) => {
            if (event.target === this.modalContainer) {
                this.hideModal();
            }
        });
    }

    showModal() {
        this.modalContainer.style.display = 'flex';
    }
    
    hideModal() {
        this.modalContainer.style.display = 'none';
    }

    toggle() {
        this.isVisible = !this.isVisible;
        this.container.style.display = this.isVisible ? 'block' : 'none';
    }

    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        if (this.modalContainer && this.modalContainer.parentNode) {
            this.modalContainer.parentNode.removeChild(this.modalContainer);
        }
    }
} 
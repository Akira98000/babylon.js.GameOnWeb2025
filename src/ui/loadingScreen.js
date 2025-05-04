import * as BABYLON from '@babylonjs/core';

export class LoadingScreen {
    constructor() {
        this.loadingContainer = null;
        this.progressBar = null;
        this.progressText = null;
        this.loadingStepText = null;
        this.loadingPercentage = 0;
        this.isVisible = false;
    }

    show() {
        if (this.loadingContainer) {
            this.loadingContainer.style.display = 'flex';
            return;
        }

        // Conteneur principal avec fond gradient comme le main menu
        this.loadingContainer = document.createElement('div');
        this.loadingContainer.id = 'loadingScreen';
        Object.assign(this.loadingContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(276deg, rgb(0, 0, 0), rgb(0 0 0 / 33%))',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            color: 'white',
            overflow: 'hidden'
        });

        // Conteneur central
        const centerContainer = document.createElement('div');
        Object.assign(centerContainer.style, {
            padding: '30px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '25px',
            maxWidth: '600px',
            width: '90%',
            zIndex: '10'
        });

        // Animation en arrière-plan
        const animationContainer = document.createElement('div');
        Object.assign(animationContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
        });

        // Style pour l'animation
        const animStyle = document.createElement('style');
        animStyle.textContent = `
            @keyframes float {
                0% { transform: translateY(0) rotate(0deg); opacity: 0; }
                10% { opacity: 0.8; }
                90% { opacity: 0.6; }
                100% { transform: translateY(-1500px) rotate(720deg); opacity: 0; }
            }
        `;
        document.head.appendChild(animStyle);

        // Création des éléments flottants
        const symbols = ['✦', '✧', '★', '⚝', '⚹', '✴', '✷', '❈', '❉', '❋'];
        const colors = ['#ffffff', '#86a8e7', '#91eae4', '#b7b7f0', '#d5d5ff'];

        for (let i = 0; i < 40; i++) {
            const element = document.createElement('div');
            const symbol = symbols[Math.floor(Math.random() * symbols.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = Math.random() * 30 + 10;
            const startPositionX = Math.random() * 100;
            const duration = Math.random() * 15 + 10;
            const delay = Math.random() * 10;

            element.textContent = symbol;
            Object.assign(element.style, {
                position: 'absolute',
                bottom: '-100px',
                left: `${startPositionX}%`,
                color: color,
                fontSize: `${size}px`,
                opacity: '0',
                animation: `float ${duration}s linear ${delay}s infinite`,
                zIndex: '1'
            });

            animationContainer.appendChild(element);
        }

        this.loadingContainer.appendChild(animationContainer);

        // Logo du jeu ou élément visuel
        const logoContainer = document.createElement('div');
        Object.assign(logoContainer.style, {
            marginBottom: '40px',
            textAlign: 'center'
        });

        const gameLogo = document.createElement('div');
        gameLogo.textContent = 'D';
        Object.assign(gameLogo.style, {
            fontSize: '6rem',
            fontWeight: 'bold',
            width: '120px',
            height: '120px',
            lineHeight: '120px',
            background: 'linear-gradient(to right, white, #86a8e7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            position: 'relative',
            animation: 'pulse 2s infinite ease-in-out'
        });

        // Ajouter l'animation de pulsation
        const pulseStyle = document.createElement('style');
        pulseStyle.textContent = `
            @keyframes pulse {
                0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(134, 168, 231, 0.4); }
                50% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(134, 168, 231, 0); }
                100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(134, 168, 231, 0); }
            }
        `;
        document.head.appendChild(pulseStyle);

        logoContainer.appendChild(gameLogo);
        centerContainer.appendChild(logoContainer);

        // Texte "Chargement..."
        const loadingText = document.createElement('div');
        loadingText.textContent = 'CHARGEMENT...';
        Object.assign(loadingText.style, {
            fontSize: '1.2rem',
            fontWeight: '600',
            letterSpacing: '3px',
            marginBottom: '20px',
            color: 'rgba(255, 255, 255, 0.9)'
        });
        centerContainer.appendChild(loadingText);

        // Barre de progression avec effet néon
        const progressContainer = document.createElement('div');
        Object.assign(progressContainer.style, {
            width: '100%',
            height: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 0 5px rgba(134, 168, 231, 0.3)'
        });

        this.progressBar = document.createElement('div');
        Object.assign(this.progressBar.style, {
            width: '0%',
            height: '100%',
            background: 'linear-gradient(to right, white, #86a8e7)',
            borderRadius: '4px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            boxShadow: '0 0 10px rgba(134, 168, 231, 0.7)'
        });

        progressContainer.appendChild(this.progressBar);
        centerContainer.appendChild(progressContainer);

        // Texte de progression et description
        const progressInfoContainer = document.createElement('div');
        Object.assign(progressInfoContainer.style, {
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            marginTop: '10px'
        });

        this.progressText = document.createElement('div');
        this.progressText.textContent = '0%';
        Object.assign(this.progressText.style, {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.875rem',
            fontWeight: '500'
        });

        this.loadingStepText = document.createElement('div');
        this.loadingStepText.textContent = 'Initialisation...';
        Object.assign(this.loadingStepText.style, {
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '0.875rem',
            fontWeight: '400',
            textAlign: 'right'
        });

        progressInfoContainer.appendChild(this.loadingStepText);
        progressInfoContainer.appendChild(this.progressText);
        centerContainer.appendChild(progressInfoContainer);

        // Ajout de conseils en dessous de la barre
        const tipContainer = document.createElement('div');
        Object.assign(tipContainer.style, {
            marginTop: '40px',
            padding: '20px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            width: '100%',
            backdropFilter: 'blur(5px)'
        });

        // Titre "Conseils pour gagner"
        const tipTitle = document.createElement('div');
        tipTitle.textContent = 'CONSEILS POUR GAGNER';
        Object.assign(tipTitle.style, {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.9rem',
            fontWeight: '600',
            letterSpacing: '1.5px',
            marginBottom: '15px'
        });

        // Texte du conseil
        const tipText = document.createElement('div');
        Object.assign(tipText.style, {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.875rem',
            fontWeight: '400',
            lineHeight: '1.6',
            transition: 'opacity 0.5s ease'
        });

        // Liste des conseils
        const tips = [
            "Restez attentif aux mouvements des ennemis pour anticiper leurs attaques",
            "Explorez chaque recoin pour découvrir des bonus cachés",
            "Les rêves peuvent contenir des indices sur la suite de votre aventure",
            "Utilisez l'environnement à votre avantage pendant les combats",
            "Certains objets peuvent être combinés pour créer de puissants outils",
            "N'hésitez pas à revenir dans des zones déjà explorées après avoir obtenu de nouvelles capacités",
            "La nuit apporte de nouvelles opportunités et dangers"
        ];

        // Fonction pour changer les conseils
        let currentTipIndex = 0;
        const updateTip = () => {
            tipText.style.opacity = '0';
            setTimeout(() => {
                tipText.textContent = tips[currentTipIndex];
                tipText.style.opacity = '1';
                currentTipIndex = (currentTipIndex + 1) % tips.length;
            }, 500);
        };

        // Initialiser le premier conseil
        tipText.textContent = tips[0];
        setInterval(updateTip, 8000);

        tipContainer.appendChild(tipTitle);
        tipContainer.appendChild(tipText);
        centerContainer.appendChild(tipContainer);

        // Assemblage final des éléments
        this.loadingContainer.appendChild(centerContainer);
        document.body.appendChild(this.loadingContainer);

        this.isVisible = true;
    }

    updateProgress(percentage, stepDescription = null) {
        if (!this.progressBar || !this.progressText) return;
        
        this.loadingPercentage = Math.min(Math.max(percentage, 0), 100);
        this.progressBar.style.width = `${this.loadingPercentage}%`;
        this.progressText.textContent = `${Math.round(this.loadingPercentage)}%`;
        
        if (stepDescription && this.loadingStepText) {
            this.loadingStepText.textContent = stepDescription;
        }
    }

    hide() {
        if (!this.loadingContainer) return;
        
        this.loadingContainer.style.opacity = '0';
        
        setTimeout(() => {
            if (this.loadingContainer) {
                this.loadingContainer.style.display = 'none';
                this.isVisible = false;
            }
        }, 500);
    }
} 
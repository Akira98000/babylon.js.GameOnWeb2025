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

        // Conteneur principal avec fond flouté
        this.loadingContainer = document.createElement('div');
        this.loadingContainer.id = 'loadingScreen';
        Object.assign(this.loadingContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.17)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
        });

        // Conteneur central avec effet glassmorphism
        const centerContainer = document.createElement('div');
        Object.assign(centerContainer.style, {
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '24px',
            padding: '40px',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '25px',
            maxWidth: '400px',
            width: '90%'
        });

        // Titre avec animation de gradient
        const loadingTitle = document.createElement('div');
        loadingTitle.textContent = 'CHARGEMENT';
        Object.assign(loadingTitle.style, {
            color: 'white',
            fontSize: '1.5rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            letterSpacing: '3px',
            background: 'linear-gradient(to right, #fff, #7f7fd5, #fff)',
            backgroundSize: '200% auto',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'gradient 3s linear infinite'
        });

        // Style pour l'animation du gradient
        const style = document.createElement('style');
        style.textContent = `
            @keyframes gradient {
                0% { background-position: 0% center }
                100% { background-position: 200% center }
            }
            @keyframes pulse {
                0% { transform: scale(1) }
                50% { transform: scale(1.02) }
                100% { transform: scale(1) }
            }
        `;
        document.head.appendChild(style);

        // Barre de progression moderne
        const progressContainer = document.createElement('div');
        Object.assign(progressContainer.style, {
            width: '100%',
            height: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '2px',
            overflow: 'hidden',
            position: 'relative'
        });

        this.progressBar = document.createElement('div');
        Object.assign(this.progressBar.style, {
            width: '0%',
            height: '100%',
            background: 'linear-gradient(to right, #7f7fd5, #86a8e7, #91eae4)',
            borderRadius: '2px',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative'
        });

        // Texte de progression minimaliste
        this.progressText = document.createElement('div');
        this.progressText.textContent = '0%';
        Object.assign(this.progressText.style, {
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '0.875rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '500',
            marginTop: '12px',
            letterSpacing: '1px'
        });

        // Texte de l'étape actuelle
        this.loadingStepText = document.createElement('div');
        this.loadingStepText.textContent = 'Initialisation...';
        Object.assign(this.loadingStepText.style, {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: '0.875rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '400',
            textAlign: 'center',
            marginTop: '4px'
        });

        // Ajout de la section des conseils
        const tipContainer = document.createElement('div');
        Object.assign(tipContainer.style, {
            marginTop: '30px',
            padding: '15px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            width: '100%',
            position: 'relative',
            overflow: 'hidden'
        });

        // Icône de conseil
        const tipIcon = document.createElement('div');
        tipIcon.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm1-4h-2V7h2v6z" fill="rgba(255,255,255,0.6)"/>
            </svg>
        `;
        Object.assign(tipIcon.style, {
            position: 'absolute',
            top: '15px',
            left: '20px',
            opacity: '0.6'
        });

        // Conteneur pour le texte du conseil
        const tipTextContainer = document.createElement('div');
        Object.assign(tipTextContainer.style, {
            marginLeft: '28px',
            position: 'relative'
        });

        // Titre "Astuce"
        const tipTitle = document.createElement('div');
        tipTitle.textContent = 'ASTUCE';
        Object.assign(tipTitle.style, {
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: '0.7rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '600',
            letterSpacing: '1.5px',
            marginBottom: '8px'
        });

        // Texte du conseil
        const tipText = document.createElement('div');
        Object.assign(tipText.style, {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '0.875rem',
            fontFamily: "'Inter', sans-serif",
            fontWeight: '400',
            lineHeight: '1.5',
            animation: 'tipFade 8s infinite'
        });

        // Liste des conseils
        const tips = [
            "Utilisez les touches ZQSD pour vous déplacer dans le monde",
            "Appuyez sur M pour afficher la carte du monde",
            "Surveillez vos missions pour progresser dans l'aventure",
            "Explorez l'environnement pour découvrir des secrets cachés",
            "Cliquez pour interagir avec les objets et personnages",
            "La touche B vous permet de danser la samba",
            "Appuyez sur K pour interagir avec les éléments du décor"
        ];

        // Animation pour le changement de conseils
        const tipStyle = document.createElement('style');
        tipStyle.textContent = `
            @keyframes tipFade {
                0%, 15% { opacity: 0; transform: translateY(10px); }
                20%, 90% { opacity: 1; transform: translateY(0); }
                95%, 100% { opacity: 0; transform: translateY(-10px); }
            }
        `;
        document.head.appendChild(tipStyle);

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

        // Assembler la section des conseils
        tipTextContainer.appendChild(tipTitle);
        tipTextContainer.appendChild(tipText);
        tipContainer.appendChild(tipIcon);
        tipContainer.appendChild(tipTextContainer);
        centerContainer.appendChild(tipContainer);

        progressContainer.appendChild(this.progressBar);
        centerContainer.appendChild(loadingTitle);
        centerContainer.appendChild(progressContainer);
        centerContainer.appendChild(this.progressText);
        centerContainer.appendChild(this.loadingStepText);
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
            if (this.loadingContainer && this.loadingContainer.parentNode) {
                this.loadingContainer.parentNode.removeChild(this.loadingContainer);
                this.loadingContainer = null;
                this.progressBar = null;
                this.progressText = null;
                this.loadingStepText = null;
            }
            this.isVisible = false;
        }, 500);
    }
} 
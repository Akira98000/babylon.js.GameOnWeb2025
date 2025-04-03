export class WelcomePage {
    constructor(onComplete) {
        this.onComplete = onComplete;
        this.welcomeContainer = null;
        this.currentPage = 0;
        this.pages = [
            {
                title: "Bienvenue dans Dreamfall !",
                text: "Un monde où les rêves et cauchemars prennent vie. Explorez cet univers fantastique, découvrez ses mystères et combattez les envahisseurs de l'espace onirique.",
                image: "/image/gameplay.png"
            },
            {
                title: "Prêt à jouer ?",
                text: "Collectez des objets, découvrez des easter eggs et explorez le monde qui vous entoure. Des PNJ seront là pour vous aider dans votre aventure.",
                image: "/image/banana.png"
            },
            {
                title: "Manette PS4 supportée !",
                text: "Connectez votre manette PS4 pour jouer ! Utilisez le joystick gauche pour vous déplacer, le joystick droit pour regarder autour de vous. Appuyez sur X, R1 ou R2 pour tirer et Triangle pour danser.",
                image: "/image/controller.svg" 
            }
        ];
        this._createUI();
    }

    _createUI() {
        // Conteneur principal avec un fond noir semi-transparent
        this.welcomeContainer = document.createElement('div');
        Object.assign(this.welcomeContainer.style, {
            position: 'absolute',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '2000',
            overflow: 'hidden',
            backdropFilter: 'blur(5px)'
        });

        const centerContainer = document.createElement('div');
        Object.assign(centerContainer.style, {
            width: '90%',
            maxWidth: '600px', 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'clamp(15px, 3vw, 25px)', 
            boxSizing: 'border-box',
            position: 'relative',
            borderRadius: '12px',
            maxHeight: '80vh', 
        });

        const contentBox = document.createElement('div');
        Object.assign(contentBox.style, {
            padding: 'clamp(10px, 2vw, 20px)', 
            borderRadius: '8px',
            marginBottom: '15px',
            width: '100%'
        });

        const subTitleElement = document.createElement('h2');
        Object.assign(subTitleElement.style, {
            fontSize: 'clamp(1.3rem, 3vw, 1.6rem)', 
            marginBottom: '10px',
            fontWeight: 'bold',
            textAlign: 'center'
        });
        this.subTitleElement = subTitleElement;

        // Texte descriptif
        const textElement = document.createElement('p');
        Object.assign(textElement.style, {
            fontSize: 'clamp(0.9rem, 2vw, 1rem)', 
            lineHeight: '1.4',
            marginBottom: '15px',
            color: 'rgba(255, 255, 255, 0.8)'
        });
        this.textElement = textElement;

        // Image
        const imageElement = document.createElement('img');
        Object.assign(imageElement.style, {
            width: '100%',
            height: 'auto',
            maxHeight: '200px', 
            objectFit: 'cover',
            borderRadius: '6px',
            display: 'block',
            marginBottom: '15px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.3)'
        });
        this.imageElement = imageElement;

        const continueButton = document.createElement('button');
        continueButton.textContent = 'Commencer';
        Object.assign(continueButton.style, {
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            color: 'white',
            border: 'none',
            padding: 'clamp(10px, 2vw, 15px) clamp(15px, 3vw, 30px)',
            width: 'clamp(180px, 50%, 250px)', 
            fontSize: 'clamp(1rem, 2.5vw, 1.5rem)', 
            fontWeight: 'bold',
            borderRadius: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            textAlign: 'center',
            marginTop: '15px'
        });

        continueButton.addEventListener('mouseenter', () => {
            continueButton.style.background = 'rgba(120, 120, 120, 0.5)';
        });

        continueButton.addEventListener('mouseleave', () => {
            continueButton.style.background = 'rgba(100, 100, 100, 0.3)';
        });

        continueButton.addEventListener('click', () => {
            if (this.currentPage < this.pages.length - 1) {
                this.nextPage();
            } else {
                this.complete();
            }
        });

        const pageIndicators = document.createElement('div');
        Object.assign(pageIndicators.style, {
            display: 'flex',
            justifyContent: 'center',
            gap: '6px', 
            marginTop: '15px'
        });

        this.pageIndicators = [];
        for (let i = 0; i < this.pages.length; i++) {
            const indicator = document.createElement('div');
            Object.assign(indicator.style, {
                width: '8px', 
                height: '8px',
                borderRadius: '50%',
                backgroundColor: i === 0 ? '#86a8e7' : 'rgba(255, 255, 255, 0.3)',
                transition: 'background-color 0.3s'
            });
            this.pageIndicators.push(indicator);
            pageIndicators.appendChild(indicator);
        }

        const copyright = document.createElement('div');
        copyright.textContent = '© Team BabyGame - UnicA';
        Object.assign(copyright.style, {
            color: 'rgba(255, 255, 255, 0.6)',
            fontSize: 'clamp(0.7rem, 1.5vw, 0.9rem)', 
            marginTop: '15px'
        });

        contentBox.appendChild(textElement);
        contentBox.appendChild(imageElement);

        centerContainer.appendChild(subTitleElement);
        centerContainer.appendChild(contentBox);
        centerContainer.appendChild(continueButton);
        centerContainer.appendChild(pageIndicators);
        centerContainer.appendChild(copyright);
        this.welcomeContainer.appendChild(centerContainer);
        document.body.appendChild(this.welcomeContainer);
        this.continueButton = continueButton;
        this.updateContent();

        const mediaQuery = window.matchMedia('(max-height: 600px)');
        const handleScreenSizeChange = (e) => {
            if (e.matches) {
                centerContainer.style.maxHeight = '90vh';
                imageElement.style.maxHeight = '150px';
            } else {
                centerContainer.style.maxHeight = '80vh';
                imageElement.style.maxHeight = '200px';
            }
        };
        mediaQuery.addEventListener('change', handleScreenSizeChange);
        handleScreenSizeChange(mediaQuery); 
    }

    updateContent() {
        const page = this.pages[this.currentPage];
        const isLastPage = this.currentPage === this.pages.length - 1;
        
        this.subTitleElement.style.opacity = "0";
        this.textElement.style.opacity = "0";
        this.imageElement.style.opacity = "0";
        
        setTimeout(() => {
            this.subTitleElement.textContent = page.title;
            this.textElement.textContent = page.text;
            this.imageElement.src = page.image;
            this.continueButton.textContent = isLastPage ? "Commencer l'aventure" : "Suivant";
            
            for (let i = 0; i < this.pageIndicators.length; i++) {
                this.pageIndicators[i].style.backgroundColor = 
                    i === this.currentPage ? '#86a8e7' : 'rgba(255, 255, 255, 0.3)';
            }
            
            this.subTitleElement.style.transition = "opacity 0.5s ease-in-out";
            this.textElement.style.transition = "opacity 0.5s ease-in-out";
            this.imageElement.style.transition = "opacity 0.5s ease-in-out";
            
            this.subTitleElement.style.opacity = "1";
            this.textElement.style.opacity = "1";
            this.imageElement.style.opacity = "1";
        }, 300);
    }

    nextPage() {
        if (this.currentPage < this.pages.length - 1) {
            this.currentPage++;
            this.updateContent();
        } else {
            this.complete();
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.updateContent();
        }
    }

    show() {
        if (this.welcomeContainer) {
            this.welcomeContainer.style.display = 'flex';
        }
    }

    hide() {
        if (this.welcomeContainer) {
            this.welcomeContainer.style.display = 'none';
        }
    }

    complete() {
        this.hide();
        if (this.onComplete) {
            this.onComplete();
        }
    }

    dispose() {
        if (this.welcomeContainer && this.welcomeContainer.parentNode) {
            this.welcomeContainer.parentNode.removeChild(this.welcomeContainer);
        }
        this.welcomeContainer = null;
    }
} 
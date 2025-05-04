import * as BABYLON from '@babylonjs/core';
import { LoadingScreen } from './loadingScreen.js';

export class MainMenu {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = new BABYLON.Engine(canvas, true, {
            adaptToDeviceRatio: true
        });
        this.scene = null;
        this.camera = null;
        this.isRotating = true;
        this.onPlayButtonClicked = null;
        this.loadingScreen = new LoadingScreen();
        this.isDisposed = false;
        this.showingPressAnyKey = true;

        this._createScene();

        const resizeHandler = () => {
            if (this.engine && !this.isDisposed) {
                this.engine.resize();
            }
        };

        window.addEventListener('resize', resizeHandler);
        this.resizeHandler = resizeHandler;
    }

    _createScene() {
        this.scene = new BABYLON.Scene(this.engine);
        this.camera = new BABYLON.ArcRotateCamera("MainCamera", Math.PI / 2, Math.PI / 4, 10, BABYLON.Vector3.Zero(), this.scene);
        this.camera.attachControl(this.canvas, true);
        this._createUI();
        this._startRendering();
    }

    _createUI() {
        if (document.getElementById('mainMenuContainer')) return;

        const menuContainer = document.createElement('div');
        menuContainer.id = 'mainMenuContainer';
        Object.assign(menuContainer.style, {
            position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', display: 'flex', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", overflow: 'hidden'
        });

        const leftContainer = document.createElement('div');
        Object.assign(leftContainer.style, {
            width: '55%', height: '100%', background: 'linear-gradient(276deg, rgb(0, 0, 0), rgb(0 0 0 / 33%))', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 5%', position: 'relative', zIndex: '1'
        });

        const rightContainer = document.createElement('div');
        Object.assign(rightContainer.style, {
            width: '45%', height: '100%', position: 'relative', overflow: 'hidden', background:'black'
        });

        const imageElement = document.createElement('div');
        Object.assign(imageElement.style, {
            position: 'absolute', top: '0', right: '0', width: '100%', height: '100%', 
            backgroundImage: 'url("/image/imageLauncher.png")', 
            backgroundSize: 'cover', 
            backgroundPosition: 'center right', 
            clipPath: 'polygon(0 0, 100% 0, 100% 100%, 20% 100%)'
        });

        imageElement.onload = () => {
            console.log("Image chargée avec succès");
        };
        imageElement.onerror = () => {
            console.error("Erreur de chargement de l'image");
        };

        const contentContainer = document.createElement('div');
        Object.assign(contentContainer.style, {
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start', maxWidth: '80%', width: '100%'
        });

        const gameTitle = document.createElement('h1');
        gameTitle.textContent = 'Dreamfall';
        Object.assign(gameTitle.style, {
            color: 'white', fontSize: '4rem', marginBottom: '0.01rem', textAlign: 'left', fontWeight: 'bold', letterSpacing: '2px', background: 'linear-gradient(to right, white, #86a8e7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', width: '100%'
        });

        const subtitle = document.createElement('h2');
        subtitle.textContent = 'The invasion began where dreams were born !';
        Object.assign(subtitle.style, {
            color: 'white', fontSize: '1.3rem', marginBottom: '3rem', marginTop: '0.01rem', textAlign: 'left', opacity: '0.9', width: '100%'
        });

        const pressAnyKeyContainer = document.createElement('div');
        pressAnyKeyContainer.id = 'pressAnyKeyContainer';
        Object.assign(pressAnyKeyContainer.style, {
            display: 'flex', flexDirection: 'column', alignItems: 'left', justifyContent: 'left', 
            width: '100%', textAlign: 'left', marginTop: '1rem',
            transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
        });

        const pressAnyKeyText = document.createElement('div');
        pressAnyKeyText.textContent = 'PRESS ANY KEY TO GET STARTED';
        Object.assign(pressAnyKeyText.style, {
            color: 'white', fontSize: '0.9rem', fontWeight: 'light', letterSpacing: '2px',
            animation: 'pulse 1.5s infinite ease-in-out'
        });

        pressAnyKeyContainer.appendChild(pressAnyKeyText);

        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'buttonsContainer';
        Object.assign(buttonsContainer.style, {
            display: 'none',
            flexDirection: 'column', 
            gap: '1.5rem', 
            width: '100%', 
            alignItems: 'flex-start',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out'
        });

        const createButton = (text, isDisabled = false) => {
            const button = document.createElement('button');
            button.textContent = text;
            Object.assign(button.style, {
                backgroundColor: isDisabled ? 'rgba(100, 100, 100, 0.3)' : 'rgba(100, 100, 100, 0.3)', color: 'white', border: 'none', padding: '15px 30px', width: '250px', fontSize: '1.5rem', fontWeight: 'bold', borderRadius: '15px', cursor: isDisabled ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden', textAlign: 'left'
            });

            if (!isDisabled) {
                button.addEventListener('mouseenter', () => {
                    button.style.background = 'rgba(120, 120, 120, 0.5)';
                });

                button.addEventListener('mouseleave', () => {
                    button.style.background = 'rgba(100, 100, 100, 0.3)';
                });
            }

            return button;
        };

        const playButton = createButton('Play');
        const creditsButton = createButton('Credits');

        playButton.addEventListener('click', () => {
            this._showUsernameForm();
        });

        creditsButton.addEventListener('click', () => {
            this._showCredits();
        });

        buttonsContainer.appendChild(playButton);
        buttonsContainer.appendChild(creditsButton);

        // Création du formulaire de nom d'utilisateur
        const usernameFormContainer = document.createElement('div');
        usernameFormContainer.id = 'usernameFormContainer';
        Object.assign(usernameFormContainer.style, {
            display: 'none',
            flexDirection: 'column',
            width: '100%',
            alignItems: 'flex-start',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
            color: 'white'
        });

        // Titre du formulaire
        const formTitle = document.createElement('h2');
        formTitle.textContent = 'Enter Your Name';
        Object.assign(formTitle.style, {
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, white, #86a8e7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        });

        // Champ de saisie
        const usernameInputContainer = document.createElement('div');
        Object.assign(usernameInputContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            marginBottom: '2rem'
        });

        const usernameLabel = document.createElement('label');
        usernameLabel.textContent = 'Username:';
        usernameLabel.htmlFor = 'usernameInput';
        Object.assign(usernameLabel.style, {
            fontSize: '1.2rem',
            marginBottom: '0.5rem'
        });

        const usernameInput = document.createElement('input');
        usernameInput.type = 'text';
        usernameInput.id = 'usernameInput';
        usernameInput.placeholder = 'Enter your username...';
        usernameInput.maxLength = 20;
        Object.assign(usernameInput.style, {
            backgroundColor: 'rgba(50, 50, 50, 0.6)',
            color: 'white',
            border: '2px solid rgba(138, 43, 226, 0.5)',
            borderRadius: '10px',
            padding: '15px',
            fontSize: '1.2rem',
            width: '100%',
            maxWidth: '350px',
            marginBottom: '0.5rem',
            outline: 'none',
            transition: 'all 0.3s ease'
        });

        usernameInput.addEventListener('focus', () => {
            usernameInput.style.borderColor = 'rgba(138, 43, 226, 0.8)';
            usernameInput.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
        });

        usernameInput.addEventListener('blur', () => {
            usernameInput.style.borderColor = 'rgba(138, 43, 226, 0.5)';
            usernameInput.style.boxShadow = 'none';
        });

        const usernameError = document.createElement('div');
        usernameError.id = 'usernameError';
        Object.assign(usernameError.style, {
            fontSize: '0.9rem',
            color: '#ff6b6b',
            marginTop: '0.5rem',
            height: '20px',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });

        // Conteneur des boutons
        const formButtonsContainer = document.createElement('div');
        Object.assign(formButtonsContainer.style, {
            display: 'flex',
            gap: '15px',
            marginTop: '1rem'
        });

        const submitButton = document.createElement('button');
        submitButton.textContent = 'Choose Character';
        Object.assign(submitButton.style, {
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        submitButton.addEventListener('mouseenter', () => {
            submitButton.style.background = 'rgba(120, 120, 120, 0.5)';
        });

        submitButton.addEventListener('mouseleave', () => {
            submitButton.style.background = 'rgba(100, 100, 100, 0.3)';
        });

        submitButton.addEventListener('click', () => {
            const username = usernameInput.value.trim();
            if (username.length < 3) {
                usernameError.textContent = 'Username must be at least 3 characters long';
                usernameError.style.opacity = '1';
                return;
            }
            
            this.username = username;
            usernameError.style.opacity = '0';
            this._hideUsernameForm();
            this._showCharacterSelection();
        });

        const cancelButton = document.createElement('button');
        cancelButton.textContent = 'Back';
        Object.assign(cancelButton.style, {
            backgroundColor: 'rgba(50, 50, 50, 0.3)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.background = 'rgba(80, 80, 80, 0.4)';
        });

        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.background = 'rgba(50, 50, 50, 0.3)';
        });

        cancelButton.addEventListener('click', () => {
            this._hideUsernameForm();
            // Afficher les boutons principaux
            if (this.buttonsContainer) {
                this.buttonsContainer.style.display = 'flex';
                setTimeout(() => {
                    this.buttonsContainer.style.opacity = '1';
                    this.buttonsContainer.style.transform = 'translateY(0)';
                }, 50);
            }
        });

        usernameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitButton.click();
            }
        });

        usernameInputContainer.appendChild(usernameLabel);
        usernameInputContainer.appendChild(usernameInput);
        usernameInputContainer.appendChild(usernameError);
        formButtonsContainer.appendChild(submitButton);
        formButtonsContainer.appendChild(cancelButton);
        usernameFormContainer.appendChild(formTitle);
        usernameFormContainer.appendChild(usernameInputContainer);
        usernameFormContainer.appendChild(formButtonsContainer);
        contentContainer.appendChild(usernameFormContainer);

        const characterSelectionContainer = document.createElement('div');
        characterSelectionContainer.id = 'characterSelectionContainer';
        Object.assign(characterSelectionContainer.style, {
            display: 'none',
            flexDirection: 'column',
            width: '100%',
            alignItems: 'flex-start',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
            color: 'white'
        });

        const characterSelectionTitle = document.createElement('h2');
        characterSelectionTitle.textContent = 'Choose Your Character';
        Object.assign(characterSelectionTitle.style, {
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, white, #86a8e7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        });

        const characterDescription = document.createElement('div');
        characterDescription.textContent = 'Select your champion for the adventure:';
        Object.assign(characterDescription.style, {
            fontSize: '1.2rem',
            marginBottom: '2rem'
        });

        const charactersContainer = document.createElement('div');
        Object.assign(charactersContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            width: '100%',
            marginBottom: '2rem'
        });

        // Fonction pour créer une option de personnage
        const createCharacterOption = (name, description, isSelected = false) => {
            const characterOption = document.createElement('div');
            characterOption.dataset.character = name.toLowerCase();
            Object.assign(characterOption.style, {
                display: 'flex',
                alignItems: 'center',
                padding: '12px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: isSelected ? 'rgba(138, 43, 226, 0.3)' : 'rgba(50, 50, 50, 0.3)',
                border: isSelected ? '2px solid rgba(138, 43, 226, 0.8)' : '2px solid transparent',
                boxShadow: isSelected ? '0 0 15px rgba(138, 43, 226, 0.5)' : 'none'
            });

            const characterName = document.createElement('div');
            characterName.textContent = name;
            Object.assign(characterName.style, {
                fontWeight: 'bold',
                fontSize: '1.3rem',
                marginRight: '1rem'
            });

            const characterInfo = document.createElement('div');
            characterInfo.textContent = description;
            Object.assign(characterInfo.style, {
                fontSize: '0.9rem',
                opacity: '0.8'
            });

            characterOption.appendChild(characterName);
            characterOption.appendChild(characterInfo);

            characterOption.addEventListener('mouseenter', () => {
                if (!isSelected) {
                    characterOption.style.background = 'rgba(80, 80, 80, 0.5)';
                    characterOption.style.transform = 'translateX(5px)';
                }
            });

            characterOption.addEventListener('mouseleave', () => {
                if (!isSelected) {
                    characterOption.style.background = 'rgba(50, 50, 50, 0.3)';
                    characterOption.style.transform = 'translateX(0)';
                }
            });

            return characterOption;
        };

        // Création d'un seul personnage pour l'instant (la licorne Sexycorn)
        const sexycornOption = createCharacterOption('Sexycorn', 'Magical unicorn with rainbow powers', true);
        const bananaOption = createCharacterOption('Banana', 'Slippery yellow fighter with potassium power', false);
        
        sexycornOption.addEventListener('click', () => {
            charactersContainer.querySelectorAll('div[data-character]').forEach(option => {
                option.style.background = 'rgba(50, 50, 50, 0.3)';
                option.style.border = '2px solid transparent';
                option.style.boxShadow = 'none';
            });
            
            sexycornOption.style.background = 'rgba(138, 43, 226, 0.3)';
            sexycornOption.style.border = '2px solid rgba(138, 43, 226, 0.8)';
            sexycornOption.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
            
            this.selectedCharacter = 'sexycorn';
            this._loadCharacterPreview(this.selectedCharacter);
            
            // Réactiver le bouton Start Adventure
            if (startGameButton) {
                startGameButton.disabled = false;
                startGameButton.style.opacity = '1';
                startGameButton.style.cursor = 'pointer';
                startGameButton.title = '';
            }
        });

        bananaOption.addEventListener('click', () => {
            charactersContainer.querySelectorAll('div[data-character]').forEach(option => {
                option.style.background = 'rgba(50, 50, 50, 0.3)';
                option.style.border = '2px solid transparent';
                option.style.boxShadow = 'none';
            });
            
            bananaOption.style.background = 'rgba(138, 43, 226, 0.3)';
            bananaOption.style.border = '2px solid rgba(138, 43, 226, 0.8)';
            bananaOption.style.boxShadow = '0 0 15px rgba(138, 43, 226, 0.5)';
            
            this.selectedCharacter = 'banana';
            this._loadCharacterPreview(this.selectedCharacter);
            
            // Désactiver le bouton Start Adventure
            if (startGameButton) {
                startGameButton.disabled = true;
                startGameButton.style.opacity = '0.5';
                startGameButton.style.cursor = 'not-allowed';
                startGameButton.title = 'Ce personnage n\'est pas encore disponible';
            }
        });

        charactersContainer.appendChild(sexycornOption);
        charactersContainer.appendChild(bananaOption);

        // Conteneur des boutons
        const characterSelectionButtonsContainer = document.createElement('div');
        Object.assign(characterSelectionButtonsContainer.style, {
            display: 'flex',
            gap: '15px',
            marginTop: '1rem'
        });

        // Bouton pour commencer le jeu
        const startGameButton = document.createElement('button');
        startGameButton.textContent = 'Start Adventure';
        Object.assign(startGameButton.style, {
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        startGameButton.addEventListener('mouseenter', () => {
            startGameButton.style.background = 'rgba(120, 120, 120, 0.5)';
        });

        startGameButton.addEventListener('mouseleave', () => {
            startGameButton.style.background = 'rgba(100, 100, 100, 0.3)';
        });

        startGameButton.addEventListener('click', () => {
            this._hideCharacterSelection();
            this.hide();
            this.loadingScreen.show();
            this._startGameLoading();
        });

        // Bouton pour revenir en arrière
        const backToFormButton = document.createElement('button');
        backToFormButton.innerHTML = 'Back';
        Object.assign(backToFormButton.style, {
            backgroundColor: 'rgba(50, 50, 50, 0.3)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease'
        });

        backToFormButton.addEventListener('mouseenter', () => {
            backToFormButton.style.background = 'rgba(80, 80, 80, 0.4)';
        });

        backToFormButton.addEventListener('mouseleave', () => {
            backToFormButton.style.background = 'rgba(50, 50, 50, 0.3)';
        });

        backToFormButton.addEventListener('click', () => {
            this._hideCharacterSelection();
            this._showUsernameForm();
        });

        // Assemblage du sélecteur de personnages
        characterSelectionButtonsContainer.appendChild(startGameButton);
        characterSelectionButtonsContainer.appendChild(backToFormButton);

        characterSelectionContainer.appendChild(characterSelectionTitle);
        characterSelectionContainer.appendChild(characterDescription);
        characterSelectionContainer.appendChild(charactersContainer);
        characterSelectionContainer.appendChild(characterSelectionButtonsContainer);

        contentContainer.appendChild(characterSelectionContainer);

        const creditsContainer = document.createElement('div');
        creditsContainer.id = 'creditsContainer';
        Object.assign(creditsContainer.style, {
            display: 'none',
            flexDirection: 'column',
            width: '100%',
            alignItems: 'flex-start',
            opacity: '0',
            transform: 'translateY(20px)',
            transition: 'opacity 0.8s ease-in-out, transform 0.8s ease-in-out',
            color: 'white'
        });

        // Titre des crédits
        const creditsTitle = document.createElement('h2');
        creditsTitle.textContent = 'Credits';
        Object.assign(creditsTitle.style, {
            fontSize: '2.5rem',
            marginBottom: '1.5rem',
            background: 'linear-gradient(to right, white, #86a8e7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
        });

        // Description du projet
        const projectDescription = document.createElement('div');
        projectDescription.innerHTML = 'Project created for the GameOnWeb 2025 competition<br>Theme: <strong>DreamLand</strong>';
        Object.assign(projectDescription.style, {
            fontSize: '1.2rem',
            marginBottom: '2rem'
        });

        // Conteneur pour la liste des créateurs
        const creatorsContainer = document.createElement('div');
        Object.assign(creatorsContainer.style, {
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            width: '100%',
            marginBottom: '2rem'
        });

        // Fonction pour créer un profil de créateur
        const createCreatorProfile = (name, githubUsername, imageUrl) => {
            const profileContainer = document.createElement('div');
            Object.assign(profileContainer.style, {
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            });

            const profileImage = document.createElement('div');
            Object.assign(profileImage.style, {
                width: '60px',
                height: '60px',
                borderRadius: '20%',
                background: `url(${imageUrl}) center/cover`,
                boxShadow: '0 0 10px rgba(138, 43, 226, 0.5)'
            });

            const profileInfo = document.createElement('div');
            profileInfo.innerHTML = `<strong>${name}</strong><br><a href="https://github.com/${githubUsername}" target="_blank" style="color: #86a8e7; text-decoration: none;">@${githubUsername}</a>`;

            profileContainer.appendChild(profileImage);
            profileContainer.appendChild(profileInfo);
            return profileContainer;
        };

        const creator1 = createCreatorProfile('Akira Santhakumaran', 'Akira98000', '/image/creators/akira.jpg');
        const creator2 = createCreatorProfile('Germain Doglioli-Duppert', 'GermainDR', '/image/creators/germain.png');
        const creator3 = createCreatorProfile('Logan Laporte', 'pzygwg', '/image/creators/logan.jpg');

        creatorsContainer.appendChild(creator1);
        creatorsContainer.appendChild(creator2);
        creatorsContainer.appendChild(creator3);

        // Bouton de retour
        const backButton = document.createElement('button');
        backButton.innerHTML = 'Back';
        Object.assign(backButton.style, {
            backgroundColor: 'rgba(100, 100, 100, 0.3)',
            color: 'white',
            border: 'none',
            padding: '12px 25px',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            borderRadius: '15px',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            marginTop: '1rem'
        });

        backButton.addEventListener('mouseenter', () => {
            backButton.style.background = 'rgba(120, 120, 120, 0.5)';
        });

        backButton.addEventListener('mouseleave', () => {
            backButton.style.background = 'rgba(100, 100, 100, 0.3)';
        });

        backButton.addEventListener('click', () => {
            this._hideCredits();
        });

        // Assemblage des éléments de crédits
        creditsContainer.appendChild(creditsTitle);
        creditsContainer.appendChild(projectDescription);
        creditsContainer.appendChild(creatorsContainer);
        creditsContainer.appendChild(backButton);

        contentContainer.appendChild(creditsContainer);

        const gameSubtitle = document.createElement('div');
        gameSubtitle.textContent = 'GameOnWeb 2025 : Dreamland Theme';
        Object.assign(gameSubtitle.style, {
            position: 'absolute', bottom: '2rem', left: '2rem', color: 'white', fontSize: '1rem'
        });

        const copyright = document.createElement('div');
        copyright.textContent = '© Team BabyGame - UnicA';
        Object.assign(copyright.style, {
            position: 'absolute', bottom: '1rem', left: '2rem', color: 'white', fontSize: '0.9rem'
        });

        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            @keyframes pulse {0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; }}
            @keyframes fadeIn {0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); }}
            @keyframes fadeOut {0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-20px); }}
        `;
        document.head.appendChild(styleSheet);

        contentContainer.appendChild(gameTitle);
        contentContainer.appendChild(subtitle);
        contentContainer.appendChild(pressAnyKeyContainer);
        contentContainer.appendChild(buttonsContainer);

        leftContainer.appendChild(contentContainer);
        leftContainer.appendChild(gameSubtitle);
        leftContainer.appendChild(copyright);

        rightContainer.appendChild(imageElement);

        menuContainer.appendChild(leftContainer);
        menuContainer.appendChild(rightContainer);

        document.body.appendChild(menuContainer);
        this.menuContainer = menuContainer;
        this.pressAnyKeyContainer = pressAnyKeyContainer;
        this.buttonsContainer = buttonsContainer;
        this.creditsContainer = creditsContainer;
        this.usernameFormContainer = usernameFormContainer;
        this.characterSelectionContainer = characterSelectionContainer;
        this.rightContainer = rightContainer;
        this.username = null;
        this.selectedCharacter = 'sexycorn';
        this.characterPreviewScene = null;

        this._setupPressAnyKeyListener();
    }

    _setupPressAnyKeyListener() {
        const handleKeyPress = (event) => {
            if (this.showingPressAnyKey) {
                this._showMainMenu();
            }
        };

        const handleClick = (event) => {
            if (this.showingPressAnyKey) {
                this._showMainMenu();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        window.addEventListener('click', handleClick);

        this.handleKeyPress = handleKeyPress;
        this.handleClick = handleClick;
    }

    _showMainMenu() {
        this.showingPressAnyKey = false;
        if (this.pressAnyKeyContainer) {
            this.pressAnyKeyContainer.style.opacity = '0';
            this.pressAnyKeyContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.pressAnyKeyContainer.style.display = 'none';
                if (this.buttonsContainer) {
                    this.buttonsContainer.style.display = 'flex';
                    setTimeout(() => {
                        this.buttonsContainer.style.opacity = '1';
                        this.buttonsContainer.style.transform = 'translateY(0)';
                    }, 50);
                }
            }, 800);
        }
    }

    _startRendering() {
        this.engine.runRenderLoop(() => {
            if (!this.scene) return;
            if (this.isRotating) this.camera.alpha += 0.002;
            this.scene.render();
        });
    }

    _showUsernameForm() {
        if (this.buttonsContainer && this.usernameFormContainer) {
            this.buttonsContainer.style.opacity = '0';
            this.buttonsContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.buttonsContainer.style.display = 'none';
                this.usernameFormContainer.style.display = 'flex';
                setTimeout(() => {
                    this.usernameFormContainer.style.opacity = '1';
                    this.usernameFormContainer.style.transform = 'translateY(0)';
                    const usernameInput = document.getElementById('usernameInput');
                    if (usernameInput) {
                        usernameInput.focus();
                    }
                }, 50);
            }, 500);
        }
    }

    _hideUsernameForm() {
        if (this.buttonsContainer && this.usernameFormContainer) {
            // Masquer le formulaire avec animation
            this.usernameFormContainer.style.opacity = '0';
            this.usernameFormContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.usernameFormContainer.style.display = 'none';
                
                // Réinitialiser les erreurs
                const usernameError = document.getElementById('usernameError');
                if (usernameError) {
                    usernameError.style.opacity = '0';
                    usernameError.textContent = '';
                }
            }, 500);
        }
    }

    _showCharacterSelection() {
        // Cacher tout autre contenu visible
        if (this.usernameFormContainer) {
            this.usernameFormContainer.style.opacity = '0';
            this.usernameFormContainer.style.transform = 'translateY(-20px)';
        }
        
        if (this.buttonsContainer) {
            this.buttonsContainer.style.opacity = '0';
            this.buttonsContainer.style.transform = 'translateY(-20px)';
        }
        
        setTimeout(() => {
            if (this.usernameFormContainer) this.usernameFormContainer.style.display = 'none';
            if (this.buttonsContainer) this.buttonsContainer.style.display = 'none';
            if (this.imageElement) {
                this.imageElement.style.display = 'none';
            }
            
            // Créer un canvas pour le modèle 3D
            if (!this.characterPreviewCanvas) {
                this.characterPreviewCanvas = document.createElement('canvas');
                this.characterPreviewCanvas.id = 'characterPreviewCanvas';
                Object.assign(this.characterPreviewCanvas.style, {
                    width: '100%',
                    height: '100%',
                    display: 'block'
                });
                this.rightContainer.appendChild(this.characterPreviewCanvas);
            } else {
                this.characterPreviewCanvas.style.display = 'block';
            }
            
            // Afficher le sélecteur de personnage avec animation
            this.characterSelectionContainer.style.display = 'flex';
            setTimeout(() => {
                this.characterSelectionContainer.style.opacity = '1';
                this.characterSelectionContainer.style.transform = 'translateY(0)';
                
                // Charger le modèle 3D
                this._loadCharacterPreview(this.selectedCharacter);
            }, 50);
        }, 500);
    }

    _hideCharacterSelection() {
        if (this.characterSelectionContainer) {
            this.characterSelectionContainer.style.opacity = '0';
            this.characterSelectionContainer.style.transform = 'translateY(-20px)';
            if (this.characterPreviewScene) {
                this.characterPreviewScene.dispose();
                this.characterPreviewScene = null;
            }
            
            if (this.characterPreviewCanvas) {
                this.characterPreviewCanvas.style.display = 'none';
            }
            
            // Remettre l'image de fond
            if (this.imageElement) {
                this.imageElement.style.display = 'block';
            }
            
            setTimeout(() => {
                this.characterSelectionContainer.style.display = 'none';
            }, 500);
        }
    }

    _loadCharacterPreview(characterId) {
        if (this.characterPreviewScene) {
            this.characterPreviewScene.dispose();
        }

        // Créer une nouvelle scène pour la prévisualisation
        this.characterPreviewScene = new BABYLON.Scene(this.engine);
        
        // Configurer la caméra
        const camera = new BABYLON.ArcRotateCamera("PreviewCamera", 
            -Math.PI / 2, Math.PI / 3, 5, 
            new BABYLON.Vector3(0, 1.2, 0), 
            this.characterPreviewScene);
        
        camera.attachControl(this.characterPreviewCanvas, true);
        camera.lowerRadiusLimit = 3;
        camera.upperRadiusLimit = 8;
        camera.wheelDeltaPercentage = 0.01;
        
        // Ajouter de la lumière
        const hemisphericLight = new BABYLON.HemisphericLight(
            "HemiLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.characterPreviewScene
        );
        hemisphericLight.intensity = 0.7;
        
        const directionalLight = new BABYLON.DirectionalLight(
            "DirLight",
            new BABYLON.Vector3(-1, -2, -1),
            this.characterPreviewScene
        );
        directionalLight.position = new BABYLON.Vector3(5, 10, 5);
        directionalLight.intensity = 0.8;
        
        // Ajouter quelques effets d'environnement
        const environment = this.characterPreviewScene.createDefaultEnvironment({
            createGround: true,
            groundSize: 20,
            skyboxSize: 50,
            groundShadowLevel: 0.6,
            enableGroundShadow: true
        });
        
        if (environment && environment.ground) {
            environment.ground.material.alpha = 0.5;
            environment.ground.position.y = -0.1;
        }
        
        let modelPath;
        let modelScale = new BABYLON.Vector3(1, 1, 1);
        let animationName;
        
        if (characterId === 'sexycorn') {
            modelPath = 'licorn.glb';
            modelScale = new BABYLON.Vector3(0.5, 0.5, 0.5); // Taille réduite pour la licorne
            animationName = 'indianDance';
        } else if (characterId === 'banana') {
            modelPath = 'banana.glb'; 
            modelScale = new BABYLON.Vector3(0.5, 0.5, 0.5);
            animationName = 'pump';
        }
        
        try {
            BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', modelPath, this.characterPreviewScene)
                .then(result => {
                    if (result.meshes.length > 0) {
                        const rootMesh = result.meshes[0];
                        rootMesh.scaling = modelScale; // Appliquer l'échelle spécifique au modèle
                        rootMesh.position = new BABYLON.Vector3(0, 0, 0);
                        
                        if (result.skeletons && result.skeletons.length > 0) {
                            const skeleton = result.skeletons[0];
                    
                            if (this.characterPreviewScene.animationGroups && this.characterPreviewScene.animationGroups.length > 0) {
                                const animationGroups = this.characterPreviewScene.animationGroups;
                                
                                // Arrêter toutes les animations
                                for (let i = 0; i < animationGroups.length; i++) {
                                    animationGroups[i].stop();
                                }
                                
                                // Chercher l'animation spécifique
                                let targetAnimation = null;
                                for (let i = 0; i < animationGroups.length; i++) {
                                    if (animationGroups[i].name.toLowerCase().includes(animationName.toLowerCase())) {
                                        targetAnimation = animationGroups[i];
                                        break;
                                    }
                                }
                                
                                // Si l'animation spécifique est trouvée, la jouer, sinon prendre la première animation
                                if (targetAnimation) {
                                    targetAnimation.play(true);
                                    console.log(`Animation ${animationName} chargée pour ${characterId}`);
                                } else if (animationGroups.length > 0) {
                                    animationGroups[0].play(true);
                                    console.log(`Animation spécifique ${animationName} non trouvée pour ${characterId}, utilisation de la première animation disponible`);
                                }
                            }
                        }
                        
                        // Ajouter une rotation automatique pour le modèle
                        this.characterPreviewScene.registerBeforeRender(() => {
                            camera.alpha += 0.003;
                        });
                    }
                })
                .catch(error => {
                    console.error("Error loading character model:", error);
                });
        } catch (err) {
            console.error("Exception while loading model:", err);
        }
        
        // Configurer le rendu
        this.engine.runRenderLoop(() => {
            if (this.characterPreviewScene && !this.characterPreviewScene.isDisposed) {
                this.characterPreviewScene.render();
            }
        });
    }

    _startGameLoading() {
        const loadingSteps = [
            { description: "Preparing resources...", duration: 300 },
            { description: "Loading textures...", duration: 500 },
            { description: "Initializing game engine...", duration: 400 },
            { description: "Configuring controls...", duration: 200 },
            { description: "Preparing level...", duration: 600 },
            { description: "Finalizing...", duration: 300 }
        ];

        const totalDuration = loadingSteps.reduce((sum, step) => sum + step.duration, 0);
        let elapsedDuration = 0;

        const processNextStep = (stepIndex) => {
            if (this.isDisposed) return;
            if (stepIndex >= loadingSteps.length) {
                setTimeout(() => {
                    if (this.isDisposed) return;
                    this.loadingScreen.updateProgress(100, "Starting game...");
                    setTimeout(() => {
                        if (this.isDisposed) return;
                        this.loadingScreen.hide();
                        const callback = this.onPlayButtonClicked;
                        // Passer le nom d'utilisateur au callback
                        const username = this.username;
                        this.dispose();
                        if (typeof callback === 'function') callback(username);
                    }, 500);
                }, 300);
                return;
            }

            const currentStep = loadingSteps[stepIndex];
            const startProgress = (elapsedDuration / totalDuration) * 100;
            const endProgress = ((elapsedDuration + currentStep.duration) / totalDuration) * 100;

            this.loadingScreen.updateProgress(startProgress, currentStep.description);

            let stepProgress = 0;
            const stepInterval = 30;
            const totalSteps = currentStep.duration / stepInterval;

            const updateStepProgress = () => {
                if (this.isDisposed) return;

                stepProgress++;
                const currentProgress = startProgress + ((endProgress - startProgress) * (stepProgress / totalSteps));
                this.loadingScreen.updateProgress(currentProgress, currentStep.description);

                if (stepProgress < totalSteps) {
                    setTimeout(updateStepProgress, stepInterval);
                } else {
                    elapsedDuration += currentStep.duration;
                    processNextStep(stepIndex + 1);
                }
            };

            setTimeout(updateStepProgress, stepInterval);
        };

        this.loadingScreen.show();
        setTimeout(() => processNextStep(0), 200);
    }

    show() {
        if (this.menuContainer) this.menuContainer.style.display = 'flex';
        this.isRotating = true;
    }

    hide() {
        if (this.menuContainer) this.menuContainer.style.display = 'none';
        this.isRotating = false;
    }

    dispose() {
        if (this.isDisposed) return;
        this.isDisposed = true;

        if (this.handleKeyPress) {
            window.removeEventListener('keydown', this.handleKeyPress);
            this.handleKeyPress = null;
        }

        if (this.handleClick) {
            window.removeEventListener('click', this.handleClick);
            this.handleClick = null;
        }

        if (this.engine) {
            try {
                this.engine.stopRenderLoop();
            } catch (e) {
                console.warn("Erreur lors de l'arrêt de la boucle de rendu:", e);
            }
        }

        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = null;
        }

        if (this.menuContainer?.parentNode) {
            this.menuContainer.parentNode.removeChild(this.menuContainer);
            this.menuContainer = null;
        }

        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }

        this.camera = null;
        this.engine = null;
    }

    _showCredits() {
        if (this.buttonsContainer && this.creditsContainer) {
            // Masquer les boutons avec animation
            this.buttonsContainer.style.opacity = '0';
            this.buttonsContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.buttonsContainer.style.display = 'none';
                
                // Afficher les crédits avec animation
                this.creditsContainer.style.display = 'flex';
                setTimeout(() => {
                    this.creditsContainer.style.opacity = '1';
                    this.creditsContainer.style.transform = 'translateY(0)';
                }, 50);
            }, 500);
        }
    }

    _hideCredits() {
        if (this.buttonsContainer && this.creditsContainer) {
            // Masquer les crédits avec animation
            this.creditsContainer.style.opacity = '0';
            this.creditsContainer.style.transform = 'translateY(-20px)';
            
            setTimeout(() => {
                this.creditsContainer.style.display = 'none';
                
                // Afficher les boutons avec animation
                this.buttonsContainer.style.display = 'flex';
                setTimeout(() => {
                    this.buttonsContainer.style.opacity = '1';
                    this.buttonsContainer.style.transform = 'translateY(0)';
                }, 50);
            }, 500);
        }
    }
}

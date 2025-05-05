# Dreamfall

Un jeu d'action-aventure 3D développé avec BabylonJS pour la compétition Game On Web 2025.

## Aperçu

Dreamfall est une aventure immersive en 3D où les joueurs incarnent une licorne à travers différents niveaux, affrontent des ennemis, recrutent des alliés et explorent un monde dynamique. Le jeu propose des mécaniques de combat, une progression du personnage et une narration captivante à travers plusieurs niveaux uniques.

## Fonctionnalités

- Monde 3D immersif : Explorez des environnements variés avec des cycles jour/nuit et des effets météo dynamiques  
- Système de combat : Affrontez vos ennemis à l’aide de projectiles et de mécaniques variées  
- Système d’alliés : Recrutez des personnages amicaux pour vous aider dans votre quête  
- Progression : Gameplay basé sur des niveaux avec des objectifs et des défis uniques  
- Environnement dynamique : Interagissez avec des PNJ, des systèmes de circulation et une météo changeante  
- Combats de boss : Faites face à des ennemis puissants avec des mécaniques et stratégies spécifiques  

## Niveaux du jeu

1. Tutoriel : Apprenez les commandes de base et les mécaniques du jeu  
2. La Rencontre : Trouvez et devenez ami avec Ray le chien  
3. Exploration : Trouvez les bananes et recrutez-les comme alliés  
4. Le Magicien : Trouvez le magicien pour obtenir des capacités de combat  
5. La Catastrophe : Survivez à la nuit alors que les zombies apparaissent  
6. La Menace : Éliminez les hordes de zombies pour sauver la ville  
7. Le Combat Final : Affrontez le boss ultime dans un combat épique  

## Contrôles

- Mouvement : Touches WASD / ZQSD  
- Viser / Regarder autour : Mouvement de la souris  
- Tirer : Bouton gauche de la souris  
- Interagir : Touche E  
- Pause : Touche ÉCHAP  

## Stack Technique

- Moteur : BabylonJS 7.5+  
- Système de build : Vite  
- Animations : GSAP  
- Physique : Physique intégrée de BabylonJS  
- Interface utilisateur : Composants HTML/CSS personnalisés et BabylonJS GUI  
- Audio : WebAudio API avec son spatial  

## Architecture Technique

### Systèmes principaux

- Gestion des scènes : Chargement modulaire des niveaux avec chargement progressif des assets  
- Système ECS (Entity Component System) : Approche orientée objet pour les entités du jeu  
- Système d’événements : Dispatcher d’événements personnalisés pour communication découplée  
- Machine à états : Contrôle des animations et comportements du joueur et des ennemis  
- Système d’IA : Recherche de chemin et prise de décision via des arbres de comportement  
- Détection de collisions : Groupes et filtres personnalisés pour optimiser les interactions  

### Pipeline de rendu

- Éclairage dynamique : Lumières ponctuelles, directionnelles et spots avec ombrage  
- Systèmes de particules : Particules GPU pour effets visuels (fumée, explosions, magie)  
- Post-traitement : Effets écran comme bloom, profondeur de champ, étalonnage des couleurs  
- Système de matériaux : Matériaux PBR avec normal maps et roughness maps  
- Niveaux de détail : Simplification dynamique des maillages selon la distance  
- Optimisation des scènes : Frustum culling, instancing et texture atlasing  

### Optimisations des performances

- Chargement des assets : Chargement asynchrone avec priorisation et mise en cache  
- Gestion mémoire : Libération des meshes et compression des textures  
- Optimisation WebGL : Réduction des draw calls via combinaison de meshes  
- Threads de fond : Calculs physiques en arrière-plan  
- Optimisation des shaders : Shaders personnalisés pour effets visuels spécifiques  

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/your-username/dreamfall.git

# Se rendre dans le dossier du projet
cd dreamfall

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Construire pour la production
npm run build
```

## Prérequis

- Navigateur moderne avec support WebGL (Chrome recommandé !!!!!)
- Clavier et souris
- Avoir un bon Ordinateur et surtout récent !


## Assets
### Modèles GLB – Personnages

- **Banane** : [https://poly.pizza/m/TFlEjNafR1](https://poly.pizza/m/TFlEjNafR1)  
- **Dog** : [https://poly.pizza/m/1gXKv15ik8](https://poly.pizza/m/1gXKv15ik8)  
- **Licorne** : [https://poly.pizza/m/TLsBUOdTr7](https://poly.pizza/m/TLsBUOdTr7)  
- **Cuisse de poulet** : [https://poly.pizza/m/JdkTgIzJZX](https://poly.pizza/m/JdkTgIzJZX)  
- **Cool Egg** : [https://poly.pizza/m/WnzvqAXBVK](https://poly.pizza/m/WnzvqAXBVK)  
- **Poo (caca)** : [https://poly.pizza/m/03djWQlJue](https://poly.pizza/m/03djWQlJue)  
- **Magicien** : [https://poly.pizza/m/dEuyzEgrF4](https://poly.pizza/m/dEuyzEgrF4)  
- **Reine** : [https://poly.pizza/m/MecWbYSEVe](https://poly.pizza/m/MecWbYSEVe)  
- **Ennemi IA** : [https://poly.pizza/m/EMoKrFEBkc](https://poly.pizza/m/EMoKrFEBkc)  
- **BigBoss** : [https://poly.pizza/m/Q0ZWVssZCg](https://poly.pizza/m/Q0ZWVssZCg)

### Modèles GLB – Bâtiments

- **Building A** : [https://poly.pizza/m/EL3ePInr1N](https://poly.pizza/m/EL3ePInr1N)  
- **Building B** : [https://poly.pizza/m/5XG9i3QzlT](https://poly.pizza/m/5XG9i3QzlT)  
- **Building C** : [https://poly.pizza/m/g15lpKh4li](https://poly.pizza/m/g15lpKh4li)  
- **Building D** : [https://poly.pizza/m/bbH2Bg73qM](https://poly.pizza/m/bbH2Bg73qM)  
- **Building E** : [https://poly.pizza/m/otRsYa6pan](https://poly.pizza/m/otRsYa6pan)  
- **Building F** : [https://poly.pizza/m/qOhhGLftam](https://poly.pizza/m/qOhhGLftam)  
- **Building G** : [https://poly.pizza/m/7lMEpT2ICD](https://poly.pizza/m/7lMEpT2ICD)  
- **Building H** : [https://poly.pizza/m/g15lpKh4li](https://poly.pizza/m/g15lpKh4li)  
- **Building I** : [https://poly.pizza/m/T3oyvK6VEU](https://poly.pizza/m/T3oyvK6VEU)

### Modèles GLB – Objets dans le jeu

- **Traffic Light** : [https://poly.pizza/m/aYC3t5ymln](https://poly.pizza/m/aYC3t5ymln)  
- **Dumpster** : [https://poly.pizza/m/QmYKHtUnxb](https://poly.pizza/m/QmYKHtUnxb)  
- **Fence** : [https://poly.pizza/m/aE3GIx8jIH](https://poly.pizza/m/aE3GIx8jIH)  
- **Route** : [https://poly.pizza/m/5BPCPOycxC](https://poly.pizza/m/5BPCPOycxC)  
- **Cage** : [https://poly.pizza/m/TAqDCvxcxd](https://poly.pizza/m/TAqDCvxcxd)

### Modèles GLB – Véhicules

- **Taxi** : [https://poly.pizza/m/u5PhZQ35XG](https://poly.pizza/m/u5PhZQ35XG)  
- **Voiture verte** : [https://poly.pizza/m/vTTTjDoxhV](https://poly.pizza/m/vTTTjDoxhV)  
- **Voiture de police** : [https://poly.pizza/m/Uj7i2vlmir](https://poly.pizza/m/Uj7i2vlmir)

### Sons

- **Epic War** : [https://pixabay.com/music/main-title-epic-war-background-music-333128/](https://pixabay.com/music/main-title-epic-war-background-music-333128/)  
- **Honey Chill Lofi** : [https://pixabay.com/music/beats-honey-chill-lofi-309227/](https://pixabay.com/music/beats-honey-chill-lofi-309227/)

### Images

Toutes les images ont été générées par **ChatGPT**.

## Équipe

Dreamfall a été créé par l’équipe Babygame pour la compétition Game On Web 2025.

## License
Tous droits réservés © 2025 Babygame & UniCA

import * as BABYLON from '@babylonjs/core';

export class Level2 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.bananas = [];
        this.friendCount = 0;
        this.proximityThreshold = 5;
        this._messageElement = this._createMessage("Appuyez sur F pour devenir ami", "bananaProximityMessage");
        this._keyHandler = this._handleKeyDown.bind(this);
        this.onComplete = null; 
    }

    async init() {
        const positions = [
            new BABYLON.Vector3(0, 0, 0),
            new BABYLON.Vector3(-40, 0, -90),
            new BABYLON.Vector3(-90, 0, 40)
        ];
        

        await Promise.all(positions.map(async (pos, i) => {
            const result = await BABYLON.SceneLoader.ImportMeshAsync('', '/personnage/', 'banana.glb', this.scene);
            const banana = result.meshes[0];
            banana.name = `banana_${i}`;
            banana.scaling.scaleInPlace(0.5);
            banana.position = pos;
            banana.checkCollisions = true;

            this._playAnimation(result.animationGroups, "hello");

            this.bananas.push({ mesh: banana, isFriend: false });
        }));

        window.addEventListener("keydown", this._keyHandler);
    }

    checkProximity(playerPosition) {
        if (this.isCompleted) return;
        const bananaNearby = this.bananas.some(bananaObj => 
            !bananaObj.isFriend && BABYLON.Vector3.Distance(playerPosition, bananaObj.mesh.position) < this.proximityThreshold
        );
        this._toggleMessage(this._messageElement, bananaNearby);
    }

    _handleKeyDown(evt) {
        if (evt.key.toLowerCase() !== 'f' || this.isCompleted) return;

        for (const bananaObj of this.bananas) {
            if (bananaObj.isFriend) continue;
            const playerPos = this.scene.getMeshByName("hero").position;
            if (BABYLON.Vector3.Distance(playerPos, bananaObj.mesh.position) < this.proximityThreshold) {
                bananaObj.isFriend = true;
                this.friendCount++;
                this._displayMessage(`Vous êtes devenu ami avec une CoolBanane ! (${this.friendCount}/3)`, "green", 3000);
                break;
            }
        }
        if (this.friendCount >= 3) this._completeMission();
    }

    _completeMission() {
        if (this.isCompleted) return;
        this.isCompleted = true;
        
        // Masquer tous les messages d'interaction
        this._toggleMessage(this._messageElement, false);
        
        // Supprimer tous les autres messages qui pourraient être affichés
        const allMessages = document.querySelectorAll('[id^="bananaProximity"], [id^="message"], [class*="message"]');
        allMessages.forEach(element => {
            if (element !== this._messageElement) {
                element.style.display = "none";
            }
        });
        
        // Afficher le message de réussite
        const successMessage = this._displayMessage("Vous avez fait ami-ami avec toutes les bananes !", "#00ff00", 3000);
        
        // Supprimer l'écouteur d'événements
        window.removeEventListener("keydown", this._keyHandler);
        
        // Appeler le callback onComplete après un court délai
        setTimeout(() => {
            // S'assurer une dernière fois que tous les messages sont masqués
            this._toggleMessage(this._messageElement, false);
            
            // Supprimer tous les messages, y compris le message de succès
            document.querySelectorAll('[id^="bananaProximity"], [id^="message"], [class*="message"]').forEach(el => {
                el.style.display = "none";
            });
            
            if (successMessage && successMessage.parentNode) {
                successMessage.parentNode.removeChild(successMessage);
            }
            
            // Appeler le callback pour passer au niveau 3
            if (typeof this.onComplete === 'function') {
                this.onComplete();
            }
        }, 3000);
    }

    _playAnimation(animationGroups, name) {
        if (animationGroups && animationGroups.length > 0) {
            animationGroups.forEach(group => {
                if (group.name.toLowerCase().includes(name)) {
                    group.start(true);
                }
            });
        } else {
            const anim = this.scene.getAnimationGroupByName(name);
            if (anim) anim.start(true);
        }
    }

    _toggleMessage(element, visible) {
        if (element) element.style.display = visible ? "block" : "none";
    }

    _createMessage(text, id) {
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            bottom: "40%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            color: "white",
            padding: "10px 15px",
            borderRadius: "5px",
            fontFamily: "Arial, sans-serif",
            fontSize: "16px",
            display: "none",
            zIndex: "1000"
        });
        message.id = id;
        message.textContent = text;
        document.body.appendChild(message);
        return message;
    }

    _displayMessage(text, color, duration = 3000) {
        const message = document.createElement("div");
        Object.assign(message.style, {
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: `rgba(${color === "green" ? "50,205,50" : "0,128,0"},0.8)`,
            color: "white",
            padding: "15px 20px",
            borderRadius: "10px",
            fontFamily: "Arial, sans-serif",
            fontSize: "20px",
            zIndex: "1000"
        });
        message.textContent = text;
        document.body.appendChild(message);
        setTimeout(() => message.remove(), duration);
        return message;
    }
}
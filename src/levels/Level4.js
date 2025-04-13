import * as BABYLON from '@babylonjs/core';
import { EnnemiIA } from '../ennemis/EnnemiIA.js';

export class Level4 {
    constructor(scene) {
        this.scene = scene;
        this.isCompleted = false;
        this.ennemis = [];
        this.messageElement = this._createMessage("", "storyMessage");
        this.nombreEnnemis = 3;
        this.nombreEnnemisVaincus = 0;
    }

    async init() {
        const positions = [
            new BABYLON.Vector3(0, 0, 10),
            new BABYLON.Vector3(0, 0, -10),
            new BABYLON.Vector3(0, 0, -15)
        ];

        for (let i = 0; i < this.nombreEnnemis; i++) {
            const ennemi = new EnnemiIA(this.scene, positions[i], this.scene.metadata.player.hero);
            this.ennemis.push(ennemi);
        }

        this._showMessage("Niveau 4: Combat contre les Pizzas Maléfiques!", 5000);
        setTimeout(() => {
            this._showMessage("Éliminez toutes les pizzas pour gagner!", 4000);
        }, 5000);

        this.scene.onBeforeRenderObservable.add(() => {
            this._checkBulletCollisions();
        });
    }

    _checkBulletCollisions() {
        const meshes = this.scene.meshes;
        for (let mesh of meshes) {
            if (mesh.name.startsWith("bullet")) {
                for (let ennemi of this.ennemis) {
                    if (ennemi.mesh && mesh.intersectsMesh(ennemi.mesh)) {
                        this._eliminerEnnemi(ennemi);
                        mesh.dispose();
                        break;
                    }
                }
            }
        }
    }

    _eliminerEnnemi(ennemi) {
        const index = this.ennemis.indexOf(ennemi);
        if (index > -1) {
            this.ennemis.splice(index, 1);
            ennemi.mesh.dispose();
            this.nombreEnnemisVaincus++;

            if (this.nombreEnnemisVaincus === this.nombreEnnemis) {
                this._victoire();
            } else {
                this._showMessage(`Pizza éliminée! Reste ${this.nombreEnnemis - this.nombreEnnemisVaincus} pizzas!`, 2000);
            }
        }
    }

    _victoire() {
        this.isCompleted = true;
        this._showMessage("Félicitations! Vous avez vaincu toutes les pizzas maléfiques!", 5000);
        setTimeout(() => {
            if (this.scene.metadata.levelManager) {
                this.scene.metadata.levelManager.goToNextLevel();
            }
        }, 5000);
    }

    _createMessage(text, id) {
        const message = document.createElement("div");
        message.id = id;
        message.style.position = "absolute";
        message.style.top = "20%";
        message.style.left = "50%";
        message.style.transform = "translate(-50%, -50%)";
        message.style.color = "white";
        message.style.fontSize = "24px";
        message.style.fontFamily = "Arial, sans-serif";
        message.style.textAlign = "center";
        message.style.textShadow = "2px 2px 4px rgba(0,0,0,0.5)";
        message.style.display = "none";
        document.body.appendChild(message);
        return message;
    }

    _showMessage(text, duration) {
        if (this.messageElement) {
            this.messageElement.textContent = text;
            this.messageElement.style.display = "block";
            setTimeout(() => {
                this.messageElement.style.display = "none";
            }, duration);
        }
    }

    dispose() {
        // Nettoyer les ressources
        for (let ennemi of this.ennemis) {
            if (ennemi.mesh) {
                ennemi.mesh.dispose();
            }
        }
        if (this.messageElement) {
            document.body.removeChild(this.messageElement);
        }
    }
} 
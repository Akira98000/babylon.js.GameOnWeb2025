import * as BABYLON from '@babylonjs/core';
import { GAME_CONFIG } from '../config/gameConfig';

export const createMuzzleFlash = (scene) => {
    const muzzleFlash = new BABYLON.ParticleSystem("muzzleFlash", GAME_CONFIG.PARTICLES.MUZZLE_FLASH.COUNT, scene);
    muzzleFlash.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    muzzleFlash.emitter = new BABYLON.Vector3(0, 0, 0);
    muzzleFlash.minEmitBox = new BABYLON.Vector3(0, 0, 0);
    muzzleFlash.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
    muzzleFlash.color1 = new BABYLON.Color4(1, 0.2, 0, 1.0);
    muzzleFlash.color2 = new BABYLON.Color4(1, 0.5, 0, 1.0);
    muzzleFlash.colorDead = new BABYLON.Color4(0.7, 0.3, 0, 0.0);
    muzzleFlash.minSize = GAME_CONFIG.PARTICLES.MUZZLE_FLASH.SIZE.MIN;
    muzzleFlash.maxSize = GAME_CONFIG.PARTICLES.MUZZLE_FLASH.SIZE.MAX;
    muzzleFlash.minLifeTime = GAME_CONFIG.PARTICLES.MUZZLE_FLASH.LIFETIME.MIN;
    muzzleFlash.maxLifeTime = GAME_CONFIG.PARTICLES.MUZZLE_FLASH.LIFETIME.MAX;
    muzzleFlash.emitRate = 500;
    muzzleFlash.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    muzzleFlash.gravity = new BABYLON.Vector3(0, 0, 0);
    muzzleFlash.direction1 = new BABYLON.Vector3(-0.2, -0.2, 1);
    muzzleFlash.direction2 = new BABYLON.Vector3(0.2, 0.2, 1);
    muzzleFlash.minEmitPower = GAME_CONFIG.PARTICLES.MUZZLE_FLASH.POWER.MIN;
    muzzleFlash.maxEmitPower = GAME_CONFIG.PARTICLES.MUZZLE_FLASH.POWER.MAX;
    muzzleFlash.updateSpeed = 0.01;
    return muzzleFlash;
};

// Fonction pour créer des confettis colorés
export const createConfetti = (scene) => {
    // Créer plusieurs systèmes de particules pour différentes couleurs
    // Utiliser des couleurs très vives et saturées
    const confettiRed = new BABYLON.ParticleSystem("confettiRed", 50, scene);
    confettiRed.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    confettiRed.emitter = new BABYLON.Vector3(0, 0, 0);
    confettiRed.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    confettiRed.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    confettiRed.color1 = new BABYLON.Color4(1, 0, 0, 1); // Rouge pur
    confettiRed.color2 = new BABYLON.Color4(1, 0.3, 0.3, 1); // Rouge clair
    confettiRed.colorDead = new BABYLON.Color4(0.7, 0, 0, 0); // Rouge foncé transparent
    
    const confettiGreen = new BABYLON.ParticleSystem("confettiGreen", 50, scene);
    confettiGreen.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    confettiGreen.emitter = new BABYLON.Vector3(0, 0, 0);
    confettiGreen.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    confettiGreen.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    confettiGreen.color1 = new BABYLON.Color4(0, 1, 0, 1); // Vert pur
    confettiGreen.color2 = new BABYLON.Color4(0.3, 1, 0.3, 1); // Vert clair
    confettiGreen.colorDead = new BABYLON.Color4(0, 0.7, 0, 0); // Vert foncé transparent
    
    const confettiBlue = new BABYLON.ParticleSystem("confettiBlue", 50, scene);
    confettiBlue.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    confettiBlue.emitter = new BABYLON.Vector3(0, 0, 0);
    confettiBlue.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    confettiBlue.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    confettiBlue.color1 = new BABYLON.Color4(0, 0, 1, 1); // Bleu pur
    confettiBlue.color2 = new BABYLON.Color4(0.3, 0.3, 1, 1); // Bleu clair
    confettiBlue.colorDead = new BABYLON.Color4(0, 0, 0.7, 0); // Bleu foncé transparent
    
    const confettiYellow = new BABYLON.ParticleSystem("confettiYellow", 50, scene);
    confettiYellow.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    confettiYellow.emitter = new BABYLON.Vector3(0, 0, 0);
    confettiYellow.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
    confettiYellow.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
    confettiYellow.color1 = new BABYLON.Color4(1, 1, 0, 1); // Jaune pur
    confettiYellow.color2 = new BABYLON.Color4(1, 1, 0.3, 1); // Jaune clair
    confettiYellow.colorDead = new BABYLON.Color4(0.7, 0.7, 0, 0); // Jaune foncé transparent
    
    // Configurer les propriétés communes à tous les systèmes
    const allSystems = [confettiRed, confettiGreen, confettiBlue, confettiYellow];
    
    allSystems.forEach(system => {
        // Taille des confettis - plus grande pour mieux voir les couleurs
        system.minSize = 0.1;
        system.maxSize = 0.3;
        
        // Durée de vie des confettis
        system.minLifeTime = 1.0;
        system.maxLifeTime = 2.0;
        
        // Taux d'émission
        system.emitRate = 75; // Réparti entre les 4 systèmes = 300 au total
        
        // Mode de fusion pour des couleurs vives
        system.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD; // Mode additif pour des couleurs plus vives
        
        // Ajouter de la gravité pour que les confettis tombent
        system.gravity = new BABYLON.Vector3(0, -0.5, 0);
        
        // Direction d'émission dans toutes les directions
        system.direction1 = new BABYLON.Vector3(-1, 1, -1);
        system.direction2 = new BABYLON.Vector3(1, 1, 1);
        
        // Puissance d'émission pour projeter les confettis
        system.minEmitPower = 1;
        system.maxEmitPower = 3;
        
        // Vitesse de rotation des confettis
        system.minAngularSpeed = 0;
        system.maxAngularSpeed = Math.PI * 2;
        
        // Vitesse de mise à jour
        system.updateSpeed = 0.01;
    });
    
    // Créer un objet wrapper pour gérer tous les systèmes ensemble
    const confettiWrapper = {
        // Propriété pour stocker l'émetteur
        _emitter: new BABYLON.Vector3(0, 0, 0),
        
        // Getter et setter pour l'émetteur
        get emitter() {
            return this._emitter;
        },
        
        set emitter(value) {
            this._emitter = value;
            // Mettre à jour l'émetteur pour tous les systèmes
            allSystems.forEach(system => {
                system.emitter = value;
            });
        },
        
        // Méthode pour démarrer tous les systèmes
        start: function() {
            allSystems.forEach(system => {
                system.start();
            });
        },
        
        // Méthode pour arrêter tous les systèmes
        stop: function() {
            allSystems.forEach(system => {
                system.stop();
            });
        },
        
        // Méthode pour disposer tous les systèmes
        dispose: function() {
            allSystems.forEach(system => {
                system.dispose();
            });
        }
    };
    
    return confettiWrapper;
};

export const createEnvironmentParticles = (scene) => {
    const envParticles = new BABYLON.ParticleSystem("particles", 2000, scene);
    envParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    envParticles.emitter = new BABYLON.Vector3(0, 20, 0);
    envParticles.minEmitBox = new BABYLON.Vector3(-50, 10, -50);
    envParticles.maxEmitBox = new BABYLON.Vector3(50, 20, 50);
    envParticles.color1 = new BABYLON.Color4(0.7, 0.3, 0.3, 0.1);
    envParticles.color2 = new BABYLON.Color4(0.5, 0.2, 0.2, 0.1);
    envParticles.colorDead = new BABYLON.Color4(0.2, 0.1, 0.1, 0);
    envParticles.minSize = 0.1;
    envParticles.maxSize = 0.5;
    envParticles.minLifeTime = 5;
    envParticles.maxLifeTime = 10;
    envParticles.emitRate = 100;
    envParticles.gravity = new BABYLON.Vector3(0, -0.05, 0);
    envParticles.direction1 = new BABYLON.Vector3(-1, -1, -1);
    envParticles.direction2 = new BABYLON.Vector3(1, -1, 1);
    envParticles.minAngularSpeed = 0;
    envParticles.maxAngularSpeed = Math.PI;
    envParticles.minEmitPower = 0.1;
    envParticles.maxEmitPower = 0.3;
    envParticles.updateSpeed = 0.01;
    envParticles.start();
    return envParticles;
}; 
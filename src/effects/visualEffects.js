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

export const createConfetti = (scene) => {
    const allSystems = [];
    const colors = [
        { color1: new BABYLON.Color4(1, 0, 0, 1), color2: new BABYLON.Color4(1, 0.3, 0.3, 1) },
        { color1: new BABYLON.Color4(0, 1, 0, 1), color2: new BABYLON.Color4(0.3, 1, 0.3, 1) }
    ];
    colors.forEach((color, index) => {
        const confetti = new BABYLON.ParticleSystem("confetti" + index, 25, scene); // Réduit à 25 par système
        confetti.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
        confetti.emitter = new BABYLON.Vector3(0, 0, 0);
        confetti.minEmitBox = new BABYLON.Vector3(-0.1, -0.1, -0.1);
        confetti.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1);
        confetti.color1 = color.color1;
        confetti.color2 = color.color2;
        confetti.colorDead = new BABYLON.Color4(color.color1.r, color.color1.g, color.color1.b, 0);
        
        confetti.minSize = 0.05;
        confetti.maxSize = 0.15;
        confetti.minLifeTime = 0.5;
        confetti.maxLifeTime = 1.0;
        confetti.emitRate = 50;
        confetti.blendMode = BABYLON.ParticleSystem.BLENDMODE_ADD;
        confetti.gravity = new BABYLON.Vector3(0, -0.5, 0);
        confetti.direction1 = new BABYLON.Vector3(-1, 1, -1);
        confetti.direction2 = new BABYLON.Vector3(1, 1, 1);
        confetti.minEmitPower = 0.5;
        confetti.maxEmitPower = 1.5;
        confetti.minAngularSpeed = 0;
        confetti.maxAngularSpeed = Math.PI;
        confetti.updateSpeed = 0.02;
        
        allSystems.push(confetti);
    });
    
    return {
        _emitter: new BABYLON.Vector3(0, 0, 0),
        get emitter() { return this._emitter; },
        set emitter(value) {
            this._emitter = value;
            allSystems.forEach(system => {
                system.emitter = value;
            });
        },
        start: function() { 
            allSystems.forEach(system => system.start()); 
        },
        stop: function() { 
            allSystems.forEach(system => system.stop()); 
        },
        dispose: function() { 
            allSystems.forEach(system => system.dispose()); 
        }
    };
};

export const createEnvironmentParticles = (scene) => {
    const envParticles = new BABYLON.ParticleSystem("particles", 200, scene); 
    envParticles.particleTexture = new BABYLON.Texture("/assets/flare.png", scene);
    envParticles.emitter = new BABYLON.Vector3(0, 20, 0);
    envParticles.minEmitBox = new BABYLON.Vector3(-30, 10, -30); 
    envParticles.maxEmitBox = new BABYLON.Vector3(30, 20, 30);
    envParticles.color1 = new BABYLON.Color4(0.7, 0.3, 0.3, 0.03); 
    envParticles.color2 = new BABYLON.Color4(0.5, 0.2, 0.2, 0.03);
    envParticles.colorDead = new BABYLON.Color4(0.2, 0.1, 0.1, 0);
    envParticles.minSize = 0.05; 
    envParticles.maxSize = 0.15;
    envParticles.minLifeTime = 2; 
    envParticles.maxLifeTime = 3;
    envParticles.emitRate = 25; 
    envParticles.gravity = new BABYLON.Vector3(0, -0.03, 0);
    envParticles.direction1 = new BABYLON.Vector3(-1, -1, -1);
    envParticles.direction2 = new BABYLON.Vector3(1, -1, 1);
    envParticles.minAngularSpeed = 0;
    envParticles.maxAngularSpeed = Math.PI / 4; 
    envParticles.minEmitPower = 0.05;
    envParticles.maxEmitPower = 0.1;
    envParticles.updateSpeed = 0.03; 
    envParticles.start();
    return envParticles;
}; 
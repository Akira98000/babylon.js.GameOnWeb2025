// L'ESPACE CENTRALISEE DES CONFIGURATION DU JEU
// LES CONFIGURATION SONT REGROUPEES PAR CATEGORIE

export const GAME_CONFIG = {
    HERO: {
        SCALE: 0.28,
        SPEED: 0.15,
        SPEED_BACKWARDS: 0.1,
        SPEED_STRAFE: 0.12,
        ROTATION_SPEED: 0.1,
        ELLIPSOID: {
            SIZE: { x: 0.6, y: 1, z: 0.6 },
            OFFSET: { x: 0, y: 1, z: 0 }
        },
        GROUND_CHECK_OFFSET: 0.1
    },
    CAMERA: {
        INITIAL: {
            BETA: Math.PI / 4,
            RADIUS: 2.5,
            HEIGHT_OFFSET: 1.5
        },
        LIMITS: {
            BETA: {
                LOWER: 0.1,
                UPPER: Math.PI * 0.9
            },
            RADIUS: {
                LOWER: 2,
                UPPER: 3
            }
        },
        SENSITIVITY: {
            ANGULAR_X: 300,
            ANGULAR_Y: 300
        },
        FOLLOW: {
            POSITION_LERP: 0.2,  
            TARGET_LERP: 0.2,    
            HEIGHT_OFFSET: 1.45,    
            DISTANCE: 3        
        }
    },
    AUDIO: {
        SHOTGUN: {
            VOLUME: 0.4,
            SPATIAL: false
        },
        MUSIC: {
            VOLUME: 0.3,
            SPATIAL: false
        }
    },
    PARTICLES: {
        MUZZLE_FLASH: {
            COUNT: 20,
            LIFETIME: { MIN: 0.02, MAX: 0.06 },
            SIZE: { MIN: 0.05, MAX: 0.15 },
            POWER: { MIN: 0.5, MAX: 1.0 }
        }
    },
    ANIMATIONS: {
        SHOOT: {
            DURATION: 300,
            COOLDOWN: 500,
            TRANSITION_SPEED: 1.5
        },
        MOVEMENT: {
            TRANSITION_SPEED: 2.0,
            RESPONSIVENESS: 8
        }
    },
    ENNEMI: {
        SCALE: 1,
        SPEED: {
            MAX: 0.1,
            WANDER: 0.05
        },
        DETECTION: {
            SEEK_RADIUS: 10,
            ARRIVE_RADIUS: 2
        },
        WANDER: {
            RADIUS: 2,
            DISTANCE: 4,
            ANGLE_CHANGE: 0.3
        }
    },
    KEYBOARD: {
        LAYOUT: 'AZERTY',
        CONTROLS: {
            AZERTY: {
                FORWARD: 'z',
                BACKWARD: 's',
                LEFT: 'q',
                RIGHT: 'd',
                JUMP: ' ',
                DANCE: 'b',
                ACTION: 'f',
                SPECIAL: 'k'
            },
            QWERTY: {
                FORWARD: 'w',
                BACKWARD: 's',
                LEFT: 'a',
                RIGHT: 'd',
                JUMP: ' ',
                DANCE: 'b',
                ACTION: 'f',
                SPECIAL: 'k'
            }
        }
    }
}; 
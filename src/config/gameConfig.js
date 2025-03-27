export const GAME_CONFIG = {
    HERO: {
        SCALE: 0.28,
        SPEED: 0.05,
        SPEED_BACKWARDS: 0.01,
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
                UPPER: Math.PI / 2
            },
            RADIUS: {
                LOWER: 2,
                UPPER: 3
            }
        },
        SENSITIVITY: {
            ANGULAR_X: 300,
            ANGULAR_Y: 300
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
    }
}; 
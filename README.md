# Dreamfall

A 3D action-adventure game built with BabylonJS for the Game On Web 2025 competition.

## Overview

Dreamfall is an immersive 3D adventure where players control a unicorn through various levels, battling enemies, recruiting allies, and exploring a dynamic world. The game features combat mechanics, character progression, and an engaging narrative across multiple unique levels.

## Features

- **Immersive 3D World**: Explore diverse environments with day/night cycles and dynamic weather effects
- **Combat System**: Engage in battles with projectile weapons against various enemy types
- **Ally System**: Recruit friendly characters to help you throughout your journey
- **Progression**: Level-based gameplay with unique objectives and challenges
- **Dynamic Environment**: Interact with NPCs, traffic systems, and changing weather conditions
- **Boss Battles**: Face challenging enemies with special mechanics and strategies

## Game Levels

1. **Tutorial**: Learn basic controls and game mechanics
2. **The Encounter**: Find and befriend Ray the dog
3. **Exploration**: Locate bananas and make them allies
4. **The Magician**: Find the magician to gain combat abilities
5. **The Catastrophe**: Survive the night as zombies appear
6. **The Threat**: Eliminate zombie hordes to save the city
7. **The Ultimate Battle**: Final confrontation against the boss

## Controls

- **Movement**: WASD/ZQSD keys
- **Aim/Look**: Mouse movement
- **Shoot**: Left mouse button
- **Interact**: E key
- **Pause**: ESC key

## Technical Stack

- **Engine**: BabylonJS 7.5+
- **Build System**: Vite
- **Animation**: GSAP
- **Physics**: BabylonJS built-in physics
- **UI**: Custom HTML/CSS components and BabylonJS GUI
- **Audio**: WebAudio API with spatial sound

## Technical Architecture

### Core Systems

- **Scene Management**: Modular level loading system with progressive asset loading
- **Entity Component System**: Object-oriented approach for game entities
- **Event System**: Custom event dispatcher for decoupled component communication
- **State Machine**: Controls player and enemy animations and behavior states
- **AI System**: Path finding and decision-making for NPCs and enemies using behavior trees
- **Collision Detection**: Custom collision groups and filtering for optimized interaction

### Rendering Pipeline

- **Dynamic Lighting**: Point, directional, and spot lights with shadow mapping
- **Particle Systems**: GPU-accelerated particles for visual effects (smoke, explosions, magic)
- **Post-Processing**: Screen-space effects including bloom, depth of field, and color grading
- **Material System**: PBR materials with normal and roughness mapping
- **Level of Detail**: Dynamic mesh simplification based on distance
- **Scene Optimization**: Frustum culling, instancing for similar meshes, and texture atlasing

### Performance Optimizations

- **Asset Loading**: Asynchronous loading with prioritization and caching
- **Memory Management**: Mesh disposal and texture compression
- **WebGL Optimization**: Minimized draw calls through mesh combining
- **Worker Threads**: Background processing for physics calculations
- **Shader Optimization**: Custom shaders for specific visual effects with minimal overhead

## Installation

```bash
# Clone the repository
git clone https://github.com/your-username/dreamfall.git

# Navigate to project directory
cd dreamfall

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Requirements

- Modern web browser with WebGL support
- Keyboard and mouse
- Recommended: Dedicated graphics card for optimal performance

## Team

Dreamfall was created by Team Babygame for the Game On Web 2025 competition.

## License

All rights reserved © 2025 Babygame
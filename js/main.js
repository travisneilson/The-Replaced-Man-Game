// js/main.js
import { PLAYER_SPEED, INTERACTION_DISTANCE } from './config.js';
import { RoomManager } from './roomManager.js';
import { showEchoText } from './ui.js';
import { setupInputListeners } from './inputManager.js';

document.addEventListener('DOMContentLoaded', () => {

    const elements = {
        body: document.body,
        gameArea: document.getElementById('game-area'),
        player: document.getElementById('player'),
        narrativeArea: document.getElementById('narrative-area'),
        roomTitle: document.getElementById('room-title'),
        gameObjectsLayer: document.getElementById('game-objects-layer'),
        echoContainer: document.getElementById('echo-container'),
        echoText: document.getElementById('echo-text'),
        uiFooter: document.getElementById('ui-footer'),
        footerText: document.querySelector('#ui-footer p')
    };

    const state = {
        gameAreaRect: null, playerX: 0, playerY: 0, playerState: {},
        keysPressed: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, 'e': false, 'E': false },
        isTransitioning: false, nearbyNode: null
    };
    
    // --- Game Logic Functions ---

    // This function holds all the logic for what happens when you press 'E'
    function handleInteraction() {
        if (state.nearbyNode && !state.isTransitioning) {
            const nodeData = RoomManager.currentRoom.nodes.find(n => n.id === state.nearbyNode.id);
            if (!nodeData) return;

            switch(nodeData.type) {
                case 'object':
                    if (nodeData.echoText) showEchoText(elements.echoContainer, elements.echoText, nodeData.echoText);
                    if (nodeData.events) {
                         nodeData.events.forEach(event => {
                            if (event.action === 'add_state') {
                                state.playerState[event.state] = true;
                                RoomManager.loadRoom(RoomManager.currentRoom.id, elements, state, true);
                            }
                        });
                    }
                    break;
                case 'npc':
                    if (nodeData.dialogue) showEchoText(elements.echoContainer, elements.echoText, nodeData.dialogue);
                    break;
                case 'exit':
                     if (nodeData.requiresState && !state.playerState[nodeData.requiresState]) {
                        showEchoText(elements.echoContainer, elements.echoText, "The way is blocked.");
                     } else {
                        RoomManager.loadRoom(nodeData.to, elements, state);
                     }
                    break;
            }
        }
    }

    function gameLoop() {
        if (!state.isTransitioning && RoomManager.currentRoom) {
            const playerHalfWidth = 25, playerHalfHeight = 25;
            
            // Player Movement
            if (state.keysPressed.ArrowUp && state.playerY > playerHalfHeight) state.playerY -= PLAYER_SPEED;
            if (state.keysPressed.ArrowDown && state.playerY < state.gameAreaRect.height - playerHalfHeight) state.playerY += PLAYER_SPEED;
            if (state.keysPressed.ArrowLeft && state.playerX > playerHalfWidth) state.playerX -= PLAYER_SPEED;
            if (state.keysPressed.ArrowRight && state.playerX < state.gameAreaRect.width - playerHalfWidth) state.playerX += PLAYER_SPEED;
            
            // Proximity Checks
            let isNearAnything = false;
            elements.footerText.textContent = 'Use arrow keys to move. Press E to interact.';
            elements.uiFooter.classList.remove('dialogue');

            RoomManager.currentRoom.nodes.forEach(node => {
                const nodeEl = document.getElementById(node.id);
                if (!nodeEl) return;
                if(node.type === 'exit' && node.requiresState && !state.playerState[node.requiresState]) {
                    nodeEl.classList.remove('highlight'); return;
                }
                const distance = Math.hypot(state.playerX - node.position.x, state.playerY - node.position.y);
                if (distance < INTERACTION_DISTANCE) {
                    isNearAnything = true;
                    state.nearbyNode = nodeEl;
                    nodeEl.classList.add('highlight');
                    if(node.type === 'npc' && node.dialogue) {
                        elements.footerText.textContent = node.dialogue;
                        elements.uiFooter.classList.add('dialogue');
                    }
                } else {
                    nodeEl.classList.remove('highlight');
                }
            });
            if (!isNearAnything) state.nearbyNode = null;
        }
        
        elements.player.style.transform = `translate(${state.playerX - 25}px, ${state.playerY - 25}px)`;
        requestAnimationFrame(gameLoop);
    }
    
    // --- Game Initialization ---
    async function initializeGame() {
        for (const key in elements) {
            if (!elements[key]) {
                console.error(`Initialization Failed: HTML element for '${key}' not found.`);
                return;
            }
        }

        elements.player.textContent = '😐';
        state.gameAreaRect = elements.gameArea.getBoundingClientRect();
        state.playerX = state.gameAreaRect.width / 2;
        state.playerY = state.gameAreaRect.height / 2;

        // Set up all event listeners by calling our new module
        setupInputListeners(state, elements, handleInteraction);
        
        try {
            const response = await fetch('story.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            RoomManager.rooms = await response.json();
            for(const roomId in RoomManager.rooms) {
                RoomManager.rooms[roomId].id = roomId;
            }
            
            RoomManager.loadRoom('living_room_start', elements, state, true);
            gameLoop();
        } catch (error) {
            console.error("Failed to load or initialize game:", error);
            document.body.innerHTML = `<div style="color: red;...">${error}</div>`;
        }
    }

    initializeGame();
});
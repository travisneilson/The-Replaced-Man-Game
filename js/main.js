// js/main.js
import { PLAYER_SPEED, INTERACTION_DISTANCE } from './config.js';
import { RoomManager } from './roomManager.js';
import { showEchoText } from './ui.js';
import { setupInputListeners } from './inputManager.js';

document.addEventListener('DOMContentLoaded', () => {

// js/main.js
import { PLAYER_SPEED, INTERACTION_DISTANCE } from './config.js';
// ... other imports

document.addEventListener('DOMContentLoaded', () => {

    // ADD THIS LINE
    console.log("--- RUNNING LATEST VERSION - NO CACHE ---");

   

    // --- Get references to all game elements ---
    const elements = {
        body: document.body,
        gameArea: document.getElementById('game-area'),
        player: document.getElementById('player'),
        narrativeArea: document.getElementById('narrative-area'),
        narrativeHeader: document.getElementById('narrative-header'),
        narrativeTextContent: document.getElementById('narrative-text-content'),
        narrativeFooter: document.getElementById('narrative-footer'),
        actTitle: document.getElementById('act-title'),
        weekdayDisplay: document.getElementById('weekday-display'),
        objectiveDisplay: document.getElementById('objective-display'),
        settingDisplay: document.getElementById('setting-display'),
        gameObjectsLayer: document.getElementById('game-objects-layer'),
        echoContainer: document.getElementById('echo-container'),
        echoText: document.getElementById('echo-text'),
        uiFooter: document.getElementById('ui-footer'),
        footerText: document.querySelector('#ui-footer p'),
        hintText: document.getElementById('hint-text')
    };

    // --- Initialize game state ---
    const state = {
        gameAreaRect: null, playerX: 0, playerY: 0, playerState: {},
        keysPressed: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, 'e': false, 'E': false, 'h': false, 'H': false },
        isTransitioning: false, nearbyNode: null
    };
    
    let cursorHideTimeout;
    const playerHalfWidth = 20;
    const playerHalfHeight = 20;

    // --- Main Game Initialization ---
    async function initializeGame() {
        // Pre-flight Check
        for (const key in elements) {
            if (!elements[key]) {
                console.error(`Initialization Failed: HTML element for '${key}' not found.`);
                document.body.innerHTML = `<div style="color:red;text-align:center;padding-top:50px;"><h1>FATAL ERROR:</h1><p>HTML element with ID '<strong>${key}</strong>' not found.</p><p>Please check index.html against the latest version.</p></div>`;
                return;
            }
        }
        
        try {
            // Set initial state
            elements.player.textContent = '😐';
            state.gameAreaRect = elements.gameArea.getBoundingClientRect();
            state.playerX = state.gameAreaRect.width / 2;
            state.playerY = state.gameAreaRect.height / 2;
            
            // Fetch Data
            const response = await fetch('the_replaced_man_test_day.json');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const storyData = await response.json();
            
            // Populate Game Data
            RoomManager.rooms = storyData.rooms;
            RoomManager.hints = storyData.hints;
            for(const roomId in RoomManager.rooms) {
                RoomManager.rooms[roomId].id = roomId;
            }
            
            // Setup Listeners and Start Game
            setupInputListeners(state, elements, handleInteraction, handleHint);
            RoomManager.initialLoad('living_room_monday_morning', elements, state);
            gameLoop(elements, state); // Initial call to the loop

        } catch (error) {
            console.error("Failed to load or initialize game:", error);
            document.body.innerHTML = `<div style="color: red;...">${error}</div>`;
        }
    }

    // --- Interaction & Hint Handlers ---
    function handleInteraction() {
        if (state.nearbyNode && !state.isTransitioning) {
            const nodeData = RoomManager.currentRoom.nodes.find(n => n.id === state.nearbyNode.id);
            if (!nodeData || !nodeData.interactions || nodeData.interactions.length === 0) return;
            const interaction = nodeData.interactions[0];
            if (!interaction) return;

            if (interaction.requiresState && !state.playerState[interaction.requiresState]) {
                showEchoText(elements.echoContainer, elements.echoText, "The way is blocked.");
                return;
            }
            if (interaction.action.type === 'travel') {
                RoomManager.loadRoom(interaction.action.to, elements, state);
            } else {
                RoomManager.updateNarrative(interaction.action.narrative, elements);
                if (interaction.action.event) {
                    state.playerState[interaction.action.event.state] = true;
                    console.log("State updated:", state.playerState);
                }
            }
        }
    }
    function handleHint() {
        const randomIndex = Math.floor(Math.random() * RoomManager.hints.length);
        elements.hintText.textContent = RoomManager.hints[randomIndex] || "No hints available.";
    }

    // --- Main Game Loop ---
    function gameLoop(elements, state) {
        if (!state.isTransitioning && RoomManager.currentRoom) {
            // Player Movement
            if (state.keysPressed.arrowup && state.playerY > playerHalfHeight) state.playerY -= PLAYER_SPEED;
            if (state.keysPressed.arrowdown && state.playerY < state.gameAreaRect.height - playerHalfHeight) state.playerY += PLAYER_SPEED;
            if (state.keysPressed.arrowleft && state.playerX > playerHalfWidth) state.playerX -= PLAYER_SPEED;
            if (state.keysPressed.arrowright && state.playerX < state.gameAreaRect.width - playerHalfWidth) state.playerX += PLAYER_SPEED;
            
            // Proximity Checks
            let isNearAnything = false;
            RoomManager.currentRoom.nodes.forEach(node => {
                const nodeEl = document.getElementById(node.id);
                if (!nodeEl) return;
                
                const interaction = (node.interactions && node.interactions[0]) || {};
                if (interaction.requiresState && !state.playerState[interaction.requiresState]) {
                    nodeEl.classList.remove('highlight'); return;
                }
                const distance = Math.hypot(state.playerX - node.position.x, state.playerY - node.position.y);
                if (distance < INTERACTION_DISTANCE) {
                    isNearAnything = true;
                    state.nearbyNode = nodeEl;
                    nodeEl.classList.add('highlight');
                } else {
                    nodeEl.classList.remove('highlight');
                }
            });
            if (!isNearAnything) state.nearbyNode = null;
        }
        
        elements.player.style.transform = `translate(${state.playerX - playerHalfWidth}px, ${state.playerY - playerHalfHeight}px)`;
        
        // THE FIX IS HERE: We must pass the arguments into the next frame of the loop.
        requestAnimationFrame(() => gameLoop(elements, state));
    }
    
    initializeGame();
});
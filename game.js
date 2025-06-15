// A single, robust game engine file, corrected to match your JSON structure.

document.addEventListener('DOMContentLoaded', () => {

    // --- The Master Game Object ---
    const Game = {
        // --- HTML Elements ---
        elements: {},
        // --- Game State ---
        state: {
            playerX: 0, playerY: 0,
            keysPressed: { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false },
            rooms: {}, currentRoom: null
        },
        // --- Configuration ---
        config: { PLAYER_SPEED: 5, INTERACTION_DISTANCE: 70 },

        // --- Helper: Typewriter ---
        typeWriter(element, text, speed = 25) {
            if (this.state.activeTypingInterval) clearInterval(this.state.activeTypingInterval);
            element.innerHTML = '';
            let i = 0;
            const cursor = '<span class="cursor" style="width:9px; height:1.3em; background:white; display:inline-block; animation:blink 1s infinite;">|</span>';
            this.state.activeTypingInterval = setInterval(() => {
                if (i < text.length) {
                    element.innerHTML = text.substring(0, i + 1) + cursor;
                    i++;
                } else {
                    element.innerHTML = text;
                    clearInterval(this.state.activeTypingInterval);
                }
            }, speed);
        },
        
        // --- Room Management ---
        loadRoom(roomId) {
            const room = this.state.rooms[roomId];
            if (!room) {
                console.error(`[Game] Room with ID "${roomId}" not found!`);
                return;
            }
            this.state.currentRoom = room;

            // UPDATED: Correctly reads from your JSON structure
            const narrativeData = room.narrative;
            this.elements.actTitle.textContent = `Act ${narrativeData.act.number} – ${narrativeData.act.title}`;
            this.elements.weekdayDisplay.textContent = narrativeData.weekday;
            this.elements.objectiveDisplay.textContent = `Objective: ${narrativeData.objective}`;
            this.elements.settingDisplay.textContent = room.setting;
            this.typeWriter(this.elements.narrativeTextContent, narrativeData.onEnter || "");
            this.elements.player.textContent = room.defaultEmoji || "😐";

            this.elements.gameObjectsLayer.innerHTML = '';
            if (room.nodes) {
                room.nodes.forEach(nodeData => {
                    const nodeEl = document.createElement('div');
                    nodeEl.className = 'node';
                    nodeEl.id = nodeData.id;
                    nodeEl.textContent = nodeData.icon || '❓';
                    nodeEl.style.left = `${nodeData.position.x}px`;
                    nodeEl.style.top = `${nodeData.position.y}px`;
                    this.elements.gameObjectsLayer.appendChild(nodeEl);
                });
            }
        },

        // --- Main Game Loop ---
        gameLoop() {
            const playerHalfWidth = 20, playerHalfHeight = 20;

            if (this.state.currentRoom) {
                if (this.state.keysPressed.ArrowUp && this.state.playerY > playerHalfHeight) this.state.playerY -= this.config.PLAYER_SPEED;
                if (this.state.keysPressed.ArrowDown && this.state.playerY < this.state.gameAreaRect.height - playerHalfHeight) this.state.playerY += this.config.PLAYER_SPEED;
                if (this.state.keysPressed.ArrowLeft && this.state.playerX > playerHalfWidth) this.state.playerX -= this.config.PLAYER_SPEED;
                if (this.state.keysPressed.ArrowRight && this.state.playerX < this.state.gameAreaRect.width - playerHalfWidth) this.state.playerX += this.config.PLAYER_SPEED;
            }
            this.elements.player.style.transform = `translate(${this.state.playerX - playerHalfWidth}px, ${this.state.playerY - playerHalfHeight}px)`;
            requestAnimationFrame(() => this.gameLoop());
        },

        // --- Initialization Sequence ---
        async init() {
            this.elements = {
                player: document.getElementById('player'), gameObjectsLayer: document.getElementById('game-objects-layer'),
                gameArea: document.getElementById('game-area'), narrativeTextContent: document.getElementById('narrative-text-content'),
                actTitle: document.getElementById('act-title'), weekdayDisplay: document.getElementById('narrative-weekday'),
                objectiveDisplay: document.getElementById('narrative-objective'), settingDisplay: document.getElementById('narrative-footer'),
                hintText: document.getElementById('hint-text'), body: document.body
            };

            for (const key in this.elements) {
                if (!this.elements[key]) {
                    document.body.innerHTML = `<div style="color:red;padding:50px;text-align:center;"><h1>FATAL ERROR:</h1><p>HTML element with ID '<strong>${key}</strong>' was not found.</p></div>`;
                    throw new Error(`Initialization failed: Missing HTML element ${key}`);
                }
            }
            
            this.state.gameAreaRect = this.elements.gameArea.getBoundingClientRect();
            this.state.playerX = this.state.gameAreaRect.width / 2;
            this.state.playerY = this.state.gameAreaRect.height / 2;

            window.addEventListener('keydown', e => { if (this.state.keysPressed.hasOwnProperty(e.key)) { this.state.keysPressed[e.key] = true; }});
            window.addEventListener('keyup', e => { if (this.state.keysPressed.hasOwnProperty(e.key)) { this.state.keysPressed[e.key] = false; }});

            try {
                const response = await fetch('the_replaced_man_test_day.json');
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                const storyData = await response.json();
                
                this.state.rooms = storyData.rooms;
                this.elements.hintText.textContent = storyData.hints[0];

                this.loadRoom('living_room_monday_morning');
                this.gameLoop();
            } catch (error) {
                console.error("Failed to initialize game:", error);
            }
        }
    };

    // --- Start the game ---
    Game.init();
});
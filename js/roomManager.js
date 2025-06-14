// js/roomManager.js
import { typeWriter } from './ui.js';

export const RoomManager = {
    rooms: {},
    currentRoom: null,

    loadRoom: function(roomId, elements, state, isInitialLoad = false) {
        
        const performLoad = () => {
            const room = this.rooms[roomId];
            if (!room) {
                console.error(`[RoomManager] Room with ID "${roomId}" not found!`);
                state.isTransitioning = false;
                return;
            }
            this.currentRoom = room;

            // Update UI
            typeWriter(elements.narrativeArea, room.narrative.description || "");
            elements.roomTitle.textContent = room.setting || "???";
            elements.player.textContent = room.defaultEmoji || "😐";
            
            // Clear old nodes from the layer
            elements.gameObjectsLayer.innerHTML = '';
            
            // Create new nodes based on the JSON data
            if (room.nodes) {
                room.nodes.forEach(nodeData => {
                    const nodeEl = document.createElement('div');
                    nodeEl.className = 'node';
                    nodeEl.id = nodeData.id;
                    nodeEl.style.left = `${nodeData.position.x}px`;
                    nodeEl.style.top = `${nodeData.position.y}px`;
                    
                    const promptEl = document.createElement('span');
                    promptEl.className = 'node-prompt';
                    promptEl.textContent = nodeData.prompt || 'Interact';
                    nodeEl.appendChild(promptEl);

                    elements.gameObjectsLayer.appendChild(nodeEl);
                });
            }

            if (!isInitialLoad) {
                elements.gameArea.classList.remove('faded-out');
                elements.player.classList.remove('faded-out');
            }
            
            setTimeout(() => state.isTransitioning = false, isInitialLoad ? 0 : 450);
        };

        if (isInitialLoad) {
            state.playerX = state.gameAreaRect.width / 2;
            state.playerY = state.gameAreaRect.height / 2;
            performLoad();
        } else {
            if (state.isTransitioning) return;
            state.isTransitioning = true;
            elements.gameArea.classList.add('faded-out');
            elements.player.classList.add('faded-out');
            
            state.playerX = state.gameAreaRect.width / 2;
            state.playerY = state.gameAreaRect.height / 2;

            setTimeout(performLoad, 400);
        }
    }
};
// js/roomManager.js
import { typeWriter } from './ui.js';

export const RoomManager = {
    rooms: {},
    hints: [],
    currentRoom: null,

    updateNarrative: function(text, elements) {
        if (!elements || !elements.narrativeTextContent) return;
        typeWriter(elements.narrativeTextContent, text || "...");
    },

    initialLoad: function(roomId, elements, state) {
        const room = this.rooms[roomId];
        if (!room) {
            console.error(`[RoomManager] Initial room with ID "${roomId}" not found!`);
            return;
        }
        this.currentRoom = room;

        // UPDATED: Reads from the new, flatter JSON structure
        elements.actTitle.textContent = `Act ${room.act.number} – ${room.act.title}`;
        elements.weekdayDisplay.textContent = room.weekday;
        elements.objectiveDisplay.textContent = `Objective: ${room.objective}`;
        elements.settingDisplay.textContent = room.setting;
        typeWriter(elements.narrativeTextContent, room.narrative || "");
        elements.player.textContent = room.defaultEmoji || "😐";

        elements.gameObjectsLayer.innerHTML = '';
        if (room.nodes) {
            room.nodes.forEach(nodeData => {
                const nodeEl = document.createElement('div');
                nodeEl.className = 'node';
                nodeEl.id = nodeData.id;
                nodeEl.textContent = nodeData.icon || '❓';
                nodeEl.style.left = `${nodeData.position.x}px`;
                nodeEl.style.top = `${nodeData.position.y}px`;
                
                const promptEl = document.createElement('span');
                promptEl.className = 'node-prompt';
                if(nodeData.interactions && nodeData.interactions.length > 0) {
                    promptEl.textContent = nodeData.interactions[0].prompt;
                }
                nodeEl.appendChild(promptEl);
                elements.gameObjectsLayer.appendChild(nodeEl);
            });
        }
    },

    loadRoom: function(roomId, elements, state) {
        if (state.isTransitioning) return;
        state.isTransitioning = true;
        elements.gameArea.classList.add('faded-out');
        elements.player.classList.add('faded-out');

        setTimeout(() => {
            this.initialLoad(roomId, elements, state);
            elements.gameArea.classList.remove('faded-out');
            elements.player.classList.remove('faded-out');
            setTimeout(() => state.isTransitioning = false, 450);
        }, 400);
    }
};
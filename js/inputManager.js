// js/inputManager.js

export function setupInputListeners(state, elements, handleInteraction) {
    let cursorHideTimeout;

    // --- Keyboard Listeners ---
    window.addEventListener('keydown', (e) => {
        // RESTORED: Hide cursor on any key press
        elements.body.classList.add('hide-cursor');

        if (state.keysPressed.hasOwnProperty(e.key)) {
            e.preventDefault();
            state.keysPressed[e.key] = true;

            if (e.key.toLowerCase() === 'e') {
                handleInteraction();
            }
        }
    });

    window.addEventListener('keyup', (e) => {
        if (state.keysPressed.hasOwnProperty(e.key)) {
            e.preventDefault();
            state.keysPressed[e.key] = false;
        }
    });

    // --- RESTORED: Mouse Listener ---
    window.addEventListener('mousemove', () => {
        // When the mouse moves, show the cursor
        if (elements.body.classList.contains('hide-cursor')) {
            elements.body.classList.remove('hide-cursor');
        }
        // Clear any previous timer to re-hide it
        clearTimeout(cursorHideTimeout);
        // Set a new timer to hide it again after 2 seconds of inactivity
        cursorHideTimeout = setTimeout(() => {
            elements.body.classList.add('hide-cursor');
        }, 2000);
    });
}
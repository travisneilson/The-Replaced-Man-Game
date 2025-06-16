// presentation.js
//
// This file contains all of the DOM/CSS/animation “polish” logic
// that sits on top of engine.js’s core and game.js’s bootstrap.

// ──────────────────────────────────────────
// 1) Style overrides via <style> injection
// ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const style = document.createElement('style');
  style.textContent = `
    /* Node icon sizing & anchoring */
    .node-icon.object,
    .node-icon.npc,
    .node-icon.mainQuest {
      font-size: 48px !important;            /* larger than default */
      transform: translate(-50%, -120%) !important; 
      transform-origin: center bottom !important;
    }

    /* Prompt positioning tweak: shift left by 12px, center vertically */
    .prompt {
      transform: translate(-12px, -50%) !important;
    }

    /* Ensure player always on top of nodes */
    #player {
      z-index: 999 !important;
    }

    /* Crossfade transitions */
    #map-container {
      transition: opacity 0.4s ease-in-out;
    }
    #map-container.visible {
      opacity: 1 !important;
    }
    #map-container:not(.visible) {
      opacity: 0 !important;
    }

    /* Loading overlay fade */
    #loading-overlay {
      transition: opacity 0.4s ease-in-out;
    }
  `;
  document.head.appendChild(style);
});

// ──────────────────────────────────────────
// 2) Cross-fade travel animation
// ──────────────────────────────────────────
// Wrap the core executeAction so that travel actions crossfade map-container
(function() {
  const origExecute = Game.executeAction;
  Game.executeAction = async function(action) {
    if (action.type === 'travel') {
      // fade out map
      UI.refs.map.classList.remove('visible');
      UI.refs.loadingOverlay.classList.remove('hidden');
      // wait for fade-out
      await new Promise(r => setTimeout(r, 400));

      // perform travel (loads new room)
      await origExecute.call(this, action);

      // fade in map
      await new Promise(r => requestAnimationFrame(r));
      UI.refs.loadingOverlay.classList.add('hidden');
      UI.refs.map.classList.add('visible');
    } else {
      // other actions untouched
      await origExecute.call(this, action);
    }
  };
})();

// ──────────────────────────────────────────
// 3) Prompt-dot hide/show sync
// ──────────────────────────────────────────
// Hide the .dot element whenever its prompt is visible
// and show it again when prompt hides.
(function() {
  const observer = new MutationObserver(records => {
    records.forEach(rec => {
      if (rec.type === 'attributes' && rec.attributeName === 'class') {
        const prompt = rec.target;
        if (prompt.classList.contains('visible')) {
          const x = parseFloat(prompt.style.left);
          const y = parseFloat(prompt.style.top);
          // find matching dot
          document.querySelectorAll('.dot').forEach(dot => {
            const dx = parseFloat(dot.style.left);
            const dy = parseFloat(dot.style.top);
            if (Math.abs(dx - x) < 1 && Math.abs(dy - y) < 1) {
              dot.style.opacity = '0';
            }
          });
        } else {
          // when prompt hides, restore all dots
          document.querySelectorAll('.dot').forEach(dot => {
            dot.style.opacity = '1';
          });
        }
      }
    });
  });

  document.addEventListener('DOMContentLoaded', () => {
    // observe all prompt elements
    document.querySelectorAll('.prompt').forEach(el => {
      observer.observe(el, { attributes: true });
    });
  });
})();

// ──────────────────────────────────────────
// 4) Additional UI polish hooks
// ──────────────────────────────────────────

// 4a) Dismiss the interaction modal on Esc (if not already in game.js)
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') UI.Modal.close();
});

// 4b) Animate node-icons on room load
(function() {
  const origLoadRoom = Game.loadRoom;
  Game.loadRoom = async function(key) {
    await origLoadRoom.call(this, key);
    // after room renders, pulse each node-icon
    UI.refs.map.querySelectorAll('.node-icon').forEach(icon => {
      icon.animate(
        [
          { transform: icon.style.transform + ' scale(0.8)' },
          { transform: icon.style.transform + ' scale(1.05)' },
          { transform: icon.style.transform + ' scale(1)' }
        ],
        {
          duration: 600,
          easing: 'ease-out',
          fill: 'forwards'
        }
      );
    });
  };
})();

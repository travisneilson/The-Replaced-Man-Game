// game.js
//
// This file contains all of the “living” bits of your game:
// – Which JSON to load
// – Any config tweaks or overrides
// – Custom UI behaviors (modal dismissal, extra node polish, etc.)

// 1) OPTIONAL: tweak core config before the game starts
//    Example: make Thomas a bit faster by default
Config.PLAYER_BASE_SPEED = 300;

// 2) OPTIONAL: rebind keys if you like
//    Example: also allow 'Space' to interact
Config.KEY.interact = ['e', ' '];

// 3) Monkey-patch Game.loadStory so that Mantra.init() runs
//    immediately after the engine’s UI & Input subsystems are set up
(function() {
  const originalLoadStory = Game.loadStory;
  Game.loadStory = async function(url) {
    // call the engine’s original loader (sets up UI.init, Input.init, first room, loop)
    await originalLoadStory.call(this, url);
    // now initialize the Mantra subsystem
    if (window.Mantra && typeof Mantra.init === 'function') {
      Mantra.init();
      console.log('✨ game.js: Mantra.init() called');
    }
  };
})();

// 4) Load your story JSON and start the engine (which now also inits Mantra)
Game.loadStory('story.json');

// 5) OPTIONAL: add your own event listeners or UI hooks

// 5a) Dismiss the interaction modal on 'Esc'
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    UI.Modal.close();
  }
});

// 5b) Debug command—press 'D' to log current state
window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'd') {
    console.log('Current game state:', Game.state);
  }
});

// 5c) Example: log every time a room loads
(function() {
  const originalLoadRoom = Game.loadRoom;
  Game.loadRoom = async function(roomKey) {
    console.log(`Loading room: ${roomKey}`);
    await originalLoadRoom.call(this, roomKey);
  };
})();

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

// 3) Load your story JSON and start the engine
Game.loadStory('the_replaced_man_living_testament_updated.json');

// 4) OPTIONAL: add your own event listeners or UI hooks

// 4a) Dismiss the interaction modal on 'Esc'
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    UI.Modal.close();
  }
});

// 4b) Example: very simple debug command—press 'D' to log current state
window.addEventListener('keydown', e => {
  if (e.key.toLowerCase() === 'd') {
    console.log('Current game state:', Game.state);
  }
});

// 4c) If you want to override or extend any Game methods,
//     you can do so here. For example, log every time a room loads:
(function() {
  const originalLoadRoom = Game.loadRoom;
  Game.loadRoom = async function(roomKey) {
    console.log(`Loading room: ${roomKey}`);
    await originalLoadRoom.call(this, roomKey);
  };
})();

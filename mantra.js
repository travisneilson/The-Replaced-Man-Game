// mantra.js
;(function(global) {
  // ──────────────────────────────────────────
  // Mantra Mechanic Module
  // ──────────────────────────────────────────
  console.log('⚡️ mantra.js loaded');
  const Mantra = {
    count: 0,

    /**
     * Initialize Mantra subsystem.
     * Must be called once after UI.init() and Input.init().
     */
    init() {
      console.log('✨ Mantra.init()');
      // Bind the [M] key handler
      Input.onMantra = this.spend.bind(this);

      // Render initial counter (UI.refs.mantraCounter must exist)
      if (UI.refs.mantraCounter) {
        UI.updateMantraUI(this.count);
      }
    },

    /**
     * Called when a node’s action.event.state === 'gained_mantra'
     */
    collect() {
      console.log('✨ Mantra.collect() — before:', this.count);
      this.count++;
      console.log('✨ Mantra.collect() — after:', this.count)
      if (UI.refs.mantraCounter) {
        UI.updateMantraUI(this.count);
        console.log('🔹 New count =', this.count);
      }
    },

    /**
     * Spend one Mantra charge, display an inner thought or flash if none.
     */
    spend() {
      console.log('✨ Mantra.spend() — count:', this.count);
      if (this.count > 0) {
        this.count--;
        UI.updateMantraUI(this.count);
        this.showRandomThought();
      } else {
        this.flashCounter();
      }
    },

    /**
     * Pick a random line from the current room’s mantraNarratives and type it.
     */
    showRandomThought() {
      const room = Game.story.rooms[Game.currentRoomKey];
      const arr  = room?.narrative?.mantraNarratives || [];
      if (!arr.length) return;
      const text = arr[Math.floor(Math.random() * arr.length)];
      UI.typeText(UI.refs.narrativeText, text);
    },

    /**
     * Briefly flash the counter UI to indicate "no charges".
     */
    flashCounter() {
      const el = UI.refs.mantraCounter?.parentElement;
      if (!el) return;
      el.classList.add('flash');
      setTimeout(() => el.classList.remove('flash'), 200);
    }
  };

  // Expose to global for game.js wiring
  global.Mantra = Mantra;

})(window);

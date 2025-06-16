// game.js
;(function() {
  // ──────────────────────────────────────────
  // 1) CONFIG & CONSTANTS
  // ──────────────────────────────────────────
  const Config = {
    PLAYER_BASE_SPEED: 240,
    SPRINT_MULTIPLIER: 2.5,
    DOOR: {
      width: 120,
      height: 48,
      inset: 8,
      svg: `
<svg width="128" height="48" viewBox="0 0 128 48" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 48V12H4L20 48Z" fill="#1B1B1B"/>
  <path d="M108 48V12H124L108 48Z" fill="#1B1B1B"/>
  <g filter="url(#filter0_d)">
    <rect x="4" y="12" width="12" height="120" transform="rotate(-90 4 12)" fill="#696969"/>
  </g>
  <defs>
    <filter id="filter0_d" x="0" y="0" width="128" height="20" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
        result="hardAlpha"/>
      <feOffset dy="4"/>
      <feGaussianBlur stdDeviation="2"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix"
        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
    </filter>
  </defs>
</svg>`.trim()
    },
    KEY: {
      up:       ['ArrowUp','w'],
      down:     ['ArrowDown','s'],
      left:     ['ArrowLeft','a'],
      right:    ['ArrowRight','d'],
      interact: 'e',
      hint:     'h',
      sprint:   'Shift'
    }
  };

  // ──────────────────────────────────────────
  // 2) INPUT HANDLING
  // ──────────────────────────────────────────
  const Input = {
    keys: {},
    onHint: null,
    onInteract: null,

    init() {
      window.addEventListener('keydown', e => {
        const k = e.key;
        // Movement
        if (Config.KEY.up.includes(k) ||
            Config.KEY.down.includes(k) ||
            Config.KEY.left.includes(k) ||
            Config.KEY.right.includes(k)) {
          this.keys[k] = true;
          e.preventDefault();
        }
        // Sprint
        if (k === Config.KEY.sprint) {
          this.keys.sprint = true;
        }
        // Hint
        if (k.toLowerCase() === Config.KEY.hint && this.onHint) {
          this.onHint();
        }
        // Interact
        if (k.toLowerCase() === Config.KEY.interact && this.onInteract) {
          this.onInteract();
        }
      });

      window.addEventListener('keyup', e => {
        const k = e.key;
        delete this.keys[k];
        if (k === Config.KEY.sprint) {
          this.keys.sprint = false;
        }
      });
    },

    isDown(key) {
      return !!this.keys[key];
    }
  };

  // ──────────────────────────────────────────
  // 3) UI & DOM OPERATIONS (with cancellable typeText)
  // ──────────────────────────────────────────
  const UI = {
    refs: {},
    _typeVersion: 0,

    init() {
      this.refs = {
        player:          document.getElementById('player'),
        map:             document.getElementById('map-container'),
        loadingOverlay:  document.getElementById('loading-overlay'),
        narrativeText:   document.getElementById('narrative-text'),
        weekday:         document.getElementById('weekday'),
        objective:       document.getElementById('objective'),
        location:        document.getElementById('location-snippet'),
        subtitle:        document.getElementById('act-subtitle'),
        hint:            document.getElementById('hint-container'),
        modal:           document.getElementById('interaction-modal'),
        modalTitle:      document.getElementById('modal-title'),
        modalOptions:    document.getElementById('modal-options')
      };
    },

    /**
     * Types text into el one char at a time.
     * Cancels any previous typeText in progress.
     */
    typeText(el, text, speed = 30) {
      const myVersion = ++this._typeVersion;
      el.textContent = '';
      return new Promise(resolve => {
        let i = 0;
        const step = () => {
          // abort if a newer typeText started
          if (myVersion !== this._typeVersion) {
            return resolve();
          }
          if (i < text.length) {
            el.textContent += text[i++];
            setTimeout(step, speed);
          } else {
            resolve();
          }
        };
        step();
      });
    },

    // Hint subsystem
    Hint: {
      index: 0,
      renderNext() {
        const h = Game.story.hints;
        if (!Array.isArray(h) || !h.length) {
          this.clear();
          return;
        }
        this.index = (this.index + 1) % h.length;
        UI.Hint.renderHint(h[this.index]);
      },
      renderHint(text) {
        const c = UI.refs.hint;
        const old = c.querySelector('.hint-text');
        if (old) {
          old.classList.add('hide');
          old.addEventListener('transitionend', function done() {
            old.removeEventListener('transitionend', done);
            c.innerHTML = `
              <span class="keycap">H</span>
              <span class="hint-text hide">Hint: ${text}</span>
            `;
            requestAnimationFrame(() => {
              c.querySelector('.hint-text').classList.remove('hide');
            });
          });
        } else {
          c.innerHTML = `
            <span class="keycap">H</span>
            <span class="hint-text hide">Hint: ${text}</span>
          `;
          requestAnimationFrame(() => {
            c.querySelector('.hint-text').classList.remove('hide');
          });
        }
      },
      clear() {
        UI.refs.hint.innerHTML = '';
      }
    },

    // Modal for interactions
    Modal: {
      open(node) {
        UI.refs.modalTitle.textContent = node.icon;
        UI.refs.modalOptions.innerHTML = '';
        node.interactions.forEach(i => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="keycap">${i.key}</span>${i.prompt}`;
          UI.refs.modalOptions.appendChild(li);
        });
        UI.refs.modal.classList.remove('hidden');
      },
      close() {
        UI.refs.modal.classList.add('hidden');
      }
    }
  };

  // ──────────────────────────────────────────
  // 4) GAME ENGINE & LOOP
  // ──────────────────────────────────────────
  const Game = {
    story: null,
    currentRoomKey: null,
    state: {},
    interactiveNodes: [],
    lastProximityNodeId: null,
    _lastTravelDir: null,
    player: { x: 0, y: 0, speed: Config.PLAYER_BASE_SPEED },

    async loadStory(url) {
      this.story = await fetch(url).then(r => r.json());
      Input.onHint     = UI.Hint.renderNext.bind(UI.Hint);
      Input.onInteract = this.handleInteract.bind(this);
      UI.init();
      Input.init();
      await this.loadRoom(Object.keys(this.story.rooms)[0]);
      requestAnimationFrame(this.loop.bind(this));
    },

    async loadRoom(key) {
      const room = this.story.rooms[key];
      if (!room) {
        console.error(`Room "${key}" not found`);
        return;
      }
      this.currentRoomKey = key;
      this.lastProximityNodeId = null;

      // Header & narrative
      UI.refs.subtitle.textContent  = `Act ${room.narrative.act.number} – ${room.narrative.act.title}`;
      UI.refs.weekday.textContent   = room.narrative.weekday;
      UI.refs.objective.innerHTML    = `<strong>OBJECTIVE:</strong> ${room.narrative.objective}`;
      await UI.typeText(UI.refs.narrativeText, room.narrative.onEnter);
      UI.refs.location.textContent   = room.setting;
      UI.refs.player.textContent     = room.defaultEmoji || '😐';

      // Show map, clear nodes
      UI.refs.loadingOverlay.classList.add('hidden');
      UI.refs.map.classList.add('visible');
      UI.refs.map.innerHTML = '';
      UI.refs.map.appendChild(UI.refs.player);

      // Center player
      this.player.x = UI.refs.map.clientWidth / 2;
      this.player.y = UI.refs.map.clientHeight / 2;
      UI.refs.player.style.left = `${this.player.x}px`;
      UI.refs.player.style.top  = `${this.player.y}px`;

      // Render all nodes
      this.interactiveNodes = [];
      const MAP_W = UI.refs.map.clientWidth;
      const MAP_H = UI.refs.map.clientHeight;

      room.nodes.forEach(node => {
        if (node.requiresState && !this.state[node.requiresState]) return;

        // Dot indicator
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (node.type === 'mainQuest') dot.classList.add('mainquest');
        UI.refs.map.appendChild(dot);

        // Icon container
        const icon = document.createElement('div');
        icon.classList.add('node-icon', node.type);
        UI.refs.map.appendChild(icon);

        // Prompt
        const prompt = document.createElement('div');
        prompt.classList.add('prompt');
        if (node.interactions?.length) {
          const i = node.interactions[0];
          prompt.innerHTML = `<span class="keycap">${i.key}</span>${i.prompt}`;
        }
        UI.refs.map.appendChild(prompt);

        let x, y, rot;
        if (node.type === 'exit') {
          // Determine orientation & position
          const o = node.orientation || 'south';
          const t = node.offset != null ? node.offset : 0.5;
          switch (o) {
            case 'north':
              x   = Config.DOOR.width / 2 + (MAP_W - Config.DOOR.width) * t;
              y   = Config.DOOR.inset + Config.DOOR.height / 2;
              rot =   0;
              break;
            case 'south':
              x   = Config.DOOR.width / 2 + (MAP_W - Config.DOOR.width) * t;
              y   = MAP_H - (Config.DOOR.inset + Config.DOOR.height / 2);
              rot = 180;
              break;
            case 'west':
              x   = Config.DOOR.inset + Config.DOOR.height / 2;
              y   = Config.DOOR.width / 2 + (MAP_H - Config.DOOR.width) * t;
              rot = 270;
              break;
            case 'east':
              x   = MAP_W - (Config.DOOR.inset + Config.DOOR.height / 2);
              y   = Config.DOOR.width / 2 + (MAP_H - Config.DOOR.width) * t;
              rot = 90;
              break;
          }
          // Position door graphic
          icon.style.left      = `${x}px`;
          icon.style.top       = `${y}px`;
          icon.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`;
          icon.innerHTML       = Config.DOOR.svg;

          // Position dot inset
          let dotX, dotY;
          switch (o) {
            case 'north':
              dotX = x;
              dotY = Config.DOOR.inset + Config.DOOR.height + Config.DOOR.inset;
              break;
            case 'south':
              dotX = x;
              dotY = MAP_H - (Config.DOOR.inset + Config.DOOR.height + Config.DOOR.inset);
              break;
            case 'west':
              dotX = Config.DOOR.inset + Config.DOOR.height + Config.DOOR.inset;
              dotY = y;
              break;
            case 'east':
              dotX = MAP_W - (Config.DOOR.inset + Config.DOOR.height + Config.DOOR.inset);
              dotY = y;
              break;
          }
          dot.style.left = `${dotX}px`;
          dot.style.top  = `${dotY}px`;

          // Position prompt & handle right-edge flip
          prompt.style.left = `${x}px`;
          prompt.style.top  = `${y}px`;
          prompt.classList.remove('right-align');
          const pRect = prompt.getBoundingClientRect();
          const mRect = UI.refs.map.getBoundingClientRect();
          if (pRect.right > mRect.right - 8) {
            prompt.classList.add('right-align');
          }

        } else {
          // Object or NPC
          x = node.position.x;
          y = node.position.y;
          icon.style.left   = `${x}px`;
          icon.style.top    = `${y}px`;
          icon.textContent  = node.icon;
          dot.style.left    = `${x}px`;
          dot.style.top     = `${y}px`;
          prompt.style.left = `${x}px`;
          prompt.style.top  = `${y}px`;

          // Flip prompt if overflow
          prompt.classList.remove('right-align');
          const pRect2 = prompt.getBoundingClientRect();
          const mRect2 = UI.refs.map.getBoundingClientRect();
          if (pRect2.right > mRect2.right - 8) {
            prompt.classList.add('right-align');
          }
        }

        this.interactiveNodes.push({
          node,
          dotEl:   dot,
          iconEl:  icon,
          promptEl: prompt
        });
      });
    },

    findEntryUnderKey() {
      return this.interactiveNodes.find(entry => {
        const dx   = this.player.x - parseFloat(entry.dotEl.style.left);
        const dy   = this.player.y - parseFloat(entry.dotEl.style.top);
        const dist = Math.hypot(dx, dy);
        const thr  = entry.node.proximity || 64;
        return dist <= thr &&
               entry.node.interactions.some(i => i.key.toLowerCase() === Config.KEY.interact);
      });
    },

    handleInteract() {
      const entry = this.findEntryUnderKey();
      if (!entry) return;
      if (entry.node.type === 'exit') {
        this._lastTravelDir = entry.node.orientation;
        this.executeAction(entry.node.interactions[0].action);
      } else {
        UI.Modal.open(entry.node);
      }
    },

    async executeAction(action) {
      UI.Modal.close();
      switch (action.type) {
        case 'set_room_narrative':
          if (action.emotionalImpact) {
            UI.refs.player.textContent = action.emotionalImpact;
          }
          await UI.typeText(UI.refs.narrativeText, action.narrative);
          if (action.event?.action === 'add_state') {
            this.state[action.event.state] = true;
          }
          break;

        case 'travel':
          UI.refs.loadingOverlay.classList.remove('hidden');
          UI.refs.map.classList.remove('visible');
          await new Promise(r => setTimeout(r, 500));
          await this.loadRoom(action.to);
          // After travel, offset spawn 30px into room
          const dir = this._lastTravelDir;
          if (dir) {
            const d = 30;
            switch (dir) {
              case 'north': this.player.y += d; break;
              case 'south': this.player.y -= d; break;
              case 'west':  this.player.x += d; break;
              case 'east':  this.player.x -= d; break;
            }
            UI.refs.player.style.left = `${this.player.x}px`;
            UI.refs.player.style.top  = `${this.player.y}px`;
          }
          this._lastTravelDir = null;
          break;

        case 'dialogue_choice':
          await UI.typeText(UI.refs.narrativeText, action.narrative);
          break;
      }
    },

    loop(now = performance.now()) {
      const dt = (now - (this._lastTime || now)) / 1000;
      this._lastTime = now;

      if (UI.refs.modal.classList.contains('hidden')) {
        // Compute movement vector
        let dx = 0, dy = 0;
        Config.KEY.up.forEach(k => { if (Input.isDown(k))   dy -= 1; });
        Config.KEY.down.forEach(k => { if (Input.isDown(k)) dy += 1; });
        Config.KEY.left.forEach(k => { if (Input.isDown(k)) dx -= 1; });
        Config.KEY.right.forEach(k => { if (Input.isDown(k))dx += 1; });
        if (dx && dy) {
          const m = Math.hypot(dx, dy);
          dx /= m; dy /= m;
        }

        // Apply sprint multiplier
        const sprint = Input.isDown(Config.KEY.sprint);
        const speed  = this.player.speed * (sprint ? Config.SPRINT_MULTIPLIER : 1);

        // Update position
        this.player.x += dx * speed * dt;
        this.player.y += dy * speed * dt;

        // Clamp within map
        const W = UI.refs.map.clientWidth;
        const H = UI.refs.map.clientHeight;
        const halfW = UI.refs.player.offsetWidth / 2;
        const halfH = UI.refs.player.offsetHeight / 2;
        this.player.x = Math.max(halfW, Math.min(W - halfW, this.player.x));
        this.player.y = Math.max(halfH, Math.min(H - halfH, this.player.y));

        // Render player
        UI.refs.player.style.left = `${this.player.x}px`;
        UI.refs.player.style.top  = `${this.player.y}px`;

        // Proximity detection & prompt handling
        let nearest = null, nd = Infinity;
        this.interactiveNodes.forEach(entry => {
          entry.promptEl.classList.remove('visible');
          entry.dotEl.style.opacity = '1';
          const dx2 = this.player.x - parseFloat(entry.dotEl.style.left);
          const dy2 = this.player.y - parseFloat(entry.dotEl.style.top);
          const dist = Math.hypot(dx2, dy2);
          const thr  = entry.node.proximity || 64;
          if (dist <= thr && dist < nd) {
            nearest = entry;
            nd = dist;
          }
        });

        if (nearest) {
          nearest.promptEl.classList.add('visible');
          nearest.dotEl.style.opacity = '0';
          UI.refs.player.textContent =
            nearest.node.proximityEmoji ||
            (this.story.rooms[this.currentRoomKey].defaultEmoji || '😐');

          if (nearest.node.id !== this.lastProximityNodeId) {
            this.lastProximityNodeId = nearest.node.id;
            let textToType = null;
            if (nearest.node.type === 'exit') {
              textToType = nearest.node.proximityNarrative ||
                           nearest.node.interactions[0].prompt;
            } else {
              const mantras = this.story.rooms[this.currentRoomKey].mantraNarratives || [];
              if (mantras.length) {
                textToType = mantras[Math.floor(Math.random() * mantras.length)];
              }
            }
            if (textToType) {
              UI.typeText(UI.refs.narrativeText, textToType);
            }
          }
        } else {
          UI.refs.player.textContent =
            this.story.rooms[this.currentRoomKey].defaultEmoji || '😐';
        }
      }

      requestAnimationFrame(this.loop.bind(this));
    }
  };

  // ──────────────────────────────────────────
  // 5) START THE GAME
  // ──────────────────────────────────────────
  Game.loadStory('the_replaced_man_living_testament_updated.json');
})();

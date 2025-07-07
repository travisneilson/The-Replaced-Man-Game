// engine.js
;(function(global) {
  // ──────────────────────────────────────────
  // 1) CONFIG & CONSTANTS
  // ──────────────────────────────────────────
  const Config = {
    PLAYER_BASE_SPEED: 240,
    SPRINT_MULTIPLIER: 2.5,
    DEFAULT_PROXIMITY: 64,
    DOOR_CLEARANCE: 96,
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
      up: ['ArrowUp','w'],
      down: ['ArrowDown','s'],
      left: ['ArrowLeft','a'],
      right: ['ArrowRight','d'],
      interact: 'e',
      hint: 'h',
      sprint: 'r'
    }
  };

  // ──────────────────────────────────────────
  // 2) INPUT HANDLING
  // ──────────────────────────────────────────
  const Input = {
    keys: {},
    onHint: null,
    onInteract: null,
    onMantra: null,

    init() {
      window.addEventListener('keydown', e => {
        const k = e.key;
        console.log('🔑 keydown:', k);

        // Movement
        if (
          Config.KEY.up.includes(k) ||
          Config.KEY.down.includes(k) ||
          Config.KEY.left.includes(k) ||
          Config.KEY.right.includes(k)
        ) {
          this.keys[k] = true;
          e.preventDefault();
        }

        // Sprint
        if (k.toLowerCase() === Config.KEY.sprint) {
          this.keys[Config.KEY.sprint] = true;
        }

        // Hint
        if (k.toLowerCase() === Config.KEY.hint && this.onHint) {
          this.onHint();
        }

        // Interact
        // if (k.toLowerCase() === Config.KEY.interact && this.onInteract) {
        //   this.onInteract(k.toLowerCase());
        // }

        const ik = Config.KEY.interact;
        const interactMatch = Array.isArray(ik)
          ? ik.includes(k.toLowerCase())
          : k.toLowerCase() === ik;
        if (interactMatch && this.onInteract) {
          console.log('🕹 Input: interact key detected:', k);
          this.onInteract(k.toLowerCase());
        }

        // Mantra
        if (k.toLowerCase() === 'm' && this.onMantra) {
          this.onMantra();
        }
      });

      window.addEventListener('keyup', e => {
        const k = e.key;
        delete this.keys[k];
        if (k.toLowerCase() === Config.KEY.sprint) {
          delete this.keys[Config.KEY.sprint];
        }
      });
    },

    isDown(key) {
      return !!this.keys[key];
    }
  };

  // ──────────────────────────────────────────
  // 3) UI & DOM OPERATIONS
  // ──────────────────────────────────────────
  const UI = {
    refs: {},
    _typeVersion: 0,

    init() {
      this.refs = {
        player:         document.getElementById('player'),
        map:            document.getElementById('map-container'),
        loadingOverlay: document.getElementById('loading-overlay'),
        narrativeText:  document.getElementById('narrative-text'),
        weekday:        document.getElementById('weekday'),
        objective:      document.getElementById('objective'),
        location:       document.getElementById('location-snippet'),
        subtitle:       document.getElementById('act-subtitle'),
        hint:           document.getElementById('hint-container'),
        modal:          document.getElementById('interaction-modal'),
        modalTitle:     document.getElementById('modal-title'),
        modalOptions:   document.getElementById('modal-options'),
        mantraCounter:  document.getElementById('mantra-counter'),
        mantraCount:    document.getElementById('mantra-count')
      };
    },

    typeText(el, text, speed = 30) {
      const myVersion = ++this._typeVersion;
      el.textContent = '';
      return new Promise(resolve => {
        let i = 0;
        const step = () => {
          if (myVersion !== this._typeVersion) return resolve();
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

    updateMantraUI(n) {
      if (this.refs.mantraCount) {
        this.refs.mantraCount.textContent = n;
      }
    },

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

    Modal: {
      open(node) {
        UI.refs.modalTitle.textContent = node.icon || '';
        UI.refs.modalOptions.innerHTML = '';
        node.interactions.forEach(i => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="keycap">${i.key}</span> ${i.prompt}`;
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
    currentLoop: 1,
    lastMantraLoopCollected: {},
    player: { x:0, y:0, speed: Config.PLAYER_BASE_SPEED },

    async loadStory(url) {
      this.story = await fetch(url).then(r => r.json());
      Input.onHint     = UI.Hint.renderNext.bind(UI.Hint);
      Input.onInteract = this.handleInteract.bind(this);
      Input.onMantra   = Mantra?.spend.bind(Mantra);
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
      this.currentRoomKey     = key;
      this.lastProximityNodeId= null;

      // Narrative header
      UI.refs.subtitle.textContent = `Act ${room.narrative.act.number} – ${room.narrative.act.title}`;
      UI.refs.weekday.textContent  = room.narrative.weekday;
      UI.refs.objective.innerHTML   = `<strong>OBJECTIVE:</strong> ${room.narrative.objective}`;
      await UI.typeText(UI.refs.narrativeText, room.narrative.onEnter);
      UI.refs.location.textContent  = room.setting;
      UI.refs.player.textContent    = room.defaultEmoji || '😐';

      // Show map
      UI.refs.loadingOverlay.classList.add('hidden');
      UI.refs.map.classList.add('visible');
      UI.refs.map.innerHTML = '';
      UI.refs.map.appendChild(UI.refs.player);

      // Center player
      this.player.x = UI.refs.map.clientWidth/2;
      this.player.y = UI.refs.map.clientHeight/2;
      UI.refs.player.style.left = `${this.player.x}px`;
      UI.refs.player.style.top  = `${this.player.y}px`;

      const MAP_W = UI.refs.map.clientWidth;
      const MAP_H = UI.refs.map.clientHeight;

      // Build node positions
      const nodesData = room.nodes
        .filter(n => !(n.requiresState && !this.state[n.requiresState]))
        .map(node => {
          let x,y;
          if (node.type === 'exit') {
            const o = node.orientation||'south';
            const t = node.offset!=null?node.offset:0.5;
            switch(o) {
              case 'north':
                x = Config.DOOR.width/2 + (MAP_W-Config.DOOR.width)*t;
                y = Config.DOOR.inset + Config.DOOR.height/2;
                break;
              case 'south':
                x = Config.DOOR.width/2 + (MAP_W-Config.DOOR.width)*t;
                y = MAP_H - (Config.DOOR.inset + Config.DOOR.height/2);
                break;
              case 'west':
                x = Config.DOOR.inset + Config.DOOR.height/2;
                y = Config.DOOR.width/2 + (MAP_H-Config.DOOR.width)*t;
                break;
              case 'east':
                x = MAP_W - (Config.DOOR.inset + Config.DOOR.height/2);
                y = Config.DOOR.width/2 + (MAP_H-Config.DOOR.width)*t;
                break;
            }
          } else {
            x = node.position.x;
            y = node.position.y;
          }
          return { node, x, y };
        });

      // Repel nodes but keep exits fixed
      const MIN_DIST = 128;
      let moved;
      do {
        moved = false;
        for (let i=0; i<nodesData.length; i++){
          for (let j=i+1; j<nodesData.length; j++){
            const a=nodesData[i], b=nodesData[j];
            const dx=b.x-a.x, dy=b.y-a.y, d=Math.hypot(dx,dy);
            if (d>0 && d<MIN_DIST){
              const push=(MIN_DIST-d)/2, ux=dx/d, uy=dy/d;
              if(a.node.type!=='exit'){ a.x-=ux*push; a.y-=uy*push; }
              if(b.node.type!=='exit'){ b.x+=ux*push; b.y+=uy*push; }
              moved=true;
            }
          }
        }
      } while(moved);

      // Keep others clear of doors
      const exits = nodesData.filter(nd=>nd.node.type==='exit');
      nodesData.forEach(nd=>{
        if(nd.node.type!=='exit'){
          exits.forEach(e=>{
            const dx=nd.x-e.x, dy=nd.y-e.y, d=Math.hypot(dx,dy);
            if(d<Config.DOOR_CLEARANCE){
              const push=Config.DOOR_CLEARANCE-d;
              nd.x += (dx/d)*push;
              nd.y += (dy/d)*push;
            }
          });
        }
      });

      // Clamp all within bounds
      nodesData.forEach(nd=>{
        nd.x = Math.max(0, Math.min(MAP_W, nd.x));
        nd.y = Math.max(0, Math.min(MAP_H, nd.y));
      });

      // Render dots, icons, prompts
      this.interactiveNodes = [];
      nodesData.forEach(({node,x,y})=>{
        const dot=document.createElement('div');
        dot.classList.add('dot');
        if(node.type==='mainQuest') dot.classList.add('mainquest');
        UI.refs.map.appendChild(dot);

        const icon=document.createElement('div');
        icon.classList.add('node-icon', node.type);
        if(node.type==='exit') icon.innerHTML=Config.DOOR.svg;
        else icon.textContent=node.icon;
        UI.refs.map.appendChild(icon);

        const prompt=document.createElement('div');
        prompt.classList.add('prompt');
        if(node.interactions?.length){
          prompt.innerHTML = node.interactions
            .map(i=>`<span class="keycap">${i.key}</span> ${i.prompt}`)
            .join('<br>');
        }
        UI.refs.map.appendChild(prompt);

        dot.style.left=`${x}px`;
        dot.style.top=`${y}px`;
        icon.style.left=`${x}px`;
        icon.style.top=`${y}px`;
        prompt.style.left=`${x}px`;
        prompt.style.top=`${y}px`;

        if(node.type==='exit'){
          let rot=0;
          switch(node.orientation){
            case 'north': rot=0; break;
            case 'south': rot=180; break;
            case 'west':  rot=270; break;
            case 'east':  rot=90; break;
          }
          icon.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;
        }

        prompt.classList.remove('right-align');
        const pR = prompt.getBoundingClientRect();
        const mR = UI.refs.map.getBoundingClientRect();
        if (pR.right > mR.right - 8) prompt.classList.add('right-align');

        this.interactiveNodes.push({ node, dotEl: dot, iconEl: icon, promptEl: prompt });
      });

      // Fade-in sequence
      const seq = [UI.refs.player]
        .concat(this.interactiveNodes.map(e=>e.iconEl))
        .concat(this.interactiveNodes.map(e=>e.dotEl));
      seq.forEach((el,i)=>setTimeout(()=>el.classList.add('fade-in'), i*100));
    },

    findEntryForKey(key) {
      return this.interactiveNodes.find(entry => {
        const dx=this.player.x-parseFloat(entry.dotEl.style.left);
        const dy=this.player.y-parseFloat(entry.dotEl.style.top);
        const dist=Math.hypot(dx,dy);
        const thr=entry.node.proximity||Config.DEFAULT_PROXIMITY;
        return (dist<=thr && entry.node.interactions.some(i=>i.key.toLowerCase()===key));
      });
    },

    handleInteract(key) {
      const entry=this.findEntryForKey(key);
      if(!entry) return;
      const interaction=entry.node.interactions.find(i=>i.key.toLowerCase()===key);
      if(!interaction) return;
      // always pass nodeId along
      const action={ ...interaction.action, nodeId: entry.node.id };

      if(entry.node.type==='exit'){
        this._lastTravelDir = entry.node.orientation;
        this.executeAction(action);
      } else if(entry.node.interactions.length>1){
        UI.Modal.open(entry.node);
      } else {
        this.executeAction(action);
      }
    },

    async executeAction(action) {
      console.log('⚙️ executeAction →', action);
      console.log('HIIII    → action.event =', action.event);
      UI.Modal.close();

      // handle mantra-collection once per loop
      const ev = action.event;
      if ((ev?.action==='collect_mantra') || (ev?.action==='add_state' && ev.state==='gained_mantra')) {
        const id = action.nodeId;
        if (this.lastMantraLoopCollected[id] !== this.currentLoop) {
          console.log(`🔹 collecting mantra from ${id} on loop ${this.currentLoop}`);
          Mantra.collect();
          this.lastMantraLoopCollected[id] = this.currentLoop;
        } else {
          console.log(`⚠️ already collected mantra from ${id} on loop ${this.currentLoop}`);
        }
      }

      switch(action.type) {
        case 'set_room_narrative':
          if(action.emotionalImpact){
            UI.refs.player.textContent=action.emotionalImpact;
          }
          await UI.typeText(UI.refs.narrativeText, action.narrative);
          // still handle other add_state events
          if(ev?.action==='add_state' && ev.state!=='gained_mantra'){
            this.state[ev.state]=true;
          }
          break;

        case 'travel':
          // JSON-driven loop boundary
          if(action.loop){
            this.currentLoop++;
            console.log(`🔄 Loop #${this.currentLoop} start`);
            this.lastMantraLoopCollected={};
          }
          UI.refs.loadingOverlay.classList.remove('hidden');
          UI.refs.map.classList.remove('visible');
          await new Promise(r=>setTimeout(r,500));
          await this.loadRoom(action.to);
          break;

        case 'dialogue_choice':
          await UI.typeText(UI.refs.narrativeText, action.narrative);
          break;
      }
    },

    loop(now=performance.now()){
      const dt=(now-(this._lastTime||now))/1000;
      this._lastTime=now;

      if(UI.refs.modal.classList.contains('hidden')){
        let dx=0, dy=0;
        Config.KEY.up.forEach(k=>{ if(Input.isDown(k)) dy-- });
        Config.KEY.down.forEach(k=>{ if(Input.isDown(k)) dy++ });
        Config.KEY.left.forEach(k=>{ if(Input.isDown(k)) dx-- });
        Config.KEY.right.forEach(k=>{ if(Input.isDown(k)) dx++ });
        if(dx&&dy){ const m=Math.hypot(dx,dy); dx/=m; dy/=m; }

        const sprint=!!Input.isDown(Config.KEY.sprint);
        const speed=this.player.speed*(sprint?Config.SPRINT_MULTIPLIER:1);

        this.player.x+=dx*speed*dt;
        this.player.y+=dy*speed*dt;

        const W=UI.refs.map.clientWidth, H=UI.refs.map.clientHeight;
        const hw=UI.refs.player.offsetWidth/2, hh=UI.refs.player.offsetHeight/2;
        this.player.x=Math.max(hw,Math.min(W-hw,this.player.x));
        this.player.y=Math.max(hh,Math.min(H-hh,this.player.y));

        UI.refs.player.style.left=`${this.player.x}px`;
        UI.refs.player.style.top=`${this.player.y}px`;

        let nearest=null, nd=Infinity;
        this.interactiveNodes.forEach(entry=>{
          entry.promptEl.classList.remove('visible');
          entry.dotEl.style.opacity='1';
          const dx2=this.player.x-parseFloat(entry.dotEl.style.left);
          const dy2=this.player.y-parseFloat(entry.dotEl.style.top);
          const dist=Math.hypot(dx2,dy2), thr=entry.node.proximity||Config.DEFAULT_PROXIMITY;
          if(dist<=thr && dist<nd){
            nearest=entry; nd=dist;
          }
        });

        if(nearest){
          nearest.promptEl.classList.add('visible');
          nearest.dotEl.style.opacity='0';
          UI.refs.player.textContent=
            nearest.node.proximityEmoji||
            (this.story.rooms[this.currentRoomKey].defaultEmoji||'😐');

          if(nearest.node.id!==this.lastProximityNodeId){
            this.lastProximityNodeId=nearest.node.id;
            let textToType=null;
            if(nearest.node.type==='exit'){
              textToType=nearest.node.proximityNarrative||nearest.node.interactions[0].prompt;
            } else {
              textToType=this.story.rooms[this.currentRoomKey].narrative.mantraNarratives
                ? this.story.rooms[this.currentRoomKey].narrative.mantraNarratives[
                    Math.floor(Math.random()*this.story.rooms[this.currentRoomKey].narrative.mantraNarratives.length)
                  ]
                : null;
            }
            if(textToType){
              UI.typeText(UI.refs.narrativeText, textToType);
            }
          }
        } else {
          UI.refs.player.textContent=
            this.story.rooms[this.currentRoomKey].defaultEmoji||'😐';
        }
      }

      requestAnimationFrame(this.loop.bind(this));
    }
  };

  // Expose globals
  global.Config = Config;
  global.Input  = Input;
  global.UI     = UI;
  global.Game   = Game;
})(window);

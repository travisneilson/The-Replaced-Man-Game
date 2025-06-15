// game.js
;(function() {
  document.addEventListener('DOMContentLoaded', () => {
    // Door SVG (unchanged)
    const DOOR_SVG = `
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
</svg>`.trim();

    // Element refs
    const loadingOverlay  = document.getElementById('loading-overlay');
    const mapContainer    = document.getElementById('map-container');
    const playerEl        = document.getElementById('player');
    const weekdayEl       = document.getElementById('weekday');
    const objectiveEl     = document.getElementById('objective');
    const narrativeTextEl = document.getElementById('narrative-text');
    const locationEl      = document.getElementById('location-snippet');
    const subtitleEl      = document.getElementById('act-subtitle');
    const hintEl          = document.getElementById('hint-container');
    const modal           = document.getElementById('interaction-modal');
    const modalTitleEl    = document.getElementById('modal-title');
    const modalOptionsEl  = document.getElementById('modal-options');

    // State
    let storyData, currentRoomKey;
    let interactiveNodes = [], hints = [], hintIndex = 0;
    let state = {}, playerDefaultEmoji = '😐';
    let lastProximityNodeId = null;

    // Player & input
    const player = { x: 0, y: 0, speed: 240 };
    const keys   = {};

    // Door dims: 120×48 to match CSS
    const DOOR_W = 120;
    const DOOR_H = 48;

    // Helpers
    const wait = ms => new Promise(res => setTimeout(res, ms));
    function typeText(el, text, speed = 30) {
      return new Promise(resolve => {
        el.textContent = '';
        let i = 0;
        (function step() {
          if (i < text.length) {
            el.textContent += text[i++];
            setTimeout(step, speed);
          } else resolve();
        })();
      });
    }
    function renderHint() {
      hintEl.textContent = hints.length
        ? `[H] Hint: ${hints[hintIndex]}`
        : '';
    }
    function entryUnderKey(key) {
      return interactiveNodes.find(entry => {
        const dx   = player.x - parseFloat(entry.dotEl.style.left);
        const dy   = player.y - parseFloat(entry.dotEl.style.top);
        const dist = Math.hypot(dx, dy);
        return dist <= (entry.node.proximity || 64)
            && entry.node.interactions.some(i => i.key.toLowerCase() === key.toLowerCase());
      });
    }

    // Modal
    function openModal(entry) {
      modalTitleEl.textContent = entry.node.icon;
      modalOptionsEl.innerHTML = '';
      entry.node.interactions.forEach(i => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="key">${i.key}</span>${i.prompt}`;
        modalOptionsEl.appendChild(li);
      });
      modal.classList.remove('hidden');
    }
    async function handleAction(action) {
      modal.classList.add('hidden');
      switch (action.type) {
        case 'set_room_narrative':
          if (action.emotionalImpact) playerEl.textContent = action.emotionalImpact;
          await typeText(narrativeTextEl, action.narrative);
          if (action.event?.action === 'add_state') {
            state[action.event.state] = true;
          }
          break;
        case 'travel':
          loadingOverlay.classList.remove('hidden');
          mapContainer.classList.remove('visible');
          await wait(500);
          await loadRoom(action.to);
          break;
        case 'dialogue_choice':
          await typeText(narrativeTextEl, action.narrative);
          break;
      }
    }

    // Input
    window.addEventListener('keydown', e => {
      const key = e.key;
      if (!modal.classList.contains('hidden')) {
        const entry = interactiveNodes.find(en =>
          en.node.interactions.some(i => i.key.toLowerCase() === key.toLowerCase())
        );
        if (entry) {
          const choice = entry.node.interactions.find(i => i.key.toLowerCase() === key.toLowerCase());
          handleAction(choice.action);
        }
        return;
      }
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(key)) {
        keys[key] = true; e.preventDefault();
      }
      if ((key==='h'||key==='H') && hints.length) {
        hintIndex = (hintIndex+1)%hints.length;
        renderHint();
      }
      if (key.toLowerCase()==='e') {
        const entry = entryUnderKey(key);
        if (entry) {
          if (entry.node.type==='exit') {
            handleAction(entry.node.interactions[0].action);
          } else {
            openModal(entry);
          }
        }
      }
    });
    window.addEventListener('keyup', e => {
      if (keys[e.key]) keys[e.key] = false;
    });

    // Main loop
    let lastTime = performance.now();
    function loop(now) {
      const dt = (now - lastTime)/1000;
      lastTime = now;
      if (modal.classList.contains('hidden')) {
        let dx=0, dy=0;
        if (keys['ArrowUp']||keys['w'])   dy-=1;
        if (keys['ArrowDown']||keys['s']) dy+=1;
        if (keys['ArrowLeft']||keys['a']) dx-=1;
        if (keys['ArrowRight']||keys['d'])dx+=1;
        if(dx&&dy){const m=Math.hypot(dx,dy);dx/=m;dy/=m;}
        player.x+=dx*player.speed*dt;
        player.y+=dy*player.speed*dt;

        const W=mapContainer.clientWidth, H=mapContainer.clientHeight;
        const halfW=playerEl.offsetWidth/2, halfH=playerEl.offsetHeight/2;
        player.x=Math.max(halfW,Math.min(W-halfW,player.x));
        player.y=Math.max(halfH,Math.min(H-halfH,player.y));

        playerEl.style.left=`${player.x}px`;
        playerEl.style.top=`${player.y}px`;

        let nearest=null, ndist=Infinity;
        interactiveNodes.forEach(entry=>{
          const dx=player.x-parseFloat(entry.dotEl.style.left);
          const dy=player.y-parseFloat(entry.dotEl.style.top);
          const dist=Math.hypot(dx,dy), thr=entry.node.proximity||64;
          entry.promptEl.classList.remove('visible');
          if(dist<=thr && dist<ndist){
            nearest=entry; ndist=dist;
          }
        });

        if(nearest){
          nearest.promptEl.classList.add('visible');
          playerEl.textContent=nearest.node.proximityEmoji||playerDefaultEmoji;
          if(nearest.node.id!==lastProximityNodeId){
            lastProximityNodeId=nearest.node.id;
            const mantras=storyData.rooms[currentRoomKey].mantraNarratives||[];
            if(mantras.length){
              const m=mantras[Math.floor(Math.random()*mantras.length)];
              typeText(narrativeTextEl,m);
            }
          }
        } else {
          playerEl.textContent=playerDefaultEmoji;
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    // Fetch JSON & start
    fetch('the_replaced_man_living_testament_updated.json')
      .then(r=>r.json())
      .then(data=>{
        storyData=data;
        hints=Array.isArray(data.hints)?data.hints:[];
        renderHint();
        loadRoom(Object.keys(data.rooms)[0]);
      }).catch(console.error);

    // Load & render room
    async function loadRoom(key) {
      const room=storyData.rooms[key];
      if(!room){console.error(`Room ${key} not found`);return;}
      currentRoomKey=key;
      lastProximityNodeId=null;

      subtitleEl.textContent=`Act ${room.narrative.act.number} – ${room.narrative.act.title}`;
      weekdayEl.textContent=room.narrative.weekday;
      objectiveEl.innerHTML=`<strong>OBJECTIVE:</strong> ${room.narrative.objective}`;
      await typeText(narrativeTextEl,room.narrative.onEnter);
      locationEl.textContent=room.setting;

      playerDefaultEmoji=room.defaultEmoji||'😐';
      playerEl.textContent=playerDefaultEmoji;
      loadingOverlay.classList.add('hidden');
      mapContainer.classList.add('visible');
      mapContainer.innerHTML='';
      mapContainer.appendChild(playerEl);
      player.x=mapContainer.clientWidth/2;
      player.y=mapContainer.clientHeight/2;
      playerEl.style.left=`${player.x}px`;
      playerEl.style.top=`${player.y}px`;

      interactiveNodes=[];
      const MAP_W=mapContainer.clientWidth, MAP_H=mapContainer.clientHeight;

      for(const node of room.nodes){
        if(node.requiresState&&!state[node.requiresState]) continue;
        const dotEl=document.createElement('div');
        dotEl.classList.add('dot');
        if(node.type==='mainQuest') dotEl.classList.add('mainquest');
        mapContainer.appendChild(dotEl);

        const iconEl=document.createElement('div');
        iconEl.classList.add('node-icon',node.type);
        mapContainer.appendChild(iconEl);

        const promptEl=document.createElement('div');
        promptEl.classList.add('prompt');
        if(node.interactions?.length){
          const i=node.interactions[0];
          promptEl.innerHTML=`<span class="key">${i.key}</span>${i.prompt}`;
        }
        mapContainer.appendChild(promptEl);

        if(node.type==='exit'){
          const o=node.orientation||'south';
          const t=node.offset!=null?node.offset:0.5;
          let x,y,rot;
          switch(o){
            case 'north':
              x=DOOR_W/2 + (MAP_W - DOOR_W)*t;
              y=DOOR_H/2;
              rot=0;break;
            case 'south':
              x=DOOR_W/2 + (MAP_W - DOOR_W)*t;
              y=MAP_H - DOOR_H/2;
              rot=180;break;
            case 'west':
              x=DOOR_H/2;
              y=DOOR_W/2 + (MAP_H - DOOR_W)*t;
              rot=270;break;
            case 'east':
              x=MAP_W - DOOR_H/2;
              y=DOOR_W/2 + (MAP_H - DOOR_W)*t;
              rot=90;break;
          }
          dotEl.style.left=`${x}px`; dotEl.style.top=`${y}px`;
          iconEl.style.left=`${x}px`; iconEl.style.top=`${y}px`;
          iconEl.style.transform=`translate(-50%,-50%) rotate(${rot}deg)`;
          iconEl.innerHTML=DOOR_SVG;
          promptEl.style.left=`${x}px`; promptEl.style.top=`${y}px`;
        } else {
          const x=node.position.x, y=node.position.y;
          dotEl.style.left=`${x}px`; dotEl.style.top=`${y}px`;
          iconEl.style.left=`${x}px`; iconEl.style.top=`${y}px`;
          iconEl.textContent=node.icon;
          promptEl.style.left=`${x}px`; promptEl.style.top=`${y}px`;
        }

        interactiveNodes.push({node,dotEl,iconEl,promptEl});
      }
    }
  });
})();

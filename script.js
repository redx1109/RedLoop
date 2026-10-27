(() => {
"use strict";

const clamp = (v,a,b) => v<a?a:v>b?b:v;
function lsGet(k,d){ try{ const v=localStorage.getItem(k); return v===null?d:v; }catch(e){ return d; } }
function lsSet(k,v){ try{ localStorage.setItem(k,v); }catch(e){} }
function mulberry32(seed){let a=seed>>>0;return function(){a|=0;a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function shuffleArr(arr,rng=Math.random){for(let i=arr.length-1;i>0;i--){const j=(rng()*(i+1))|0;[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;}

/* ============================================================
   THEMES
============================================================ */
const THEMES = {
  neon:{label:'Neon',style:'neon',previewBg:'#0a1520',
    pipe:{halo:[56,166,235],glow:[96,200,255],core:[166,236,255],coreSolved:[200,250,255]},
    css:{'--accent':'#3aa7d8','--accent-bright':'#9fe4ff','--text':'#cfe9f7','--text-dim':'#4d7a99',
      '--orb1':'rgba(30,120,200,.45)','--orb2':'rgba(20,90,180,.4)','--orb3':'rgba(60,160,220,.18)',
      '--btn-bg':'rgba(24,52,78,.5)','--btn-border':'rgba(80,160,210,.28)',
      '--card-a':'rgba(22,44,70,.62)','--card-b':'rgba(10,20,34,.52)',
      '--glow-color':'rgba(90,210,255,.45)','--bg-base':'#05090f'}},
  minimal:{label:'Minimal',style:'minimal',previewBg:'#12161c',
    pipe:{core:[220,232,245],coreSolved:[255,255,255]},
    css:{'--accent':'#8fa6bd','--accent-bright':'#e6eef8','--text':'#dce6f0','--text-dim':'#5a6878',
      '--orb1':'rgba(80,95,115,.2)','--orb2':'rgba(60,75,95,.2)','--orb3':'rgba(120,135,155,.1)',
      '--btn-bg':'rgba(32,40,52,.5)','--btn-border':'rgba(120,140,160,.25)',
      '--card-a':'rgba(28,34,44,.62)','--card-b':'rgba(10,14,20,.52)',
      '--glow-color':'rgba(200,220,240,.25)','--bg-base':'#0c1016'}},
  glass:{label:'Glass',style:'glass',previewBg:'#0d1722',
    pipe:{glass:[110,190,255],glassAlpha:0.32,liquid:[210,240,255],liquidSolved:[255,255,255]},
    css:{'--accent':'#5aa8e8','--accent-bright':'#c8e8ff','--text':'#e0f0ff','--text-dim':'#5a7a9a',
      '--orb1':'rgba(80,160,240,.4)','--orb2':'rgba(120,190,255,.32)','--orb3':'rgba(80,140,200,.2)',
      '--btn-bg':'rgba(30,60,90,.5)','--btn-border':'rgba(120,180,230,.3)',
      '--card-a':'rgba(24,52,80,.62)','--card-b':'rgba(10,24,40,.52)',
      '--glow-color':'rgba(130,200,255,.4)','--bg-base':'#07101a'}},
  sketch:{label:'Sketch',style:'sketch',previewBg:'#1a1612',
    pipe:{ink:[230,216,190],inkSolved:[255,250,230]},
    css:{'--accent':'#d4c4a0','--accent-bright':'#f4ecd6','--text':'#ece2cc','--text-dim':'#8a7a5a',
      '--orb1':'rgba(90,70,40,.15)','--orb2':'rgba(60,45,25,.15)','--orb3':'rgba(120,95,55,.08)',
      '--btn-bg':'rgba(50,42,32,.5)','--btn-border':'rgba(140,120,90,.3)',
      '--card-a':'rgba(40,34,26,.62)','--card-b':'rgba(20,16,12,.52)',
      '--glow-color':'rgba(200,180,140,.3)','--bg-base':'#1a1612'}},
  hollow:{label:'Hollow',style:'hollow',previewBg:'#140e08',
    pipe:{wall:[255,150,70],wallSolved:[255,200,130],interior:[28,18,12]},
    css:{'--accent':'#e08c3a','--accent-bright':'#ffc088','--text':'#f5e0c8','--text-dim':'#8a5a35',
      '--orb1':'rgba(180,90,30,.3)','--orb2':'rgba(140,60,20,.28)','--orb3':'rgba(220,130,50,.12)',
      '--btn-bg':'rgba(50,30,16,.5)','--btn-border':'rgba(180,110,60,.3)',
      '--card-a':'rgba(48,28,16,.62)','--card-b':'rgba(20,12,8,.52)',
      '--glow-color':'rgba(255,150,80,.35)','--bg-base':'#0d0805'}},
  pixel:{label:'Pixel',style:'pixel',previewBg:'#07100a',
    pipe:{border:[30,90,55],core:[110,255,140],coreSolved:[190,255,200]},
    css:{'--accent':'#4adb78','--accent-bright':'#a8ffc0','--text':'#d4f5dc','--text-dim':'#3d7a50',
      '--orb1':'rgba(40,180,90,.25)','--orb2':'rgba(20,130,60,.22)','--orb3':'rgba(80,220,120,.1)',
      '--btn-bg':'rgba(18,44,28,.5)','--btn-border':'rgba(90,200,120,.3)',
      '--card-a':'rgba(20,48,32,.62)','--card-b':'rgba(8,20,14,.52)',
      '--glow-color':'rgba(110,255,140,.35)','--bg-base':'#07100a'}},
};

const DIRS=[{dx:0,dy:-1,bit:1},{dx:1,dy:0,bit:2},{dx:0,dy:1,bit:4},{dx:-1,dy:0,bit:8}];
const OPP={1:4,2:8,4:1,8:2};
function rotCW(m){return((m&1)?2:0)|((m&2)?4:0)|((m&4)?8:0)|((m&8)?1:0);}
function rotMask(m,k){k=((k%4)+4)%4;for(let i=0;i<k;i++)m=rotCW(m);return m;}

/* ============================================================
   GENERATOR — difficulty-driven
============================================================ */
function tryLoop(sx,sy,used,W,H,rng,opts){
  const minLen = Math.min(opts.minLen, Math.floor(W*H*0.6));
  const closeChance = opts.closeChance;
  const straightBias = opts.straightBias;

  const inPath = new Set([sy*W+sx]);
  const edges = [];
  let x=sx,y=sy,dir=(rng()*4)|0;

  for(let step=0; step<W*H*2; step++){
    // can we close?
    let closeBit = 0;
    if(edges.length >= minLen){
      for(let d=0;d<4;d++){
        const dd=DIRS[d];
        if(x+dd.dx===sx && y+dd.dy===sy){ closeBit = dd.bit; break; }
      }
    }

    // build weighted move options
    const opts2 = [];
    const dirs = [dir,(dir+1)&3,(dir+3)&3];
    const weights = [Math.max(1,Math.round(straightBias)),1,1];
    for(let i=0;i<dirs.length;i++){
      const nd = dirs[i];
      const dd = DIRS[nd];
      const tx = x+dd.dx, ty = y+dd.dy;
      if(tx<0||tx>=W||ty<0||ty>=H) continue;
      if(used[ty][tx]) continue;
      if(inPath.has(ty*W+tx)) continue;
      for(let w=0;w<weights[i];w++) opts2.push(nd);
    }

    if(closeBit && (opts2.length===0 || rng() < closeChance)){
      edges.push({x,y,bit:closeBit});
      return edges;
    }
    if(opts2.length===0) return null;

    const nd = opts2[(rng()*opts2.length)|0];
    edges.push({x,y,bit:DIRS[nd].bit});
    dir = nd;
    x += DIRS[nd].dx; y += DIRS[nd].dy;
    inPath.add(y*W+x);
  }
  return null;
}

function commitLoop(conn,used,edges){
  const n = edges.length;
  for(let i=0;i<n;i++){
    const e = edges[i];
    const p = edges[(i-1+n)%n];
    if(used[e.y][e.x]) return false;
    conn[e.y][e.x] = e.bit | OPP[p.bit];
    used[e.y][e.x] = true;
  }
  return true;
}

function generateRawBoard(W,H,params,rng){
  const conn = Array.from({length:H},()=>new Array(W).fill(0));
  const used = Array.from({length:H},()=>new Array(W).fill(false));
  const cells = [];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) cells.push([x,y]);

  // PHASE 1: try to place one big "anchor" loop at high difficulty
  if(params.bigLoopMinLen > 0){
    shuffleArr(cells, rng);
    for(const [sx,sy] of cells){
      const edges = tryLoop(sx,sy,used,W,H,rng,{
        minLen: params.bigLoopMinLen,
        closeChance: params.closeChance * 0.5,
        straightBias: params.straightBias,
      });
      if(edges && edges.length >= params.bigLoopMinLen){
        if(commitLoop(conn,used,edges)) break;
      }
    }
  }

  // PHASE 2: fill remaining cells with regular loops
  for(let pass=0; pass<5; pass++){
    shuffleArr(cells, rng);
    let progress = false;
    for(const [sx,sy] of cells){
      if(used[sy][sx]) continue;
      for(let a=0;a<40;a++){
        const edges = tryLoop(sx,sy,used,W,H,rng,params);
        if(!edges) continue;
        if(!commitLoop(conn,used,edges)) continue;
        progress = true;
        break;
      }
    }
    if(!progress) break;
  }

  // PHASE 3: 2×2 filler with difficulty-scaled probability
  for(let y=0;y<H-1;y++){
    for(let x=0;x<W-1;x++){
      if(used[y][x]||used[y][x+1]||used[y+1][x]||used[y+1][x+1]) continue;
      if(rng() > params.fillChance) continue;
      conn[y][x]=6; conn[y][x+1]=12; conn[y+1][x+1]=9; conn[y+1][x]=3;
      used[y][x]=used[y][x+1]=used[y+1][x]=used[y+1][x+1]=true;
    }
  }

  return {conn, used};
}

/* ---- metrics + scoring ---- */
function computeBoardMetrics(conn, used, W, H){
  let filled = 0;
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) if(used[y][x]) filled++;
  const density = filled / (W*H);

  const visited = Array.from({length:H},()=>new Array(W).fill(false));
  const comps = [];
  let maxLen = 0, sumLen = 0;

  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      if(!used[y][x] || visited[y][x]) continue;
      // BFS through connections
      const stack = [[x,y]];
      visited[y][x] = true;
      let count = 0;
      while(stack.length){
        const [cx,cy] = stack.pop();
        count++;
        const mask = conn[cy][cx];
        for(let d=0;d<4;d++){
          const dir = DIRS[d];
          if(!(mask & dir.bit)) continue;
          const nx = cx+dir.dx, ny = cy+dir.dy;
          if(nx<0||nx>=W||ny<0||ny>=H) continue;
          if(visited[ny][nx]) continue;
          if(!(conn[ny][nx] & OPP[dir.bit])) continue;
          visited[ny][nx] = true;
          stack.push([nx,ny]);
        }
      }
      comps.push(count);
      if(count > maxLen) maxLen = count;
      sumLen += count;
    }
  }

  return {
    density,
    filled,
    componentCount: comps.length,
    avgLen: comps.length ? sumLen/comps.length : 0,
    maxLen,
  };
}

function scoreDifficulty(m, W, H){
  const maxComponents = Math.max(1, m.filled / 4);
  const componentScore = 1 - Math.min(1, m.componentCount / maxComponents);
  const lengthScore    = Math.min(1, Math.max(0, (m.avgLen - 3) / 6));
  const densityScore   = Math.min(1, Math.max(0, (m.density - 0.35) / 0.55));
  const maxLoopScore   = Math.min(1, m.maxLen / (W*H*0.6));
  return densityScore*0.35 + componentScore*0.25 + lengthScore*0.25 + maxLoopScore*0.15;
}

/* ---- conversion ---- */
function connToTiles(conn, W, H){
  const tiles = [];
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const m = conn[y][x];
      let base=0, rot=0;
      if(m===5){base=5;rot=0;}
      else if(m===10){base=5;rot=1;}
      else if(m===3){base=3;rot=0;}
      else if(m===6){base=3;rot=1;}
      else if(m===12){base=3;rot=2;}
      else if(m===9){base=3;rot=3;}
      tiles.push({base,rot,angle:rot*90,vel:0});
    }
  }
  return tiles;
}

function isSolved(tiles,W,H){
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const t=tiles[y*W+x]; const m=rotMask(t.base,t.rot); if(m===0) continue;
    for(let d=0;d<4;d++){
      const bit=DIRS[d].bit; if(!(m&bit)) continue;
      const nx=x+DIRS[d].dx, ny=y+DIRS[d].dy;
      if(nx<0||nx>=W||ny<0||ny>=H) return false;
      const nt=tiles[ny*W+nx];
      if(!(rotMask(nt.base,nt.rot)&OPP[bit])) return false;
    }
  }
  return true;
}

/* ============================================================
   DIFFICULTY TUNING — the heart of the ramp
============================================================ */
function difficultyForLevel(level, mode){
  // t: 0 at level 1 → 1 at level 20+ (per-mode scaling)
  let t = clamp((level - 1) / 19, 0, 1);
  if(mode === 'time') t *= 0.6;        // gentler ramp, timer is pressure enough
  else if(mode === 'zen') t *= 0.35;   // relaxing
  else if(mode === 'daily') t = 0.45;  // fixed medium-hard

  // Grid size — modest step-ups (the pattern does the real work)
  let grid;
  if(mode === 'daily') grid = 6;
  else if(mode === 'time') grid = Math.min(7, 4 + Math.floor(level / 5));
  else grid = Math.min(8, 4 + Math.floor(level / 4));

  // Difficulty parameters — all ramp with t
  const params = {
    // anchor loop first: 0 (off) → 18 (giant snaking loop)
    bigLoopMinLen: Math.round(t * 18),
    // fill loop minimum length: 3 → 7
    minLen: Math.round(3 + t * 4),
    // how eagerly a walk closes: 0.55 (very eager) → 0.03 (only when stuck)
    closeChance: 0.55 - t * 0.52,
    // preference for going straight: 1× → 3×
    straightBias: 1 + t * 2,
    // 2×2 filler probability: 0.25 (sparse) → 0.95 (dense)
    fillChance: 0.25 + t * 0.70,
  };

  return { grid, params, t };
}

/* ============================================================
   SOUND
============================================================ */
const Sound = (() => {
  let ac=null, masterGain, sfxBus, bgmBus, reverbSend;
  let bgmPlaying=false, bgmTimer=null, chordIdx=0;
  let muted = lsGet('il.muted','0') === '1';
  const MASTER_VOL=0.72, SFX_VOL=1.0, BGM_VOL=0.75;
  const CHORDS=[
    {root:110.00,notes:[220.00,261.63,329.63,392.00]},
    {root:87.31, notes:[174.61,220.00,261.63,329.63]},
    {root:130.81,notes:[261.63,329.63,392.00,493.88]},
    {root:98.00, notes:[196.00,246.94,293.66,392.00]},
  ];
  const PENTA=[440,523.25,587.33,659.25,783.99,880,1046.5];
  function init(){
    if(ac)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      ac=new AC();
      masterGain=ac.createGain();masterGain.gain.value=muted?0:MASTER_VOL;masterGain.connect(ac.destination);
      sfxBus=ac.createGain();sfxBus.gain.value=SFX_VOL;sfxBus.connect(masterGain);
      bgmBus=ac.createGain();bgmBus.gain.value=BGM_VOL;bgmBus.connect(masterGain);
      const conv=ac.createConvolver();const len=Math.floor(ac.sampleRate*2.8);
      const buf=ac.createBuffer(2,len,ac.sampleRate);
      for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);
        for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);}
      conv.buffer=buf;
      const wet=ac.createGain();wet.gain.value=0.42;wet.connect(masterGain);conv.connect(wet);
      reverbSend=ac.createGain();reverbSend.gain.value=1.0;reverbSend.connect(conv);
    }catch(e){ac=null;}
  }
  function unlock(){
    init();if(!ac)return;
    if(ac.state==='suspended')ac.resume().catch(()=>{});
    if(!bgmPlaying)startBGM();
  }
  function scheduleTone(freq,t0,opts={}){
    if(!ac||muted)return;
    const{type='sine',dur=0.2,vol=0.3,attack=0.005,glideTo=0,target=sfxBus,reverb=0.3,release=0}=opts;
    const osc=ac.createOscillator();const g=ac.createGain();
    osc.type=type;osc.frequency.setValueAtTime(freq,t0);
    if(glideTo)osc.frequency.exponentialRampToValueAtTime(Math.max(20,glideTo),t0+dur);
    g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol,t0+attack);
    if(release>0&&dur>release+attack){
      g.gain.setValueAtTime(vol,t0+dur-release);g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
    }else{
      g.gain.exponentialRampToValueAtTime(0.0001,t0+attack+dur);
    }
    osc.connect(g);g.connect(target);
    if(reverb>0&&reverbSend){const s=ac.createGain();s.gain.value=reverb;g.connect(s);s.connect(reverbSend);}
    osc.start(t0);osc.stop(t0+attack+dur+0.15);
  }
  function blip(freq,opts={}){if(!ac||muted)return;scheduleTone(freq,ac.currentTime+0.005,opts);}
  function playPad(freq,t0,duration){
    if(!ac||muted)return;
    const a=ac.createOscillator(),b=ac.createOscillator();
    a.type='sine';b.type='sine';a.frequency.value=freq;b.frequency.value=freq*1.004;
    const g=ac.createGain();
    g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(0.032,t0+1.8);
    g.gain.setValueAtTime(0.032,t0+duration-2.5);g.gain.exponentialRampToValueAtTime(0.0001,t0+duration);
    a.connect(g);b.connect(g);g.connect(bgmBus);
    const s=ac.createGain();s.gain.value=0.55;g.connect(s);s.connect(reverbSend);
    a.start(t0);b.start(t0);a.stop(t0+duration+0.2);b.stop(t0+duration+0.2);
  }
  function playBass(freq,t0,duration){
    if(!ac||muted)return;
    const osc=ac.createOscillator();osc.type='sine';osc.frequency.value=freq;
    const g=ac.createGain();
    g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(0.09,t0+1.2);
    g.gain.setValueAtTime(0.09,t0+duration-2);g.gain.exponentialRampToValueAtTime(0.0001,t0+duration);
    osc.connect(g);g.connect(bgmBus);
    const s=ac.createGain();s.gain.value=0.15;g.connect(s);s.connect(reverbSend);
    osc.start(t0);osc.stop(t0+duration+0.2);
  }
  function playBell(freq,t0,vol=0.11){
    if(!ac||muted)return;
    const osc=ac.createOscillator();osc.type='sine';
    osc.frequency.setValueAtTime(freq*1.01,t0);osc.frequency.exponentialRampToValueAtTime(freq,t0+0.08);
    const g=ac.createGain();
    g.gain.setValueAtTime(0.0001,t0);g.gain.linearRampToValueAtTime(vol,t0+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+2.4);
    osc.connect(g);g.connect(bgmBus);
    const s=ac.createGain();s.gain.value=0.75;g.connect(s);s.connect(reverbSend);
    osc.start(t0);osc.stop(t0+2.6);
  }
  const CHORD_DUR=11,CHORD_STEP=9;
  function bgmTick(){
    if(!bgmPlaying||!ac)return;
    const now=ac.currentTime;const chord=CHORDS[chordIdx%CHORDS.length];chordIdx++;
    playBass(chord.root,now+0.05,CHORD_DUR);
    for(const f of chord.notes)playPad(f,now+0.05,CHORD_DUR);
    const noteCount=1+Math.floor(Math.random()*3);
    for(let i=0;i<noteCount;i++){
      const offset=1+Math.random()*(CHORD_STEP-2);
      const note=PENTA[(Math.random()*PENTA.length)|0];
      playBell(note,now+offset,0.07+Math.random()*0.06);
    }
    bgmTimer=setTimeout(bgmTick,CHORD_STEP*1000);
  }
  function startBGM(){if(bgmPlaying||!ac)return;bgmPlaying=true;chordIdx=0;bgmTick();}
  return {
    init,unlock,startBGM,
    rotate(){unlock();if(!ac||muted)return;const f=580+Math.random()*200;
      blip(f,{type:'sine',dur:0.09,vol:0.34,attack:0.002,glideTo:f*0.72,reverb:0.18});
      blip(f*2.4,{type:'sine',dur:0.035,vol:0.12,attack:0.001,reverb:0.28});},
    solve(){unlock();if(!ac||muted)return;const t0=ac.currentTime;
      [523.25,659.25,783.99,1046.5,1318.51].forEach((f,i)=>scheduleTone(f,t0+i*0.085,{type:'sine',dur:0.95,vol:0.30,attack:0.006,reverb:0.55}));
      scheduleTone(261.63,t0+0.04,{type:'triangle',dur:1.9,vol:0.24,attack:0.02,reverb:0.65});
      scheduleTone(2093.0,t0+0.30,{type:'sine',dur:0.7,vol:0.09,attack:0.06,reverb:0.85});},
    bonus(){unlock();if(!ac||muted)return;const t0=ac.currentTime;
      [880,1174.66,1567.98].forEach((f,i)=>scheduleTone(f,t0+i*0.055,{type:'sine',dur:0.3,vol:0.20,attack:0.004,reverb:0.45}));},
    click(){unlock();if(!ac||muted)return;
      blip(880,{type:'sine',dur:0.05,vol:0.20,attack:0.001,reverb:0.12});
      blip(1320,{type:'sine',dur:0.03,vol:0.08,attack:0.001,reverb:0.15});},
    gameOver(){unlock();if(!ac||muted)return;const t0=ac.currentTime;
      [523.25,440,349.23,261.63].forEach((f,i)=>scheduleTone(f,t0+i*0.15,{type:'triangle',dur:0.65,vol:0.26,attack:0.01,reverb:0.55}));},
    levelStart(){unlock();if(!ac||muted)return;const t0=ac.currentTime;
      scheduleTone(659.25,t0,{type:'sine',dur:0.35,vol:0.14,attack:0.01,reverb:0.4});
      scheduleTone(880.00,t0+0.07,{type:'sine',dur:0.4,vol:0.11,attack:0.01,reverb:0.55});},
    toggle(){muted=!muted;lsSet('il.muted',muted?'1':'0');
      if(ac&&masterGain){const t=ac.currentTime;
        masterGain.gain.cancelScheduledValues(t);masterGain.gain.setValueAtTime(masterGain.gain.value,t);
        masterGain.gain.linearRampToValueAtTime(muted?0:MASTER_VOL,t+0.2);
        if(!muted&&ac.state==='suspended')ac.resume().catch(()=>{});
        if(!muted&&!bgmPlaying)startBGM();}
      return !muted;},
    pause(){ if(ac&&ac.state==='running') ac.suspend().catch(()=>{}); },
    unpause(){ if(ac&&!muted&&ac.state==='suspended') ac.resume().catch(()=>{}); },
    isMuted(){return muted;}
  };
})();

/* ============================================================
   DOM
============================================================ */
const canvas=document.getElementById('c');const ctx=canvas.getContext('2d');
const elHome=document.getElementById('screen-home');
const elSettings=document.getElementById('screen-settings');
const elGame=document.getElementById('screen-game');
const elStatA=document.getElementById('statA');
const elStatB=document.getElementById('statB');
const elStatAL=document.getElementById('statALabel');
const elStatBL=document.getElementById('statBLabel');
const elDiffDots=document.getElementById('diffDots');
const elToast=document.getElementById('toast');
const elToastBig=document.getElementById('toastBig');
const elToastSub=document.getElementById('toastSub');
const elOverlay=document.getElementById('overlay');
const elOvTitle=document.getElementById('ovTitle');
const elOvScore=document.getElementById('ovScore');
const elOvLabel=document.getElementById('ovLabel');
const elOvBest=document.getElementById('ovBest');
const themeGrid=document.getElementById('themeGrid');

/* ============================================================
   STATE
============================================================ */
const Game={
  mode:'classic',screen:'home',
  level:1,moves:0,score:0,timeLeft:60,
  W:4,H:4,tiles:[],
  cell:50,ox:0,oy:0,
  solved:false,solvedAt:0,winTimer:0,gameOver:false,
  hover:null,fadeIn:1,
  themeName:'neon',theme:THEMES.neon,
  reduceMotion:false,
  diffBars:0,
  difficulty:0,
};
const particles=[];
let vw=0,vh=0;
let lastFrame=performance.now();
let errLogged=false;

/* ============================================================
   THEME
============================================================ */
function applyTheme(name,save){
  const theme=THEMES[name]||THEMES.neon;
  Game.themeName=name;Game.theme=theme;
  if(save!==false)lsSet('il.theme',name);
  const root=document.documentElement;
  for(const [k,v] of Object.entries(theme.css))root.style.setProperty(k,v);
  root.setAttribute('data-theme',name);
  document.querySelectorAll('.theme-swatch').forEach(s=>{
    s.classList.toggle('active',s.dataset.theme===name);
  });
}
function themePreviewSVG(name){
  const t=THEMES[name];const style=t.style;
  const d='M 20 6 A 14 14 0 0 0 34 20';
  const dPixel='M 20 6 L 20 20 L 34 20';
  const bg=t.previewBg;
  let inner='';
  if(style==='neon'){
    const halo=t.pipe.halo.join(','),glow=t.pipe.glow.join(','),core=t.pipe.core.join(',');
    inner=`<path d="${d}" fill="none" stroke="rgba(${halo},0.35)" stroke-width="10" stroke-linecap="round" filter="url(#b1)"/>
           <path d="${d}" fill="none" stroke="rgba(${glow},0.7)" stroke-width="5" stroke-linecap="round"/>
           <path d="${d}" fill="none" stroke="rgb(${core})" stroke-width="2.4" stroke-linecap="round"/>`;
  }else if(style==='minimal'){
    const core=t.pipe.core.join(',');
    inner=`<path d="${d}" fill="none" stroke="rgb(${core})" stroke-width="1.6" stroke-linecap="round"/>`;
  }else if(style==='glass'){
    const g=t.pipe.glass.join(','),l=t.pipe.liquid.join(',');
    inner=`<path d="${d}" fill="none" stroke="rgba(${g},0.4)" stroke-width="9" stroke-linecap="round"/>
           <path d="${d}" fill="none" stroke="rgb(${l})" stroke-width="1.8" stroke-linecap="round"/>`;
  }else if(style==='sketch'){
    const ink=t.pipe.ink.join(',');
    inner=`<path d="${d}" fill="none" stroke="rgba(${ink},0.55)" stroke-width="2" stroke-linecap="round" transform="translate(-0.7,-0.5)"/>
           <path d="${d}" fill="none" stroke="rgba(${ink},0.9)" stroke-width="1.4" stroke-linecap="round" transform="translate(0.6,0.4)"/>`;
  }else if(style==='hollow'){
    const w=t.pipe.wall.join(','),i=t.pipe.interior.join(',');
    inner=`<path d="${d}" fill="none" stroke="rgb(${w})" stroke-width="8" stroke-linecap="round"/>
           <path d="${d}" fill="none" stroke="rgb(${i})" stroke-width="4.2" stroke-linecap="round"/>`;
  }else if(style==='pixel'){
    const b=t.pipe.border.join(','),c=t.pipe.core.join(',');
    inner=`<path d="${dPixel}" fill="none" stroke="rgb(${b})" stroke-width="7" stroke-linecap="butt" stroke-linejoin="miter"/>
           <path d="${dPixel}" fill="none" stroke="rgb(${c})" stroke-width="4.4" stroke-linecap="butt" stroke-linejoin="miter"/>`;
  }
  return `<svg viewBox="0 0 40 40" preserveAspectRatio="xMidYMid meet">
    <defs><filter id="b1" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.5"/></filter></defs>
    <rect width="40" height="40" fill="${bg}"/>${inner}</svg>`;
}
function buildThemeSwatches(){
  themeGrid.innerHTML='';
  for(const key of Object.keys(THEMES)){
    const theme=THEMES[key];
    const btn=document.createElement('button');
    btn.className='theme-swatch';btn.dataset.theme=key;btn.type='button';
    btn.innerHTML='<div class="swatch-preview">'+themePreviewSVG(key)+'</div><span>'+theme.label+'</span>';
    btn.addEventListener('click',()=>{Sound.click();applyTheme(key);});
    themeGrid.appendChild(btn);
  }
}
function applyMotionPref(on){
  Game.reduceMotion=on;
  document.body.classList.toggle('reduced-motion',on);
  lsSet('il.motion',on?'1':'0');
  const el=document.getElementById('toggleMotion');
  if(el)el.classList.toggle('on',on);
}

/* ============================================================
   LAYOUT
============================================================ */
function layout(retry){
  retry=retry||0;
  const rect=canvas.getBoundingClientRect();
  if(rect.width<4||rect.height<4){ if(retry<10) requestAnimationFrame(()=>layout(retry+1)); return; }
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(rect.width*dpr);
  canvas.height=Math.round(rect.height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  vw=rect.width;vh=rect.height;
  const pad=Math.min(vw,vh)*0.045;
  const s=Math.min((vw-pad*2)/Game.W,(vh-pad*2)/Game.H);
  Game.cell=s;
  Game.ox=(vw-s*Game.W)/2;
  Game.oy=(vh-s*Game.H)/2;
}

/* ============================================================
   PARTICLES
============================================================ */
function spawnBurst(cx,cy,count){
  if(Game.reduceMotion)return;
  const p=Game.theme.pipe.glow||Game.theme.pipe.core||Game.theme.pipe.liquid||[200,220,240];
  for(let i=0;i<count;i++){
    const a=Math.random()*Math.PI*2;const sp=50+Math.random()*160;
    particles.push({x:cx,y:cy,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:0,maxLife:0.5+Math.random()*0.6,r:1.2+Math.random()*2.2,r0:p[0],g0:p[1],b0:p[2]});
  }
}
function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];p.life+=dt;
    if(p.life>=p.maxLife){particles.splice(i,1);continue;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;
    p.vx*=(1-dt*3);p.vy*=(1-dt*3);p.vy+=70*dt;
  }
}
function renderParticles(){
  for(const p of particles){
    const t=1-p.life/p.maxLife;
    ctx.beginPath();
    ctx.fillStyle='rgba('+p.r0+','+p.g0+','+p.b0+','+(t*0.9).toFixed(3)+')';
    ctx.arc(p.x,p.y,p.r*(0.4+t*0.9),0,Math.PI*2);
    ctx.fill();
  }
}

/* ============================================================
   PIPE PATH
============================================================ */
function buildPipePath(base,half,style){
  ctx.beginPath();
  if(base===5){ ctx.moveTo(0,-half); ctx.lineTo(0,half); }
  else if(style==='pixel'){ ctx.moveTo(0,-half); ctx.lineTo(0,0); ctx.lineTo(half,0); }
  else { ctx.moveTo(0,-half); ctx.arc(half,-half,half,Math.PI,Math.PI/2,true); }
}

/* ============================================================
   TILE DRAW
============================================================ */
function drawTile(t,x,y,s,solvedT,pulse,now){
  const half=s/2;const lw=Math.max(2.4,s*0.13);
  const theme=Game.theme;const style=theme.style;const pipe=theme.pipe;
  ctx.save();
  ctx.translate(Game.ox+x*s+half,Game.oy+y*s+half);
  ctx.rotate((t.angle*Math.PI)/180);

  if(style==='neon'){
    buildPipePath(t.base,half,style);ctx.lineCap='round';ctx.lineJoin='round';
    ctx.strokeStyle='rgba('+pipe.glow[0]+','+pipe.glow[1]+','+pipe.glow[2]+','+((0.22+solvedT*0.20)*pulse).toFixed(3)+')';
    ctx.lineWidth=lw*1.85;ctx.stroke();
    const cr=Math.round(pipe.core[0]+(pipe.coreSolved[0]-pipe.core[0])*solvedT);
    const cg=Math.round(pipe.core[1]+(pipe.coreSolved[1]-pipe.core[1])*solvedT);
    const cb=Math.round(pipe.core[2]+(pipe.coreSolved[2]-pipe.core[2])*solvedT);
    ctx.strokeStyle='rgb('+cr+','+cg+','+cb+')';ctx.lineWidth=lw;ctx.stroke();
  }else if(style==='minimal'){
    buildPipePath(t.base,half,style);ctx.lineCap='round';ctx.lineJoin='round';
    const alpha=0.85+solvedT*0.15;
    ctx.strokeStyle='rgba('+pipe.core[0]+','+pipe.core[1]+','+pipe.core[2]+','+alpha.toFixed(3)+')';
    ctx.lineWidth=lw*0.62;ctx.stroke();
  }else if(style==='glass'){
    buildPipePath(t.base,half,style);ctx.lineCap='round';ctx.lineJoin='round';
    const ga=pipe.glassAlpha+solvedT*0.1;
    ctx.strokeStyle='rgba('+pipe.glass[0]+','+pipe.glass[1]+','+pipe.glass[2]+','+ga.toFixed(3)+')';
    ctx.lineWidth=lw*2.3;ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,'+(0.08+solvedT*0.06).toFixed(3)+')';
    ctx.lineWidth=lw*1.7;ctx.stroke();
    const lr=Math.round(pipe.liquid[0]+(pipe.liquidSolved[0]-pipe.liquid[0])*solvedT);
    const lg=Math.round(pipe.liquid[1]+(pipe.liquidSolved[1]-pipe.liquid[1])*solvedT);
    const lb=Math.round(pipe.liquid[2]+(pipe.liquidSolved[2]-pipe.liquid[2])*solvedT);
    ctx.strokeStyle='rgb('+lr+','+lg+','+lb+')';ctx.lineWidth=lw*0.55;ctx.stroke();
  }else if(style==='sketch'){
    ctx.lineCap='round';ctx.lineJoin='round';
    const seed=(x*31+y*97)%100;
    const j1x=((seed%7)-3)*0.22,j1y=(((seed*7)%11)-5)*0.18;
    const j2x=(((seed*3)%9)-4)*0.20,j2y=(((seed*5)%13)-6)*0.16;
    const ir=pipe.ink[0],ig=pipe.ink[1],ib=pipe.ink[2];
    const irS=pipe.inkSolved[0],igS=pipe.inkSolved[1],ibS=pipe.inkSolved[2];
    ctx.save();ctx.translate(j1x,j1y);buildPipePath(t.base,half,style);
    ctx.strokeStyle='rgba('+ir+','+ig+','+ib+','+(0.55+solvedT*0.25).toFixed(2)+')';
    ctx.lineWidth=lw*0.55;ctx.stroke();ctx.restore();
    ctx.save();ctx.translate(j2x,j2y);buildPipePath(t.base,half,style);
    const rr=Math.round(ir+(irS-ir)*solvedT),gg=Math.round(ig+(igS-ig)*solvedT),bb=Math.round(ib+(ibS-ib)*solvedT);
    ctx.strokeStyle='rgba('+rr+','+gg+','+bb+','+((0.9+solvedT*0.1)*pulse).toFixed(2)+')';
    ctx.lineWidth=lw*0.72;ctx.stroke();ctx.restore();
  }else if(style==='hollow'){
    buildPipePath(t.base,half,style);ctx.lineCap='round';ctx.lineJoin='round';
    const wr=Math.round(pipe.wall[0]+(pipe.wallSolved[0]-pipe.wall[0])*solvedT);
    const wg=Math.round(pipe.wall[1]+(pipe.wallSolved[1]-pipe.wall[1])*solvedT);
    const wb=Math.round(pipe.wall[2]+(pipe.wallSolved[2]-pipe.wall[2])*solvedT);
    ctx.strokeStyle='rgb('+wr+','+wg+','+wb+')';ctx.lineWidth=lw*2.3;ctx.stroke();
    ctx.strokeStyle='rgb('+pipe.interior[0]+','+pipe.interior[1]+','+pipe.interior[2]+')';ctx.lineWidth=lw*1.35;ctx.stroke();
    ctx.strokeStyle='rgba('+wr+','+wg+','+wb+','+(0.35+solvedT*0.4).toFixed(2)+')';ctx.lineWidth=lw*0.35;ctx.stroke();
  }else if(style==='pixel'){
    buildPipePath(t.base,half,style);ctx.lineCap='butt';ctx.lineJoin='miter';
    ctx.strokeStyle='rgb('+pipe.border[0]+','+pipe.border[1]+','+pipe.border[2]+')';ctx.lineWidth=lw*1.55;ctx.stroke();
    const cr=Math.round(pipe.core[0]+(pipe.coreSolved[0]-pipe.core[0])*solvedT);
    const cg=Math.round(pipe.core[1]+(pipe.coreSolved[1]-pipe.core[1])*solvedT);
    const cb=Math.round(pipe.core[2]+(pipe.coreSolved[2]-pipe.core[2])*solvedT);
    ctx.strokeStyle='rgb('+cr+','+cg+','+cb+')';ctx.lineWidth=lw*0.95;ctx.stroke();
  }
  ctx.restore();
}

/* ============================================================
   RENDER
============================================================ */
function render(now){
  if(!vw||!vh)return;
  ctx.clearRect(0,0,vw,vh);
  ctx.globalAlpha=Game.fadeIn;
  const W=Game.W,H=Game.H,tiles=Game.tiles;
  const s=Game.cell,ox=Game.ox,oy=Game.oy;const half=s/2;
  const style=Game.theme.style;

  if(style==='neon'||style==='minimal'){
    ctx.fillStyle=style==='minimal'?'rgba(160,180,200,0.14)':'rgba(80,160,220,0.20)';
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.beginPath();ctx.arc(ox+x*s+half,oy+y*s+half,1.4,0,Math.PI*2);ctx.fill();}
  }
  if(style==='pixel'){
    ctx.fillStyle='rgba(90,200,120,0.07)';
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){ctx.fillRect(ox+x*s+half-1,oy+y*s+half-1,2,2);}
  }
  if(style==='sketch'){
    ctx.strokeStyle='rgba(200,180,140,0.06)';ctx.lineWidth=1;
    for(let y=0;y<H;y++)for(let x=0;x<W;x++){
      const cx=ox+x*s+half,cy=oy+y*s+half;
      ctx.beginPath();ctx.moveTo(cx-2.5,cy);ctx.lineTo(cx+2.5,cy);
      ctx.moveTo(cx,cy-2.5);ctx.lineTo(cx,cy+2.5);ctx.stroke();
    }
  }
  if(Game.hover){
    const hx=Game.hover.x,hy=Game.hover.y;
    if(hy>=0&&hy<H&&hx>=0&&hx<W){
      const t=tiles[hy*W+hx];
      if(t&&t.base!==0){
        const gp=Game.theme.pipe.glow||Game.theme.pipe.core||Game.theme.pipe.liquid;
        ctx.fillStyle='rgba('+gp[0]+','+gp[1]+','+gp[2]+',0.09)';
        ctx.fillRect(ox+hx*s+3,oy+hy*s+3,s-6,s-6);
      }
    }
  }
  let pulse=1,solvedT=0;
  if(Game.solved){solvedT=clamp((now-Game.solvedAt)/500,0,1);pulse=0.85+0.15*Math.sin(now/220);}
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const t=tiles[y*W+x];
      if(!t||t.base===0)continue;
      drawTile(t,x,y,s,solvedT,pulse,now);
    }
  }
  renderParticles();
  ctx.globalAlpha=1;
}

/* ============================================================
   UPDATE
============================================================ */
function update(dt,now){
  const dtSafe=Math.min(dt,1/30);
  if(Game.fadeIn<1)Game.fadeIn=Math.min(1,Game.fadeIn+dt*3.2);
  let animating=false;
  const omega=10,zeta=0.85;
  for(const t of Game.tiles){
    const target=t.rot*90;const dx=t.angle-target;
    if(Math.abs(dx)<0.02&&Math.abs(t.vel||0)<0.2){t.angle=target;t.vel=0;continue;}
    if(Game.reduceMotion){t.angle=target;t.vel=0;continue;}
    const accel=-omega*omega*dx-2*zeta*omega*(t.vel||0);
    t.vel=(t.vel||0)+accel*dtSafe;
    t.angle+=t.vel*dtSafe;
    animating=true;
  }
  updateParticles(dt);
  if(Game.mode==='time'&&!Game.gameOver&&!Game.solved){
    Game.timeLeft-=dt;
    if(Game.timeLeft<=0){Game.timeLeft=0;updateHUD(true);triggerGameOver();return;}
    updateHUD(true);
  }
  if(!Game.solved&&!Game.gameOver&&Game.fadeIn>=1){
    if(isSolved(Game.tiles,Game.W,Game.H))onLevelComplete(now);
  }
}

/* ============================================================
   LEVEL FLOW
============================================================ */
function scrambleTiles(tiles, difficultyT, rng=Math.random){
  // At low difficulty, some tiles start already in their target rotation —
  // they act as anchors the player can build from.
  const scrambleRatio = 0.55 + difficultyT * 0.45;
  for(const t of tiles){
    if(t.base===0)continue;
    if(rng() > scrambleRatio) continue; // leave at target rotation
    t.rot=(rng()*4)|0;
    t.angle=t.rot*90;
    t.vel=0;
  }
  // Never hand the player a solved board
  if(isSolved(tiles,Game.W,Game.H)){
    const t=tiles.find(x=>x.base!==0);
    if(t){t.rot=(t.rot+1)%4;t.angle=t.rot*90;}
  }
}
function todayKey(){ return new Date().toISOString().slice(0,10); }

function newLevel(fromTransition){
  const cfg = difficultyForLevel(Game.level, Game.mode);
  Game.W = cfg.grid;
  Game.H = cfg.grid;

  let rng = Math.random;
  if(Game.mode === 'daily') rng = mulberry32(+todayKey().replace(/-/g,''));

  // Generate several candidates, pick the one closest to the target difficulty band.
  // Target score grows with t so the ramp is measurable, not just parameter-based.
  const targetScore = 0.15 + cfg.t * 0.72;
  let best = null, bestErr = Infinity, bestMetrics = null, bestScore = 0;

  const attempts = Game.mode === 'daily' ? 10 : 8;
  for(let i=0; i<attempts; i++){
    const board = generateRawBoard(cfg.grid, cfg.grid, cfg.params, rng);
    const metrics = computeBoardMetrics(board.conn, board.used, cfg.grid, cfg.grid);
    const score = scoreDifficulty(metrics, cfg.grid, cfg.grid);
    const err = Math.abs(score - targetScore);
    if(err < bestErr){
      bestErr = err;
      best = board;
      bestMetrics = metrics;
      bestScore = score;
    }
  }

  Game.tiles = connToTiles(best.conn, cfg.grid, cfg.grid);
  Game.difficulty = bestScore;

  // Partial scramble: fewer scrambled tiles at low difficulty
  scrambleTiles(Game.tiles, cfg.t, rng);

  Game.moves = 0;
  Game.solved = false;
  Game.solvedAt = 0;
  Game.gameOver = false;
  Game.hover = null;
  Game.fadeIn = 0;
  particles.length = 0;

  // Difficulty dots reflect the ACTUAL generated difficulty, not just level
  Game.diffBars = clamp(Math.round(bestScore * 5), 1, 5);
  renderDiffDots();

  hideToast();
  hideOverlay();
  layout();
  updateHUD();

  if(fromTransition) Sound.levelStart();
}

function onLevelComplete(now){
  Game.solved = true;
  Game.solvedAt = now;

  const s=Game.cell,half=s/2;
  let count=0;
  for(let y=0;y<Game.H;y++)for(let x=0;x<Game.W;x++){
    const t=Game.tiles[y*Game.W+x];
    if(!t||t.base===0)continue;
    if(count++>60)break;
    spawnBurst(Game.ox+x*s+half,Game.oy+y*s+half,4);
  }
  Sound.solve();

  if(Game.mode==='time'){
    Game.score++;
    Game.timeLeft=Math.min(99,Game.timeLeft+8);
    updateHUD();
    Sound.bonus();
    showToast('+8s','TIME BONUS');
    clearTimeout(Game.winTimer);
    Game.winTimer=setTimeout(()=>{Game.level++;newLevel(true);},950);
  }
  else if(Game.mode==='daily'){
    lsSet('il.daily.lastSolved',todayKey());
    showToast('✦','DAILY SOLVED');
    clearTimeout(Game.winTimer);
    Game.winTimer=setTimeout(showDailyOverlay,1100);
  }
  else if(Game.mode==='zen'){
    showToast('∞','LOOP CLOSED');
    clearTimeout(Game.winTimer);
    Game.winTimer=setTimeout(()=>{Game.level++;newLevel(true);},1500);
  }
  else {
    const bestLevel=+(lsGet('il.best.classic','0')||0);
    if(Game.level>bestLevel)lsSet('il.best.classic',String(Game.level));
    showToast('∞','LOOP CLOSED');
    clearTimeout(Game.winTimer);
    Game.winTimer=setTimeout(()=>{Game.level++;newLevel(true);},1500);
    lsSet('il.classic.level',String(Game.level+1)); 
  }
}
function triggerGameOver(){
  if(Game.gameOver)return;
  Game.gameOver=true;
  Sound.gameOver();
  const best=+(lsGet('il.best.time','0')||0);
  if(Game.score>best)lsSet('il.best.time',String(Game.score));
  const finalBest=Math.max(best,Game.score);
  elOvTitle.textContent="TIME'S UP";
  elOvScore.textContent=Game.score;
  elOvLabel.textContent='LOOPS CLOSED';
  elOvBest.innerHTML=finalBest>Game.score?'Best: <b>'+finalBest+'</b>':'New best! <b>'+finalBest+'</b>';
  elOverlay.classList.add('show');
}
function showDailyOverlay(){
  const best=+(lsGet('il.best.daily','0')||0);
  const newBest=!best||Game.moves<best;
  if(newBest)lsSet('il.best.daily',String(Game.moves));
  elOvTitle.textContent='PUZZLE SOLVED';
  elOvScore.textContent=Game.moves;
  elOvLabel.textContent='MOVES';
  elOvBest.innerHTML=newBest?'New best! <b>'+Game.moves+'</b> moves':'Best: <b>'+Math.min(best,Game.moves)+'</b> moves';
  elOverlay.classList.add('show');
}

/* ============================================================
   SCREENS
============================================================ */
function showScreen(name){
  Game.screen=name;
  elHome.classList.toggle('active',name==='home');
  elSettings.classList.toggle('active',name==='settings');
  elGame.classList.toggle('active',name==='game');
}
function startGame(mode){
  Game.mode=mode;Game.level=(mode==='classic'?Math.max(1,+lsGet('il.classic.level','1')||1):1);Game.moves=0;Game.score=0;Game.timeLeft=60;Game.gameOver=false;
  showScreen('game');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{layout();newLevel(false);}));
  setTimeout(()=>{if(Game.screen==='game')layout();},420);
}
function goHome(){
  clearTimeout(Game.winTimer);
  hideToast();hideOverlay();
  Game.solved=false;Game.gameOver=false;
  refreshHome();showScreen('home');Sound.click();
}
function openSettings(){
  Sound.click();
  document.getElementById('toggleSound').classList.toggle('on',!Sound.isMuted());
  document.getElementById('toggleMotion').classList.toggle('on',Game.reduceMotion);
  showScreen('settings');
}
function refreshHome(){
  const bc=+(lsGet('il.best.classic','0')||0);
  const bt=+(lsGet('il.best.time','0')||0);
  const bd=+(lsGet('il.best.daily','0')||0);
  const elC=document.querySelector('[data-best="classic"]');
  const elT=document.querySelector('[data-best="time"]');
  const elZ=document.querySelector('[data-best="zen"]');
  const elD=document.querySelector('[data-best="daily"]');
  if(!elC||!elT||!elZ||!elD)return;
  elC.textContent=bc>0?'BEST · LEVEL '+bc:'';
  elT.textContent=bt>0?'BEST · '+bt+' LOOPS':'';
  elZ.textContent=lsGet('il.zen.played','0')==='1'?'WELCOME BACK':'';
  const done=lsGet('il.daily.lastSolved','')===todayKey();
  if(done){elD.textContent='✓ SOLVED TODAY';elD.classList.add('done');}
  else{elD.textContent=bd>0?'BEST · '+bd+' MOVES':'';elD.classList.remove('done');}
  updateSoundIcon();
}
function updateSoundIcon(){
  const sb=document.getElementById('btnSoundQuick');
  if(sb)sb.textContent=Sound.isMuted()?'🔇':'🔊';
}

/* ============================================================
   HUD
============================================================ */
function renderDiffDots(){
  elDiffDots.innerHTML='';
  for(let i=0;i<5;i++){
    const s=document.createElement('span');
    if(i<Game.diffBars)s.className='on';
    elDiffDots.appendChild(s);
  }
}
function updateHUD(onlyTimer){
  if(Game.mode==='classic'||Game.mode==='zen'){
    elStatAL.textContent='LEVEL';
    elStatBL.textContent=Game.mode==='zen'?'—':'MOVES';
    if(!onlyTimer){
      if(elStatA.textContent!==String(Game.level)){elStatA.textContent=Game.level;popStat(elStatA);}
      if(Game.mode==='zen'){elStatB.textContent='∞';}
      else if(elStatB.textContent!==String(Game.moves)){elStatB.textContent=Game.moves;popStat(elStatB);}
    }
    elStatB.classList.remove('warn');
  }else if(Game.mode==='time'){
    elStatAL.textContent='SCORE';elStatBL.textContent='TIME';
    if(elStatA.textContent!==String(Game.score)){elStatA.textContent=Game.score;popStat(elStatA);}
    const t=Math.ceil(Game.timeLeft);
    elStatB.textContent=t;
    elStatB.classList.toggle('warn',t<=10);
  }else if(Game.mode==='daily'){
    const d=new Date();
    const months=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
    elStatAL.textContent='DATE';elStatBL.textContent='MOVES';
    elStatA.textContent=months[d.getUTCMonth()]+' '+d.getUTCDate();
    if(elStatB.textContent!==String(Game.moves)){elStatB.textContent=Game.moves;popStat(elStatB);}
    elStatB.classList.remove('warn');
  }
}

function popStat(el){el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');}
function showToast(big,sub,gold){
  elToastBig.textContent=big;elToastSub.textContent=sub;
  elToastSub.classList.toggle('gold',!!gold);
  elToast.classList.add('show');
}
function hideToast(){elToast.classList.remove('show');}
function hideOverlay(){elOverlay.classList.remove('show');}

/* ============================================================
   INTERACTION
============================================================ */
function cellFromPoint(px,py){
  const x=Math.floor((px-Game.ox)/Game.cell);
  const y=Math.floor((py-Game.oy)/Game.cell);
  if(x<0||x>=Game.W||y<0||y>=Game.H)return null;
  return {x,y};
}
canvas.addEventListener('pointerdown',(e)=>{
  e.preventDefault();Sound.unlock();
  if(Game.solved||Game.gameOver||Game.fadeIn<1)return;
  const rect=canvas.getBoundingClientRect();
  const c=cellFromPoint(e.clientX-rect.left,e.clientY-rect.top);
  if(!c)return;
  const t=Game.tiles[c.y*Game.W+c.x];
  if(!t||t.base===0)return;
  t.rot+=1;Game.moves++;Sound.rotate();updateHUD();
});
canvas.addEventListener('pointermove',(e)=>{
  if(e.pointerType==='touch')return;
  const rect=canvas.getBoundingClientRect();
  Game.hover=cellFromPoint(e.clientX-rect.left,e.clientY-rect.top);
});
canvas.addEventListener('pointerleave',()=>{Game.hover=null;});

/* ============================================================
   BUTTONS
============================================================ */
document.getElementById('btnBack').addEventListener('click',goHome);
document.getElementById('btnSettings').addEventListener('click',openSettings);
document.getElementById('btnSettingsBack').addEventListener('click',()=>{Sound.click();refreshHome();showScreen('home');});
document.getElementById('btnSoundQuick').addEventListener('click',(e)=>{
  Sound.init();Sound.toggle();Sound.click();updateSoundIcon();
  const b=e.currentTarget;b.classList.remove('pulse');void b.offsetWidth;b.classList.add('pulse');
});
document.getElementById('toggleSound').addEventListener('click',()=>{
  Sound.init();const on=Sound.toggle();Sound.click();
  document.getElementById('toggleSound').classList.toggle('on',on);
  updateSoundIcon();
});
document.getElementById('toggleMotion').addEventListener('click',()=>{
  Sound.click();applyMotionPref(!Game.reduceMotion);
});
document.getElementById('ovPlay').addEventListener('click',()=>{
  Sound.click();startGame(Game.mode==='daily'?'daily':'time');
});
document.getElementById('ovHome').addEventListener('click',goHome);
document.querySelectorAll('.mode-card').forEach(card=>{
  card.addEventListener('click',()=>{
    Sound.unlock();Sound.click();
    const mode=card.dataset.mode;
    if(mode==='zen')lsSet('il.zen.played','1');
    startGame(mode);
  });
});

/* ============================================================
   LOOP
============================================================ */
function frame(now){
  requestAnimationFrame(frame);
  try{
    const dt=Math.min(0.05,(now-lastFrame)/1000);
    lastFrame=now;
    if(Game.screen==='game'){update(dt,now);render(now);}
  }catch(err){
    if(!errLogged){errLogged=true;console.error('Loop error:',err);}
  }
}

/* ============================================================
   INIT
============================================================ */
window.addEventListener('resize',()=>{if(Game.screen==='game')layout();});
window.addEventListener('orientationchange',()=>setTimeout(()=>{if(Game.screen==='game')layout();},180));
elGame.addEventListener('transitionend',(e)=>{
  if(e.target===elGame&&Game.screen==='game')layout();
});
document.addEventListener('pointerdown',()=>{Sound.init();Sound.unlock();},{once:true});
document.addEventListener('keydown',()=>{Sound.init();Sound.unlock();},{once:true});
document.addEventListener('visibilitychange',()=>document.hidden?Sound.pause():Sound.unpause());

buildThemeSwatches();
applyTheme(lsGet('il.theme','neon'),false);
let savedMotion=lsGet('il.motion',null);
if(savedMotion===null)applyMotionPref(matchMedia('(prefers-reduced-motion: reduce)').matches);
else applyMotionPref(savedMotion==='1');
updateSoundIcon();
refreshHome();
requestAnimationFrame(frame);

})();

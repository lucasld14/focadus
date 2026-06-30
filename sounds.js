/* ═══════════════════════════════════════════
   Focadus — Ambient Sound Engine
   Web Audio API, no external files needed
═══════════════════════════════════════════ */
(function () {
  'use strict';

  let ctx = null;
  let currentNodes = [];
  let masterGain = null;
  let currentType = null;
  let vol = 0.55;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function stopAll() {
    currentNodes.forEach(n => { try { n.stop ? n.stop() : n.disconnect(); } catch (e) {} });
    currentNodes = [];
    if (masterGain) { masterGain.disconnect(); masterGain = null; }
    currentType = null;
  }

  /* ── White noise buffer ── */
  function whiteNoise(c, seconds) {
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    return src;
  }

  /* ── Brown noise buffer ── */
  function brownNoise(c, seconds) {
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      d[i] = (last + 0.02 * w) / 1.02;
      last = d[i];
      d[i] *= 3.5;
    }
    const src = c.createBufferSource();
    src.buffer = buf; src.loop = true;
    return src;
  }

  /* ── RAIN ── */
  function playRain() {
    const c = getCtx();
    const mg = c.createGain(); mg.gain.value = vol * 0.45; mg.connect(c.destination);

    // Main rainfall — lowpass white noise
    const n1 = whiteNoise(c, 3);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700; lp.Q.value = 0.4;
    n1.connect(lp); lp.connect(mg); n1.start();

    // Distant rumble — brown noise
    const n2 = brownNoise(c, 3);
    const g2 = c.createGain(); g2.gain.value = 0.35;
    n2.connect(g2); g2.connect(mg); n2.start();

    // LFO — rain intensity variation
    const lfo = c.createOscillator(); lfo.frequency.value = 0.07; lfo.type = 'sine';
    const lg = c.createGain(); lg.gain.value = 0.1;
    lfo.connect(lg); lg.connect(mg.gain); lfo.start();

    masterGain = mg;
    currentNodes = [n1, n2, lfo];
    currentType = 'rain';
  }

  /* ── CAFÉ ── */
  function playCafe() {
    const c = getCtx();
    const mg = c.createGain(); mg.gain.value = vol * 0.35; mg.connect(c.destination);

    // Background murmur — bandpass brown noise
    const n1 = brownNoise(c, 4);
    const bp = c.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 350; bp.Q.value = 0.5;
    n1.connect(bp); bp.connect(mg); n1.start();

    // High freq presence (cups, activity)
    const n2 = whiteNoise(c, 3);
    const hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1200;
    const g2 = c.createGain(); g2.gain.value = 0.06;
    n2.connect(hp); hp.connect(g2); g2.connect(mg); n2.start();

    // Gentle LFO — chatter rhythm
    const lfo = c.createOscillator(); lfo.frequency.value = 0.12; lfo.type = 'sine';
    const lg = c.createGain(); lg.gain.value = 0.08;
    lfo.connect(lg); lg.connect(mg.gain); lfo.start();

    masterGain = mg;
    currentNodes = [n1, n2, lfo];
    currentType = 'cafe';
  }

  /* ── LOFI ── */
  function playLofi() {
    const c = getCtx();
    const mg = c.createGain(); mg.gain.value = vol * 0.2; mg.connect(c.destination);

    // Chord: A minor voicing (A2, E3, A3, C4, E4)
    const freqs = [110, 164.81, 220, 261.63, 329.63];
    const oscs = freqs.map((f, i) => {
      const o = c.createOscillator();
      o.type = i < 2 ? 'sawtooth' : 'triangle';
      o.frequency.value = f;
      const g = c.createGain(); g.gain.value = i < 2 ? 0.3 : 0.18;
      o.connect(g); g.connect(mg);
      o.start();
      return o;
    });

    // Muffled filter — old speaker feel
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 550; lp.Q.value = 1.5;
    oscs.forEach(o => { /* already connected via gain */ });

    // Breathing LFO
    const lfo = c.createOscillator(); lfo.frequency.value = 0.08; lfo.type = 'sine';
    const lg = c.createGain(); lg.gain.value = 0.04;
    lfo.connect(lg); lg.connect(mg.gain); lfo.start();

    // Vinyl crackle
    const crack = whiteNoise(c, 2);
    const hpCrack = c.createBiquadFilter(); hpCrack.type = 'highpass'; hpCrack.frequency.value = 5500;
    const gCrack = c.createGain(); gCrack.gain.value = 0.007;
    crack.connect(hpCrack); hpCrack.connect(gCrack); gCrack.connect(c.destination); crack.start();

    masterGain = mg;
    currentNodes = [...oscs, lfo, crack];
    currentType = 'lofi';
  }

  /* ═══ UI WIDGET ═══ */
  function injectWidget() {
    const div = document.createElement('div');
    div.id = 'snd-widget';
    div.innerHTML = `
<style>
#snd-widget{position:fixed;bottom:2rem;right:1.5rem;z-index:9990;font-family:'Inter',system-ui,sans-serif;}
@media(max-width:860px){#snd-widget{bottom:5.75rem;}}
#snd-btn{
  width:46px;height:46px;border-radius:50%;
  background:rgba(198,154,58,.1);border:1px solid rgba(198,154,58,.3);
  cursor:pointer;display:flex;align-items:center;justify-content:center;
  color:#C69A3A;transition:all .22s;
  backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);
  box-shadow:0 4px 20px rgba(0,0,0,.35);
}
#snd-btn:hover{background:rgba(198,154,58,.22);box-shadow:0 0 20px rgba(198,154,58,.25),0 4px 20px rgba(0,0,0,.35);}
#snd-btn.active{
  background:rgba(198,154,58,.15);border-color:rgba(198,154,58,.5);
  box-shadow:0 0 24px rgba(198,154,58,.35),0 4px 20px rgba(0,0,0,.35);
  animation:sndPulse 2.5s ease infinite;
}
@keyframes sndPulse{0%,100%{box-shadow:0 0 18px rgba(198,154,58,.15),0 4px 20px rgba(0,0,0,.3);}50%{box-shadow:0 0 32px rgba(198,154,58,.45),0 4px 20px rgba(0,0,0,.3);}}
#snd-panel{
  position:absolute;bottom:58px;right:0;
  background:rgba(8,8,20,.97);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);
  border:1px solid rgba(198,154,58,.22);border-radius:18px;
  padding:1.25rem;width:210px;
  box-shadow:0 20px 60px rgba(0,0,0,.55),0 0 0 1px rgba(255,255,255,.04) inset;
  display:none;
  animation:sndIn .17s cubic-bezier(.22,1,.36,1);
}
#snd-panel.open{display:block;}
@keyframes sndIn{from{opacity:0;transform:translateY(10px) scale(.95);}to{opacity:1;transform:none;}}
.snd-head{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#7A7A8A;margin-bottom:12px;font-family:'Syne',system-ui,sans-serif;}
.snd-opts{display:flex;flex-direction:column;gap:5px;margin-bottom:14px;}
.snd-opt{
  display:flex;align-items:center;gap:9px;padding:9px 12px;
  border-radius:10px;cursor:pointer;border:1px solid transparent;
  transition:all .15s;color:#7A7A8A;font-size:13px;font-weight:500;
  background:rgba(255,255,255,.03);
}
.snd-opt:hover{border-color:rgba(198,154,58,.22);color:#F0EDE4;background:rgba(198,154,58,.07);}
.snd-opt.on{border-color:rgba(198,154,58,.4);color:#C69A3A;background:rgba(198,154,58,.12);}
.snd-opt svg{flex-shrink:0;}
.snd-vol{display:flex;align-items:center;gap:8px;}
.snd-vol-lbl{font-size:10px;color:#7A7A8A;text-transform:uppercase;letter-spacing:.06em;font-weight:600;min-width:26px;}
.snd-slider{
  flex:1;-webkit-appearance:none;appearance:none;
  height:3px;border-radius:3px;background:rgba(198,154,58,.15);outline:none;cursor:pointer;
}
.snd-slider::-webkit-slider-thumb{-webkit-appearance:none;width:13px;height:13px;border-radius:50%;background:#C69A3A;cursor:pointer;box-shadow:0 0 8px rgba(198,154,58,.6);}
</style>
<div id="snd-panel">
  <div class="snd-head">Sons ambiente</div>
  <div class="snd-opts">
    <div class="snd-opt" id="sopt-rain" onclick="BZSound.toggle('rain')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 16.2A4.5 4.5 0 0 0 17.5 8h-1.8A7 7 0 1 0 4 14.9"/><line x1="8" y1="19" x2="8" y2="21"/><line x1="8" y1="13" x2="8" y2="15"/><line x1="16" y1="19" x2="16" y2="21"/><line x1="16" y1="13" x2="16" y2="15"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="12" y1="15" x2="12" y2="17"/></svg>
      Chuva
    </div>
    <div class="snd-opt" id="sopt-cafe" onclick="BZSound.toggle('cafe')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/></svg>
      Café
    </div>
    <div class="snd-opt" id="sopt-lofi" onclick="BZSound.toggle('lofi')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="8" cy="18" r="4"/><path d="M12 18V2l7 4"/></svg>
      Lofi
    </div>
  </div>
  <div class="snd-vol">
    <span class="snd-vol-lbl">Vol</span>
    <input type="range" class="snd-slider" id="snd-vol-sl" min="0" max="100" value="55" oninput="BZSound.vol(this.value/100)">
  </div>
</div>
<button id="snd-btn" onclick="BZSound.panel()" title="Sons ambiente">
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
</button>
`;
    document.body.appendChild(div);

    document.addEventListener('click', e => {
      const w = document.getElementById('snd-widget');
      if (w && !w.contains(e.target)) {
        const p = document.getElementById('snd-panel');
        if (p) p.classList.remove('open');
      }
    });
  }

  function updateButtons() {
    ['rain', 'cafe', 'lofi'].forEach(t => {
      const el = document.getElementById('sopt-' + t);
      if (el) el.classList.toggle('on', currentType === t);
    });
    const btn = document.getElementById('snd-btn');
    if (btn) btn.classList.toggle('active', !!currentType);
  }

  window.BZSound = {
    toggle(type) {
      if (currentType === type) { stopAll(); updateButtons(); return; }
      stopAll();
      if (type === 'rain') playRain();
      else if (type === 'cafe') playCafe();
      else if (type === 'lofi') playLofi();
      updateButtons();
    },
    vol(v) {
      vol = v;
      if (masterGain) {
        const mult = currentType === 'rain' ? 0.45 : currentType === 'cafe' ? 0.35 : 0.2;
        masterGain.gain.value = v * mult;
      }
    },
    panel() {
      const p = document.getElementById('snd-panel');
      if (p) p.classList.toggle('open');
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectWidget);
  } else {
    injectWidget();
  }
})();

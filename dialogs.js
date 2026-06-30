/* ═══════════════════════════════════════════
   Focadus — Custom Dialog System
   Replaces browser confirm/prompt/alert
═══════════════════════════════════════════ */
(function () {
  'use strict';

  function inject() {
    const html = `
<style>
#bz-dlg{
  display:none;position:fixed;inset:0;
  background:rgba(0,0,0,.65);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
  z-index:99998;align-items:center;justify-content:center;
}
#bz-dlg.open{display:flex;}
#bz-dlg-box{
  background:rgba(9,9,21,.98);border:1px solid rgba(255,255,255,.09);
  border-radius:22px;padding:2rem 2rem 1.75rem;
  width:min(460px,92vw);
  box-shadow:0 40px 100px rgba(0,0,0,.65),0 0 0 1px rgba(255,255,255,.04) inset;
  animation:dlgIn .2s cubic-bezier(.22,1,.36,1);
}
[data-theme="light"] #bz-dlg-box{background:rgba(255,255,255,.99);border-color:rgba(198,154,58,.18);box-shadow:0 40px 100px rgba(0,0,0,.1);}
[data-theme="light"] #bz-dlg-title{color:#0A0E1A;}
[data-theme="light"] #bz-dlg-msg{color:#7A7A8A;}
[data-theme="light"] #bz-dlg-cancel{background:rgba(0,0,0,.05);color:#7A7A8A;border-color:rgba(198,154,58,.18);}
[data-theme="light"] #bz-dlg-cancel:hover{background:rgba(0,0,0,.09);color:#0A0E1A;}
[data-theme="light"] #bz-dlg-inp{background:rgba(0,0,0,.04);border-color:rgba(198,154,58,.15);color:#0A0E1A;}
[data-theme="light"] #bz-dlg-hint{color:#7A7A8A;}
@keyframes dlgIn{from{opacity:0;transform:translateY(20px) scale(.96);}to{opacity:1;transform:none;}}
#bz-dlg-icon{width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:1.1rem;}
#bz-dlg-title{font-family:'Syne',system-ui,sans-serif;font-size:16px;font-weight:700;color:#F0EDE4;margin-bottom:.45rem;line-height:1.3;}
#bz-dlg-msg{font-size:13.5px;color:#7A7A8A;line-height:1.65;}
#bz-dlg-inp-wrap{margin-top:1rem;}
#bz-dlg-inp{
  width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);
  border-radius:11px;padding:10px 14px;color:#F0EDE4;font-size:14px;
  font-family:'Inter',system-ui,sans-serif;outline:none;
  transition:border-color .2s,box-shadow .2s;
}
#bz-dlg-inp:focus{border-color:rgba(198,154,58,.5);box-shadow:0 0 0 3px rgba(198,154,58,.12);}
#bz-dlg-inp.shake{animation:dlgShake .35s ease;}
@keyframes dlgShake{0%,100%{transform:none;}25%{transform:translateX(-5px);}75%{transform:translateX(5px);}}
#bz-dlg-hint{font-size:11.5px;color:#7A7A8A;margin-top:6px;font-style:italic;}
#bz-dlg-btns{display:flex;gap:10px;margin-top:1.5rem;justify-content:flex-end;}
.bz-dlg-btn{
  border-radius:11px;padding:9px 20px;font-size:14px;font-weight:600;
  cursor:pointer;font-family:'Inter',system-ui,sans-serif;
  transition:all .18s;border:none;
}
#bz-dlg-cancel{background:rgba(255,255,255,.05);color:#7A7A8A;border:1px solid rgba(255,255,255,.08);}
#bz-dlg-cancel:hover{background:rgba(255,255,255,.09);color:#F0EDE4;}
</style>
<div id="bz-dlg">
  <div id="bz-dlg-box">
    <div id="bz-dlg-icon" style="display:none;"></div>
    <div id="bz-dlg-title"></div>
    <div id="bz-dlg-msg"></div>
    <div id="bz-dlg-inp-wrap" style="display:none;">
      <input id="bz-dlg-inp" type="text" autocomplete="off" spellcheck="false">
      <div id="bz-dlg-hint"></div>
    </div>
    <div id="bz-dlg-btns">
      <button class="bz-dlg-btn" id="bz-dlg-cancel">Cancelar</button>
      <button class="bz-dlg-btn" id="bz-dlg-ok">Confirmar</button>
    </div>
  </div>
</div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('bz-dlg').addEventListener('click', e => {
      if (e.target === document.getElementById('bz-dlg')) close();
    });
    document.addEventListener('keydown', e => {
      if (!document.getElementById('bz-dlg').classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Enter') document.getElementById('bz-dlg-ok').click();
    });
  }

  function close() {
    const d = document.getElementById('bz-dlg');
    if (d) d.classList.remove('open');
  }

  function applyStyle(type) {
    const styles = {
      danger: { bg: 'rgba(255,77,109,.12)', icon: '#FF4D6D', btn: 'linear-gradient(135deg,#c02040,#FF4D6D)', shadow: 'rgba(255,77,109,.35)', svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FF4D6D" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' },
      warn:   { bg: 'rgba(245,158,11,.1)',  icon: '#F59E0B', btn: 'linear-gradient(135deg,#b07510,#F59E0B)', shadow: 'rgba(245,158,11,.3)',  svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' },
      info:   { bg: 'rgba(198,154,58,.1)',   icon: '#C69A3A', btn: 'linear-gradient(135deg,#B8891F,#C69A3A)', shadow: 'rgba(198,154,58,.3)',  svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C69A3A" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' },
      green:  { bg: 'rgba(198,154,58,.1)',   icon: '#C69A3A', btn: 'linear-gradient(135deg,#B8891F,#C69A3A)', shadow: 'rgba(198,154,58,.3)',  svg: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C69A3A" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' }
    };
    const s = styles[type] || styles.info;
    const iconEl = document.getElementById('bz-dlg-icon');
    iconEl.style.cssText = `background:${s.bg};width:44px;height:44px;border-radius:14px;display:flex;align-items:center;justify-content:center;margin-bottom:1.1rem;`;
    iconEl.innerHTML = s.svg;
    const okBtn = document.getElementById('bz-dlg-ok');
    okBtn.style.cssText = `background:${s.btn};color:#fff;box-shadow:0 0 20px ${s.shadow};border-radius:11px;padding:9px 20px;font-size:14px;font-weight:600;cursor:pointer;font-family:'Inter',system-ui,sans-serif;transition:all .18s;border:none;`;
  }

  window.bzConfirm = function (title, msg, type, onConfirm) {
    document.getElementById('bz-dlg-title').textContent = title;
    document.getElementById('bz-dlg-msg').textContent = msg;
    document.getElementById('bz-dlg-inp-wrap').style.display = 'none';
    document.getElementById('bz-dlg-cancel').style.display = '';
    document.getElementById('bz-dlg-ok').textContent = 'Confirmar';
    applyStyle(type || 'info');
    document.getElementById('bz-dlg').classList.add('open');
    document.getElementById('bz-dlg-ok').onclick = () => { close(); onConfirm(); };
    document.getElementById('bz-dlg-cancel').onclick = close;
  };

  window.bzPrompt = function (title, msg, placeholder, expected, onConfirm) {
    document.getElementById('bz-dlg-title').textContent = title;
    document.getElementById('bz-dlg-msg').textContent = msg;
    const inp = document.getElementById('bz-dlg-inp');
    inp.value = '';
    inp.placeholder = placeholder || '';
    inp.className = 'bz-dlg-btn';
    inp.style.cssText = 'width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:11px;padding:10px 14px;color:#F0EDE4;font-size:14px;font-family:Inter,system-ui,sans-serif;outline:none;transition:border-color .2s,box-shadow .2s;';
    document.getElementById('bz-dlg-inp-wrap').style.display = '';
    document.getElementById('bz-dlg-hint').textContent = expected ? `Digite "${expected}" para confirmar` : '';
    document.getElementById('bz-dlg-cancel').style.display = '';
    document.getElementById('bz-dlg-ok').textContent = 'Confirmar';
    applyStyle('danger');
    document.getElementById('bz-dlg').classList.add('open');
    setTimeout(() => inp.focus(), 120);

    document.getElementById('bz-dlg-ok').onclick = () => {
      const val = inp.value.trim();
      if (expected && val !== expected) {
        inp.style.borderColor = '#FF4D6D';
        inp.style.boxShadow = '0 0 0 3px rgba(255,77,109,.2)';
        setTimeout(() => { inp.style.borderColor = 'rgba(255,255,255,.1)'; inp.style.boxShadow = 'none'; }, 1000);
        return;
      }
      close();
      onConfirm(val);
    };
    document.getElementById('bz-dlg-cancel').onclick = close;
  };

  window.bzAlert = function (title, msg, type) {
    document.getElementById('bz-dlg-title').textContent = title;
    document.getElementById('bz-dlg-msg').textContent = msg;
    document.getElementById('bz-dlg-inp-wrap').style.display = 'none';
    document.getElementById('bz-dlg-cancel').style.display = 'none';
    document.getElementById('bz-dlg-ok').textContent = 'OK';
    applyStyle(type || 'info');
    document.getElementById('bz-dlg').classList.add('open');
    document.getElementById('bz-dlg-ok').onclick = close;
    document.getElementById('bz-dlg-cancel').onclick = close;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject);
  } else {
    inject();
  }
})();

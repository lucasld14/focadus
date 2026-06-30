/* ═══════════════════════════════════════════
   Focadus — Study Reminder Notifications
   Uses browser Notification API (no server)
═══════════════════════════════════════════ */
(function () {
  'use strict';

  const KEY = 'bz-notif-time';
  let scheduled = null;

  function schedule(timeStr) {
    if (scheduled) { clearTimeout(scheduled); scheduled = null; }
    if (!timeStr) return;

    const [h, m] = timeStr.split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);

    const ms = next - now;
    scheduled = setTimeout(() => {
      if (Notification.permission === 'granted') {
        new Notification('Focadus — Hora de estudar!', {
          body: 'Você definiu este horário para estudar. Vamos lá, mantenha sua sequência!',
          icon: '/favicon.svg',
          tag: 'bz-study-reminder',
          renotify: true
        });
      }
      schedule(timeStr); // re-schedule for next day
    }, ms);
  }

  function getSaved() { return localStorage.getItem(KEY) || ''; }

  async function saveAndSchedule(timeStr) {
    if (!timeStr) {
      localStorage.removeItem(KEY);
      if (scheduled) { clearTimeout(scheduled); scheduled = null; }
      setStatus('Lembrete removido.');
      return;
    }

    if (!('Notification' in window)) {
      setStatus('Seu navegador não suporta notificações.'); return;
    }

    if (Notification.permission === 'default') {
      const p = await Notification.requestPermission();
      if (p !== 'granted') {
        setStatus('Permissão negada. Habilite notificações nas configurações do navegador.'); return;
      }
    }

    if (Notification.permission === 'denied') {
      setStatus('Notificações bloqueadas. Clique no cadeado na barra de endereço para habilitar.'); return;
    }

    localStorage.setItem(KEY, timeStr);
    schedule(timeStr);
    const [h, m] = timeStr.split(':').map(Number);
    const label = new Date(0, 0, 0, h, m).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setStatus(`Lembrete ativo: ${label} todos os dias ✓`);
  }

  function setStatus(msg) {
    const el = document.getElementById('bz-notif-status');
    if (el) { el.textContent = msg; }
  }

  /* ── inject notification section into profile modals ── */
  function injectNotifSection() {
    // Find the last .account-action-btn's parent container
    const btns = document.querySelectorAll('.account-action-btn');
    if (!btns.length) return;
    const container = btns[btns.length - 1].closest('div');
    if (!container || container.dataset.notifInjected) return;
    container.dataset.notifInjected = 'true';

    const saved = getSaved();
    const section = document.createElement('div');
    section.style.cssText = 'margin-top:1.25rem;padding-top:1.25rem;border-top:1px solid rgba(255,255,255,.07);';
    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const inputBg = isLight ? 'rgba(0,0,0,.04)' : 'rgba(255,255,255,.04)';
    const inputBorder = isLight ? 'rgba(198,154,58,.15)' : 'rgba(255,255,255,.1)';
    const inputColor = isLight ? '#0A0E1A' : '#F0EDE4';
    const scheme = isLight ? 'light' : 'dark';
    section.innerHTML = `
      <div style="font-size:10px;color:var(--muted,#7A7A8A);text-transform:uppercase;letter-spacing:.1em;font-weight:700;margin-bottom:10px;font-family:'Syne',system-ui,sans-serif;">Lembrete de Estudo</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="time" id="bz-notif-input" value="${saved}"
          style="flex:1;background:${inputBg};border:1px solid ${inputBorder};
                 border-radius:10px;padding:9px 12px;color:${inputColor};font-size:14px;
                 font-family:'Inter',system-ui,sans-serif;outline:none;
                 color-scheme:${scheme};">
        <button onclick="window.BZNotif.save(document.getElementById('bz-notif-input').value)"
          style="background:rgba(198,154,58,.12);border:1px solid rgba(198,154,58,.3);
                 border-radius:10px;padding:9px 14px;color:#C69A3A;font-size:13px;
                 font-weight:600;cursor:pointer;white-space:nowrap;
                 font-family:'Inter',system-ui,sans-serif;transition:background .15s;">
          Salvar
        </button>
      </div>
      <div id="bz-notif-status" style="font-size:12px;color:var(--muted,#7A7A8A);margin-top:8px;line-height:1.5;min-height:16px;">
        ${saved ? `Lembrete ativo: ${saved} todos os dias ✓` : 'Nenhum lembrete configurado.'}
      </div>
    `;
    container.insertAdjacentElement('afterend', section);
  }

  /* ── observe profile modal opening ── */
  function watchModal() {
    const observer = new MutationObserver(() => {
      const modal = document.querySelector('.profile-modal[style*="flex"]') ||
                    document.querySelector('.profile-modal.open') ||
                    document.querySelector('#profile-modal[style*="flex"]');
      if (modal) injectNotifSection();
    });
    observer.observe(document.body, { attributes: true, childList: true, subtree: true });
  }

  window.BZNotif = { save: saveAndSchedule };

  // Auto-schedule on page load
  const saved = getSaved();
  if (saved && typeof Notification !== 'undefined' && Notification.permission === 'granted') {
    schedule(saved);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchModal);
  } else {
    watchModal();
  }
})();

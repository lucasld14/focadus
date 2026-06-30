/* ═══════════════════════════════════════════
   Focadus — Firebase Cloud Messaging (FCM)
   Registra token push e salva no Firestore
═══════════════════════════════════════════ */
(async function() {
  'use strict';

  const VAPID_KEY = 'BNEYESp1p-lRpdXjprRPrdmYAiRR6q02BkmjLtojZGLJPZ0nX8cQiAVRRjnRSgy0zPcay8T1FB3AcC3YrURN0KY';

  // Aguarda até que Firebase esteja carregado
  function waitForAuth() {
    return new Promise((resolve) => {
      const check = () => {
        if (typeof auth !== 'undefined' && typeof db !== 'undefined') {
          resolve();
        } else {
          setTimeout(check, 50);
        }
      };
      check();
    });
  }

  async function initMessaging() {
    if (!('serviceWorker' in navigator)) return;

    // Aguarda Firebase estar disponível
    await waitForAuth();

    try {
      // Importa o SDK de messaging (versão modular, não compat)
      const { getMessaging, getToken, onMessage } = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js').then(m => m.getMessaging),
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js').then(m => m.getToken),
        import('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging.js').then(m => m.onMessage)
      ]).catch(() => [null, null, null]);

      if (!getMessaging) return; // Falha silenciosa se o módulo não carregar

      const messaging = getMessaging(app);

      // Pede permissão e registra o token
      Notification.requestPermission().then(async (permission) => {
        if (permission === 'granted') {
          try {
            const token = await getToken(messaging, { vapidKey: VAPID_KEY });
            if (token) {
              // Salva o token no Firestore pra o "carteiro" usar
              const uid = auth.currentUser?.uid;
              if (uid) {
                await setDoc(
                  doc(db, 'users', uid, 'data', 'fcmToken'),
                  { token, updatedAt: new Date() },
                  { merge: true }
                );
              }
            }
          } catch (err) {
            console.error('Erro ao registrar FCM token:', err);
          }
        }
      });

      // Ouve mensagens quando o app está aberto (foreground)
      onMessage(messaging, (payload) => {
        if (payload.notification) {
          new Notification(payload.notification.title || 'Focadus', {
            body: payload.notification.body || '',
            icon: '/icon-192.svg',
            badge: '/favicon.svg'
          });
        }
      });

    } catch (err) {
      console.error('Erro ao inicializar FCM:', err);
    }
  }

  // Inicializa assim que a página carrega
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMessaging);
  } else {
    initMessaging();
  }
})();

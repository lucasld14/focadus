/* ═══════════════════════════════════════════
   Focadus — Service Worker de Push (FCM)
   Recebe notificações mesmo com o app fechado.
═══════════════════════════════════════════ */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCy5sqb9OTa9AL6X3RfbFsnMXx90hiqpPs",
  authDomain: "brainzept.firebaseapp.com",
  projectId: "brainzept",
  storageBucket: "brainzept.firebasestorage.app",
  messagingSenderId: "187802304063",
  appId: "1:187802304063:web:00f06e412f1bfa89e7828a"
});

const messaging = firebase.messaging();

// Notificação recebida com o app em segundo plano / fechado
messaging.onBackgroundMessage((payload) => {
  const title = (payload.notification && payload.notification.title) || 'Focadus';
  const options = {
    body: (payload.notification && payload.notification.body) || '',
    icon: '/icon-192.svg',
    badge: '/favicon.svg',
    tag: 'focadus-reminder',
    renotify: true,
    data: { url: (payload.data && payload.data.url) || '/dashboard.html' }
  };
  self.registration.showNotification(title, options);
});

// Ao clicar na notificação, abre/foca o app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/dashboard.html';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && 'focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

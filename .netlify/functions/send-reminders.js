/* ═══════════════════════════════════════════
   Focadus — Carteiro de Lembretes (Netlify Function)
   Envia notificações push pros usuários na hora do lembrete
═══════════════════════════════════════════ */

const admin = require('firebase-admin');

// Inicializa Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'brainzept'
});

const db = admin.firestore();
const messaging = admin.messaging();

// Helper: formata data local (Brasil, UTC-3)
function localStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

exports.handler = async (event) => {
  const token = event.queryStringParameters?.token || event.headers['x-reminder-token'] || '';
  if (token !== process.env.REMINDER_WEBHOOK_TOKEN) {
    return { statusCode: 401, body: 'Não autorizado' };
  }

  try {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const todayStr = localStr(now);

    // 1. Itera por cada usuário em /users
    const usersSnap = await db.collection('users').get();
    const toSend = [];

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      // 2. Lê fcmToken do usuário (se existe)
      const fcmTokenDoc = await db.doc(`users/${uid}/data/fcmToken`).get();
      const fcmToken = fcmTokenDoc.data()?.token;
      if (!fcmToken) continue; // usuário não tem token registrado

      // 3. Lê profile (reminderTime)
      const profileDoc = await db.doc(`users/${uid}/data/profile`).get();
      const reminderTime = profileDoc.data()?.reminderTime;
      if (!reminderTime) continue; // usuário não tem lembrete configurado

      const [remH, remM] = reminderTime.split(':').map(Number);

      // 4. Verifica se agora é a hora (margem de 10 min: 00:00-00:09)
      if (currentHour === remH && currentMin < 10) {
        // 5. Verifica se estudou hoje
        const sessionsSnap = await db.collection(`users/${uid}/sessions`)
          .where('startedAt', '>=', new Date(now.getFullYear(), now.getMonth(), now.getDate()))
          .get();

        const studied = sessionsSnap.docs.some(s => {
          const sess = s.data();
          return sess.duration && sess.duration > 0;
        });

        if (!studied) {
          toSend.push({ fcmToken, uid });
        }
      }
    }

    // 6. Envia push pra todos que precisam
    let sent = 0;
    for (const { fcmToken } of toSend) {
      try {
        await messaging.send({
          token: fcmToken,
          notification: {
            title: 'Focadus — Hora de estudar!',
            body: 'Você ainda não estudou hoje. Que tal uma sessão agora?'
          },
          data: { url: '/dashboard.html' },
          android: { priority: 'high' },
          webpush: { urgency: 'high' }
        });
        sent++;
      } catch (err) {
        console.error('Erro ao enviar push:', err);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        checked: usersSnap.docs.length,
        toSend: toSend.length,
        sent
      })
    };

  } catch (err) {
    console.error('Erro na função:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

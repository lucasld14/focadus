# 🔔 Setup — Lembretes com Push (Firebase Cloud Messaging)

Este guia explica como **ativar o carteiro de lembretes** — o sistema que envia notificações push pro seu celular mesmo com o app fechado.

---

## 🧩 Peças já prontas

✅ **Peça 1:** Chave VAPID gerada (você já tem)
✅ **Peça 2:** `firebase-messaging-sw.js` — service worker de push
✅ **Peça 3:** `firebase-messaging.js` — registra token FCM de cada usuário
✅ **Peça 4 (essa):** `send-reminders.js` — a função Netlify que envia no horário certo

---

## 📋 Checklist de Configuração

### **Passo 1 — Gerar credenciais do Firebase (chave de serviço)**

Essa chave permite que a função Netlify **fale com o Firebase** como admin (pode enviar push).

1. No **Firebase Console → brainzept**, clique na **engrenagem ⚙️ (Configurações)**
2. Vá em **"Contas de serviço"** (abas: Geral → Contas de serviço)
3. Clique em **"Gerar nova chave privada"**
4. Vai baixar um arquivo JSON gigante — **guarde ele**, vamos usar

Esse JSON tem o `private_key` e `client_email` que fazem a autenticação.

---

### **Passo 2 — Adicionar variáveis de ambiente no Netlify**

1. Abra **https://app.netlify.com** → seu site Focadus
2. **Settings → Build & Deploy → Environment**
3. Clique em **"Edit variables"**
4. Adicione **duas variáveis:**

| Nome | Valor |
|------|-------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | *todo o conteúdo do JSON que você baixou (Passo 1)* — como string |
| `REMINDER_WEBHOOK_TOKEN` | *qualquer string aleatória forte*, ex: `abc123xyz789remindersecretkey2024` |

**Dica:** Pra `FIREBASE_SERVICE_ACCOUNT_KEY`, copie o JSON inteiro e cole como string (Netlify faz isso automaticamente).

---

### **Passo 3 — Deploy pra Netlify**

Arraste a pasta `Focadus` completa (com os novos arquivos `netlify.toml`, `package.json`, `.netlify/functions/send-reminders.js`) pro Netlify.

Netlify vai:
1. Ver o `package.json` → instalar `firebase-admin`
2. Ver o `netlify.toml` → configurar a função em `.netlify/functions`
3. Publicar tudo

Pronto! Sua função estará em: `https://seu-site.netlify.app/.netlify/functions/send-reminders`

---

### **Passo 4 — Configurar o agendador (cron)**

A função não roda automaticamente — precisa de alguém "cutucá-la" a cada ~10 minutos.

Use **https://cron-job.org** (grátis):

1. Abra **https://cron-job.org/en/** e crie uma conta
2. Clique em **"Cronjobs"** → **"Create Cronjob"**
3. Preencha:
   - **URL:** `https://seu-site.netlify.app/.netlify/functions/send-reminders?token=abc123xyz789remindersecretkey2024`
     (substitua `seu-site` e o `token` pelo que você colocou no Netlify)
   - **Execution schedule:** **Every 10 minutes** (a cada 10 min)
   - **Notification settings:** Email quando falhar (opcional)
4. Clique em **"Create Cronjob"**

Pronto! A cada 10 minutos, o cron-job.org vai chamar sua função, que:
1. Verifica quem tem `reminderTime` configurado
2. Checa se a hora bateu (e.g., 20:00)
3. Confirma se já estudou hoje
4. Envia push pra quem não estudou ainda

---

## 🧪 Como testar

1. **Abra o app** (focadus.com.br)
2. Vá em **Perfil → Horário do lembrete** → coloque um horário pra **daqui a 2–3 minutos** (ex: se são 14:25, coloque 14:27)
3. Salve
4. **Feche o app** (fecha a aba/navegador)
5. **Aguarde** até a hora (ex: 14:27)
6. Vai chegar uma notificação push! 🔔

Se não chegar:
- Verifica se você **permitiu notificações** quando abriu o app
- Verifica se o token FCM foi salvo no Firestore (tem um doc `users/{uid}/data/fcmToken`)
- Manda um print do **Console do Netlify → Logs** (pode aparecer um erro ali)

---

## 🚨 Limitações e notas

- **Android/PC:** push funciona tanto no navegador quanto no app PWA instalado
- **iPhone:** push só funciona se você **instalar o app** na tela inicial (iOS 16.4+, Web App)
- **Agendador grátis:** cron-job.org é grátis mas ocasionalmente pode ter delay de alguns minutos
- **Firebase grátis:** você tem **100k** chamadas de Cloud Messaging/mês (mais que o suficiente)

---

## 📞 Quando ativar

Você pode:
- **Testar agora** (faça o setup todo) — serve pra validar antes de vender
- **Deixar pra depois** — o app funciona sem isso (lembrete só funciona com app aberto, como antes)

Se deixar pra depois: **delete `send-reminders.js`, `netlify.toml`, `package.json`** antes de fazer o próximo deploy, pra Netlify não tentar buildar nada que não vai usar.

---

**Pronto pra seguir?** Quer que eu valide algo ou tem dúvida em algum passo?

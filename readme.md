# Focadus — Plataforma Premium de Estudos

App web de controle de estudos com cronômetro, metas, gráficos e provas. Hospedado em [focadus.com.br](https://focadus.com.br).

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML + CSS + JavaScript puro (sem framework) |
| Auth | Firebase Authentication (e-mail/senha + Google) |
| Banco | Cloud Firestore (Firebase) |
| Hospedagem | Netlify (drag & drop da pasta) |
| Pagamentos | Kiwify → webhook Make.com → Firestore `pagantes` |
| Gráficos | Chart.js 4.4.0 via CDN |
| Fontes | Google Fonts (Space Grotesk + Inter) |

---

## Estrutura de arquivos

```
Focadus/
│
├── index.html          # Landing page pública (vendas)
├── login.html          # Tela de login / cadastro
├── dashboard.html      # Painel principal (home do app)
├── cronometro.html     # Módulo de cronômetro por matéria
├── cronograma.html     # Cronograma semanal de estudos
├── graficos.html       # Gráficos e heatmap de atividade
├── metas.html          # Metas diárias e progresso
├── provas.html         # Controle de provas com contagem regressiva
├── obrigado.html       # Página pós-compra (redireciona de volta ao app)
│
├── shared.css          # Estilos compartilhados entre TODAS as páginas do app
│
├── dialogs.js          # Sistema de modais customizados (bzConfirm, bzPrompt)
├── notifications.js    # Lógica de permissão e envio de notificações do navegador
├── sounds.js           # Sons de feedback (conclusão de sessão, etc.)
│
├── favicon.svg         # Ícone do site (SVG com a logo)
├── _redirects          # Regras de redirecionamento do Netlify
└── README.md           # Este arquivo
```

---

## Fluxo de autenticação e acesso premium

```
Usuário compra na Kiwify
        ↓
Kiwify dispara webhook para Make.com
        ↓
Make.com grava e-mail em Firestore: pagantes/{email}
        ↓
Usuário cria conta no login.html
        ↓
App verifica se e-mail existe em pagantes/{email}
        ↓ sim               ↓ não
Badge "Premium"        Acesso negado / redirect
```

---

## Firestore — estrutura de dados

```
users/
  {uid}/
    data/
      profile     → { name, photo (base64), reminderTime }
      meta        → { horas }         ← meta diária em horas
      subjects    → { list: [{id, name, color}] }
    sessions/
      {id}        → { startedAt (Timestamp), duration (segundos), subject }
    exams/
      {id}        → { name, subject, date, createdAt }
    cronograma/
      {weekKey}   → { planned: {key: horas}, actual: calculado das sessions }

pagantes/
  {email}         → { email, createdAt }  ← gravado pelo Make.com
```

---

## Helpers críticos (evitar bugs de timezone)

Todo o app usa dois helpers para evitar bugs de data causados por UTC vs horário local (Brasil = UTC-3):

```js
// SEMPRE chame now() em vez de usar new Date() cached no topo
function now() { return new Date(); }

// SEMPRE use localStr() em vez de .toISOString().slice(0,10)
function localStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
```

**Por quê:** `.toISOString()` retorna UTC. Após ~21h no horário de Brasília o dia já virou no UTC, causando métricas erradas.

---

## Como rodar localmente

Não há build step. Basta abrir os arquivos em um servidor local:

```bash
# Opção 1 — VS Code: instale a extensão "Live Server" e clique em "Go Live"

# Opção 2 — Python
python -m http.server 5500

# Opção 3 — Node
npx serve .
```

Acesse: `http://localhost:5500`

> **Atenção:** Firebase Auth não funciona com `file://`. Use sempre um servidor local (localhost).

---

## Deploy no Netlify

1. Arraste a pasta `Focadus/` para [app.netlify.com](https://app.netlify.com)
2. O arquivo `_redirects` já está configurado para roteamento correto
3. Nenhuma variável de ambiente necessária — Firebase config está inline nos HTMLs

---

## Configuração do Firebase

As credenciais do Firebase estão diretamente nos arquivos HTML (projeto Firebase ID: `brainzept` — não pode ser alterado). Para trocar de projeto Firebase, busque por `FC={` em qualquer arquivo do app e atualize o objeto.

---

## Adicionando novas páginas ao app

Toda página nova deve:

1. Incluir `<link rel="stylesheet" href="shared.css">` no `<head>`
2. Copiar a estrutura de sidebar/topbar de `dashboard.html`
3. Usar `onAuthStateChanged` para checar auth (padrão do projeto)
4. Usar `localStr()` e `now()` para qualquer lógica de data

---

## Contato / Suporte

- **Dono do projeto:** Lucas Davi
- **E-mail:** lucasdavimelo321@gmail.com
- **Site:** https://focadus.com.br

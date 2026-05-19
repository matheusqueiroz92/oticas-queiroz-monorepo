# WhatsApp Bot Gateway

Gateway entre **WhatsApp** (via [Baileys](https://github.com/WhiskeySockets/Baileys)) e o **ERP** / **n8n**. A sessão multi-device do WhatsApp fica em disco (`WA_SESSION_PATH`); a inteligência do atendimento (menu, consultas, agendamento) fica no backend (`POST /api/bot/chat`).

Documentação completa da API do bot: [`bot-api-docs.md`](../../bot-api-docs.md) (raiz do monorepo).

## Fluxo

```
Cliente (WhatsApp)
    → whatsapp-bot (mensagem de texto)
    → n8n (opcional) OU ERP direto (fallback / modo erp)
    → POST /api/bot/chat (máquina de estados + MongoDB)
    → resposta { text, action, sessionStatus }
    → whatsapp-bot envia texto ao cliente
```

1. Cliente envia mensagem em chat **individual** (não grupo).
2. O gateway encaminha para `N8N_WEBHOOK_URL` **ou**, se o n8n falhar ou estiver em modo `erp`, chama direto `POST {ERP_API_URL}/api/bot/chat`.
3. O backend devolve o texto a enviar; o gateway repassa ao WhatsApp (`response.text`).
4. Para respostas iniciadas pelo n8n (sem passar pelo chat), use `POST /send-message` neste serviço.

## Variáveis de ambiente

Copie `.env.example` para `.env`:

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `BOT_API_KEY` | sim | Mesma chave do backend ERP (`x-api-key`) |
| `N8N_WEBHOOK_URL` | sim* | Webhook n8n para mensagens recebidas |
| `ERP_API_URL` | não | Base do backend (default `http://localhost:3333`) |
| `BOT_CHAT_MODE` | não | `n8n` (padrão) ou `erp` (só ERP, sem n8n) |
| `BOT_ERP_FALLBACK_ON_N8N_ERROR` | não | `true` (padrão): se n8n falhar (ex.: 404), chama o ERP |
| `N8N_WEBHOOK_TIMEOUT_MS` | não | Default `10000` |
| `PORT` | não | Default `3344` |
| `WA_SESSION_PATH` | não | Default `./data/auth` |
| `LOG_LEVEL` | não | Default `info` (dev: `debug`) |

\* Obrigatória quando `BOT_CHAT_MODE=n8n`.

### Webhook de teste vs produção (n8n)

| URL | Uso |
|-----|-----|
| `/webhook-test/...` | **Uma chamada por vez** com editor aberto — a 2ª mensagem costuma retornar **404** |
| `/webhook/...` | Workflow **ativo/publicado** — use em Docker e produção |

**Recomendações em desenvolvimento local:**

- `BOT_CHAT_MODE=erp` — mais simples, fala direto com o backend; ou
- `BOT_CHAT_MODE=n8n` + `BOT_ERP_FALLBACK_ON_N8N_ERROR=true` — tenta n8n e cai no ERP se der erro; ou
- URL de **produção** do n8n com workflow publicado.

## Desenvolvimento local

```bash
# Na raiz do monorepo
npm install
cp apps/whatsapp-bot/.env.example apps/whatsapp-bot/.env
# Preencha BOT_API_KEY (igual ao apps/backend/.env)

# Terminal 1 — API
npm run dev:backend

# Terminal 2 — gateway WhatsApp
npm run dev:whatsapp-bot
```

Na primeira execução, escaneie o **QR Code** no terminal (Aparelhos conectados).

## API HTTP

### `GET /health`

Sem autenticação. Retorna `{ "status": "ok", "whatsapp": "connected" | "disconnected" }`.

### `POST /send-message`

Envio **ativo** de mensagem (ex.: n8n disparando resposta manual).

| Header | Valor |
|--------|--------|
| `x-api-key` | `BOT_API_KEY` |
| `Content-Type` | `application/json` |

Body:

```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "text": "Sua mensagem de resposta"
}
```

Resposta **200**: `{ "success": true }`.

## Integração com n8n

### Opção A — Recomendada: ERP centraliza o diálogo

1. **Webhook** recebe o payload do gateway (`remoteJid`, `text`, …).
2. **HTTP Request** → `POST http://backend:3333/api/bot/chat` (ou `localhost:3333` local).
   - Header: `x-api-key` = `BOT_API_KEY`
   - Body: `{ "remoteJid": "{{ $json.remoteJid }}", "text": "{{ $json.text }}" }`
3. **Respond to Webhook** (ou retorno síncrono) com `{ "text": "{{ $json.text }}" }` usando o campo `text` da resposta do ERP.

O gateway envia ao cliente qualquer objeto de resposta que contenha `text`.

### Opção B — Modo `erp` no gateway

Com `BOT_CHAT_MODE=erp`, o gateway chama `/api/bot/chat` direto; o n8n pode ficar fora do caminho de mensagens recebidas.

Payload recebido no webhook n8n (quando usado):

```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "pushName": "Maria",
  "text": "1",
  "timestamp": 1715000000
}
```

> JIDs podem usar sufixo `@s.whatsapp.net` ou `@lid` (privacidade WhatsApp). O backend normaliza e persiste sessão por `remoteJid`.

## Docker

```bash
# Primeira autenticação (QR no terminal)
docker compose run --rm -it whatsapp-bot

# Depois, em produção
docker compose up -d whatsapp-bot
```

A sessão fica no volume `whatsapp_bot_auth`. Se a sessão for deslogada, remova o volume e escaneie o QR novamente.

## Testes

```bash
cd apps/whatsapp-bot
npm test
```

## Comportamento

- Ignora **grupos** e mensagens **enviadas por você** (`fromMe`).
- Apenas mensagens de **texto** (`conversation` / `extendedTextMessage`) disparam o processamento.
- **Reconexão automática** se a conexão cair (exceto logout explícito).
- **JID `@lid` (privacidade WhatsApp):** respostas são enviadas para o número `@s.whatsapp.net` quando o Baileys informa `senderPn` na mensagem recebida (evita falha “PDO / phone offline” ao responder só no `@lid`).
- Logs: `Inbound WhatsApp`, `Envio usando JID de telefone (mapeamento LID)`, `Resposta enviada ao WhatsApp`.

Menu e fluxos (opções 1–4, voltar com `0`): ver [`bot-api-docs.md`](../../bot-api-docs.md).

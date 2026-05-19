# API do Bot (WhatsApp / n8n / ERP)

O atendimento automatizado usa **dois serviços** com a mesma chave `BOT_API_KEY`:

| Serviço | Pacote | Função |
|---------|--------|--------|
| **ERP Bot API** | `apps/backend` | Máquina de estados, sessões, consultas e solicitações (`/api/bot/*`) |
| **WhatsApp Gateway** | `apps/whatsapp-bot` | Baileys ↔ n8n ou ERP (`POST /send-message`) |

Documentação do gateway: [`apps/whatsapp-bot/README.md`](apps/whatsapp-bot/README.md).

---

## Visão geral do chatbot

O endpoint **`POST /api/bot/chat`** concentra a lógica do diálogo. O n8n (ou o gateway em modo `erp`) envia cada mensagem do cliente e recebe o texto (e metadados) para responder no WhatsApp.

### Menu principal

| Tecla | Ação |
|-------|------|
| `1` | Consultar pedido por O.S. |
| `2` | Consultar débitos por CPF |
| `3` | Agendar exame de vista (R$ 150 — configurável) |
| `4` | Solicitar orçamento (receita / dados do óculos) |
| `0` | Voltar ao menu principal (em qualquer etapa do fluxo) |

### Estados da sessão (MongoDB: `botchatsessions`)

| Status | Descrição |
|--------|-----------|
| `AGUARDANDO_OPCAO` | Menu principal |
| `AGUARDANDO_OS` | Aguardando número da O.S. |
| `AGUARDANDO_CPF` | Aguardando CPF |
| `AGUARDANDO_AGENDAMENTO` | Aguardando dados para agendamento |
| `AGUARDANDO_ORCAMENTO` | Aguardando dados para orçamento |

- Sessão expira após **`BOT_SESSION_TTL_MINUTES`** sem interação (padrão: 30).
- Após consultas (O.S./CPF) ou envio de solicitação (3/4), a sessão é **encerrada**; o cliente pode digitar `0` ou qualquer mensagem para reabrir o menu.

### Solicitações salvas (MongoDB: `botwhatsapprequests`)

| `type` | Origem |
|--------|--------|
| `exam_scheduling` | Opção 3 — agendamento de exame |
| `quote_request` | Opção 4 — orçamento |

Campos: `remoteJid`, `type`, `content`, `createdAt`.

---

## ERP Bot API (`/api/bot`)

Todas as rotas exigem o header **`x-api-key`** = `BOT_API_KEY` (`apps/backend/.env`).

Base URL (exemplo): `https://app.oticasqueiroz.com.br/api/bot`

### Autenticação

| Header | Valor |
|--------|--------|
| `x-api-key` | Igual a `BOT_API_KEY` no backend |

Erro padrão (401):

```json
{
  "status": "error",
  "code": "UNAUTHORIZED",
  "message": "Chave de API inválida."
}
```

---

## POST `/chat` — Webhook do diálogo (principal)

Processa uma mensagem inbound e devolve a resposta síncrona para o n8n ou gateway.

**Body:**

```json
{
  "remoteJid": "5511999999999@s.whatsapp.net",
  "text": "1"
}
```

- `remoteJid`: JID do WhatsApp (aceita `@s.whatsapp.net` ou `@lid`; normalizado com trim).
- `text`: conteúdo da mensagem (número ou texto livre conforme o estado).

Também aceita body aninhado `{ "body": { "remoteJid", "text" } }` (comum no n8n).

**Sucesso — HTTP 200:**

```json
{
  "action": "ASK_OS",
  "text": "Por favor, informe o número da *Ordem de Serviço (O.S.)* do seu pedido.\n\n_Digite *0* para voltar ao menu principal._",
  "sessionStatus": "AGUARDANDO_OS"
}
```

### Valores de `action`

| action | Quando |
|--------|--------|
| `SHOW_MENU` | Menu principal ou opção inválida no menu |
| `ASK_OS` | Pedindo O.S. (opção 1) |
| `ASK_CPF` | Pedindo CPF (opção 2) |
| `ASK_AGENDAMENTO` | Informações de agendamento + valor (opção 3) |
| `ASK_ORCAMENTO` | Pedido de receita/dados do óculos (opção 4) |
| `ORDER_RESULT` | Resultado da consulta de O.S. |
| `DEBTS_RESULT` | Resultado da consulta de débitos |
| `AGENDAMENTO_CONFIRMED` | Dados de agendamento recebidos |
| `ORCAMENTO_CONFIRMED` | Solicitação de orçamento recebida |
| `SEND_MESSAGE` | Erro de negócio com retorno ao menu |
| `SESSION_EXPIRED` | Sessão anterior expirou por inatividade (`BOT_SESSION_TTL_MINUTES`); `text` avisa e reexibe o menu |

- **`text`:** sempre preenchido — use este campo para enviar ao WhatsApp.
- **`sessionStatus`:** estado atual ou `null` se a sessão foi fechada.
- **`data`:** presente em `ORDER_RESULT` e `DEBTS_RESULT` (mesmo formato das rotas GET abaixo).

### Fluxo resumido

1. **Sem sessão:** cria `AGUARDANDO_OPCAO` → menu (`SHOW_MENU`).
2. **Sessão expirada por inatividade:** cria nova sessão → aviso + menu (`SESSION_EXPIRED`).
3. **Menu + `1`–`4`:** muda estado e pergunta o dado correspondente.
4. **Menu + outro texto:** menu com “opção inválida”.
5. **`0`:** volta ao menu em qualquer estado ativo.
6. **O.S. / CPF:** consulta ERP → resultado → sessão fechada.
7. **Agendamento / orçamento:** valida tamanho mínimo do texto → grava em `botwhatsapprequests` → confirma → sessão fechada.

---

## GET `/order/:os_number`

Consulta pedido pela **ordem de serviço** (apenas dígitos na busca).

### Sucesso — HTTP 200

```json
{
  "serviceOrder": "300450",
  "status": "in_production",
  "paymentStatus": "partially_paid",
  "orderDate": "2025-01-15T14:30:00.000Z",
  "deliveryDate": null,
  "totalPrice": 899.9,
  "totalPaid": 300,
  "remainingAmount": 599.9
}
```

- **`status`:** `pending` | `in_production` | `ready` | `delivered` | `cancelled`
- **`paymentStatus`:** `pending` | `partially_paid` | `paid`

### Erros comuns

| HTTP | `code` | Situação |
|------|--------|----------|
| 400 | `VALIDATION_ERROR` | O.S. inválida |
| 404 | `RESOURCE_NOT_FOUND` | Pedido não encontrado |

---

## GET `/customer/debts/:cpf`

Débitos pendentes do cliente (`role === "customer"`).

### Sucesso — HTTP 200

```json
{
  "cpf": "12345678901",
  "totalDebt": 250.5,
  "pendingDebts": [
    {
      "orderId": "674a1b2c3d4e5f6789abcdef",
      "serviceOrder": "300451",
      "status": "delivered",
      "totalPrice": 500,
      "totalPaid": 400,
      "remainingAmount": 100
    }
  ]
}
```

### Erros comuns

| HTTP | `code` | Situação |
|------|--------|----------|
| 400 | `INVALID_CPF` | CPF inválido |
| 404 | `USER_NOT_FOUND` | Cliente não encontrado |

---

## Variáveis de ambiente (backend)

| Variável | Descrição |
|----------|-----------|
| `BOT_API_KEY` | Chave `x-api-key` |
| `BOT_SESSION_TTL_MINUTES` | TTL da sessão (padrão `30`) |
| `BOT_EXAM_PRICE_BRL` | Valor exibido no agendamento (padrão `150`) |

---

## Exemplo n8n — diálogo completo

1. **Webhook** — recebe mensagem do `whatsapp-bot`.
2. **HTTP Request**
   - Method: `POST`
   - URL: `http://backend:3333/api/bot/chat` (Docker) ou `http://localhost:3333/api/bot/chat`
   - Header: `x-api-key` = `BOT_API_KEY`
   - Body: `{ "remoteJid": "{{ $json.remoteJid }}", "text": "{{ $json.text }}" }`
3. **Respond to Webhook** — `{ "text": "{{ $json.text }}" }` (campo `text` da resposta do ERP).

Consultas pontuais (sem máquina de estados) continuam possíveis via GET `/order/...` e `/customer/debts/...`.

---

## Arquitetura (backend)

| Camada | Arquivos principais |
|--------|---------------------|
| Rotas | `src/routes/botRoutes.ts` |
| Controller | `src/controllers/BotController.ts` |
| Use cases | `src/useCases/bot/ProcessBotInboundMessageUseCase.ts`, `GetBotOrderByOsUseCase.ts`, … |
| Sessão | `src/services/BotChatSessionService.ts`, `src/schemas/BotChatSessionSchema.ts` |
| Solicitações | `src/services/BotWhatsAppRequestService.ts`, `src/schemas/BotWhatsAppRequestSchema.ts` |
| Mensagens | `src/constants/botChatMessages.ts` |

---

## Testes

No pacote `apps/backend`:

```bash
npm run test:bot
```

Cobertura focada em `jest.bot.config.ts` (use cases, sessão, DTOs, formatadores).

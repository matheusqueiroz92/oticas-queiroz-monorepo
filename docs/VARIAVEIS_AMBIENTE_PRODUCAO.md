# 📋 Variáveis de Ambiente para Produção

Este documento lista **TODAS** as variáveis de ambiente necessárias para rodar a aplicação em produção.

---

## 🔴 BACKEND (apps/backend/.env)

### ✅ Variáveis OBRIGATÓRIAS

Estas variáveis **DEVEM** estar configuradas ou a aplicação não funcionará:

```env
# Ambiente
NODE_ENV=production

# Banco de Dados
MONGODB_URI=mongodb://usuario:senha@oticas-queiroz-db:27017/oticas_queiroz_db?authSource=admin&replicaSet=rs0

# Autenticação
JWT_SECRET=sua_chave_secreta_jwt_minimo_32_caracteres

# Email (obrigatório se usar funcionalidade de email)
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app
```

### ⚙️ Variáveis OPCIONAIS (mas recomendadas)

```env
# Servidor
PORT=3333
API_URL=https://app.oticasqueiroz.com.br/api
FRONTEND_URL=https://app.oticasqueiroz.com.br

# Email (opcionais, têm valores padrão)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

### 🔵 Integração SICREDI (Opcional, mas obrigatória se usar boletos SICREDI)

Se você usar a integração com SICREDI para gerar boletos, estas variáveis são obrigatórias:

```env
SICREDI_ENVIRONMENT=production
SICREDI_CLIENT_ID=seu_client_id_sicredi
SICREDI_CLIENT_SECRET=seu_client_secret_sicredi
SICREDI_COOPERATIVE_CODE=seu_codigo_cooperativa
SICREDI_POST_CODE=seu_codigo_posto
SICREDI_ACCESS_CODE=seu_codigo_acesso_internet_banking
SICREDI_ACCESS_TOKEN=seu_token_acesso_sicredi
SICREDI_AUTO_SYNC=true
SICREDI_SYNC_INTERVAL=30
```

### 💳 Integração Mercado Pago (Opcional)

Se você usar integração com Mercado Pago:

```env
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_mercado_pago
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_mercado_pago
```

---

## 🟢 FRONTEND (apps/web/.env.local)

### ✅ Variáveis OBRIGATÓRIAS

```env
# Ambiente
NODE_ENV=production

# URL da API (deixe vazio se usar proxy NGINX)
NEXT_PUBLIC_API_URL=
```

**Nota sobre NEXT_PUBLIC_API_URL:**

- Produção com Traefik: `https://api.app.oticasqueiroz.com.br` (subdomínio roteado nas labels do `backend`)
- Alternativa no mesmo host: `https://app.oticasqueiroz.com.br/api` (PathPrefix `/api` no Traefik)
- Após alterar, é obrigatório **rebuild** do frontend (`docker compose build --no-cache frontend`)
- DNS: registro `A` de `api.app.oticasqueiroz.com.br` apontando para o IP do VPS

---

## 📝 Template Completo para Produção

### Backend (.env)

```env
# ===========================================
# CONFIGURAÇÕES OBRIGATÓRIAS
# ===========================================
NODE_ENV=production
PORT=3333
API_URL=https://app.oticasqueiroz.com.br/api
FRONTEND_URL=https://app.oticasqueiroz.com.br

# Banco de Dados
MONGODB_URI=mongodb://usuario:senha@oticas-queiroz-db:27017/oticas_queiroz_db?authSource=admin&replicaSet=rs0

# JWT
JWT_SECRET=GERAR_UMA_CHAVE_SECRETA_ALEATORIA_MINIMO_32_CARACTERES

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app_gmail

# ===========================================
# SICREDI (Opcional - apenas se usar boletos)
# ===========================================
SICREDI_ENVIRONMENT=production
SICREDI_CLIENT_ID=seu_client_id_sicredi
SICREDI_CLIENT_SECRET=seu_client_secret_sicredi
SICREDI_COOPERATIVE_CODE=seu_codigo_cooperativa
SICREDI_POST_CODE=seu_codigo_posto
SICREDI_ACCESS_CODE=seu_codigo_acesso_internet_banking
SICREDI_ACCESS_TOKEN=seu_token_acesso_sicredi
SICREDI_AUTO_SYNC=true
SICREDI_SYNC_INTERVAL=30

# ===========================================
# MERCADO PAGO (Opcional - apenas se usar)
# ===========================================
MERCADO_PAGO_ACCESS_TOKEN=seu_access_token_mercado_pago
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_mercado_pago
```

### Frontend (.env.local)

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=
```

---

## ⚠️ IMPORTANTE: Correção no env.example

O arquivo `apps/backend/env.example` estava com um erro. Ele tinha `EMAIL_PASS` mas o código usa `EMAIL_PASSWORD`. Isso foi corrigido.

**Sempre use `EMAIL_PASSWORD` e não `EMAIL_PASS`.**

---

## 🔐 Segurança

1. **NUNCA** commite arquivos `.env` ou `.env.local` no Git
2. Use valores diferentes em desenvolvimento e produção
3. Para JWT_SECRET, gere uma chave segura:
   ```bash
   openssl rand -base64 32
   ```
4. Para Gmail, use "Senha de App" e não a senha normal da conta
5. Mantenha backups seguros dos arquivos .env de produção

---

## 📍 Localização dos Arquivos

- **Backend**: `apps/backend/.env`
- **Frontend**: `apps/web/.env.local`

---

## 🧪 Verificação

Após configurar, verifique se todas as variáveis estão sendo lidas corretamente:

### Backend

```bash
cd apps/backend
node -e "require('dotenv').config(); console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Configurado' : '✗ Faltando'); console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Configurado' : '✗ Faltando');"
```

### Frontend

O Next.js carrega automaticamente as variáveis do `.env.local` em produção.

---

## 🚨 Problemas Comuns

### Erro: "MONGODB_URI not defined"

- Verifique se o arquivo `.env` existe em `apps/backend/`
- Verifique se o nome da variável está correto (MONGODB_URI, não MONGODB_URL)

### Erro: "JWT_SECRET não está definido no ambiente"

- Verifique se `JWT_SECRET` está definido no `.env`
- Certifique-se de que o arquivo está na raiz do backend

### Erro: "Credenciais de email não configuradas"

- Verifique `EMAIL_USER` e `EMAIL_PASSWORD` no `.env`
- Use `EMAIL_PASSWORD` (não `EMAIL_PASS`)

### Frontend não consegue conectar à API

- Verifique `NEXT_PUBLIC_API_URL` no `.env.local`
- Se usar NGINX, deixe vazio para usar URLs relativas
- Se não usar NGINX, defina a URL completa da API

### Deploy: `network oticas-queiroz-db_default ... could not be found`

- No `.env` da VPS (`/opt/apps/oticas-queiroz/.env`): `MONGO_DOCKER_NETWORK=traefik-public`
- Confirme com: `docker inspect oticas-queiroz-db --format '{{range $k,$v := .NetworkSettings.Networks}}{{$k}} {{end}}'`

### WhatsApp: "Aguardando mensagem" no celular do cliente

- Respostas devem usar o **mesmo JID** da mensagem recebida (`@lid` → responder em `@lid`).
- Use `BOT_CHAT_MODE=erp` em produção se o workflow n8n não estiver publicado.
- Senha com `@` na `MONGODB_URI` deve ser codificada (`%40`).

---

---

## 📚 Arquivos de Referência

- **Template Backend**: `apps/backend/env.example` (atualizado com todas as variáveis)
- **Documentação Completa**: Este arquivo

---

**Última atualização:** 2025-01-27
**Versão:** 1.0.0

# 🔧 Correção do Problema de Login em Produção

## 🐛 Problema Identificado

**Sintoma:** Erro 404 ao tentar fazer login em produção (`app.oticasqueiroz.com.br`)

**Causa Raiz:** O frontend estava tentando acessar `http://localhost:3333/api/auth/login` mesmo em produção, ignorando o proxy do NGINX.

## ✅ Solução Implementada

### Alteração no código (`authService.ts`)

**Antes:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333";
```

**Depois:**
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3333');
```

### Como Funciona Agora

#### Em Desenvolvimento:
- `NODE_ENV !== 'production'`
- `API_URL = 'http://localhost:3333'`
- Requisições vão para: `http://localhost:3333/api/auth/login`

#### Em Produção:
- `NODE_ENV === 'production'`
- `API_URL = ''` (vazio - URLs relativas)
- Requisições vão para: `/api/auth/login` (relativo)
- NGINX faz proxy de `/api` para `http://127.0.0.1:3333`

## 📋 Instruções para Deploy

### 1. Fazer Build do Frontend

```bash
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo/apps/web
npm run build
```

### 2. Reiniciar o Frontend (PM2)

```bash
pm2 restart oticas-frontend
```

ou

```bash
pm2 restart all
```

### 3. Verificar Logs

```bash
# Ver logs do frontend
pm2 logs oticas-frontend

# Ver logs do backend
pm2 logs oticas-backend
```

### 4. Verificar NGINX

```bash
# Testar configuração
sudo nginx -t

# Se necessário, reiniciar NGINX
sudo systemctl restart nginx
```

## 🧪 Testes de Validação

1. **Teste de Login:**
   - Acesse: https://app.oticasqueiroz.com.br
   - Tente fazer login
   - Deve funcionar sem erro 404

2. **Verificar Console do Navegador:**
   - Abra DevTools (F12)
   - Aba Network
   - Tente fazer login
   - A requisição deve ir para `/api/auth/login` (relativo)
   - Status deve ser 200 (sucesso) ou 401 (credenciais inválidas), NÃO 404

3. **Verificar Headers da Requisição:**
   ```
   Request URL: https://app.oticasqueiroz.com.br/api/auth/login
   Request Method: POST
   Status Code: 200 OK
   ```

## 📝 Configuração do NGINX (já está correta)

```nginx
location /api {
    proxy_pass http://127.0.0.1:3333;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}
```

## 🚀 Comandos Rápidos para Deploy

Execute no servidor de produção:

```bash
# Navegar para o diretório do projeto
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo

# Fazer pull das alterações
git pull origin main

# Instalar dependências (se necessário)
cd apps/web && npm install && cd ../..

# Build do frontend
cd apps/web && npm run build && cd ../..

# Reiniciar aplicações
pm2 restart all

# Verificar status
pm2 status
```

## ⚠️ Possíveis Problemas e Soluções

### Problema 1: Ainda recebe erro 404

**Solução:**
```bash
# Limpar cache do Next.js
cd apps/web
rm -rf .next
npm run build
pm2 restart oticas-frontend
```

### Problema 2: Backend não está respondendo

**Solução:**
```bash
# Verificar se o backend está rodando na porta 3333
netstat -tlnp | grep 3333

# Reiniciar backend
pm2 restart oticas-backend

# Ver logs
pm2 logs oticas-backend --lines 50
```

### Problema 3: NGINX não está fazendo proxy corretamente

**Solução:**
```bash
# Verificar configuração
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx

# Ver logs do NGINX
sudo tail -f /var/log/nginx/error.log
```

## 📊 Checklist de Deploy

- [ ] Pull do código mais recente
- [ ] Instalar dependências (se houver novas)
- [ ] Build do frontend
- [ ] Reiniciar PM2
- [ ] Verificar status do PM2
- [ ] Testar login no navegador
- [ ] Verificar console do navegador (sem erro 404)
- [ ] Testar outras funcionalidades

## 🎯 Resumo

O problema era que o frontend em produção estava tentando acessar diretamente `localhost:3333` ao invés de usar URLs relativas que o NGINX pudesse fazer proxy. A correção faz com que:

- **Desenvolvimento:** Continue funcionando com `http://localhost:3333`
- **Produção:** Use URLs relativas (`/api/...`) que o NGINX intercepta e faz proxy para `http://127.0.0.1:3333`

---

**Data da Correção:** 10/10/2025  
**Commit:** 02d3520 (feat: implementa sistema completo de gerenciamento de senhas)  
**Próximo Commit:** Fix de produção para login


# 🚀 Deploy Rápido - Correção de Login em Produção

## ⚡ Comandos Rápidos (Copiar e Colar no Servidor)

```bash
# 1. Navegar para o diretório do projeto
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo

# 2. Fazer pull das alterações
git pull origin main

# 3. Build do frontend
cd apps/web
npm run build

# 4. Voltar para raiz e reiniciar aplicações
cd ../..
pm2 restart all

# 5. Verificar status
pm2 status
```

## ✅ Validação

1. Acesse: **https://app.oticasqueiroz.com.br**
2. Tente fazer login
3. Deve funcionar SEM erro 404

## 🔍 Se Ainda Tiver Problema

```bash
# Limpar cache do Next.js e rebuild
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo/apps/web
rm -rf .next
npm run build
cd ../..
pm2 restart oticas-frontend
```

## 📊 Ver Logs (caso necessário)

```bash
# Frontend
pm2 logs oticas-frontend --lines 50

# Backend  
pm2 logs oticas-backend --lines 50

# Todos
pm2 logs --lines 50
```

---

**O que foi corrigido:**
- Frontend agora usa URLs relativas em produção (`/api/...`)
- NGINX faz o proxy corretamente para o backend
- Em desenvolvimento continua funcionando com `localhost:3333`


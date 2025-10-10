# 🚀 INSTRUÇÕES COMPLETAS PARA DEPLOY EM PRODUÇÃO

## 📋 Resumo das Alterações

### ✅ Correções Implementadas:
1. **Erro 404 no Login** - Frontend agora usa URLs relativas em produção
2. **Sistema de Gerenciamento de Senhas** - Completo com permissões
3. **Correções de Build** - Todos os imports corrigidos

### 📦 Commits a serem deployados:
```
36b89ed - fix: errors login
76fa25a - docs: adiciona guia rápido de deploy
3fc2653 - fix: corrige erro 404 no login em produção
02d3520 - feat: implementa sistema completo de gerenciamento de senhas
```

---

## 🔧 PASSO A PASSO PARA DEPLOY

### 1️⃣ Conectar ao Servidor

```bash
ssh usuario@seu-servidor.com
# ou use seu método de acesso preferido
```

### 2️⃣ Navegar para o Diretório do Projeto

```bash
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo
```

### 3️⃣ Fazer Backup (Recomendado)

```bash
# Backup rápido
cd ..
tar -czf backup-$(date +%Y%m%d-%H%M%S).tar.gz oticas-queiroz-monorepo
cd oticas-queiroz-monorepo
```

### 4️⃣ Atualizar o Código

```bash
# Ver status atual
git status

# Fazer pull das alterações
git pull origin main
```

### 5️⃣ Instalar Dependências (se necessário)

```bash
# Backend (se houver novas dependências)
cd apps/backend
npm install
cd ../..

# Frontend (se houver novas dependências)
cd apps/web
npm install
cd ../..
```

### 6️⃣ Build do Frontend

```bash
cd apps/web
npm run build
cd ../..
```

### 7️⃣ Reiniciar Aplicações

```bash
# Reiniciar todas as aplicações PM2
pm2 restart all

# Ou reiniciar individualmente
pm2 restart oticas-backend
pm2 restart oticas-frontend
```

### 8️⃣ Verificar Status

```bash
pm2 status
pm2 logs --lines 20
```

---

## 🧪 VALIDAÇÃO DO DEPLOY

### ✅ Checklist de Testes:

1. **Teste de Login:**
   - [ ] Acesse: https://app.oticasqueiroz.com.br
   - [ ] Faça login com suas credenciais
   - [ ] **SUCESSO:** Login funciona sem erro 404
   - [ ] **FALHA:** Se erro 404, execute os passos de troubleshooting

2. **Teste do Console do Navegador:**
   - [ ] Abra DevTools (F12)
   - [ ] Vá para aba Network
   - [ ] Faça login novamente
   - [ ] Verifique: Request URL deve ser `/api/auth/login` (relativo)
   - [ ] Verifique: Status Code deve ser 200 ou 401, NÃO 404

3. **Teste de Gerenciamento de Senhas:**
   - [ ] Faça login como Admin
   - [ ] Acesse seu perfil
   - [ ] Clique em "Alterar Minha Senha"
   - [ ] Tente alterar sua senha
   - [ ] **SUCESSO:** Senha alterada com sucesso

4. **Teste de Reset de Senha (Admin/Employee):**
   - [ ] Faça login como Admin ou Employee
   - [ ] Vá para lista de Clientes ou Funcionários
   - [ ] Clique nas ações (⋮) de um usuário
   - [ ] Verifique se aparece opção "Resetar Senha"
   - [ ] Tente resetar a senha de um usuário
   - [ ] **SUCESSO:** Senha resetada com sucesso

---

## 🚨 TROUBLESHOOTING

### Problema: Ainda recebe erro 404 no login

```bash
# Limpar cache do Next.js
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo/apps/web
rm -rf .next
npm run build
cd ../..
pm2 restart oticas-frontend
```

### Problema: Build falha

```bash
# Limpar node_modules e reinstalar
cd apps/web
rm -rf node_modules .next
npm install
npm run build
cd ../..
pm2 restart oticas-frontend
```

### Problema: Backend não responde

```bash
# Verificar se está rodando
netstat -tlnp | grep 3333

# Ver logs
pm2 logs oticas-backend --lines 50

# Reiniciar
pm2 restart oticas-backend
```

### Problema: NGINX não faz proxy

```bash
# Testar configuração
sudo nginx -t

# Reiniciar NGINX
sudo systemctl restart nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📊 COMANDOS ÚTEIS

### PM2

```bash
# Status de todos os processos
pm2 status

# Ver logs em tempo real
pm2 logs

# Ver logs de uma aplicação específica
pm2 logs oticas-frontend
pm2 logs oticas-backend

# Reiniciar uma aplicação
pm2 restart oticas-frontend

# Parar uma aplicação
pm2 stop oticas-frontend

# Ver informações detalhadas
pm2 show oticas-frontend
```

### NGINX

```bash
# Testar configuração
sudo nginx -t

# Reiniciar
sudo systemctl restart nginx

# Ver status
sudo systemctl status nginx

# Ver logs de erro
sudo tail -f /var/log/nginx/error.log

# Ver logs de acesso
sudo tail -f /var/log/nginx/access.log
```

### Git

```bash
# Ver status
git status

# Ver últimos commits
git log --oneline -10

# Ver diferenças
git diff

# Forçar sincronização (cuidado!)
git fetch origin
git reset --hard origin/main
```

---

## 🎯 SCRIPT COMPLETO (COPIAR E COLAR)

Para deploy rápido, copie e cole este bloco inteiro:

```bash
# Navegar para o projeto
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo

# Atualizar código
git pull origin main

# Build do frontend
cd apps/web && npm run build && cd ../..

# Reiniciar aplicações
pm2 restart all

# Verificar status
pm2 status

echo "✅ Deploy concluído! Teste o login em: https://app.oticasqueiroz.com.br"
```

---

## ⚠️ IMPORTANTE

1. **Backup:** Sempre faça backup antes de fazer deploy
2. **Horário:** Prefira fazer deploy em horários de baixo movimento
3. **Testes:** Teste tudo após o deploy
4. **Logs:** Monitore os logs por alguns minutos após o deploy
5. **Rollback:** Se algo der errado, você pode voltar para o commit anterior

### Rollback de Emergência:

```bash
cd /var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo
git log --oneline -10  # Ver commits anteriores
git reset --hard <commit-id-anterior>
cd apps/web && npm run build && cd ../..
pm2 restart all
```

---

## 📞 SUPORTE

Se encontrar problemas:
1. Verifique os logs: `pm2 logs`
2. Verifique NGINX: `sudo systemctl status nginx`
3. Verifique se o backend está rodando: `netstat -tlnp | grep 3333`
4. Consulte: `PRODUCTION_LOGIN_FIX.md` para mais detalhes

---

**Data:** 10/10/2025  
**Responsável:** Matheus Queiroz  
**Status:** ✅ Pronto para Deploy


#!/bin/bash

# Script de deploy para Óticas Queiroz Monorepo
# Este script deve ser executado na raiz do projeto

# Definir variáveis
PROJECT_DIR="/var/www/app.oticasqueiroz.com.br/oticas-queiroz-monorepo"
NGINX_CONF="/etc/nginx/sites-available/app.oticasqueiroz.com.br"
NGINX_ENABLED="/etc/nginx/sites-enabled/app.oticasqueiroz.com.br"
LOG_FILE="$PROJECT_DIR/deploy.log"

# Função para registrar mensagens de log
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Iniciar o processo de deploy
log "Iniciando deploy da aplicação Óticas Queiroz"

# Verificar se estamos no diretório correto
if [ "$(pwd)" != "$PROJECT_DIR" ]; then
  log "Mudando para o diretório do projeto: $PROJECT_DIR"
  cd "$PROJECT_DIR" || {
    log "ERRO: Falha ao mudar para o diretório $PROJECT_DIR"
    exit 1
  }
fi

# Puxar as mudanças mais recentes do repositório
log "Obtendo as alterações mais recentes do repositório"
git pull origin main || {
  log "ERRO: Falha ao obter as alterações mais recentes"
  exit 1
}

# Instalar dependências
log "Instalando dependências"
npm install || {
  log "ERRO: Falha ao instalar dependências"
  exit 1
}

# Construir os aplicativos
log "Construindo aplicativos com Turborepo"
npx turbo run build || {
  log "ERRO: Falha ao construir aplicativos"
  exit 1
}

# Copiar a configuração do Nginx se ela não existir
if [ ! -f "$NGINX_CONF" ]; then
  log "Copiando configuração do Nginx"
  cp "$PROJECT_DIR/nginx.conf" "$NGINX_CONF" || {
    log "ERRO: Falha ao copiar configuração do Nginx"
    exit 1
  }
  
  # Criar link simbólico se não existir
  if [ ! -f "$NGINX_ENABLED" ]; then
    ln -s "$NGINX_CONF" "$NGINX_ENABLED" || {
      log "ERRO: Falha ao criar link simbólico para Nginx"
      exit 1
    }
  fi
  
  # Testar a configuração do Nginx
  nginx -t || {
    log "ERRO: Configuração do Nginx inválida"
    exit 1
  }
  
  # Recarregar o Nginx
  systemctl reload nginx || {
    log "ERRO: Falha ao recarregar Nginx"
    exit 1
  }
fi

# Parar aplicações existentes no PM2
log "Parando aplicações existentes (se houver)"
pm2 delete all || true

# Iniciar aplicações com PM2
log "Iniciando aplicações com PM2"
pm2 start ecosystem.config.js || {
  log "ERRO: Falha ao iniciar aplicações com PM2"
  exit 1
}

# Salvar configuração do PM2
log "Salvando configuração do PM2"
pm2 save || {
  log "AVISO: Falha ao salvar configuração PM2"
}

# Configurar PM2 para iniciar com o sistema
log "Configurando PM2 para iniciar com o sistema"
pm2 startup | tail -n 1 | bash || {
  log "AVISO: Falha ao configurar inicialização automática do PM2"
}

log "Deploy concluído com sucesso!"
echo "=============================================================================="
echo "Aplicação disponível em: https://app.oticasqueiroz.com.br"
echo "API disponível em: https://app.oticasqueiroz.com.br/api"
echo "Documentação Swagger: https://app.oticasqueiroz.com.br/api-docs"
echo "=============================================================================="
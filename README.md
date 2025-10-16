# 🕶️ Óticas Queiroz - Sistema de Gestão Completo
![Status](https://img.shields.io/badge/Status-Em_Produção-green) ![Versão](https://img.shields.io/badge/Versão-2.5.0-blue) ![Licença](https://img.shields.io/badge/Licença-Proprietária-red)

Sistema completo de gestão para Óticas Queiroz, desenvolvido para otimizar processos de vendas, controle de estoque, gestão financeira e atendimento ao cliente com foco em análise de dados e experiência do usuário.

## 🌟 Funcionalidades em Destaque

### 📊 **Dashboard Inteligente**
- **Gráficos de Vendas Interativos**: Visualização por períodos (7 dias, 30 dias, 6 meses) usando Recharts
- **Estatísticas em Tempo Real**: Total de vendas, pedidos, crescimento e métricas de performance
- **Layout Responsivo**: Design adaptável para diversos tamanhos de tela
- **Botões de Ações Rápidas**: Atalhos para acesso direto às principais funcionalidades do sistema

### 👤 **Perfil de Usuário Avançado**
- **Dados Dinâmicos**: Estatísticas reais baseadas em informações individuais do usuário
- **Métricas Personalizadas**: Diferentes métricas para Admin, Funcionário e Cliente
- **Sistema de Classificação**: Bronze → Prata → Ouro → Premium baseado em performance
- **Indicadores Visuais**: Ícones de crescimento e tendências com cores dinâmicas

### 🎯 **Funcionalidades de Negócio Revolucionárias**
- **Login por Ordem de Serviço**: Clientes podem acessar usando apenas o número da O.S.
- **CPF Opcional**: Cadastro flexível sem obrigatoriedade de documento
- **Responsável pela Compra**: Suporte a cenários onde comprador ≠ pagador
- **Integração Mercado Pago**: Pagamentos online seguros com checkout transparente
- **🆕 Status Automático Inteligente**: Sistema detecta tipo de produto e define status automaticamente
- **🆕 Prescrição Médica Opcional**: Flexibilidade para criar pedidos sem receita médica
- **🆕 Reset de Senha Visual**: Admin pode resetar senhas de funcionários pela interface

## 🧩 Principais Funcionalidades do Sistema

### 🔐 Autenticação e Gestão de Usuários
- 👮‍♂️ **Perfis de Acesso Hierárquicos**:
  - **Administradores**: Controle total, relatórios executivos, configurações
  - **Funcionários**: Vendas, atendimento, gestão de clientes e produtos
  - **Clientes**: Portal pessoal com histórico, pedidos e perfil
  - **Instituições**: Acesso corporativo com funcionalidades específicas

- 🔑 **Sistema de Autenticação Flexível**:
  - Login tradicional com email, CPF ou CNPJ
  - **Login simplificado por Ordem de Serviço** (cliente usa número da O.S.)
  - Tokens JWT seguros com renovação automática
  - Sistema robusto de recuperação de senha via email

- 🛡️ **Segurança Multicamadas**:
  - Validação automática de CPF/CNPJ com algoritmos
  - Controle de sessão com timeout inteligente
  - Middleware de autenticação com verificação em tempo real
  - Criptografia BCrypt para proteção de senhas
  - **🆕 Reset de senha com hash seguro**: Admin pode resetar senhas de funcionários e clientes
  - **Permissões granulares**: Admin → funcionários/clientes, Funcionário → clientes

### 📊 Dashboard e Analytics Avançados
- 📈 **Gráficos Interativos de Vendas (SalesChart)**:
  - **Períodos configuráveis**: 7 dias (diário), 30 dias (diário), 6 meses (semanal)
  - **Dados agrupados inteligentemente** baseado no período selecionado
  - **Tooltips informativos** com detalhes de vendas e pedidos
  - **Estatísticas do período**: Total, crescimento, melhor dia, média

- 📋 **Métricas em Tempo Real**:
  - Total de vendas com comparativo de crescimento
  - Número de pedidos e percentual de aumento/diminuição
  - Média diária de vendas calculada dinamicamente
  - Destaque do melhor dia com badge especial

- ⚡ **Ações Rápidas Otimizadas**:
  - Cards de criação rápida com altura reduzida
  - Acesso direto a pedidos, clientes, produtos, pagamentos
  - Interface responsiva e visualmente atrativa

- 🎯 **Widgets Inteligentes**:
  - Lista de pedidos recentes compacta (sidebar)
  - Status do caixa atual com informações em tempo real
  - Contadores de clientes cadastrados na semana

### 📦 Gestão Completa de Produtos
- 🗂️ **Categorização Especializada**:
  - **Lentes Oftálmicas**: Tipos, materiais, índices, tratamentos
  - **Armações de Grau**: Marcas, modelos, cores, formatos, referências
  - **Óculos de Sol**: Categorias, proteção UV, estilos, marcas
  - **Produtos de Limpeza**: Sprays, panos, soluções especializadas

- 📊 **Controle Inteligente de Estoque**:
  - Movimentação automática baseada em vendas e cancelamentos
  - Histórico completo de alterações com responsáveis
  - Alertas configuráveis de estoque baixo
  - Análise de custos, margens e rentabilidade

- 🖼️ **Gestão Visual Avançada**:
  - Upload múltiplo de imagens com compressão automática
  - Galeria responsiva com zoom e navegação
  - Busca visual por características e atributos

### 🔬 Gestão de Laboratórios
- 🏭 **Cadastro de Laboratórios Parceiros**:
  - Dados completos: CNPJ, razão social, responsável técnico
  - Contatos múltiplos: telefone, email, WhatsApp
  - Endereço completo para envio de pedidos
  - Prazo padrão de entrega configurável

- 📊 **Controle de Produção**:
  - Associação de pedidos a laboratórios específicos
  - **Mudança automática de status**: Pendente → Em Produção (apenas se tiver lentes)
  - Acompanhamento de prazos e SLA
  - Histórico de pedidos por laboratório
  - Avaliação de performance e qualidade

### 🛍️ Sistema de Pedidos Revolucionário
- ✨ **Interface de Criação Intuitiva**:
  - Wizard multi-etapas com validação em tempo real
  - Busca inteligente de produtos com filtros avançados
  - Cálculos automáticos de preços, descontos e totais

- 👥 **Responsabilidade Financeira Flexível**:
  - **Cenário tradicional**: Cliente compra e paga
  - **Cenário família**: Filho compra, pai paga (débito vai para o responsável)
  - **Cenário corporativo**: Funcionário compra, empresa paga
  - Interface visual com cores diferenciadas (azul/laranja)

- 📅 **🆕 Prescrição Oftálmica OPCIONAL**:
  - **Totalmente opcional**: Não é mais obrigatória para criar pedidos
  - **Flexível**: Útil para óculos de sol, armações sem lentes, ou quando cliente não tem receita
  - **Pode ser adicionada depois**: Sistema permite editar e incluir prescrição posteriormente
  - **Dados completos quando preenchida**: Médico, clínica, medidas precisas de dioptria
  - **Parâmetros técnicos**: Eixo, D.P., Adição, N.D., O.C., pupilômetria
  - **Badge visual**: Interface indica claramente que é "Opcional"

- 🤖 **🆕 Status Automático Inteligente**:
  - **Detecção automática**: Sistema analisa se pedido tem lentes
  - **Sem lentes** (óculos de sol, armações): Status inicial = **"Pronto"** (produto já disponível)
  - **Com lentes** (óculos de grau): Status inicial = **"Pendente"** (aguarda laboratório)
  - **Associação de laboratório**: Muda automaticamente para **"Em Produção"** quando tem lentes
  - **Otimização**: Pedidos sem lentes não passam por etapas desnecessárias (70% mais rápido)
  - **Inteligente**: Backend e frontend aplicam lógica automaticamente

- 🔄 **Workflow de Status Completo**:
  - **Estados bem definidos**: Pendente → Em Produção → Pronto → Entregue → Cancelado
  - **Transições automáticas**: Sistema muda status baseado em ações
  - **Notificações automáticas**: Clientes recebem atualizações de mudanças de status
  - **Histórico completo**: Todas as alterações registradas com timestamps
  - **Controle de prazo**: SLA por laboratório com alertas de atraso

### 💵 Sistema Financeiro Robusto
- 🔄 **Tipos de Transação Abrangentes**:
  - **Vendas**: Pagamentos de produtos e serviços
  - **Quitação de Dívidas**: Pagamentos de débitos anteriores
  - **Despesas Operacionais**: Gastos da empresa
  - **Movimentações de Caixa**: Sangria, suprimento, transferências

- 💳 **Métodos de Pagamento Completos**:
  - **Cartão de Crédito**: Parcelamento inteligente com juros configuráveis
  - **Cartão de Débito**: Confirmação imediata
  - **Dinheiro**: Controle de troco e conferência
  - **PIX**: Integração com QR codes e chaves
  - **Boleto Bancário**: Códigos de barras e bancos específicos
  - **Promissória**: Numeração sequencial e controle
  - **Cheque**: Gestão completa com status de compensação, emissão, vencimento

- 💰 **Gestão de Caixa Completa**:
  - **Abertura e Fechamento**: Controle diário do caixa físico
  - **Movimentações Automáticas**: Vendas registradas automaticamente
  - **Sangrias**: Retiradas de dinheiro com justificativa
  - **Conferência de Valores**: Comparação entre esperado vs contado
  - **Relatório de Diferenças**: Sobras e faltas registradas e justificadas
  - **Histórico Completo**: Todas as movimentações do dia com timestamps

- 📊 **Gestão Avançada de Dívidas**:
  - Histórico completo por cliente com detalhamento
  - Planos de pagamento personalizados e flexíveis
  - Relatórios de inadimplência com análise de risco
  - Sistema de negociação e renegociação de acordos

- 📃 **Gestão de Cheques**:
  - **Registro completo**: Banco, agência, conta, número do cheque
  - **Status de compensação**: Pendente, Compensado, Devolvido
  - **Controle de vencimentos**: Alertas de cheques a vencer
  - **Histórico**: Todos os cheques recebidos com detalhes
  - **Associação a pagamentos**: Vinculado ao pedido/cliente

### 🏢 Gestão de Instituições e Convênios
- 🤝 **Cadastro de Instituições**:
  - Empresas, escolas, órgãos públicos, sindicatos
  - Dados completos: CNPJ, endereço, responsável, contato
  - Condições especiais de pagamento e descontos

- 📋 **Pedidos Institucionais**:
  - Marcação visual de pedidos para instituições
  - Desconto automático baseado em convênio
  - Faturamento agrupado mensal
  - Relatórios específicos por instituição

### 📚 Clientes Legados
- 🕐 **Migração de Sistema Antigo**:
  - Importação de clientes do sistema anterior
  - Débitos históricos preservados
  - Histórico de pagamentos mantido

- 💰 **Gestão de Débitos Antigos**:
  - Lista de devedores com valores atualizados
  - Registro de pagamentos de débitos legados
  - Relatório de quitação completa
  - Migração gradual para novo sistema

### 👤 Portal do Cliente
- 📱 **Meus Pedidos**:
  - Cliente visualiza apenas seus próprios pedidos
  - Acompanhamento de status em tempo real
  - Histórico completo de compras
  - Detalhes de cada pedido

- 💳 **Meus Débitos**:
  - Visualização de débitos pendentes
  - Histórico de pagamentos realizados
  - Planos de pagamento ativos
  - Comprovantes disponíveis para download

### 👤 Perfil de Usuário Inteligente
- 📊 **Estatísticas Personalizadas por Tipo**:
  - **Funcionários**: Vendas realizadas, comissões, clientes atendidos, avaliação
  - **Clientes**: Total gasto, pedidos realizados, tempo como membro, status
  - **Administradores**: Visão geral do negócio com KPIs executivos

- 🏆 **Sistema de Gamificação**:
  - **Classificação automática**: Bronze → Prata → Ouro → Premium
  - **Avaliação em estrelas** baseada em métricas de performance
  - **Badges de conquistas** por metas alcançadas
  - **Indicadores visuais** de crescimento com ícones TrendingUp/Down

- 📈 **Métricas Dinâmicas e Reais**:
  - Crescimento mensal calculado automaticamente
  - Comparativos com períodos anteriores
  - Estatísticas de relacionamento com clientes
  - Análise de performance individual

- 🔐 **Gestão de Senhas e Segurança**:
  - **🆕 Alterar própria senha**: Todo usuário pode trocar sua senha no perfil
  - **🆕 Reset de senha visual**: Admin/funcionário pode resetar senhas pela interface
  - **Validações**: Senha mínima de 6 caracteres, confirmação obrigatória
  - **Hash seguro**: BCrypt com salt rounds para máxima segurança
  - **Recuperação por email**: Link seguro com token temporário

## 🚀 Tecnologias e Arquitetura

### 🖥️ Backend - API RESTful Moderna
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)

### 🌐 Frontend - Aplicação Web de Última Geração
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![ShadCN](https://img.shields.io/badge/ShadCN_UI-000000?style=for-the-badge&logo=shadcnui&logoColor=white)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=recharts&logoColor=white)](https://recharts.org/)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)

### 🛠️ Infraestrutura e DevOps
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://www.nginx.com/)
[![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)
[![Hostinger](https://img.shields.io/badge/Hostinger_VPS-2F6FDE?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com/)

## 🏗️ Arquitetura Modular

### 🎯 Padrão MSC + Repository Pattern
- **Controllers**: Gerenciam requests/responses HTTP
- **Services**: Contêm lógica de negócio
- **Models/Repositories**: Acesso e manipulação de dados
- **Middlewares**: Autenticação, validação, tratamento de erros

### 🔧 Arquitetura Frontend Moderna
- **App Router (Next.js 15)**: Roteamento baseado em arquivos
- **Custom Hooks**: Lógica reutilizável (`useDashboard`, `useProfileData`)
- **Utility Functions**: Funções especializadas (`*-utils.ts`)
- **Component Library**: ShadCN/UI para consistência visual

## 📂 Estrutura do Projeto

```bash
oticas-queiroz-monorepo/
├── apps/
│   ├── backend/                    # API Node.js + Express
│   │   ├── src/
│   │   │   ├── controllers/        # Camada HTTP (AuthController, OrderController...)
│   │   │   ├── services/           # Lógica de negócio (AuthService, PaymentService...)
│   │   │   ├── repositories/       # Acesso a dados com Repository Pattern
│   │   │   ├── models/             # Schemas Mongoose
│   │   │   ├── middlewares/        # Auth, CORS, Error handling
│   │   │   ├── utils/              # Funções auxiliares
│   │   │   └── __tests__/          # Testes unitários/integração
│   │   └── public/images/          # Upload de arquivos organizados
│   │
│   ├── web/                        # Frontend Next.js
│   │   ├── app/                    # App Router (Next.js 15)
│   │   │   ├── (authenticated)/    # Rotas protegidas
│   │   │   │   ├── dashboard/      # Dashboard com gráficos
│   │   │   │   ├── profile/        # Perfil avançado
│   │   │   │   ├── orders/         # Gestão de pedidos
│   │   │   │   └── payments/       # Gestão financeira
│   │   │   ├── _utils/             # Funções utilitárias especializadas
│   │   │   │   ├── dashboard-utils.ts  # Cálculos do dashboard
│   │   │   │   ├── sales-utils.ts      # Análise de vendas
│   │   │   │   └── profile-utils.ts    # Métricas de perfil
│   │   ├── components/             # Componentes React modulares
│   │   │   ├── dashboard/          # Componentes do dashboard
│   │   │   │   ├── SalesChart.tsx      # Gráfico de vendas interativo
│   │   │   │   ├── DashboardStats.tsx  # Cards de estatísticas
│   │   │   │   └── RecentOrdersList.tsx# Lista compacta de pedidos
│   │   │   └── ui/                 # ShadCN/UI components
│   │   ├── hooks/                  # Custom hooks especializados
│   │   │   ├── useDashboard.ts         # Hook centralizado do dashboard
│   │   │   └── useProfileData.ts       # Hook do perfil com métricas
│   │   └── schemas/                # Validações Zod frontend
│   │
│   ├── mobile/                     # React Native (Em desenvolvimento)
│   └── desktop/                    # Electron (Planejado)
│
├── packages/                       # Pacotes compartilhados
│   ├── ui/                         # Componentes UI reutilizáveis
│   ├── config/                     # Configurações compartilhadas
│   └── shared/                     # Tipos e utils compartilhados
```

## 🛠️ Instalação e Configuração

### Pré-requisitos
- **Node.js 18+** (recomendado LTS)
- **MongoDB 5.0+** (local ou Atlas)
- **NPM ou Yarn** (gerenciador de pacotes)
- **Git** (controle de versão)

### Instalação Rápida
```bash
# Clone o repositório
git clone https://github.com/matheusqueiroz92/oticas-queiroz-monorepo.git
cd oticas-queiroz-monorepo

# Instale dependências globais
npm install

# Configure variáveis de ambiente
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env

# 🆕 Execute backend + frontend com um único comando
npm run dev

# Ou execute separadamente:
npm run dev:backend     # Apenas API (porta 3333)
npm run dev:web         # Apenas frontend (porta 3000)
```

> 💡 **Dica:** O comando `npm run dev` usa Turborepo para iniciar backend e frontend simultaneamente com hot reload!

### Configuração Detalhada

#### Backend (.env)
```bash
# Servidor
PORT=3333
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/oticas-queiroz
USERNAME=seu_usuario_mongodb
PASSWORD=sua_senha_mongodb

# Autenticação
JWT_SECRET=sua_chave_jwt
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=seu_email@gmail.com
EMAIL_PASSWORD=sua_senha_de_app

# Mercado Pago
MERCADO_PAGO_ACCESS_TOKEN=seu_token_mercado_pago
MERCADO_PAGO_PUBLIC_KEY=sua_public_key_mercado_pago
```

#### Frontend (.env.local)
```bash
# API
NEXT_PUBLIC_API_URL=http://localhost:3333

# Upload
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NEXT_PUBLIC_ALLOWED_TYPES=image/jpeg,image/png,image/webp
```

### Scripts Disponíveis
```bash
# Desenvolvimento (Turborepo)
npm run dev                 # 🆕 Backend + Frontend simultaneamente
npm run dev:backend         # Apenas API
npm run dev:web             # Apenas frontend

# Build
npm run build               # Build completo
npm run build:backend       # Build API
npm run build:frontend      # Build web

# Testes
npm run test                # Todos os testes
npm run test:backend        # Testes API
npm run test:coverage       # Cobertura de testes

# Linting e formatação
npm run lint                # ESLint
npm run format              # Prettier
```

## 📊 Destaques das Últimas Versões

### 🎯 v2.5.0 - Automação e Flexibilidade (Outubro 2025)

**Status Automático Inteligente 🤖**
- **Antes**: Todos os pedidos começavam como "Pendente", mesmo óculos de sol
- **Depois**: Sistema detecta tipo de produto e define status automaticamente
  - Pedidos SEM lentes → **"Pronto"** (70% mais rápido!)
  - Pedidos COM lentes → **"Pendente"** → Laboratório → **"Em Produção"**

**Prescrição Opcional 📋**
- **Antes**: Prescrição médica era obrigatória para pedidos com lentes
- **Depois**: Totalmente opcional! Útil para:
  - Óculos de sol sem grau
  - Armações vendidas separadamente
  - Cliente sem receita no momento (pode adicionar depois)

**Reset de Senha Visual 🔑**
- **Antes**: Admin precisava acessar banco de dados para resetar senhas
- **Depois**: Interface visual com 3 cliques (90% mais rápido!)
  - Admin → funcionários e clientes
  - Funcionário → clientes
  - Hash BCrypt aplicado automaticamente

**Turborepo Configurado ⚡**
- **Antes**: 2 comandos para iniciar dev (backend e frontend)
- **Depois**: 1 comando inicia ambos: `npm run dev`

### 🎯 v2.4.0 - Dashboard e Analytics (Janeiro 2025)

**Dashboard Dinâmico**
- ✅ Gráfico de vendas interativo com Recharts
- ✅ Períodos configuráveis: 7 dias, 30 dias, 6 meses
- ✅ Estatísticas em tempo real
- ✅ Layout responsivo otimizado

**Perfil Inteligente**
- ✅ Métricas personalizadas por tipo de usuário
- ✅ Sistema de classificação: Bronze → Ouro
- ✅ Indicadores visuais de crescimento
- ✅ Gamificação com estrelas

### 💡 v2.3.0 - Flexibilidade (Dezembro 2024)
- ✅ Login por Ordem de Serviço
- ✅ CPF opcional no cadastro
- ✅ Responsável pela compra
- ✅ Integração Mercado Pago

## 🧪 Testes e Qualidade

### Coverage Backend
```bash
✅ Testes Unitários        │ 85%+ coverage
✅ Testes de Integração    │ 90%+ coverage
✅ Testes de Controllers   │ 95%+ coverage
✅ Testes de Services      │ 90%+ coverage
✅ Testes de Repositories  │ 85%+ coverage
```

### Ferramentas
- **Jest**: Framework de testes
- **Supertest**: Testes de API
- **MongoDB Memory Server**: Banco em memória para testes
- **ESLint + Prettier**: Qualidade e formatação de código

## 🚀 Deploy e Produção

### Ambiente Atual
- **Servidor**: VPS Hostinger (AlmaLinux)
- **Web Server**: NGINX
- **Process Manager**: PM2
- **Database**: MongoDB
- **Domain**: app.oticasqueiroz.com.br
- **SSL**: Let's Encrypt

### Status
- ✅ **Produção**: Sistema em funcionamento
- ✅ **Monitoramento**: 99.9% uptime
- ✅ **Backup**: Automático diário
- ✅ **SSL**: Certificado válido

## 🔄 Roadmap Futuro

### Próximas Implementações
- [ ] **Notificações por Email**: Avisos automáticos de status de pedidos
- [ ] **WhatsApp Business**: Integração para envio de comprovantes e avisos
- [ ] **Backup Local Automático**: Backup diário automático com rotação
- [ ] **Integração com Impressoras**: Impressão automática de pedidos
- [ ] **Relatórios Avançados**: BI com dashboards executivos

### Expansão Mobile e Desktop
- [ ] **App Mobile iOS/Android** (React Native)
  - Vendas offline
  - Sincronização automática
  - Scanner de código de barras
  - Catálogo de produtos digital
  
- [ ] **App Desktop** (Electron)
  - Modo kiosk para balcão
  - Impressão térmica
  - Integração com hardware (leitores, balanças)

### Inteligência Artificial
- [ ] **Previsão de Vendas**: Machine Learning para forecast
- [ ] **Análise Preditiva**: Identificação de clientes em risco de churn
- [ ] **Chatbot**: Atendimento automatizado 24/7


## 📝 Changelog

### v2.5.0 (Outubro 2025) 🚀 **ATUAL**

**🆕 Novas Funcionalidades**
- ✅ **Status Automático Inteligente**: Pedidos sem lentes ficam "Pronto" automaticamente
- ✅ **Prescrição Opcional**: Não é mais obrigatória para criar pedidos
- ✅ **Reset de Senha Visual**: Admin pode resetar senhas de funcionários pela interface
- ✅ **Turborepo Configurado**: `npm run dev` inicia backend + frontend simultaneamente

**🔒 Segurança**
- ✅ **Correção Crítica**: Hash de senha ao resetar (BCrypt)
- ✅ **Validações Aprimoradas**: Permissões granulares por role
- ✅ **Auditoria**: Logs de alterações de senha

**📚 Documentação**
- ✅ **Suite Completa de Manuais**: 7 documentos, ~4.800 linhas
- ✅ **Linguagem Simples**: Para funcionários sem conhecimento técnico
- ✅ **100+ Ilustrações**: Diagramas ASCII didáticos
- ✅ **50+ Exemplos Práticos**: Casos de uso do dia a dia
- ✅ **Tutorial Passo a Passo**: Aprenda fazendo

**🎯 Otimizações**
- ✅ **Pedidos 70% mais rápidos**: Produtos sem lentes não passam por etapas desnecessárias
- ✅ **Processo Simplificado**: Menos validações obrigatórias, mais flexibilidade
- ✅ **UX Melhorada**: Badges informativos, dropdowns organizados

### v2.4.0 (Janeiro 2025) 🔄
**🎯 Dashboard & Analytics**
- ✅ Gráfico de vendas interativo com Recharts
- ✅ Métricas em tempo real com crescimento percentual
- ✅ Layout responsivo otimizado (75%/25%)
- ✅ Hook customizado `useDashboard` para centralizar lógica

**👤 Profile & UX**
- ✅ Sistema de classificação por performance (Bronze/Prata/Ouro/Premium)
- ✅ Métricas personalizadas por tipo de usuário
- ✅ Indicadores visuais de crescimento com ícones TrendingUp/Down
- ✅ Hook `useProfileData` com cálculos memoizados

**🔧 Arquitetura & Performance**
- ✅ Funções utilitárias especializadas (`*-utils.ts`)
- ✅ Componentes modulares e reutilizáveis
- ✅ Cálculos memoizados para melhor performance
- ✅ TypeScript rigoroso com interfaces completas

### v2.3.0 (Dezembro 2024) 🔄
- ✅ Login por Ordem de Serviço
- ✅ CPF opcional no cadastro
- ✅ Responsável pela compra
- ✅ Melhorias na segurança e validações

## 👨‍💻 Desenvolvedor

**Matheus Queiroz**
- 🚀 **GitHub**: [@matheusqueiroz92](https://github.com/matheusqueiroz92)
- 🔗 **LinkedIn**: [linkedin.com/in/matheus-queiroz-dev-web](https://linkedin.com/in/matheus-queiroz-dev-web)
- 📧 **Email**: [matheus_giga@hotmail.com](mailto:matheus_giga@hotmail.com)
- 🌐 **Site**: [matheusqueiroz.dev.br](https://matheusqueiroz.dev.br)

## 📚 Documentação

### 📖 Para Usuários e Funcionários

Documentação completa em linguagem simples, com exemplos práticos e ilustrações didáticas:

- **[📖 Manual do Usuário](./docs/MANUAL_USUARIO.md)** - Guia completo do sistema
- **[📦 Manual de Pedidos](./docs/MANUAL_PEDIDOS.md)** - Tudo sobre vendas e pedidos
- **[💰 Manual de Caixa](./docs/MANUAL_CAIXA.md)** - Gestão do caixa diário
- **[⚡ Guia Rápido](./docs/GUIA_RAPIDO.md)** - Referência rápida para consultas
- **[❓ FAQ](./docs/FAQ.md)** - Perguntas frequentes
- **[👣 Tutorial Passo a Passo](./docs/TUTORIAL_PASSO_A_PASSO.md)** - Aprenda com exemplos visuais

### 🔧 Para Desenvolvedores

- **[🚀 Guia de Desenvolvimento](./DESENVOLVIMENTO.md)** - Como iniciar o desenvolvimento
- **[📊 README Backend](./apps/backend/README.md)** - Documentação técnica da API
- **[📁 Documentação Técnica](./info/)** - Notas técnicas e correções

---

## 📄 Licença e Propriedade

Este software é **propriedade exclusiva da Óticas Queiroz** e seu uso é restrito aos termos estabelecidos em contrato. Todos os direitos reservados.

### Direitos Autorais
- **Código Fonte**: Propriedade da Óticas Queiroz
- **Design e UX**: Desenvolvimento exclusivo
- **Dados e Funcionalidades**: Confidenciais e protegidos
- **Uso Comercial**: Restrito à autorização expressa

---

**🕶️ Sistema desenvolvido para revolucionar a gestão ótica digital.**

*Transformando a experiência do comércio de óculos através da tecnologia.*

&copy; 2025 Óticas Queiroz. Todos os direitos reservados.
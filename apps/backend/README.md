# Backend - Sistema Óticas Queiroz

## 📋 Visão Geral

Sistema de gestão completo para ótica, desenvolvido com Node.js, Express.js, TypeScript e MongoDB. Aplicação otimizada para processos de vendas, controle de estoque, gestão financeira e atendimento ao cliente.

## 🏗️ Arquitetura

### Tecnologias Utilizadas
- **Runtime**: Node.js
- **Framework**: Express.js
- **Linguagem**: TypeScript
- **Banco de Dados**: MongoDB com Mongoose
- **Autenticação**: JWT + BCrypt
- **Validação**: Zod
- **Segurança**: Helmet (headers HTTP), express-rate-limit (proteção contra brute force)
- **Testes**: Jest + Supertest
- **Documentação**: Swagger
- **Upload**: Multer
- **E-mail**: Node Mailer
- **Exportação**: PDF Kit + Json2CSV

### Padrões Arquiteturais
- **MSC**: Model, Service, Controller
- **Repository Pattern**: Abstração de acesso a dados
- **Dependency Injection**: Injeção de dependências
- **Middleware Pattern**: Processamento de requisições

### Integrações Externas
- **SICREDI API**: Integração com API de cobrança para geração de boletos
  - Autenticação via certificado digital
  - Geração, consulta e cancelamento de boletos
  - Suporte a ambientes de homologação e produção

## 📁 Estrutura do Projeto

```
src/
├── controllers/     # Controladores da API
├── services/        # Lógica de negócio
├── models/          # Modelos de dados
├── repositories/    # Acesso a dados
├── interfaces/      # Tipos TypeScript
├── schemas/         # Schemas Mongoose
├── middlewares/     # Middlewares Express
├── validators/      # Validações Zod
├── utils/           # Utilitários
├── config/          # Configurações
└── __tests__/       # Testes automatizados
```

## 🚀 Instalação e Configuração

### Pré-requisitos
- Node.js 18+
- MongoDB 5+
- npm ou yarn

### Instalação
```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar migrações (se necessário)
npm run migrate

# Iniciar em desenvolvimento
npm run dev

# Executar testes
npm test
```

## 📊 Status dos Testes

### ✅ Serviços com 100% de Cobertura
- **AuthService**: 100% statements, 100% branches, 100% functions, 100% lines
- **ProductService**: 100% statements, 100% branches, 100% functions, 100% lines
- **OrderService**: 99.33% statements, 83.95% branches, 100% functions, 99.33% lines
- **OrderValidationService**: 100% statements, 100% branches, 100% functions, 100% lines
- **PasswordResetService**: 100% statements, 100% branches, 100% functions, 100% lines
- **PaymentService**: 100% statements, 100% branches, 100% functions, 100% lines
- **PaymentValidationService**: 100% statements, 100% branches, 100% functions, 100% lines
- **UserService**: 100% statements, 94.11% branches, 100% functions, 100% lines
- **OrderRelationshipService**: 100% statements, 80.88% branches, 100% functions, 100% lines
- **PaymentCalculationService**: 100% statements, 97.43% branches, 100% functions, 100% lines
- **StockService**: 100% statements, 91.78% branches, 100% functions, 100% lines

### 🟡 Serviços com Boa Cobertura (80-94%)
- **LegacyClientService**: 93.93% statements, 75.86% branches, 100% functions, 93.87% lines
- **ReportService**: 88.58% statements, 68.25% branches, 100% functions, 86.79% lines
- **CashRegisterService**: 83.11% statements, 78.26% branches, 81.25% functions, 83.11% lines
- **PaymentStatusService**: 80.35% statements, 55.43% branches, 100% functions, 81.65% lines

### ❌ Serviços com Problemas Críticos
- **MercadoPagoService**: 78.03% statements, 44.68% branches, 90% functions, 77.69% lines
- **PaymentExportService**: 36.11% statements, 7.69% branches, 41.66% functions, 37.14% lines
- **OrderExportService**: 4.34% statements, 0% branches, 0% functions, 4.68% lines

## 🔧 Funcionalidades Principais

### Autenticação e Usuários
- **Login tradicional**: Email/CPF/CNPJ + senha
- **Login por O.S.**: Número da O.S. como usuário e senha
- **CPF opcional**: Cadastro de clientes sem CPF
- **Reset de senha**: Via e-mail
- **Gestão de usuários**: CRUD completo

### Pedidos e Vendas
- **Criação de pedidos**: Com produtos e prescrições
- **Controle de status**: Pending → In Production → Ready → Delivered
- **Validação de transições**: Regras de negócio para mudanças de status
- **Histórico de pedidos**: Rastreamento completo
- **Exportação**: PDF e CSV

### Produtos e Estoque
- **Gestão de produtos**: Lentes, armações, produtos de limpeza
- **Controle de estoque**: Entrada, saída, histórico
- **Alertas de estoque**: Produtos com baixo estoque
- **Categorização**: Por tipo e marca

### Pagamentos
- **Múltiplos métodos**: Dinheiro, cartão, PIX, cheque
- **Controle de status**: Pending → Paid → Cancelled
- **Histórico de pagamentos**: Rastreamento completo
- **Cálculos automáticos**: Descontos, parcelas
- **Exportação**: Relatórios financeiros

### Relatórios
- **Estatísticas de clientes**: Novos, recorrentes, por localização
- **Relatórios de vendas**: Por período, produto, funcionário
- **Relatórios financeiros**: Receita, despesas, lucro
- **Relatórios de estoque**: Produtos mais vendidos, baixo estoque

## 🔐 Segurança

### Autenticação
- **JWT**: Tokens seguros com expiração
- **BCrypt**: Hash de senhas com salt
- **Middleware de autenticação**: Proteção de rotas
- **Roles**: Admin, employee, client

### Helmet (Headers de Segurança)
- X-Content-Type-Options: nosniff
- X-Frame-Options: SAMEORIGIN
- X-XSS-Protection
- HSTS (em produção via proxy)
- Content-Security-Policy desabilitada para compatibilidade com Swagger UI

### Validação
- **Zod**: Validação de schemas
- **Sanitização**: Limpeza de dados de entrada
- **CORS**: Configuração de origens permitidas

### Rate Limiting (express-rate-limit)
Proteção contra brute force e abuso em rotas sensíveis:

| Rota | Limite | Janela |
|------|--------|--------|
| `POST /api/auth/login` | 10 req | 15 min |
| `POST /api/auth/forgot-password` | 5 req | 15 min |
| `POST /api/auth/reset-password` | 5 req | 15 min |
| `GET /api/auth/validate-reset-token/:token` | 5 req | 15 min |

- Desativado automaticamente em ambiente de teste
- Resposta 429 com formato padronizado da API
- Configuração em `src/config/rateLimit.ts`

### Rotas de Diagnóstico
- **`GET /api/debug/images-path`**: Disponível apenas em `development` e `test`. Em produção retorna 404 para evitar exposição de informações do servidor

## 📝 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login tradicional
- `POST /api/auth/register` - Registro de usuário
- `POST /api/auth/forgot-password` - Solicitar reset de senha
- `POST /api/auth/reset-password` - Resetar senha

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `GET /api/users/:id` - Buscar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Pedidos
- `GET /api/orders` - Listar pedidos
- `POST /api/orders` - Criar pedido
- `GET /api/orders/:id` - Buscar pedido
- `PUT /api/orders/:id` - Atualizar pedido
- `PUT /api/orders/:id/status` - Atualizar status
- `DELETE /api/orders/:id` - Deletar pedido

### Produtos
- `GET /api/products` - Listar produtos
- `POST /api/products` - Criar produto
- `GET /api/products/:id` - Buscar produto
- `PUT /api/products/:id` - Atualizar produto
- `DELETE /api/products/:id` - Deletar produto

### Pagamentos
- `GET /api/payments` - Listar pagamentos
- `POST /api/payments` - Criar pagamento
- `GET /api/payments/:id` - Buscar pagamento
- `PUT /api/payments/:id` - Atualizar pagamento
- `POST /api/payments/:id/cancel` - Cancelar pagamento

## 🧪 Testes

### Execução de Testes
```bash
# Todos os testes
npm test

# Testes específicos
npm run test:auth
npm run test:user
npm run test:product
npm run test:order

# Testes unitários
npm run test:auth:unit
npm run test:auth:integration

# Com cobertura
npm run test:auth -- --coverage
```

### Estratégias de Teste
- **Testes unitários**: Serviços e modelos
- **Testes de integração**: Controllers e rotas
- **Mocks**: Dependências externas
- **Cobertura**: Meta de 80%+ em branches

## 🔄 Changelog

### [2025-02-22] - Melhorias de Segurança e Média Prioridade

#### ✨ Novas Implementações (Média Prioridade)
- **Validação de variáveis de ambiente**: Schema Zod em `src/config/env.ts` valida MONGODB_URI, JWT_SECRET e PORT no bootstrap; falha rápida se inválidas
- **Limite de paginação**: Parâmetro `limit` limitado a máximo 100 em user e order validators
- **express.json limit**: Corpo das requisições limitado a 1MB
- **ReportService testes**: Correção do contexto `this` com `.bind(reportService)` e guard para `reportModel`
- **Índices MongoDB**: Novos índices em Order (clientId, employeeId, status, orderDate, createdAt), Payment (orderId, customerId, date, cashRegisterId) e Product (name, productType, stock)

#### ✨ Implementações Anteriores (Alta Prioridade)
- **Rate Limiting**: Proteção contra brute force em login e enumeração de emails
  - Login: 10 tentativas por 15 min por IP
  - Forgot-password, reset-password: 5 tentativas por 15 min por IP
- **Rota de Debug Protegida**: `/api/debug/images-path` disponível apenas em dev/test; em produção retorna 404
- **Helmet**: Headers de segurança HTTP (X-Content-Type-Options, X-Frame-Options, etc.)
- **Sort Whitelist**: Validação do parâmetro `sort` em queries para evitar NoSQL injection
  - BaseRepository: whitelist padrão (createdAt, updatedAt, _id, name)
  - MongoOrderRepository: campos específicos de pedidos
- **PM2 Produção**: Corrigido para usar `npm start` em vez de `npm run dev` no ecosystem.config.js

#### 📝 Arquivos Modificados/Criados
- `src/config/rateLimit.ts` - Configuração dos limitadores
- `src/config/env.ts` - Validação de variáveis de ambiente
- `src/app.ts` - Helmet, express.json limit, proteção rota debug
- `src/server.ts` - Import da validação env
- `src/routes/authRoutes.ts` - Aplicação dos limitadores
- `src/validators/userValidators.ts` - Limite max paginação
- `src/validators/orderValidators.ts` - Limite max paginação
- `src/repositories/implementations/BaseRepository.ts` - Whitelist de sort
- `src/repositories/implementations/MongoOrderRepository.ts` - Whitelist de sort
- `src/services/ReportService.ts` - Guard reportModel
- `src/__tests__/unit/services/ReportService.test.ts` - Bind contexto
- `src/schemas/OrderSchema.ts` - Índices MongoDB
- `src/schemas/PaymentSchema.ts` - Índices MongoDB
- `src/schemas/ProductSchema.ts` - Índices MongoDB
- `ecosystem.config.js` - PM2 com npm start
- `package.json` - Dependências express-rate-limit, helmet, script build

### [2024-12-19] - Mudanças de CPF Opcional e Login por O.S.

#### ✨ Novas Funcionalidades
- **Sistema de Login por O.S.**: Usar número da O.S. como usuário e senha
- **CPF Opcional**: Cadastro de clientes sem CPF obrigatório

#### 🔄 Mudanças Importantes
- **UserSchema**: CPF não é mais obrigatório
- **LegacyClientSchema**: CPF opcional com índice sparse
- **Interfaces atualizadas**: IUser e ILegacyClient com CPF opcional
- **Validadores ajustados**: Validação de CPF apenas quando fornecido

#### 📝 Arquivos Modificados
- Schemas: UserSchema.ts, LegacyClientSchema.ts
- Models: AuthModel.ts, LegacyClientModel.ts
- Services: AuthService.ts, UserService.ts, LegacyClientService.ts
- Controllers: AuthController.ts, LegacyClientController.ts
- Validators: userValidators.ts
- Interfaces: IUser.ts, ILegacyClient.ts
- Testes: AuthService.test.ts

## 🚀 Deploy

### Produção
- **Servidor**: Hostinger VPN
- **Sistema**: Alma Linux
- **Proxy**: NGINX
- **Domínio**: app.oticasqueiroz.com.br

### Configuração
```bash
# Build para produção (executado pelo deploy via npx turbo run build)
npm run build

# Iniciar servidor (usado pelo PM2 em produção)
npm start

# PM2 (recomendado) - usa npm start para rodar node dist/server.js
pm2 start ecosystem.config.js
```

## 📈 Monitoramento

### Logs
- **Aplicação**: Winston
- **Acesso**: NGINX logs
- **Erros**: Sentry (opcional)

### Métricas
- **Performance**: Response time
- **Disponibilidade**: Uptime
- **Erros**: Error rate
- **Uso**: Request count

## 🤝 Contribuição

### Padrões de Código
- **TypeScript**: Tipagem estrita
- **ESLint**: Linting automático
- **Prettier**: Formatação de código
- **Conventional Commits**: Padrão de commits

### Processo
1. Fork do repositório
2. Criar branch feature
3. Implementar funcionalidade
4. Adicionar testes
5. Submeter pull request

## 📞 Suporte

### Contato
- **Desenvolvedor**: Equipe de desenvolvimento
- **Email**: suporte@oticasqueiroz.com.br
- **Documentação**: Swagger UI em `/api-docs`

### Problemas Conhecidos
- **MercadoPago**: Integração temporariamente desabilitada
- **Testes de integração**: Alguns falhando por dados inválidos
- **Cobertura**: Meta de 80% branches não atingida

## ✅ Checklist de Melhorias Implementadas

| Área | Status | Observação |
|------|--------|------------|
| Helmet | ✅ | Headers de segurança HTTP |
| Rate limiting | ✅ | Rotas auth sensíveis |
| Rota debug | ✅ | Protegida em produção |
| Sort whitelist | ✅ | BaseRepository e MongoOrderRepository |
| BCrypt | ✅ | Hash de senhas |
| JWT | ✅ | Tokens com expiração |
| CORS | ✅ | Origens configuradas |
| Validação Zod | ✅ | Schemas validados |
| PM2 | ✅ | npm start em produção |
| Validação env | ✅ | Schema Zod no bootstrap |
| express.json limit | ✅ | 1MB |
| Paginação limit max | ✅ | Máximo 100 |
| Índices MongoDB | ✅ | Order, Payment, Product |
| ReportService testes | ✅ | Correção de contexto |
| Swagger em prod | 🟡 | Disponível; considerar proteção futura |
| bcrypt vs bcryptjs | 🟡 | Duplicidade; padronizar futuramente |
| Refresh token | ⏳ | Pendente |

---

**Desenvolvido com ❤️ para Óticas Queiroz** 
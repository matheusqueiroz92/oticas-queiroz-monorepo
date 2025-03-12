# Óticas Queiroz Monorepo

Este repositório contém um sistema de gerenciamento para ótica que integra controle de clientes, funcionários, produtos, pedidos, pagamentos, laboratórios e fornecedores. Esta aplicação inclui backend, frontend, mobile e desktop, e é gerenciada com Turborepo.

## 🚀 Tecnologias

### Backend

- Node.js
- Express
- MongoDB
- Mongoose
- Swagger
- TypeScript
- Jest
- Supertest
- MongoDB Memory Server
- JWT
- BCrypt
- Zod
- Cors
- Dotenv

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- Shadcn UI
- Zod
- React Query
- React Hook Form
- Axios
- Cookies-js
- Lucide React
- React-PDF

### Mobile

- React Native (Expo)

### Desktop

- Electron

### DevOps

- Turborepo
- ESLint
- Docker
- Kubernetes

## 📂 Estrutura de pastas do projeto

```bash
oticas-queiroz-monorepo/
├── apps/
│   ├── backend/  # API Node.js
│     ├── src/
│       ├── config/       # Configurações de conexão ao banco de dados e documentação da API
│       ├── controllers/  # Camada de controle HTTP
│       ├── interfaces/   # Definições de tipos
│       ├── middlewares/  # Definições dos middlewares
│       ├── models/       # Camada de acesso ao banco
│       ├── services/     # Camada das regras de negócio da aplicação
│       ├── schemas/      # Schemas do Mongoose
│       ├── __tests__/    # Testes da aplicação
│       ├── types/        # Tipagens Express
│       └── utils/        # Arquivos auxiliares
│   ├── web/      # Next.js
│     ├── app/        # Rotas e páginas da aplicação
│       ├── (authenticated)/ # Rotas com páginas protegidas
│       ├── auth/            # Páginas de autenticação
│       ├── services/        # Serviços e integrações
│       └── types/           # Definições de tipos e interfaces
│     ├── components/  # Componentes reutilizáveis
│       ├── ui/              # Componentes de UI básicos (Shadcn)
│       ├── forms/           # Componentes de formulários
│       ├── tables/          # Componentes de tabelas
│       └── exports/         # Componentes de exportação (PDF, etc)
│     ├── hooks/       # Hooks personalizados
│     ├── lib/         # Utilitários e funções auxiliares
│     ├── contexts/    # Contexts
│     ├── providers/   # Providers
│     ├── public/      # Arquivos públicos do frontend web
│     └── schemas/
│   ├── mobile/       # React Native
│   ├── desktop/      # Electron
│   └── public/       # Arquivo públicos da aplicação
│     ├── images/       # Arquivos de imagem
│       ├── users/       # Imagens de usuários
│       └── products/    # Imagens de produtos
├── packages/
│   ├── config/       # Configurações (ESLint, TS, Tailwind)
│   ├── ui/           # Componentes UI (Shadcn UI)
│   └── shared/       # Código compartilhado
```

## 🔒 Autenticação

### Features

- Login via email ou username
- JWT (JSON Web Token)
- Autorização baseada em roles
- Middleware de proteção de rotas
- Middleware para tratamento de erros
- Recuperação de senha via email

### Roles

- **Admin**: Acesso total ao sistema
- **Employee**: Gestão de clientes, produtos e pedidos
- **Customer**: Consulta de pedidos e débitos

### Rotas

- POST `/api/auth/login`

  ```typescript
  // Request
  {
    "login": string,    // email ou cpf
    "password": string
  }

  // Response 200
  {
    "token": string,
    "user": {
      "id": string,
      "name": string,
      "email": string,
      "cpf": string,
      "role": "admin" | "employee" | "customer"
    }
  }
  ```

  - POST `/api/auth/forgot-password`

  ```typescript
  // Request
  {
    "email": string    // email cadastrado do usuário
  }

  // Response 200
  {
    "message": string  // Mensagem de sucesso (mesmo se o email não existir, por segurança)
  }
  ```

- POST `/api/auth/reset-password`

```typescript
// Request
{
  "token": string,    // token recebido por email
  "password": string  // nova senha
}

// Response 200
{
  "message": string   // Confirmação de redefinição
}
```

- GET `/api/auth/validate-reset-token/{token}`

```typescript
// Response 200
{
  "valid": boolean // Indica se o token é válido e não expirou
}
```

## 👥 Usuários

### Rotas

- POST `/api/auth/register`: Registra um novo usuário
- GET `/api/users`: Listar todos os usuários
- GET `/api/users/profile`: Obtém o perfil do usário logado
- PUT `/api/users/profile`: Atualiza o perfil do usário logado
- GET `/api/users/:id`: Obtém um usuário pelo ID
- PUT `/api/users/:id`: Atualiza um usuário
- DELETE `/api/users/:id`: Remover usuário

### Schema

```typescript
{
  _id: string;
  name: string;
  email: string;
  cpf: string;
  password: string;
  image: string;
  role: "admin" | "employee" | "customer";
  address?: string;
  phone?: string;
  sales?: string[];
  purchases?: string[];
  debts?: number;
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
```

## 📦 Produtos

### Rotas

- POST `/api/products`: Criar produto
- GET `/api/products`: Listar todos os produtos
- GET `/api/products/:id`: Buscar produto
- PUT `/api/products/:id`: Atualizar produto
- DELETE `/api/products/:id`: Remover produto

### Schema

```typescript
{
  _id: string;
  name: string;
  productType: string;
  category: string;
  description: string;
  brand: string;
  image: string;
  modelGlasses: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛍️ Pedidos

### Rotas

- POST `/api/orders`: Criar pedido
- GET `/api/orders`: Listar todos os pedidos
- GET `/api/orders/:id`: Buscar pedido
- PUT `/api/orders/:id/status`: Atualizar status do pedido
- PUT `/api/orders/:id/laboratory`: Atualizar laboratório do pedido

### Schema

```typescript
{
  _id: string;
  clientId: string;
  employeeId: string;
  productType: "glasses" | "lensCleaner";
  products: string;
  glassType: "prescription" | "sunglasses";
  glassFrame: "with" | "no";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string;
  lensType?: string;
  prescriptionData?: {
    doctorName: string;
    clinicName: string;
    appointmentdate: Date;
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    nd: number;
    addition: number;
  };
  totalPrice: number;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🔬 Laboratórios

### Rotas

- POST `/api/laboratories`: Criar laboratório
- GET `/api/laboratories`: Listar todos os laboratórios
- GET `/api/laboratories/:id`: Buscar laboratório
- PUT `/api/laboratories/:id`: Atualizar laboratório
- DELETE `/api/laboratories/:id`: Remover laboratório
- PATCH `/api/laboratories/:id/toggle-status` : Atualizar status do laboratório

### Schema

```typescript
{
  _id: string;
  name: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  contactName: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 💰 Pagamentos

### Features

- Registro de diferentes tipos de pagamentos (vendas, recebimentos, despesas)
- Suporte a múltiplos métodos de pagamento
- Controle de parcelamentos
- Relatórios financeiros personalizados
- Exportação em múltiplos formatos (Excel, PDF, CSV, JSON)
- Cancelamento com estorno automático
- Cache para consultas frequentes
- Transações atômicas para garantir integridade
- Soft delete para manter histórico completo
- Validações robustas e modulares

### Rotas

- POST `/api/payments`: Criar pagamento
- GET `/api/payments`: Listar todos os pagamentos
- GET `/api/payments/daily`: Buscar pagamentos do dia
- GET `/api/payments/:id`: Buscar pagamento
- POST `/api/payments/:id/cancel`: Cancelar pagamento
- POST `/api/payments/:id/delete`: Exclusão lógica (soft delete) de pagamento
- GET `/api/payments/deleted`: Listar pagamentos excluídos logicamente
- GET `/api/payments/export`: Exportar pagamentos em vários formatos
- GET `/api/payments/report/daily`: Gerar relatório financeiro diário

### Schema

```typescript
{
  _id: string;
  amount: number;
  date: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "installment";
  installments?: {
    current: number;
    total: number;
    value: number;
  };
  status: "pending" | "completed" | "cancelled";
  orderId?: string;
  customerId?: string;
  employeeId?: string;
  legacyClientId?: string;
  cashRegisterId: string;
  description?: string;
  createdBy: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 💵 Cash Register

### Features

- Controle de abertura e fechamento de caixa
- Balanço detalhado por tipo de pagamento
- Relatórios diários e por caixa específico
- Exportação em múltiplos formatos (Excel, PDF, CSV, JSON)
- Cache para consultas frequentes
- Validações robustas e modulares
- Soft delete para manter histórico completo
- Resumos financeiros detalhados

### Rotas

- POST `/api/cash-registers/open`: Abrir o registro de caixa atual
- POST `/api/cash-registers/close`: Fechar o registro de caixa atual
- GET `/api/cash-registers/current`: Buscar o registro de caixa atual
- GET `/api/cash-registers/summary/daily`: Resumo diário dos registros de caixa
- GET `/api/cash-registers/:id`: Buscar um registro de caixa específico
- GET `/api/cash-registers/:id/summary`: Resumo de um registro de caixa específico
- POST `/api/cash-registers/:id/delete`: Exclusão lógica de um registro
- GET `/api/cash-registers/deleted`: Listar registros excluídos logicamente
- GET `/api/cash-registers/:id/export`: Exportar resumo de um caixa específico
- GET `/api/cash-registers/export/daily`: Exportar resumo diário dos caixas

### Schema

```typescript
{
  _id: string;
  openingDate: Date;
  closingDate?: Date;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  sales: {
    total: number;
    cash: number;
    credit: number;
    debit: number;
    pix: number;
  };
  payments: {
    received: number;
    made: number;
  };
  openedBy: string;
  closedBy?: string;
  observations?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 🚫 Legacy Client

### Rotas

- POST `/api/legacy-clients`: Cadastrar cliente legado
- GET `/api/legacy-clients`: Listar todos os cliente legados
- GET `/api/legacy-clients/search`: Buscar cliente legado pelo documento
- GET `/api/legacy-clients/debtors`: Listar os clientes com dívidas
- GET `/api/legacy-clients/:id`: Buscar um cliente legado pelo id
- PUT `/api/legacy-clients/:id`: Atualizar um cliente legado
- GET `/api/legacy-clients/:id/payment-history`: Buscar o histórico de pagmendo de um cliente legado
- PATCH `/api/legacy-clients/:id/toggle-status`: Alterar o status de um cliente legado

### Schema

```typescript
{
  _id: string;
  name: string;
  identifier: string; // CPF/CNPJ
  phone?: string;
  address?: string;
  totalDebt: number;
  lastPayment?: {
    date: Date;
    amount: number;
  };
  paymentHistory: Array<{
    date: Date;
    amount: number;
    paymentId: string;
  }>;
  status: "active" | "inactive";
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 📊 Relatórios

### Rotas

- POST `/api/reports`: Criar novo relatório
- GET `/api/reports`: Listar relatórios do usuário
- GET `/api/reports/:id`: Buscar relatório específico

### Schema

```typescript
{
  _id: string;
  name: string;
  type: "sales" | "inventory" | "customers" | "orders" | "financial";
  filters: {
    startDate?: Date;
    endDate?: Date;
    status?: string[];
    paymentMethod?: string[];
    productCategory?: string[];
    minValue?: number;
    maxValue?: number;
  };
  data: any;
  createdBy: string;
  format: "json" | "pdf" | "excel";
  status: "pending" | "processing" | "completed" | "error";
  errorMessage?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 👓 Tipos de Lente

### Rotas

- POST `/api/lens-type`: Criar tipo de lente
- GET `/api/lens-type`: Listar todos os tipos de lente
- GET `/api/lens-type/:id`: Buscar tipo de lente
- PUT `/api/lens-type/:id`: Atualizar tipo de lente
- DELETE `/api/lens-type/:id`: Remover tipo de lente

### Schema

```typescript
{
  _id: string;
  name: string;
  description: string;
  brand: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## 🛠️ Setup

### Pré-requisitos

- Node.js (v18 ou superior)
- MongoDB
- Docker (opcional)

### Instalação

```bash
# Clone o repositório
git clone https://github.com/matheusqueiroz92/oticas-queiroz-monorepo.git

# Entre na pasta
cd oticas-queiroz-monorepo

# Instale as dependências
npm install
```

### Variáveis de Ambiente

```bash
# Adicione o arquivo (.env) na pasta raiz do backend para as variáveis de ambiente
PORT=porta_de_conexao_utilizada
MONGODB_URI=uri_de_conexao_com_mongoDB
JWT_SECRET=sua_senha_jwt
```

### Desenvolvimento

```bash
# Roda todos os apps
npx turbo run dev

# Roda apenas o backend
cd apps/backend
npm run dev

# Roda apenas o frontend
cd apps/frontend
npm run dev
```

## 📱 Recursos Frontend Implementados

### Autenticação

- Login com diferentes tipos de usuário
- Proteção de rotas baseado em perfis
- Gerenciamento de sessão com cookies

### Dashboard

- Visão geral personalizada para cada tipo de usuário
- Exibição de métricas relevantes por perfil
- Acesso rápido às principais funcionalidades

### Gestão de Usuários

- Cadastro, edição e visualização de funcionários
- Cadastro, edição e visualização de clientes
- Perfil de usuário com informações detalhadas

### Gestão de Produtos

- Cadastro, edição e visualização de produtos
- Listagem com filtros e paginação
- Detalhes com características e estoque

### Gestão de Laboratórios

- Cadastro, edição e visualização de laboratórios
- Ativação/desativação de laboratórios
- Associação de laboratórios a pedidos

### Gestão de Pedidos

- Fluxo completo de criação de pedidos
- Associação com laboratórios
- Atualização de status independente
- Informações específicas para óculos de grau
- Suporte a dados de prescrição médica

### Exportação de dados

- Exportação de pedidos em PDF
- Exportação de relatórios financeiros em múltiplos formatos
- Visualização de detalhes completos

### Estrutura de Componentes

- **Formulários**

  - Validação com Zod
  - Feedback visual de erros
  - Campos dinâmicos baseados em contexto

- **Tabelas**

  - Exibição de dados com paginação
  - Ações contextuais por tipo de registro
  - Estados vazios informativos

- **Modais e Diálogos**

  - Confirmação de ações importantes
  - Formulários de edição rápida

- **Tratamento de Erros**

  - Feedback visual para o usuário
  - Estados vazios para listas sem dados
  - Manipulação robusta de erros da API

### Padrões de Interface

- Design system consistente com Shadcn UI
- Responsividade para diferentes tamanhos de tela
- Feedback visual para operações assíncronas
- Temas claros e escuros (suporte parcial)

### Testes Implementados

- ✅ Testes unitários para Models

  - User Model
  - Product Model
  - Order Model
  - Laboratory Model
  - Payment Model
  - Register Cash Model
  - Legacy Client Model

- ✅ Testes unitários para Services

  - Auth Service
  - User Service
  - Product Service
  - Order Service
  - Laboratory Service
  - Payment Service
  - Register Cash Service
  - Legacy Client Service

- ✅ Testes de integração para Controllers

  - Auth Controller
  - User Controller
  - Product Controller
  - Order Controller
  - Laboratory Controller
  - Payment Controller
  - Register Cash Controller
  - Legacy Client Controller

- Ferramentas e práticas
  - Jest para execução dos testes
  - Supertest para testes de API
  - MongoDB Memory Server para banco de dados em memória
  - Mocks e stubs para isolamento de testes
  - Testes para fluxos de sucesso e erro

```bash
# Roda os testes do backend
cd apps/backend
npm test # roda todos os testes
npm run test:auth-user # roda os testes de autenticação e de usuário
npm run test:product # roda os testes de produto
npm run test:order # roda os testes de pedido
npm run test:laboratory # roda os testes de laboratório
npm run test:payment # roda os testes de pagamento
npm run test:cash-register # roda os testes de registro de caixa
npm run test:legacy-client # roda os testes de clientes legados
npm run coverage # verifica a cobertura dos testes
```

### Testes do Frontend

```bash
# Roda apenas os testes do frontend
cd apps/frontend
npm test
```

## ✨ Melhorias Recentes

### Módulos de Pagamentos e Caixa

- ✅ **Validação Modular**: Refatoração da validação em funções específicas para melhorar manutenção e testabilidade.
- ✅ **Soft Delete**: Implementação de exclusão lógica para manter histórico completo de todas as operações.
- ✅ **Cache Eficiente**: Adição de caching para consultas frequentes, melhorando performance do sistema.
- ✅ **Swagger Aprimorado**: Documentação detalhada das APIs para facilitar integração com frontend.
- ✅ **Exportação Flexível**: Suporte a exportação para Excel, PDF, CSV e JSON para relatórios financeiros.
- ✅ **Relatórios Avançados**: Adição de relatórios personalizados para análise financeira detalhada.
- ✅ **Correção de Bugs**: Resolução de inconsistências e bugs em ambos os módulos.

## 🔄 Melhorias Sugeridas

### Performance

- [ ] Implementar Redis para cache distribuído
  - Cache de produtos mais acessados
  - Cache de resultados de queries frequentes
  - Cache de sessões de usuário

### Segurança

- [ ] Implementar rate limiting
- [ ] Adicionar helmet para headers de segurança
- [ ] Melhorar validação de senhas
- [ ] Configurar CORS por ambiente
- [ ] Implementar refresh tokens

### Monitoramento e Logs

- [ ] Implementar Winston para logs estruturados
- [ ] Adicionar Sentry para monitoramento de erros
- [ ] Criar middleware de log para requisições
- [ ] Implementar métricas de performance

### Otimizações de Banco

- [ ] Implementar paginação com cursor
- [ ] Adicionar índices compostos
- [ ] Otimizar queries de agregação
- [ ] Implementar soft delete para outras entidades

### Testes

- [ ] Adicionar testes de carga com k6
- [ ] Implementar testes E2E
- [ ] Aumentar cobertura de testes
- [ ] Adicionar testes de regressão

### Documentação

- [ ] Melhorar documentação Swagger para todas as APIs
- [ ] Adicionar exemplos de uso
- [ ] Documentar erros possíveis
- [ ] Criar guia de contribuição

## 📈 Próximos Passos

- [ ] Gestão de fornecedores

  - [ ] Cadastro
  - [ ] Catálogo
  - [ ] Pedidos

- [ ] Sistema de pagamentos

  - [ ] Integração com gateway
  - [ ] Parcelamentos e boletos
  - [ ] Emissão de NF
  - [ ] Geração de QR Code para Pix

- [ ] Dashboard

  - [ ] Métricas de vendas
  - [ ] Controle de estoque
  - [ ] Relatórios avançados

- [ ] Melhorias técnicas

  - [ ] Implementação de Cache

    - [ ] Configuração do Redis
    - [ ] Cache de produtos
    - [ ] Cache de autenticação

  - [ ] Sistema de Logs e Monitoramento

    - [ ] Implementação do Winston
    - [ ] Configuração do Sentry
    - [ ] Dashboard de monitoramento

  - [ ] Melhorias de Performance

    - [ ] Otimização de queries
    - [ ] Implementação de índices
    - [ ] Compressão de respostas

  - [ ] CI/CD
  - [ ] Monitoramento
  - [ ] Logs
  - [ ] Cache

  - [ ] Relatórios interativos
  - [ ] Integração com impressoras para receitas
  - [ ] Sistema de notificações
  - [ ] Modo offline para operação sem internet
  - [ ] Testes de integração da interface

## 📝 Licença

Este projeto está sob a licença MIT.

## 📚 Documentação da API

A documentação da API está disponível no Swagger UI: http://localhost:3333/api-docs.

## 🤖 Docker, Kubernetes e CI/CD

🐳 Para rodar o projeto com Docker:

```bash
docker-compose up --build
```

- Kubernetes (opcional)
  Os arquivos de configuração do Kubernetes estão na pasta kubernetes/.

- CI/CD
  O projeto utiliza GitHub Actions para CI/CD. O workflow está configurado em .github/workflows/ci.yml.

---

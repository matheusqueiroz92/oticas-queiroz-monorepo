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
- Tailwind CSS
- Shadcn UI
- TypeScript
- Zod

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
│   ├── backend/      # API Node.js
│     ├── src/
│       ├── config/       # Configurações de conexão ao banco de dados e documentação da API
│       ├── controllers/  # Camada de controle HTTP
│       ├── interfaces/   # Definições de tipos
│       ├── middlewares/  # Definições dos middlewares
│       ├── models/       # Camada de acesso ao banco
│       ├── services/     # Camada de regras de negócio
│       ├── schemas/      # Schemas do Mongoose
│       ├── __tests__/    # Testes da aplicação
│       ├── types/        # Tipagens Express
│       └── utils/        # Arquivos auxiliares
│   ├── web/          # Next.js
│   ├── mobile/       # React Native
│   └── desktop/      # Electron
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

### Roles

- **Admin**: Acesso total ao sistema
- **Employee**: Gestão de clientes, produtos e pedidos
- **Customer**: Consulta de pedidos e débitos

### Rotas

- POST `/api/auth/login`

  ```typescript
  // Request
  {
    "login": string,    // email ou username
    "password": string
  }

  // Response 200
  {
    "token": string,
    "user": {
      "id": string,
      "name": string,
      "email": string,
      "role": "admin" | "employee" | "customer"
    }
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
  _id?: string;
  name: string;
  email: string;
  password: string;
  image: string;
  role: "admin" | "employee" | "customer";
  address?: string;
  phone?: string;
  prescription?: {
    leftEye: number;
    rightEye: number;
    addition?: number;
  };
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

### Schema

```typescript
{
  _id: string;
  clientId: string;
  employeeId: string;
  products: string[];
  description?: string;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate: Date;
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string;
  lensType: string;
  prescriptionData: {
    doctorName: string;
    clinicName: string;
    appointmentdate: Date;
    leftEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
    };
    rightEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      };
    };
  };
  totalPrice: number;
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
  _id?: string;
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

### Rotas

- POST `/api/payments`: Criar pagamento
- GET `/api/payments`: Listar todos os pagamentos
- GET `/api/payments/daily`: Buscar pagamentos do dia
- GET `/api/payments/:id`: Buscar pagamento
- POST `/api/payments/:id/cancel`: Cancelar pagamento

### Schema

```typescript

{
  _id?: string;
  amount: number;
  paymentDate: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix";
  installments?: number;
  status: "pending" | "completed" | "cancelled";
  orderId?: string;
  customerId?: string;
  employeeId?: string;
  legacyClientId?: string;
  cashRegisterId: string;
  description?: string;
  category?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

## 💵 Cash Register

### Rotas

- POST `/api/cash-registers/open`: Abrir o registro de caixa atual
- POST `/api/cash-registers/close`: Fechar o registro de caixa atual
- GET `/api/cash-registers/current`: Buscar o registro de caixa atual
- GET `/api/cash-registers/summary/daily`: Abrir o resumo diário dos registros de caixa
- GET `/api/cash-registers/:id`: Buscar um registro de caixa específico
- GET `/api/cash-registers/:id/summary`: Buscar o resumo de um registro de caixa específico

### Schema

```typescript
{
  _id?: string;
  date: Date;
  openingBalance: number;
  currentBalance: number;
  closingBalance?: number;
  status: "open" | "closed";
  openedBy: string;
  closedBy?: string;
  totalSales: number;
  totalPayments: number;
  observations?: string;
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
  _id?: string;
  name: string;
  identifier: string; // CPF/CNPJ
  phone?: string;
  address?: string;
  totalDebt: number;
  lastPaymentDate?: Date;
  status: "active" | "inactive";
  observations?: string;
  createdAt?: Date;
  updatedAt?: Date;
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

## 🔄 Melhorias Sugeridas

### Performance

- [ ] Implementar Redis para cache
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
- [ ] Implementar soft delete

### Testes

- [ ] Adicionar testes de carga com k6
- [ ] Implementar testes E2E
- [ ] Aumentar cobertura de testes
- [ ] Adicionar testes de regressão

### Documentação

- [ ] Melhorar documentação Swagger
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
  - [ ] Parcelamento
  - [ ] Emissão de NF

- [ ] Dashboard

  - [ ] Métricas de vendas
  - [ ] Controle de estoque
  - [ ] Relatórios

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

Novas Implementações

Sistema de Pagamentos

Gestão de pagamentos para clientes cadastrados e não cadastrados
Suporte a múltiplas formas de pagamento (crédito, débito, dinheiro, PIX)
Controle de parcelamento
Integração com caixa diário
Histórico de transações

👥 Clientes Legados

Sistema para gerenciar clientes antigos e seus débitos pendentes.

💵 Caixa Diário

Sistema para controle de fluxo de caixa diário.

Testes Implementados

✅ Testes de integração para Pagamentos

Criação de pagamentos
Atualização de status
Validações de regras de negócio

✅ Testes de integração para Clientes Legados

Cadastro de clientes
Atualização de débitos
Validações de identificador único

✅ Testes de integração para Caixa Diário

Abertura de caixa
Fechamento de caixa
Atualização de saldo
Validações de operações

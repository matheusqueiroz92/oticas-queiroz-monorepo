# Óticas Queiroz Monorepo

Este repositório contém um sistema de gerenciamento para ótica que integra controle de clientes, funcionários, produtos, pedidos, pagamentos, laboratório e fornecedores. Esta aplicação inclui backend, frontend, mobile e desktop, gerenciado com Turborepo.

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
- BCrypt para hash de senhas
- Zod para validação
- MongoDB Memory Server para testes

### Frontend

- Next.js
- Tailwind CSS
- Shadcn UI
- TypeScript

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
│   ├── frontend/     # Next.js
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

- POST `/api/users`: Criar usuário
- GET `/api/users`: Listar usuários
- GET `/api/users/:id`: Buscar usuário
- PUT `/api/users/:id`: Atualizar usuário
- DELETE `/api/users/:id`: Remover usuário

### Schema

```typescript
{
  name: string;
  email: string;
  password: string;
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
  createdAt: Date;
  updatedAt: Date;
}
```

## 📦 Produtos

### Rotas

- POST `/api/products`: Criar produto
- GET `/api/products`: Listar produtos
- GET `/api/products/:id`: Buscar produto
- PUT `/api/products/:id`: Atualizar produto
- DELETE `/api/products/:id`: Remover produto

### Schema

```typescript
{
  name: string;
  category: "solar" | "grau";
  description: string;
  brand: string;
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
- GET `/api/orders`: Listar pedidos
- GET `/api/orders/:id`: Buscar pedido
- PUT `/api/orders/:id/status`: Atualizar status

### Schema

```typescript
{
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

### Testes Implementados

- ✅ Testes unitários para Models

  - User Model
  - Product Model
  - Order Model

- ✅ Testes unitários para Services

  - User Service
  - Product Service
  - Order Service
  - Auth Service

- ✅ Testes de integração para Controllers

  - User Controller
  - Product Controller
  - Order Controller
  - Auth Controller

- Ferramentas e práticas
  - Jest para execução dos testes
  - Supertest para testes de API
  - MongoDB Memory Server para banco de dados em memória
  - Mocks e stubs para isolamento de testes
  - Testes para fluxos de sucesso e erro

```bash
# Roda os testes do backend
cd apps/backend
npm test
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

- [ ] Sistema de laboratório ótico

  - [ ] Cadastro de laboratórios
  - [ ] Gestão de pedidos
  - [ ] Acompanhamento de produção

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

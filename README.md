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
│       ├── tests/        # Testes da aplicação
│       ├── types/        # Tipagens Express
│       └── utils/        # Arquivos auxiliares
├── frontend/     # Next.js
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
  category: "prescription" | "sunglasses";
  description: string;
  brand: string;
  modelGlasses: string;
  price: number;
  stock: number;
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
  products: productId[];
  price: number;
  description?: string;
  employeeId: string;
  paymentMethod: string;
  paymentEntry?: string;
  installments?: number;
  deliveryDate: date;
  status: string;
  loboratoryId: string;
  lensType: string;
  prescriptionData: {
    doctorName: string;
    clinicName: string;
    appointmentdate: data;
    leftEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      },
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      }
    }
    rightEye: {
      near: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      },
      far: {
        sph: number;
        cyl: number;
        axis: number;
        pd: number;
      }
    }
  }
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

### Testes do Backend

```bash
# Roda apenas os testes do backend
cd apps/backend
npm test
```

#### 🔄 Estrutura de Testes do Backend

```bash
oticas-queiroz-monorepo/
├── apps/
│   ├── backend/
│     ├── src/
│       ├── tests/
│         ├── unit/
│            ├── models/       # Testes da camada Model
│            └── services/     # Testes da camada Service
│         └── integration/
│            └──controllers/   # Testes da camada Controller
```

### Testes do Frontend

```bash
# Roda apenas os testes do frontend
cd apps/frontend
npm test
```

#### 🔄 Estrutura de Testes do Frontend

```bash
oticas-queiroz-monorepo/
├── apps/
│   ├── frontend/
│     ├── src/
│       ├── tests/
│          └── unit/

```

### Tratamento de Erros

- Implementado tratamento consistente de erros em todas as camadas
- Validação de dados com tipagem forte
- Mensagens de erro claras e específicas

### URLs

- Backend: http://localhost:3333
- Swagger: http://localhost:3333/api-docs
- Frontend: http://localhost:3000

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

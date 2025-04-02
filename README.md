# Óticas Queiroz Monorepo

Este é um sistema completo de gestão para a Óticas Queiroz, desenvolvido para facilitar a organização e o planejamento da empresa. O sistema permite o gerenciamento detalhado de vendas, pagamentos, controle de caixa, gestão de usuários (funcionários e clientes), controle de produtos (lentes, armações de grau e solares) e laboratórios óticos, além de fornecer relatórios detalhados para análise estatística e tomada de decisões.

## 🧩 Principais Funcionalidades

### Autenticação e Gestão de Usuários
- **Perfis de Acesso**: Implementação de diferentes níveis de acesso:
  - Administradores: Acesso completo ao sistema;
  - Funcionários: Podem registrar vendas, gerenciar clientes e produtos;
  - Clientes: Acesso limitado aos seus pedidos e perfil;
- **Autenticação Segura**: Login com email ou CPF, protegido por JWT (JSON Web Tokens);
- **Recuperação de Senha**: Sistema de reset de senha via tokens enviados por email;
- **Gerenciamento de Perfil**: Upload de foto, atualização de dados pessoais e senha;
- **Validação de CPF**: Verificação automática da validade do CPF para evitar cadastros fraudulentos;
- **Controle de Sessão**: Verificação e renovação automática de tokens de autenticação.

### Gestão de Produtos
- **Categorização de Produtos**: Suporte a diferentes tipos de produtos óticos:
  - Lentes oftálmicas (lentes de grau);
  - Armações para óculos de grau;
  - Armações para óculos de sol;
  - Limpadores de lentes;
- **Controle de Estoque**: Registro de entradas e saídas com histórico completo
- **Gestão de Imagens**: Upload e gerenciamento de imagens para produtos
- **Configurações Específicas por Tipo**:
  - Lentes: Associação com tipos de lentes;
  - Armações: Registro de características como tipo de armação, cor, formato, referência;
  - Óculos de Sol: Detalhes específicos como modelo e características especiais;
- **Busca Avançada**: Filtros por tipo, marca, preço, cor e outros atributos;
- **Exportação de Catálogo**: Geração de relatórios detalhados de produtos.

### Gestão de Pedidos
- **Criação Intuitiva**: Interface amigável para registro de novos pedidos;
- **Seleção de Produtos**: Adição de múltiplos produtos em um mesmo pedido;
- **Dados de Prescrição**: Registro detalhado da receita médica:
  - Dados do médico e clínica;
  - Data da consulta;
  - Informações de dioptria para olho direito e esquerdo (SPH, CYL, AXIS, PD);
  - Valores de adição, ND e OC;
- **Gerenciamento de Status**:
  - Pendente: Pedido registrado, aguardando produção;
  - Em Produção: Enviado para laboratório;
  - Pronto: Produto finalizado, aguardando retirada;
  - Entregue: Produto entregue ao cliente;
  - Cancelado: Pedido cancelado;
- **Integração com Laboratórios**: Envio automático para laboratórios óticos parceiros;
- **Cálculos Financeiros**: Automatização de cálculos de total, desconto e valor final;
- **Histórico de Alterações**: Registro de todas as modificações em pedidos;
- **Exportação de Documentos**: Geração de ordens de serviço em múltiplos formatos;
- **Busca Avançada**: Filtros por cliente, status, data, laboratório e método de pagamento;
- **Exportação de Dados**: Geração de relatórios diários e customizados.

### Gestão de Pagamentos
- **Múltiplos Tipos de Transação**:
  - Venda: Pagamentos relacionados a pedidos;
  - Pagamento de Dívida: Para clientes com débitos pendentes;
  - Despesa: Registro de gastos da empresa;
- **Métodos de Pagamento Diversificados**:
  - Cartão de Crédito: Com suporte a parcelamento;
  - Cartão de Débito;
  - Dinheiro;
  - PIX;
  - Boleto Bancário: Com registro de código e banco;
  - Promissória: Com registro de número e controle;
- **Parcelamento Inteligente**: Cálculo automático de valores parcelados;
- **Gerenciamento de Dívidas**: Controle de débitos de clientes;
  - Geração automática de planos de pagamento;
  - Registro de datas de vencimento;
  - Histórico de pagamentos realizados;
- **Cancelamento e Estorno**: Processo seguro para cancelamento de pagamentos;
- **Exclusão Lógica**: Marcação de pagamentos excluídos sem remoção física do banco;
- **Relatórios Financeiros**: Exportação detalhada de transações;
- **Resumo por Período**: Visualização de pagamentos diários, mensais e customizados.

### Gestão de Registros de Caixa
- **Controle de Abertura e Fechamento**: Registro de início e fim de operações diárias;
- **Saldo Inicial e Final**: Registro de valores de abertura e conferência no fechamento;
- **Resumo de Operações**:
  - Total de vendas por método de pagamento;
  - Total de pagamentos recebidos;
  - Total de despesas realizadas;
- **Diferença de Caixa**: Cálculo automático de sobras ou faltas no fechamento;
- **Exportação de Movimentações**: Geração de relatórios em diferentes formatos;
- **Histórico Detalhado**: Registro de todas as operações realizadas no caixa;
- **Exclusão Lógica**: Mecanismo de segurança para operações canceladas;
- **Visualização por Período**: Resumos diários, mensais e customizados.

### Gestão de Laboratórios
- **Cadastro Completo**: Registro de laboratórios óticos parceiros;
- **Dados de Contato**: Informações detalhadas para comunicação;
- **Endereço Estruturado**: Registro completo de localização;
- **Controle de Status**: Ativação/desativação de laboratórios;
- **Associação com Pedidos**: Vinculação entre laboratórios e serviços;
- **Histórico de Envios**: Registro de pedidos enviados para cada laboratório;
- **Busca e Filtragem**: Localização rápida por nome, cidade ou status.

### Gestão de Clientes Legados
- **Cadastro de Clientes Antigos**: Registro de clientes com histórico anterior ao sistema;
- **Controle de Dívidas**: Gerenciamento de débitos pendentes;
- **Histórico de Pagamentos**: Registro de todas as transações realizadas;
- **Planos de Pagamento**: Criação de acordos de quitação parcelada;
- **Notificações**: Alertas sobre vencimentos e pagamentos;
- **Busca Avançada**: Filtros por nome, documento, valor de dívida;
- **Exportação de Dados**: Geração de relatórios personalizados;
- **Controle de Status**: Ativação/inativação de clientes.

### Geração de Relatórios
- **Relatórios de Vendas**: Análise detalhada de vendas por período;
- **Relatórios de Estoque**: Controle de produtos disponíveis e movimentações;
- **Relatórios de Clientes**: Análise de base de clientes e comportamento;
- **Relatórios de Pedidos**: Visualização de status, laboratórios e valores;
- **Relatórios Financeiros**: Análise completa de receitas e despesas;
- **Múltiplos Formatos**: Exportação em Excel, PDF, CSV e JSON;
- **Filtros Avançados**: Customização de relatórios por diversos parâmetros;
- **Agendamento**: Possibilidade de configurar geração periódica;
- **Visualização Gráfica**: Apresentação visual de dados relevantes.

### Controle de Estoque
- **Gestão de Inventário**: Controle preciso de produtos disponíveis;
- **Movimentação Automática**: Redução de estoque em vendas e reposição em cancelamentos;
- **Histórico de Alterações**: Registro detalhado de todas as movimentações;
- **Alertas de Estoque Baixo**: Notificações para produtos com quantidade crítica;
- **Registro de Motivos**: Documentação de razões para alterações no estoque;
- **Identificação de Responsáveis**: Registro de quem realizou cada operação;
- **Vinculação com Pedidos**: Associação entre movimentações e vendas;
- **Exportação de Dados**: Geração de relatórios de inventário.

## 🚀 Tecnologias utilizadas

### Backend
- **Node.js**: Ambiente de execução JavaScript do lado do servidor;
- **Express**: Framework web para criação de APIs;
- **TypeScript**: Superset tipado de JavaScript para maior segurança e produtividade;
- **MongoDB**: Banco de dados NoSQL para armazenamento flexível de dados;
- **Mongoose**: ODM (Object Document Mapper) para modelagem de dados;
- **JWT**: JSON Web Tokens para autenticação segura;
- **Bcrypt**: Biblioteca para hash seguro de senhas;
- **Multer**: Middleware para upload de arquivos;
- **Nodemailer**: Biblioteca para envio de emails;
- **Zod**: Sistema de validação de dados com tipagem;
- **Swagger**: Documentação interativa da API;
- **Jest**: Framework para testes automatizados;
- **ExcelJS/PDFKit**: Bibliotecas para geração de relatórios.

### Frontend (Web)
- **NextJS**: Framework para construção das páginas e interfaces;
- **TypeScript**: Tipagem estática para desenvolvimento seguro;
- **React Router**: Gerenciamento de rotas da aplicação
- **Axios**: Cliente HTTP para comunicação com a API;
- **React Query**: Gerenciamento de estado e cache de dados;
- **React Hook Form**: Biblioteca para gerenciamento de formulários;
- **Zod**: Validação de dados no frontend;
- **React-PDF/Excel.js**: Visualização e geração de documentos;
- **Tailwind CSS**: Framework CSS para estilização;
- **Recharts/D3.js**: Visualização gráfica de dados.

### Mobile

- React Native (Expo)

### Desktop

- Electron

### Infraestrutura
- **Turborepo**: Gerenciamento de monorepo para frontend e backend;
- **Git/GitHub**: Controle de versão e colaboração;
- **Docker**: Containerização para desenvolvimento e produção;
- **GitHub Actions/Jenkins**: CI/CD para integração e deploy contínuos;
- **Nginx**: Servidor web para produção;
- **PM2**: Gerenciador de processos para Node.js;
- **MongoDB Atlas/Self-hosted**: Opções de hospedagem do banco de dados;
- **Sentry**: Monitoramento de erros;
- **Hostinger VPS**: Servidor virtual para hospedagem;
- **AlmaLinux 8**: Sistema operacional do servidor;
- **Webmin**: Interface de administração do servidor.


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
│       ├── services/     # Camada das regras de negócio da aplicação
│       ├── schemas/      # Schemas do Mongoose
│       ├── __tests__/    # Testes da aplicação
│       ├── types/        # Tipagens Express
│       └── utils/        # Arquivo utilitários
│   ├── web/        # Next.js
│     ├── app/          # Rotas e páginas da aplicação
│       ├── (authenticated)/ # Rotas com páginas protegidas
│       ├── auth/            # Páginas para autenticação
│       ├── constants/       # Arquivos de constantes da aplicação
│       ├── debugger/        # Arquivos de diagnósticos
│       ├── services/        # Arquivos de Serviços e integrações
│       ├── types/           # Definições de tipos e interfaces
│       └── utils/           # Arquivo utilitários
│     ├── components/   # Componentes reutilizáveis
│       ├── ui/             # Componentes de UI básicos (Shadcn)
│       ├── forms/          # Componentes de formulários
│       ├── tables/         # Componentes de tabelas
│       └── exports/        # Componentes de exportação (PDF, etc)
│     ├── contexts/     # Contexts
│     ├── hooks/        # Hooks personalizados
│     ├── lib/          # Utilitários e funções auxiliares
│     ├── providers/    # Providers
│     ├── public/       # Arquivos públicos do frontend web
│     └── schemas/      # Arquivos de schemas
│   ├── mobile/     # React Native
│   ├── desktop/    # Electron
│   └── public/     # Arquivo públicos da aplicação
│     ├── images/       # Arquivos de imagem
│       ├── users/          # Imagens de usuários
│       └── products/       # Imagens de produtos
├── packages/
│   ├── config/       # Configurações (ESLint, TS, Tailwind)
│   ├── ui/           # Componentes UI (Shadcn UI)
│   └── shared/       # Código compartilhado
```

## 🛣️ API Endpoints

A API expõe diversos endpoints organizados por domínio:

### 🔒 Autenticação
- `POST /api/auth/login`: Autenticação de usuários
- `POST /api/auth/register`: Registro de novos usuários (requer autorização)
- `POST /api/auth/forgot-password`: Solicita redefinição de senha
- `POST /api/auth/reset-password`: Redefine senha com token
- `GET /api/auth/validate-token/:token`: Valida token de redefinição

### 👥 Usuários
- `GET /api/users`: Lista todos os usuários
- `GET /api/users/:id`: Obtém detalhes de um usuário
- `PUT /api/users/:id`: Atualiza dados de um usuário
- `DELETE /api/users/:id`: Remove um usuário
- `GET /api/users/profile`: Obtém perfil do usuário autenticado
- `PUT /api/users/profile`: Atualiza perfil do usuário autenticado
- `POST /api/users/change-password`: Altera senha do usuário autenticado

### 📦 Produtos e Estoque
- `POST /api/products`: Cria um novo produto
- `GET /api/products`: Lista produtos com filtros
- `GET /api/products/:id`: Obtém detalhes de um produto
- `PUT /api/products/:id`: Atualiza um produto
- `DELETE /api/products/:id`: Remove um produto
- `GET api/products/:id/stock-history`: Obtém histórico de estoque de um produto
- `PATCH api/products/:id/stock`: Atualiza o estoque de um produto

### 🛍️ Pedidos
- `POST /api/orders`: Cria um novo pedido
- `GET /api/orders`: Lista pedidos com filtros
- `GET /api/orders/:id`: Obtém detalhes de um pedido
- `PUT /api/orders/:id`: Atualiza um pedido
- `PUT /api/orders/:id/status`: Atualiza o status de um pedido
- `PUT /api/orders/:id/laboratory`: Atualiza o laboratório de um pedido
- `GET /api/orders/client/:clientId`: Lista pedidos de um cliente
- `POST /api/orders/:id/cancel`: Cancela um pedido
- `POST /api/orders/:id/delete`: Exclusão lógica de um pedido
- `GET /api/orders/deleted`: Lista pedidos excluídos
- `GET /api/orders/daily`: Pedidos do dia atual
- `GET /api/orders/export`: Exporta pedidos filtrados
- `GET /api/orders/export/daily`: Exporta resumo diário
- `GET /api/orders/:id/export`: Exporta detalhes de um pedido

### 🔬 Laboratórios
- `POST /api/laboratories`: Cria um novo laboratório
- `GET /api/laboratories`: Lista laboratórios
- `GET /api/laboratories/:id`: Obtém detalhes de um laboratório
- `PUT /api/laboratories/:id`: Atualiza um laboratório
- `DELETE /api/laboratories/:id`: Remove um laboratório
- `PATCH /api/laboratories/:id/toggle-status`: Altera status ativo/inativo

### 💵 Pagamentos
- `POST /api/payments`: Cria um novo pagamento
- `GET /api/payments`: Lista pagamentos
- `GET /api/payments/:id`: Obtém detalhes de um pagamento
- `GET /api/payments/daily`: Pagamentos do dia
- `POST /api/payments/:id/cancel`: Cancela um pagamento
- `POST /api/payments/:id/delete`: Exclusão lógica de um pagamento
- `GET /api/payments/deleted`: Lista pagamentos excluídos
- `GET /api/payments/export`: Exporta pagamentos
- `GET /api/payments/report/daily`: Relatório financeiro diário

### 📊 Registros de Caixa
- `POST /api/cash-registers/open`: Abre um novo caixa
- `POST /api/cash-registers/close`: Fecha o caixa atual
- `GET /api/cash-registers`: Lista registros de caixa
- `GET /api/cash-registers/current`: Obtém o caixa atual
- `GET /api/cash-registers/:id`: Obtém um caixa específico
- `GET /api/cash-registers/:id/summary`: Resumo de um caixa
- `GET /api/cash-registers/summary/daily`: Resumo diário
- `POST /api/cash-registers/:id/delete`: Exclusão lógica de um caixa
- `GET /api/cash-registers/deleted`: Lista caixas excluídos
- `GET /api/cash-registers/:id/export`: Exporta resumo de um caixa
- `GET /api/cash-registers/export/daily`: Exporta resumo diário

### 🕰️ Clientes Legados
- `POST /api/legacy-clients`: Cria um novo cliente legado
- `GET /api/legacy-clients`: Lista clientes legados
- `GET /api/legacy-clients/:id`: Obtém detalhes de um cliente legado
- `PUT /api/legacy-clients/:id`: Atualiza um cliente legado
- `GET /api/legacy-clients/debtors`: Lista clientes com dívidas
- `GET /api/legacy-clients/:id/payment-history`: Histórico de pagamentos
- `PATCH /api/legacy-clients/:id/toggle-status`: Altera status ativo/inativo

### 📈 Relatórios
- `POST /api/reports`: Cria um novo relatório
- `GET /api/reports`: Lista relatórios do usuário
- `GET /api/reports/:id`: Obtém detalhes de um relatório
- `GET /api/reports/:id/download`: Faz download de um relatório

## 📐 Schemas da Aplicação

Schemas do Typescript de cada entidade da aplicação

### Schema de Usuário

```typescript
{
  _id: string;
  name: string;
  email?: string;
  password: string;
  role: "admin" | "employee" | "customer";
  image?: string;
  address?: string;
  phone?: string;
  cpf: string;
  rg?: string;
  birthDate?: Date;
  sales?: string[]; // apenas para funcionários
  purchases?: string[]; // apenas para clientes
  debts?: number; // apenas para clientes
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}
```

### Schema de Produto

```typescript
{
  _id: string;
  name: string;
  productType: "lenses" | "clean_lenses" | "prescription_frame" | "sunglasses_frame";
  image?: string;
  sellPrice: number;
  description?: string;
  brand?: string;
  costPrice?: number;
  stock: number;
  
  // Campos específicos baseados em productType
  
  // Para lentes (lenses):
  lensType?: string;
  
  // Para armações (prescription_frame e sunglasses_frame):
  typeFrame?: string;
  color?: string;
  shape?: string;
  reference?: string;
  
  // Apenas para armações solares:
  modelSunglasses?: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

### Schema de Pedido

```typescript
{
  _id?: string;
  clientId: string;
  employeeId: string;
  products: Product[]; // Array de produtos
  serviceOrder?: string;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: string | null;
  prescriptionData?: { // Dados da prescrição dos óculos
    doctorName: string;
    clinicName: string;
    appointmentDate: Date;
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
      pd: number;
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
      pd: number;
    };
    nd: number;
    oc: number;
    addition: number;
  };
  observations?: string;
  totalPrice: number;
  discount: number;
  finalPrice: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Schema de Laboratório

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

### Schema de Pagamento

```typescript
{
  _id: string;
  createdBy: string;
  customerId?: string;
  legacyClientId?: string;
  orderId?: string;
  cashRegisterId: string;
  amount: number;
  date: Date;
  type: "sale" | "debt_payment" | "expense";
  paymentMethod: "credit" | "debit" | "cash" | "pix" | "installment" | "bank_slip" | "promissory_note";
  status: "pending" | "completed" | "cancelled";

  // Campos para cartão de crédito
  creditCardInstallments?: {
    current: number;
    total: number;
    value: number;
  };

  // Campos para boleto
  bank_slip?: {
    code: string;
    bank: string;
  };

  // Campos para débito ao cliente
  clientDebt?: {
    generateDebt: boolean;
    installments?: {
      total: number;
      value: number;
    };
    dueDates?: Date[];
  };

  description?: string;
  isDeleted?: boolean;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
```

### Schema de Registro de Caixa

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

### Schema de Cliente Legado

```typescript
{
  _id: string;
  name: string;
  cpf: string;
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

### Schema de Relatório

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






## 🛠️ Setup

### Pré-requisitos

- Node.js (v18+)
- NPM ou Yarn
- MongoDB (v4.4+)
- Git

### Passos para Instalação

1. Clone o repositório do GitHub:
```bash
git clone https://github.com/matheusqueiroz92/oticas-queiroz-monorepo.git
```

2. Entre na pasta do projeto
```bash
cd oticas-queiroz-monorepo
```

3. Instale as dependências:
```bash
npm install
```

4. Entre na pasta do backend e instale as dependências
```bash
cd apps/backend
npm install
```

5. Entre na pasta do frontend (web) e instale as dependências
```bash
cd apps/web
npm install
```

6. Configure as variáveis de ambiente:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

### Configuração das Variáveis de Ambiente

1. Adicione o arquivo (.env) na pasta raiz do backend para as variáveis de ambiente da API

```bash
PORT=3333 # porta de conexão utilizada
MONGODB_URI=uri_de_conexao_com_mongoDB # string de conexão com o MongoDB
JWT_SECRET=sua_senha_jwt # senha JWT
NODE_ENV=development_ou_production # ambiente node
JWT_EXPIRES_IN=24h # tempo de expiração do token JWT
CORS_ORIGIN=https://localhost:3000 # URL de origem da conexão com o frontend
API_URL=https://localhost:3333 # URL da API

# dados de login mongoDB
USERNAME=usuario_mongodb
PASSWORD=senha_mongodb

# Node Mailer
EMAIL_HOST=serviço_de_e-mail
EMAIL_PORT=porta_de_conexão_utilizada
EMAIL_SECURE=true_ou_false
EMAIL_USER=e-mail_do_usuario
EMAIL_PASSWORD=senha_do_usuario
```

2. Adicione o arquivo (.env) na pasta raiz do frontend (web) para as variáveis de ambiente do Next

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333 # URL da API
```

### Iniciando Servidor em Desenvolvimento

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

### Acessando a aplicação:

- Frontend: http://localhost:3000
- API: http://localhost:3333
- Documentação API: http://localhost:3333/api-docs


### Deploy em Produção

1. Construa os artefatos para produção:
```bash
npm run build
```

2. Configure o servidor Nginx para servir a aplicação:
```nginx
server {
    listen 80;
    server_name dominio_da_aplicacao;

    location / {
        root /path/to/build/web;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3333;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Configure o PM2 para gerenciar o processo Node.js:
```bash
npm install -g pm2
pm2 start apps/backend/dist/server.js --name oticas-queiroz-backend
pm2 start apps/web/dist/ --name oticas-queiroz-frontend
pm2 save
```

4. Execute o script
```bash
./deploy.sh
```

## Testes Implementados

### Testes do Backend

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

## 🤖 Docker, Kubernetes e CI/CD

🐳 Para rodar o projeto com Docker:

```bash
docker-compose up --build
```

- Kubernetes (opcional)
  Os arquivos de configuração do Kubernetes estão na pasta kubernetes/.

- CI/CD
  O projeto utiliza GitHub Actions para CI/CD. O workflow está configurado em .github/workflows/ci.yml.

## 📚 Documentação da API

A documentação da API está disponível no Swagger UI: https://app.oticasqueiroz.com.br/api-docs.


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
- [ ] Implementar testes no frontend
- [ ] Implementar testes E2E
- [ ] Aumentar cobertura de testes
- [ ] Adicionar testes de regressão

### Documentação

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

  - [ ] Atualização da interface do usuário para melhor visualização e gestão de pedidos com múltiplos produtos
  - [ ] Dashboard com análises específicas por tipo de produto
  - [ ] Funcionalidades avançadas de gestão de estoque para diferentes tipos de produtos

## 📝 Licença

Este software é propriedade da Óticas Queiroz e seu uso é restrito aos termos estabelecidos no contrato.

## Autor

- Matheus Queiroz

---

&copy; 2025 Óticas Queiroz. Todos os direitos reservados.
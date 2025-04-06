# 🕶️ Óticas Queiroz Monorepo  
![Status](https://img.shields.io/badge/Status-Em_Desenvolvimento-yellow) ![Licença](https://img.shields.io/badge/Licença-Proprietária-red)

Sistema completo de gestão para Óticas Queiroz, desenvolvido para otimizar processos de vendas, controle de estoque, gestão financeira e atendimento ao cliente.

## 🧩 Principais Funcionalidades do sistema

### 🔐 Autenticação e Gestão de Usuários
- 👮‍♂️ **Perfis de Acesso**: Implementação de diferentes níveis de acesso:
  - Administradores: Acesso completo ao sistema;
  - Funcionários: Podem registrar vendas, gerenciar clientes e produtos;
  - Clientes: Acesso limitado aos seus pedidos e perfil;
- 🔑 **Autenticação Segura**: Login com email ou CPF, protegido por JWT (JSON Web Tokens);
- 🔄 **Recuperação de Senha**: Sistema de reset de senha via tokens enviados por email;
- **Gerenciamento de Perfil**: Upload de foto, atualização de dados pessoais e senha;
- ✅ **Validação de CPF**: Verificação automática da validade do CPF para evitar cadastros fraudulentos;
- 📊 **Controle de Sessão**: Verificação e renovação automática de tokens de autenticação.

### 📦 Gestão de Produtos
- 🗂️ **Categorização de Produtos**: Suporte a diferentes tipos de produtos óticos:
  - Lentes oftálmicas (lentes de grau);
  - Armações para óculos de grau;
  - Armações para óculos de sol;
  - Limpadores de lentes;
- 📊 **Controle de Estoque**: Registro de entradas e saídas com histórico completo
- 🖼️ **Gestão de Imagens**: Upload e gerenciamento de imagens para produtos
- ⚙️ **Configurações Específicas por Tipo**:
  - Lentes: Associação com tipos de lentes;
  - Armações: Registro de características como tipo de armação, cor, formato, referência;
  - Óculos de Sol: Detalhes específicos como modelo e características especiais;
- 🔍 **Busca Avançada**: Filtros por tipo, marca, preço, cor e outros atributos;
- 📤 **Exportação de Catálogo**: Geração de relatórios detalhados de produtos.

### 🛍️ Gestão de Pedidos
- ✨ **Criação Intuitiva**: Interface amigável para registro de novos pedidos;
- 📝 **Seleção de Produtos**: Adição de múltiplos produtos em um mesmo pedido;
- 📅 **Dados de Prescrição**: Registro detalhado da receita médica:
  - Dados do médico e clínica;
  - Data da consulta;
  - Informações de dioptria para olho direito e esquerdo (Esf., Cil., Eixo, D.P.);
  - Valores de Adição, D.N.P e C.O.;
- 🔄 **Gerenciamento de Status**:
  - Pendente: Pedido registrado, aguardando produção;
  - Em Produção: Enviado para laboratório;
  - Pronto: Produto finalizado, aguardando retirada;
  - Entregue: Produto entregue ao cliente;
  - Cancelado: Pedido cancelado;
- 🔗 **Integração com Laboratórios**: Envio automático para laboratórios óticos parceiros;
- 🧮 **Cálculos Financeiros**: Automatização de cálculos de total, desconto e valor final;
- 📜 **Histórico de Alterações**: Registro de todas as modificações em pedidos;
- 📄 **Exportação de Documentos**: Geração de ordens de serviço em múltiplos formatos;
- 🔎 **Busca Avançada**: Filtros por cliente, vendedor, status, data, laboratório e método de pagamento;
- 📊 **Exportação de Dados**: Geração de relatórios diários e customizados.

### 💵 Gestão de Pagamentos
- 🔄 **Múltiplos Tipos de Transação**:
  - Venda: Pagamentos relacionados a pedidos;
  - Pagamento de Dívida: Para clientes com débitos pendentes;
  - Despesa: Registro de gastos da empresa;
- 💳 **Métodos de Pagamento Diversificados**:
  - Cartão de Crédito: Com suporte a parcelamento;
  - Cartão de Débito;
  - Dinheiro;
  - PIX;
  - Boleto Bancário: Com registro de código e banco;
  - Promissória: Com registro de número e controle;
- 🧩 **Parcelamento Inteligente**: Cálculo automático de valores parcelados;
- 📉 **Gerenciamento de Dívidas**: Controle de débitos de clientes;
  - Geração automática de planos de pagamento;
  - Registro de datas de vencimento;
  - Histórico de pagamentos realizados;
- ❌ **Cancelamento e Estorno**: Processo seguro para cancelamento de pagamentos;
- 🗑️ **Exclusão Lógica**: Marcação de pagamentos excluídos sem remoção física do banco;
- 📈 **Relatórios Financeiros**: Exportação detalhada de transações;
- 📅 **Resumo por Período**: Visualização de pagamentos diários, mensais e customizados.

### 📊 Gestão de Registros de Caixa
- 🔓 **Controle de Abertura e Fechamento**: Registro de início e fim de operações diárias do caixa da empresa;
- 💰 **Saldo Inicial e Final**: Registro de valores de abertura e conferência no fechamento;
- 📝 **Resumo de Operações**:
  - Total de vendas por método de pagamento;
  - Total de pagamentos recebidos;
  - Total de despesas realizadas;
- ⚖️ **Diferença de Caixa**: Cálculo automático de sobras ou faltas no fechamento;
- 📤 **Exportação de Movimentações**: Geração de relatórios em diferentes formatos;
- 📜 **Histórico Detalhado**: Registro de todas as operações realizadas no caixa;
- 🗑️ **Exclusão Lógica**: Mecanismo de segurança para operações canceladas;
- 📅 **Visualização por Período**: Resumos diários, mensais e customizados.

### 🔬 Gestão de Laboratórios
- 📝 **Cadastro Completo**: Registro de laboratórios óticos parceiros;
- 📞 **Dados de Contato**: Informações detalhadas para comunicação;
- 📌 **Endereço Estruturado**: Registro completo de localização;
- 🔄 **Controle de Status**: Ativação/desativação de laboratórios;
- 🔗 **Associação com Pedidos**: Vinculação entre laboratórios e serviços;
- 📜 **Histórico de Envios**: Registro de pedidos enviados para cada laboratório;
- 🔍 **Busca e Filtragem**: Localização rápida por nome, cidade ou status.

### 🕰️ Gestão de Clientes Legados
- 📝 **Cadastro de Clientes Antigos**: Registro de clientes com histórico anterior ao sistema;
- 💸 **Controle de Dívidas**: Gerenciamento de débitos pendentes;
- 📜 **Histórico de Pagamentos**: Registro de todas as transações realizadas;
- 📅 **Planos de Pagamento**: Criação de acordos de quitação parcelada;
- 🔔 **Notificações**: Alertas sobre vencimentos e pagamentos;
- 🔎 **Busca Avançada**: Filtros por nome, documento, valor de dívida;
- 📤 **Exportação de Dados**: Geração de relatórios personalizados;
- 🔄 **Controle de Status**: Ativação/inativação de clientes.

### 📊 Geração de Relatórios
- 🛒 **Relatórios de Vendas**: Análise detalhada de vendas por período;
- 📦 **Relatórios de Estoque**: Controle de produtos disponíveis e movimentações;
- 👥 **Relatórios de Clientes**: Análise de base de clientes e comportamento;
- 📝 **Relatórios de Pedidos**: Visualização de status, laboratórios e valores;
- 💰 **Relatórios Financeiros**: Análise completa de receitas e despesas;
- 📁 **Múltiplos Formatos**: Exportação em Excel, PDF, CSV e JSON;
- 🔍 **Filtros Avançados**: Customização de relatórios por diversos parâmetros;
- ⏰ **Agendamento**: Possibilidade de configurar geração periódica;
- 📊 **Visualização Gráfica**: Apresentação visual de dados relevantes.

### 📦 Controle de Estoque
- 📊 **Gestão de Inventário**: Controle preciso de produtos disponíveis;
- 🔄 **Movimentação Automática**: Redução de estoque em vendas e reposição em cancelamentos;
- 📜 **Histórico de Alterações**: Registro detalhado de todas as movimentações;
- ⚠️ **Alertas de Estoque Baixo**: Notificações para produtos com quantidade crítica;
- 📝 **Registro de Motivos**: Documentação de razões para alterações no estoque;
- 👤 **Identificação de Responsáveis**: Registro de quem realizou cada operação;
- 🔗 **Vinculação com Pedidos**: Associação entre movimentações e vendas;
- 📤 **Exportação de Dados**: Geração de relatórios de inventário.

## 🚀 Tecnologias utilizadas

### 🖥️ Backend
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)](https://mongoosejs.com/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Bcrypt](https://img.shields.io/badge/Bcrypt-525252?style=for-the-badge&logo=bcrypt&logoColor=white)](https://www.npmjs.com/package/bcrypt)
[![Multer](https://img.shields.io/badge/Multer-FF6C37?style=for-the-badge&logo=multer&logoColor=white)](https://www.npmjs.com/package/multer)
[![Nodemailer](https://img.shields.io/badge/Nodemailer-339933?style=for-the-badge&logo=nodemailer&logoColor=white)](https://nodemailer.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)
[![Jest](https://img.shields.io/badge/Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)](https://jestjs.io/)
[![ExcelJS](https://img.shields.io/badge/ExcelJS-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white)](https://exceljs.org/)
[![PDFKit](https://img.shields.io/badge/PDFKit-FF0000?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://pdfkit.org/)

### 🌐 Frontend (Web)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Axios](https://img.shields.io/badge/Axios-5A29E4?style=for-the-badge&logo=axios&logoColor=white)](https://axios-http.com/)
[![React Query](https://img.shields.io/badge/React_Query-FF4154?style=for-the-badge&logo=reactquery&logoColor=white)](https://tanstack.com/query)
[![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)](https://react-hook-form.com/)
[![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)](https://zod.dev/)
[![React PDF](https://img.shields.io/badge/React_PDF-FF0000?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://react-pdf.org/)
[![Excel.js](https://img.shields.io/badge/Excel.js-217346?style=for-the-badge&logo=microsoftexcel&logoColor=white)](https://www.npmjs.com/package/exceljs)
[![Recharts](https://img.shields.io/badge/Recharts-FF6384?style=for-the-badge&logo=recharts&logoColor=white)](https://recharts.org/)
[![D3.js](https://img.shields.io/badge/D3.js-F9A03C?style=for-the-badge&logo=d3dotjs&logoColor=white)](https://d3js.org/)

### Mobile (falta desenvolver)

- React Native

### Desktop (falta desenvolver)

- Electron

### 🛠️ Infraestrutura
[![Turborepo](https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)](https://git-scm.com/)
[![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/features/actions)
[![Jenkins](https://img.shields.io/badge/Jenkins-D24939?style=for-the-badge&logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![NGINX](https://img.shields.io/badge/NGINX-009639?style=for-the-badge&logo=nginx&logoColor=white)](https://www.nginx.com/)
[![PM2](https://img.shields.io/badge/PM2-2B037A?style=for-the-badge&logo=pm2&logoColor=white)](https://pm2.keymetrics.io/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Sentry](https://img.shields.io/badge/Sentry-362D59?style=for-the-badge&logo=sentry&logoColor=white)](https://sentry.io/)
[![Hostinger](https://img.shields.io/badge/Hostinger-2F6FDE?style=for-the-badge&logo=hostinger&logoColor=white)](https://www.hostinger.com/)
[![AlmaLinux](https://img.shields.io/badge/AlmaLinux-1F5F9F?style=for-the-badge&logo=almalinux&logoColor=white)](https://almalinux.org/)
[![Webmin](https://img.shields.io/badge/Webmin-7DA0D0?style=for-the-badge&logo=webmin&logoColor=white)](https://www.webmin.com/)

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

## 🏗️ Arquitetura do Backend

### Arquitetura da API (RESTful)

A API segue os princípios REST com:

- Recursos bem definidos (users, products, orders)
- Verbos HTTP semânticos (GET, POST, PUT, DELETE)
- Status codes apropriados (200, 201, 400, 404, 500)
- JSON como formato padrão para requests/responses
- Autenticação via JWT (Bearer tokens)

### Padrão MSC (Model-Service-Controller)

Organização em camadas para separação de responsabilidades:

1. Models (/models)
- Definem esquemas do MongoDB (Mongoose)
- Validações de dados com Zod

Exemplo:
```typescript
// UserModel.ts
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true },
  role: { type: String, enum: ['admin', 'employee', 'customer'] }
});
```

2. Services (/services)
- Contêm a lógica de negócios
- Isolam complexidade dos controllers
Exemplo:
```typescript
// UserCervice.ts
export class UserService {
  async createUser(userData: IUser) {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    return UserModel.create({ ...userData, password: hashedPassword });
  }
}
```

3. Controllers (/controllers)
- Gerenciam requests/responses HTTP
- Chamam services apropriados
Exemplo:
```typescript
// UserController.ts
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await UserService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

🔹 Fluxo de Requisição
```bash
sequenceDiagram
  Client->>+Controller: HTTP Request
  Controller->>+Service: Chama método
  Service->>+Model: Interage com DB
  Model-->>-Service: Retorna dados
  Service-->>-Controller: Retorna resultado
  Controller-->>-Client: HTTP Response
```

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
  // Array de produtos
  products: Product[];
  serviceOrder?: string;
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  orderDate: Date;
  deliveryDate?: Date;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  laboratoryId?: string | null;
  // Dados da prescrição dos óculos
  prescriptionData?: {
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

6. Crie os arquivos de configuração das variáveis de ambiente:
```bash
touch apps/backend/.env
touch apps/web/.env
```

### Configuração das Variáveis de Ambiente

1. Adicione o conteúdo ao arquivo (.env) na pasta raiz do backend para as variáveis de ambiente da API

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

2. Adicione o conteúdo ao arquivo (.env) na pasta raiz do frontend (web) para as variáveis de ambiente do Next.js

```bash
NEXT_PUBLIC_API_URL=http://localhost:3333 # URL da API
```

### Iniciando Servidor em Desenvolvimento

1. Entre na pasta raiz do projeto para executar o Turborepo

```bash
# Roda todos os apps
cd oticas-queiroz-monorepo
npx turbo run dev
```

2. Entre na pasta do backend para iniciar a API da aplicação

```bash
# Roda apenas o backend
cd apps/backend
npm run dev
```

3. Entre na pasta do frontend web para executar o Next.js

```bash
# Roda apenas o frontend
cd apps/web
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

- ✅ Testes de integração do Middlewares
  - Auth Middleware
  - Error Middleware

- 🛠️ Ferramentas e práticas utilizdas nos testes
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

### 🐳 Para rodar o projeto com Docker:

```bash
docker-compose up --build
```

### Kubernetes (opcional)
  Os arquivos de configuração do Kubernetes estão na pasta kubernetes/.

### CI/CD
  O projeto utiliza GitHub Actions para CI/CD. O workflow está configurado em .github/workflows/ci.yml.

## 📚 Documentação da API

A documentação da API está disponível no Swagger UI: https://app.oticasqueiroz.com.br/api-docs.

## 📈 Próximos Passos

- [ ] Gestão de fornecedores

  - [ ] Cadastro
  - [ ] Catálogo
  - [ ] Pedidos

- [ ] Sistema de pagamentos

  - [ ] Integração com gateway e sistema bancário
  - [ ] Parcelamentos e boletos
  - [ ] Emissão de NF
  - [ ] Geração de QR Code para Pix

- [ ] Sistema de Logs e Monitoramento

  - [ ] Implementação do Winston
  - [ ] Configuração do Sentry
  - [ ] Dashboard de monitoramento

- [ ] Sistema de notificações

  - [ ] Alerta de produtos com estoque baixo
  - [ ] Alerta para clientes com exame de vista vencido
  - [ ] Alerta para clientes com débitos vencidos

- [ ] Modo offline para operação sem internet

- [ ] Testes de integração da interface

- [ ] Desenvolvimento da parte Mobile do sistema

- [ ] Desenvolvimento da parte Desktop do sistema


## 📝 Licença

Este software é propriedade da Óticas Queiroz e seu uso é restrito aos termos estabelecidos no contrato.

## Autor

- Matheus Queiroz

---

&copy; 2025 Óticas Queiroz. Todos os direitos reservados.
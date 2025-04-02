# Sistema de Gestão para Óticas Queiroz

Este é um sistema completo de gestão para a Óticas Queiroz, desenvolvido para facilitar a organização e o planejamento da empresa. O sistema permite o gerenciamento detalhado de vendas, pagamentos, controle de caixa, gestão de usuários (funcionários e clientes), controle de produtos (lentes, armações de grau e solares) e laboratórios óticos, além de fornecer relatórios detalhados para tomada de decisões.

## Principais Funcionalidades

### Autenticação e Gestão de Usuários
- **Perfis de Acesso**: Implementação de diferentes níveis de acesso:
  - Administradores: Acesso completo ao sistema
  - Funcionários: Podem registrar vendas, gerenciar clientes e produtos
  - Clientes: Acesso limitado aos seus pedidos e perfil
- **Autenticação Segura**: Login com email ou CPF, protegido por JWT (JSON Web Tokens)
- **Recuperação de Senha**: Sistema de reset de senha via tokens enviados por email
- **Gerenciamento de Perfil**: Upload de foto, atualização de dados pessoais e senha
- **Validação de CPF**: Verificação automática da validade do CPF para evitar cadastros fraudulentos
- **Controle de Sessão**: Verificação e renovação automática de tokens de autenticação

### Gestão de Produtos
- **Categorização de Produtos**: Suporte a diferentes tipos de produtos óticos:
  - Lentes oftálmicas (lentes de grau)
  - Limpadores de lentes
  - Armações para óculos de grau
  - Armações para óculos de sol
- **Controle de Estoque**: Registro de entradas e saídas com histórico completo
- **Gestão de Imagens**: Upload e gerenciamento de imagens para produtos
- **Configurações Específicas por Tipo**:
  - Lentes: Associação com tipos de lentes (multifocal, bifocal, etc.)
  - Armações: Registro de características como tipo de armação, cor, formato, referência
  - Óculos de Sol: Detalhes específicos como modelo e características especiais
- **Busca Avançada**: Filtros por tipo, marca, preço, cor e outros atributos
- **Exportação de Catálogo**: Geração de relatórios detalhados de produtos

### Gestão de Tipos de Lentes
- **Cadastro de Tipos**: Registro de diferentes tipos de lentes (progressiva, bifocal, monofocal)
- **Marcas e Fornecedores**: Associação com fabricantes específicos
- **Características Técnicas**: Registro de especificações técnicas das lentes
- **Associação com Produtos**: Vinculação entre tipos de lentes e produtos específicos

### Gestão de Pedidos
- **Criação Intuitiva**: Interface amigável para registro de novos pedidos
- **Seleção de Produtos**: Adição de múltiplos produtos em um mesmo pedido
- **Dados de Prescrição**: Registro detalhado da receita médica:
  - Dados do médico e clínica
  - Data da consulta
  - Informações de dioptria para olho direito e esquerdo (SPH, CYL, AXIS, PD)
  - Valores de adição, ND e OC
- **Gerenciamento de Status**:
  - Pendente: Pedido registrado, aguardando produção
  - Em Produção: Enviado para laboratório
  - Pronto: Produto finalizado, aguardando retirada
  - Entregue: Produto entregue ao cliente
  - Cancelado: Pedido cancelado
- **Integração com Laboratórios**: Envio automático para laboratórios óticos parceiros
- **Cálculos Financeiros**: Automatização de cálculos de total, desconto e valor final
- **Histórico de Alterações**: Registro de todas as modificações em pedidos
- **Exportação de Documentos**: Geração de ordens de serviço em múltiplos formatos
- **Busca Avançada**: Filtros por cliente, status, data, laboratório e método de pagamento
- **Exportação de Dados**: Geração de relatórios diários e customizados

### Gestão de Pagamentos
- **Múltiplos Tipos de Transação**:
  - Venda: Pagamentos relacionados a pedidos
  - Pagamento de Dívida: Para clientes com débitos pendentes
  - Despesa: Registro de gastos da empresa
- **Métodos de Pagamento Diversificados**:
  - Cartão de Crédito: Com suporte a parcelamento
  - Cartão de Débito
  - Dinheiro
  - PIX
  - Boleto Bancário: Com registro de código e banco
  - Promissória: Com registro de número e controle
- **Parcelamento Inteligente**: Cálculo automático de valores parcelados
- **Gerenciamento de Dívidas**: Controle de débitos de clientes
  - Geração automática de planos de pagamento
  - Registro de datas de vencimento
  - Histórico de pagamentos realizados
- **Cancelamento e Estorno**: Processo seguro para cancelamento de pagamentos
- **Exclusão Lógica**: Marcação de pagamentos excluídos sem remoção física do banco
- **Relatórios Financeiros**: Exportação detalhada de transações
- **Resumo por Período**: Visualização de pagamentos diários, mensais e customizados

### Gestão de Caixa (Cash Register)
- **Controle de Abertura e Fechamento**: Registro de início e fim de operações diárias
- **Saldo Inicial e Final**: Registro de valores de abertura e conferência no fechamento
- **Resumo de Operações**:
  - Total de vendas por método de pagamento
  - Total de pagamentos recebidos
  - Total de despesas realizadas
- **Diferença de Caixa**: Cálculo automático de sobras ou faltas no fechamento
- **Exportação de Movimentações**: Geração de relatórios em diferentes formatos
- **Histórico Detalhado**: Registro de todas as operações realizadas no caixa
- **Exclusão Lógica**: Mecanismo de segurança para operações canceladas
- **Visualização por Período**: Resumos diários, mensais e customizados

### Gestão de Laboratórios
- **Cadastro Completo**: Registro de laboratórios óticos parceiros
- **Dados de Contato**: Informações detalhadas para comunicação
- **Endereço Estruturado**: Registro completo de localização
- **Controle de Status**: Ativação/desativação de laboratórios
- **Associação com Pedidos**: Vinculação entre laboratórios e serviços
- **Histórico de Envios**: Registro de pedidos enviados para cada laboratório
- **Busca e Filtragem**: Localização rápida por nome, cidade ou status

### Gestão de Clientes Legados
- **Cadastro de Clientes Antigos**: Registro de clientes com histórico anterior ao sistema
- **Controle de Dívidas**: Gerenciamento de débitos pendentes
- **Histórico de Pagamentos**: Registro de todas as transações realizadas
- **Planos de Pagamento**: Criação de acordos de quitação parcelada
- **Notificações**: Alertas sobre vencimentos e pagamentos
- **Busca Avançada**: Filtros por nome, documento, valor de dívida
- **Exportação de Dados**: Geração de relatórios personalizados
- **Controle de Status**: Ativação/inativação de clientes

### Geração de Relatórios
- **Relatórios de Vendas**: Análise detalhada de vendas por período
- **Relatórios de Estoque**: Controle de produtos disponíveis e movimentações
- **Relatórios de Clientes**: Análise de base de clientes e comportamento
- **Relatórios de Pedidos**: Visualização de status, laboratórios e valores
- **Relatórios Financeiros**: Análise completa de receitas e despesas
- **Múltiplos Formatos**: Exportação em Excel, PDF, CSV e JSON
- **Filtros Avançados**: Customização de relatórios por diversos parâmetros
- **Agendamento**: Possibilidade de configurar geração periódica
- **Visualização Gráfica**: Apresentação visual de dados relevantes

### Controle de Estoque
- **Gestão de Inventário**: Controle preciso de produtos disponíveis
- **Movimentação Automática**: Redução de estoque em vendas e reposição em cancelamentos
- **Histórico de Alterações**: Registro detalhado de todas as movimentações
- **Alertas de Estoque Baixo**: Notificações para produtos com quantidade crítica
- **Registro de Motivos**: Documentação de razões para alterações no estoque
- **Identificação de Responsáveis**: Registro de quem realizou cada operação
- **Vinculação com Pedidos**: Associação entre movimentações e vendas
- **Exportação de Dados**: Geração de relatórios de inventário

## Tecnologias Utilizadas

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
- **React**: Biblioteca para construção de interfaces;
- **NextJS**: Framework;
- **TypeScript**: Tipagem estática para desenvolvimento seguro;
- **React Router**: Gerenciamento de rotas da aplicação
- **Axios**: Cliente HTTP para comunicação com a API;
- **React Query**: Gerenciamento de estado e cache de dados;
- **React Hook Form**: Biblioteca para gerenciamento de formulários;
- **Zod**: Validação de dados no frontend;
- **React-PDF/Excel.js**: Visualização e geração de documentos;
- **Tailwind CSS**: Framework CSS para estilização;
- **Recharts/D3.js**: Visualização gráfica de dados;
- **Context API/Redux**: Gerenciamento de estado global.

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

## Estrutura do Projeto

O projeto segue uma arquitetura em camadas, garantindo separação de responsabilidades:

### Backend (API)
- **/src**
  - **/config**: Configurações de banco de dados, upload, email e documentação
  - **/controllers**: Recebem requisições HTTP e delegam para os services
  - **/interfaces**: Definições de tipos e interfaces TypeScript
  - **/middlewares**: Processamento intermediário (autenticação, erros, logs)
  - **/models**: Implementação da camada de acesso ao banco de dados
  - **/routes**: Definição dos endpoints da API
  - **/schemas**: Modelos de dados para o MongoDB
  - **/services**: Implementação da lógica de negócio
  - **/utils**: Funções utilitárias compartilhadas
  - **/validators**: Validação e sanitização de dados de entrada
  - **/scripts**: Utilitários para administração e manutenção

### Frontend (Web)
- **/src**
  - **/components**: Componentes React reutilizáveis
  - **/contexts**: Contextos para gerenciamento de estado
  - **/hooks**: Custom hooks para compartilhamento de lógica
  - **/pages**: Componentes de página para cada rota
  - **/services**: Integração com a API
  - **/utils**: Funções utilitárias compartilhadas
  - **/assets**: Recursos estáticos (imagens, ícones)
  - **/styles**: Estilos globais e temas
  - **/types**: Definições de tipos TypeScript

## API Endpoints

A API expõe diversos endpoints organizados por domínio:

### Autenticação
- `POST /api/auth/login`: Autenticação de usuários
- `POST /api/auth/register`: Registro de novos usuários (requer autorização)
- `POST /api/auth/forgot-password`: Solicita redefinição de senha
- `POST /api/auth/reset-password`: Redefine senha com token
- `GET /api/auth/validate-token/:token`: Valida token de redefinição

### Usuários
- `GET /api/users`: Lista todos os usuários
- `GET /api/users/:id`: Obtém detalhes de um usuário
- `PUT /api/users/:id`: Atualiza dados de um usuário
- `DELETE /api/users/:id`: Remove um usuário
- `GET /api/users/profile`: Obtém perfil do usuário autenticado
- `PUT /api/users/profile`: Atualiza perfil do usuário autenticado
- `POST /api/users/change-password`: Altera senha do usuário autenticado

### Produtos e Estoque
- `POST /api/products`: Cria um novo produto
- `GET /api/products`: Lista produtos com filtros
- `GET /api/products/:id`: Obtém detalhes de um produto
- `PUT /api/products/:id`: Atualiza um produto
- `DELETE /api/products/:id`: Remove um produto
- `GET api/products/:id/stock-history`: Obtém histórico de estoque de um produto
- `PATCH api/products/:id/stock`: Atualiza o estoque de um produto

### Tipos de Lentes
- `POST /api/lens-types`: Cria um novo tipo de lente
- `GET /api/lens-types`: Lista tipos de lentes
- `GET /api/lens-types/:id`: Obtém detalhes de um tipo de lente
- `PUT /api/lens-types/:id`: Atualiza um tipo de lente
- `DELETE /api/lens-types/:id`: Remove um tipo de lente

### Laboratórios
- `POST /api/laboratories`: Cria um novo laboratório
- `GET /api/laboratories`: Lista laboratórios
- `GET /api/laboratories/:id`: Obtém detalhes de um laboratório
- `PUT /api/laboratories/:id`: Atualiza um laboratório
- `DELETE /api/laboratories/:id`: Remove um laboratório
- `PATCH /api/laboratories/:id/toggle-status`: Altera status ativo/inativo

### Clientes Legados
- `POST /api/legacy-clients`: Cria um novo cliente legado
- `GET /api/legacy-clients`: Lista clientes legados
- `GET /api/legacy-clients/:id`: Obtém detalhes de um cliente legado
- `PUT /api/legacy-clients/:id`: Atualiza um cliente legado
- `GET /api/legacy-clients/debtors`: Lista clientes com dívidas
- `GET /api/legacy-clients/:id/payment-history`: Histórico de pagamentos
- `PATCH /api/legacy-clients/:id/toggle-status`: Altera status ativo/inativo

### Pedidos
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

### Pagamentos
- `POST /api/payments`: Cria um novo pagamento
- `GET /api/payments`: Lista pagamentos
- `GET /api/payments/:id`: Obtém detalhes de um pagamento
- `GET /api/payments/daily`: Pagamentos do dia
- `POST /api/payments/:id/cancel`: Cancela um pagamento
- `POST /api/payments/:id/delete`: Exclusão lógica de um pagamento
- `GET /api/payments/deleted`: Lista pagamentos excluídos
- `GET /api/payments/export`: Exporta pagamentos
- `GET /api/payments/report/daily`: Relatório financeiro diário

### Caixa (Cash Register)
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

### Relatórios
- `POST /api/reports`: Cria um novo relatório
- `GET /api/reports`: Lista relatórios do usuário
- `GET /api/reports/:id`: Obtém detalhes de um relatório
- `GET /api/reports/:id/download`: Faz download de um relatório

## Configuração e Instalação

### Pré-requisitos
- Node.js (v16+)
- NPM ou Yarn
- MongoDB (v4.4+)
- Git

### Passos para Instalação

1. Clone o repositório do GitHub:
```bash
git clone https://github.com/matheusqueiroz92/oticas-queiroz-monorepo.git
cd oticas-queiroz-monorepo
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
```

4. Edite os arquivos `.env` com suas configurações:
```
# Backend
PORT=3333
MONGODB_URI=mongodb://localhost:27017/oticas-queiroz
JWT_SECRET=seu_secret_key
JWT_EXPIRATION=8h
NODE_ENV=development

# Configurações de e-mail
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=seu_email@exemplo.com
EMAIL_PASSWORD=sua_senha
EMAIL_SECURE=false

# Frontend
VITE_API_URL=http://localhost:3333/api
```

5. Inicie o servidor de desenvolvimento:
```bash
# Para executar apenas o backend
npm run dev --workspace=backend

# Para executar apenas o frontend
npm run dev --workspace=web

# Para executar ambos
npm run dev
```

6. Acesse a aplicação:
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
    server_name app.oticasqueiroz.com.br;

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
pm2 start apps/backend/dist/server.js --name oticas-queiroz-api
pm2 save
```

## Licença

Este software é propriedade da Óticas Queiroz e seu uso é restrito aos termos estabelecidos no contrato.

## Autores

- Matheus Queiroz

## Suporte

Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

&copy; 2023-2025 Óticas Queiroz. Todos os direitos reservados.
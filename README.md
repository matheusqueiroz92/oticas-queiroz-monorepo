# Óticas Queiroz Monorepo

Este repositório contém o projeto completo da Óticas Queiroz, incluindo backend, frontend, mobile e desktop, gerenciado com Turborepo.

## 🚀 Tecnologias Utilizadas

- **Backend:** Node.js, Express, MongoDB, Mongoose, Swagger
- **Frontend:** Next.js, Tailwind CSS, Shadcn UI
- **Mobile:** React Native (Expo)
- **Desktop:** Electron
- **Ferramentas:** Turborepo, TypeScript, ESLint, Jest, Docker, Kubernetes

## 📂 Estrutura do Projeto

```bash
oticas-queiroz-monorepo/
├── apps/
│ ├── backend/ # API Node.js
│ ├── frontend/ # Next.js
│ ├── mobile/ # React Native (Expo)
│ └── desktop/ # Electron
├── packages/
│ ├── config/ # Configurações compartilhadas (ESLint, TS, Tailwind)
│ ├── ui/ # Componentes UI compartilhados (Shadcn UI)
│ └── shared/ # Código compartilhado (tipos, utilitários)
├── turbo.json # Configuração do Turborepo
├── package.json # Dependências globais
├── .gitignore
└── README.md
```

## 🛠️ Como Executar o Projeto

### Pré-requisitos

- Node.js (v18 ou superior)
- MongoDB
- Docker (opcional)

### Passos

1. Clone o repositório:

```bash
git clone https://github.com/matheusqueiroz92/oticas-queiroz-monorepo.git
cd oticas-queiroz-monorepo
```

2. Instale as dependências:

```bash
npm install
```

3. Configure as variáveis de ambiente:

- Crie um arquivo .env na raiz do backend e acrescente o conteúdo:

```bash
PORT=porta_utilizada
MONGODB_URI=uri_de_conexão_com_MongoDB
JWT_SECRET=sua_chave_JWT
```

4. Inicie todos os projetos em modo de desenvolvimento:

```bash
npx turbo run dev
```

5. Acesse as aplicações:

- Backend: http://localhost:3333
- Swagger UI: http://localhost:3333/api-docs
- Frontend: http://localhost:3000
- Mobile: Utilize o Expo Go no seu dispositivo móvel.
- Desktop: Execute o Electron localmente no seu computador.

📚 Documentação da API
A documentação da API está disponível no Swagger UI: http://localhost:3333/api-docs.

🐳 Docker e Kubernetes

Para rodar o projeto com Docker:

```bash
docker-compose up --build
```

🤖 Kubernetes (opcional)
Os arquivos de configuração do Kubernetes estão na pasta kubernetes/.

🤖 CI/CD
O projeto utiliza GitHub Actions para CI/CD. O workflow está configurado em .github/workflows/ci.yml.

📝 Licença
Este projeto está licenciado sob a MIT License. Veja o arquivo LICENSE para mais detalhes.

---

## 🚀 Backend

A API do backend foi desenvolvida utilizando Node.js, Express, MongoDB e Mongoose. Ela roda na porta **3333** e está documentada com Swagger.

### Estrutura do Backend

- **app.ts**: Configuração do Express, rotas, banco de dados e Swagger.
- **server.ts**: Inicialização do servidor.

### Rotas de Usuário

- **POST /api/users**: Cria um novo usuário.
- **GET /api/users/{id}**: Obtém um usuário pelo ID.
- **PUT /api/users/{id}**: Atualiza um usuário pelo ID.
- **DELETE /api/users/{id}**: Remove um usuário pelo ID.

### Rotas de Produtos

- **POST /api/products**: Cria um novo produto.
- **GET /api/products/{id}**: Obtém um produto pelo ID.
- **PUT /api/products/{id}**: Atualiza um produto pelo ID.
- **DELETE /api/products/{id}**: Remove um produto pelo ID.

### Como Executar

1. Navegue até a pasta `apps/backend`.
2. Instale as dependências:

```bash
npm install
```

### Tratamento de Erros

- Todos os erros são tratados de forma segura, garantindo que mensagens de erro sejam retornadas de forma clara e consistente.
- Erros desconhecidos são capturados e retornados com a mensagem "An unknown error occurred".

## 🧪 Testes

O backend foi desenvolvido seguindo o TDD (Test-Driven Development). Para executar os testes, siga os passos abaixo:

1. Navegue até a pasta `apps/backend`.
2. Execute os testes:

```bash
npm test
```

testando

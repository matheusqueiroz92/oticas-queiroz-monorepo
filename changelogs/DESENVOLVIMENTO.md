# Guia de Desenvolvimento - Óticas Queiroz Monorepo

## 🚀 Como Iniciar o Desenvolvimento

### Iniciar Backend e Frontend Simultaneamente

Para iniciar tanto a API quanto o frontend em modo de desenvolvimento, execute na **raiz do projeto**:

```bash
npm run dev
```

Este comando irá:
- ✅ Iniciar o **backend** (API) na porta `3333`
- ✅ Iniciar o **frontend** (web) na porta `3000`
- ✅ Usar o **Turborepo** para gerenciar ambos os processos
- ✅ Habilitar **hot reload** em ambos os apps

### Comandos Individuais

Se precisar iniciar apenas um dos serviços:

#### Apenas Backend (API)
```bash
npm run dev:backend
```
Ou dentro da pasta backend:
```bash
cd apps/backend
npm run dev
```

#### Apenas Frontend (Web)
```bash
npm run dev:web
```
Ou dentro da pasta web:
```bash
cd apps/web
npm run dev
```

## 📦 Estrutura do Monorepo

```
oticas-queiroz-monorepo/
├── apps/
│   ├── backend/          # API REST (Node.js + Express + MongoDB)
│   │   └── src/
│   │       ├── controllers/
│   │       ├── services/
│   │       ├── repositories/
│   │       ├── models/
│   │       └── ...
│   │
│   ├── web/              # Frontend (Next.js 15 + React 19)
│   │   ├── app/
│   │   ├── components/
│   │   ├── hooks/
│   │   └── ...
│   │
│   ├── mobile/           # App Mobile (React Native - Em desenvolvimento)
│   └── desktop/          # App Desktop (Electron - Em desenvolvimento)
│
├── packages/             # Pacotes compartilhados
│   ├── config/
│   ├── eslint-config/
│   ├── typescript-config/
│   ├── shared/
│   └── ui/
│
├── turbo.json           # Configuração do Turborepo
└── package.json         # Scripts principais
```

## 🔧 Scripts Disponíveis na Raiz

### Desenvolvimento
- `npm run dev` - Inicia backend + frontend simultaneamente
- `npm run dev:backend` - Inicia apenas o backend
- `npm run dev:web` - Inicia apenas o frontend

### Build
- `npm run build` - Build de todos os apps

### Testes
- `npm run test` - Executa testes de todos os apps

### Linting
- `npm run lint` - Executa linter em todos os apps

## 🌐 URLs de Desenvolvimento

Após executar `npm run dev`, os serviços estarão disponíveis em:

- **Frontend**: http://localhost:3000
- **Backend (API)**: http://localhost:3333
- **Swagger (Documentação da API)**: http://localhost:3333/api-docs

## 🛠️ Tecnologias

### Backend
- Node.js 18+
- Express.js
- TypeScript
- MongoDB + Mongoose
- JWT para autenticação
- Bcrypt para hash de senhas
- Multer para upload de arquivos
- Swagger para documentação
- Jest + Supertest para testes

### Frontend
- React 19
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- ShadCN/ui (componentes)
- React Hook Form + Zod (formulários)
- TanStack Query (cache e estado)
- Axios (HTTP client)
- Jest + Testing Library (testes)

### Monorepo
- Turborepo (orquestração)
- npm Workspaces
- Shared packages

## ⚙️ Configuração do Turborepo

A configuração do Turborepo está no arquivo `turbo.json`:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "ui": "tui",
  "tasks": {
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": []
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "test": {
      "dependsOn": ["^test"]
    },
    "lint": {
      "dependsOn": ["^lint"]
    }
  }
}
```

### O que isso significa?

- **`cache: false`** no `dev`: Não faz cache do processo de desenvolvimento
- **`persistent: true`** no `dev`: Mantém o processo rodando (não finaliza após executar)
- **`dependsOn`**: Define dependências entre tasks
- **`outputs`**: Define quais arquivos são gerados pelo build

## 🔄 Como o `npm run dev` funciona?

1. **Você executa**: `npm run dev`
2. **Turborepo identifica** os workspaces com script `dev`:
   - `apps/backend` → `nodemon src/server.ts`
   - `apps/web` → `next dev --turbopack`
3. **Turborepo inicia** ambos em paralelo com UI TUI (Terminal UI)
4. **Você vê** os logs de ambos em tempo real
5. **Hot reload** funciona em ambos automaticamente

## 📝 Variáveis de Ambiente

### Backend
Crie um arquivo `.env` em `apps/backend/`:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/oticas-queiroz

# JWT
JWT_SECRET=seu-secret-super-seguro

# Server
PORT=3333
NODE_ENV=development

# Email (opcional para desenvolvimento)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=seu-email@gmail.com
EMAIL_PASS=sua-senha-app

# Mercado Pago (opcional)
MERCADOPAGO_ACCESS_TOKEN=seu-token

# Sicredi (opcional)
SICREDI_USER=usuario
SICREDI_PASSWORD=senha
```

### Frontend
Crie um arquivo `.env.local` em `apps/web/`:

```env
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3333
```

## 🐛 Troubleshooting

### Erro de porta em uso
Se receber erro de porta já em uso:

```bash
# Windows - Encontrar processo na porta
netstat -ano | findstr :3000
netstat -ano | findstr :3333

# Matar processo específico (substitua PID)
taskkill /PID <numero_do_pid> /F
```

### Backend não inicia
1. Verifique se o MongoDB está rodando
2. Verifique as variáveis de ambiente
3. Execute `npm install` em `apps/backend`

### Frontend não inicia
1. Execute `npm install` em `apps/web`
2. Limpe o cache do Next.js: `rm -rf apps/web/.next`
3. Verifique se a porta 3000 está livre

### Turborepo não encontra os workspaces
1. Execute `npm install` na raiz
2. Verifique se o `package.json` raiz tem `"workspaces": ["apps/*", "packages/*"]`
3. Certifique-se de que cada workspace tem um `package.json` válido

## 🚦 Checklist para Começar

- [ ] Node.js 18+ instalado
- [ ] MongoDB rodando
- [ ] Clonar repositório
- [ ] `npm install` na raiz
- [ ] Configurar `.env` no backend
- [ ] Configurar `.env.local` no frontend
- [ ] `npm run dev` na raiz
- [ ] Acessar http://localhost:3000
- [ ] API disponível em http://localhost:3333

## 🎯 Próximos Passos

1. Configurar variáveis de ambiente
2. Criar usuário admin: `cd apps/backend && npm run create-admin`
3. Acessar aplicação: http://localhost:3000
4. Login com credenciais do admin criado
5. Começar a desenvolver! 🎉

---

**Desenvolvido com ❤️ pela equipe Óticas Queiroz**


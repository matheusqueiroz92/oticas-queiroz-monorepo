# Changelog do Frontend - Sistema Óticas Queiroz

## [2024-12-19] - Mudanças de CPF Opcional e Login por O.S.

### ✨ Novas Funcionalidades

#### Sistema de Login por O.S. (Ordem de Serviço)
- **Página de login atualizada** com informações sobre o novo sistema
  - Adicionado aviso: "Clientes: Use o número da sua O.S. como usuário e senha"
  - Campo de login expandido para: "Email, CPF ou Número da O.S."
  - Placeholder atualizado para incluir O.S.

### 🔄 Mudanças Importantes

#### CPF Opcional
- **Schema de login**: Removida validação mínima de senha (para permitir O.S. curtas)
- **Schema de cliente legacy**: CPF agora é opcional
- **Schema de usuário**: CPF e data de nascimento opcionais
- **Formulários atualizados**: Labels e placeholders indicam campos opcionais

### 📝 Arquivos Modificados

#### Schemas
- `schemas/login-schema.ts` - Validação de senha ajustada
- `schemas/legacy-client-schema.ts` - CPF opcional
- `schemas/user-schema.ts` - CPF e data de nascimento opcionais

#### Páginas
- `app/auth/login/page.tsx` - Interface atualizada para novo sistema de login

#### Componentes
- `components/LegacyClients/LegacyClientForm.tsx` - CPF opcional
- `components/Profile/UserRegisterForm.tsx` - CPF e data opcionais

### 🚀 Como Usar

#### Login Tradicional (mantido)
1. Email + senha
2. CPF + senha 
3. CNPJ + senha

#### Novo Login por O.S.
1. Digite o número da O.S. no campo de login
2. Digite o mesmo número da O.S. no campo de senha
3. Clique em "Entrar"

#### Cadastro sem CPF
- Todos os formulários de cadastro agora permitem CPF em branco
- Labels indicam "(opcional)" onde aplicável
- Validações ajustadas para aceitar campos vazios

### ⚠️ Observações Importantes

1. **Compatibilidade**: Sistema mantém compatibilidade total com logins existentes
2. **UX**: Interface clara sobre as opções de login disponíveis
3. **Validação**: Mantém validação de CPF quando fornecido
4. **Flexibilidade**: Permite cadastro de clientes sem documentos

### 🔄 Próximas Etapas

- [ ] **Testar integração completa** backend + frontend
- [ ] **Documentar processo** para usuários finais
- [ ] **Adicionar testes** para novas funcionalidades
- [ ] **Otimizar UX** baseado em feedback dos usuários

### 🧪 Como Testar

1. **Inicie o backend**: `cd apps/backend && npm run dev`
2. **Inicie o frontend**: `cd apps/web && npm run dev`
3. **Acesse**: http://localhost:3000/auth/login
4. **Teste cenários**:
   - Login tradicional por email
   - Login por CPF (se usuário tem CPF)
   - Login por O.S. (usuário: número da O.S., senha: mesmo número)
   - Cadastro de cliente sem CPF

### 🔧 Configurações Necessárias

- Backend rodando na porta padrão (conforme configuração)
- MongoDB conectado e funcionando
- Variáveis de ambiente configuradas
- Dados de teste criados (usuários e pedidos) 
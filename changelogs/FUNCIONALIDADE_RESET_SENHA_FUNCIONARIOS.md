# Funcionalidade de Reset de Senha para Funcionários

## 📋 Resumo

Implementada a funcionalidade que permite aos **administradores** resetar a senha dos **funcionários** (employees) através da interface web, similar à funcionalidade já existente para clientes.

## 🎯 Objetivo

Permitir que administradores gerenciem senhas de funcionários de forma visual e intuitiva dentro da aplicação, sem necessidade de acesso direto ao banco de dados ou execução de scripts.

## ✅ O que foi implementado

### Backend (já estava pronto)

O backend já possuía a lógica necessária implementada no `UserController.ts`:

- **Endpoint**: `POST /api/users/:id/reset-password`
- **Permissões**:
  - ✅ Admin pode alterar senha de employee e customer
  - ✅ Employee pode alterar senha de customer
  - ❌ Customer não pode alterar senha de outros usuários
  - ❌ Admin não pode alterar senha de outro admin

### Frontend (modificações realizadas)

#### 1. **Arquivo de configuração de colunas** (NOVO)
**Caminho**: `apps/web/app/_utils/employee-table-config.tsx`

Criado arquivo de configuração das colunas da tabela de funcionários, incluindo:
- Nome
- Email
- Função (com Badge visual para Admin/Funcionário)
- Total de Vendas
- Valor Total

#### 2. **Componente EmployeeTableSection** (MODIFICADO)
**Caminho**: `apps/web/components/employees/EmployeeTableSection.tsx`

Alterações realizadas:
- ✅ Substituída a implementação customizada de tabela pelo componente reutilizável `UserTable`
- ✅ Adicionado suporte ao `UserActionsDropdown` que já inclui a opção de "Resetar Senha"
- ✅ Mantida a consistência visual e funcional com a tabela de clientes

#### 3. **Componentes reutilizados** (já existentes)
- `UserTable`: Componente de tabela com suporte a ações
- `UserActionsDropdown`: Menu dropdown com ações (visualizar, editar, resetar senha)
- `ResetPasswordDialog`: Dialog para resetar senha com validações

## 🔐 Regras de Permissão

### Admin
- ✅ Pode resetar senha de **funcionários** (employees)
- ✅ Pode resetar senha de **clientes** (customers)
- ❌ Não pode resetar senha de outros **admins**

### Employee
- ✅ Pode resetar senha de **clientes** (customers)
- ❌ Não pode resetar senha de outros **funcionários**

### Customer
- ❌ Não pode resetar senha de outros usuários
- ✅ Pode alterar apenas sua própria senha no perfil

## 🎨 Interface do Usuário

### Página de Funcionários

1. **Lista de funcionários** com todas as informações
2. **Botão de ações** (três pontos) em cada linha
3. **Menu dropdown** com opções:
   - 👁️ Visualizar
   - ✏️ Editar
   - 🔑 Resetar Senha (visível apenas para admin)

### Dialog de Reset de Senha

Quando o admin clica em "Resetar Senha":
1. Abre um dialog modal
2. Exibe o nome do funcionário
3. Campos para:
   - Nova senha (mínimo 6 caracteres)
   - Confirmar nova senha
4. Validações:
   - Senhas devem conferir
   - Mínimo 6 caracteres
5. Feedback visual de sucesso/erro

## 📝 Fluxo de Uso

### Resetar senha de um funcionário (Admin)

1. Acesse a página de **Funcionários**
2. Localize o funcionário desejado na lista
3. Clique no botão de **ações** (três pontos)
4. Selecione **"Resetar Senha"**
5. Digite a nova senha (mínimo 6 caracteres)
6. Confirme a nova senha
7. Clique em **"Resetar Senha"**
8. Aguarde a confirmação de sucesso
9. Informe o funcionário sobre a nova senha

## 🔧 Arquivos Modificados/Criados

### Criados
- ✅ `apps/web/app/_utils/employee-table-config.tsx`
- ✅ `apps/web/FUNCIONALIDADE_RESET_SENHA_FUNCIONARIOS.md`

### Modificados
- ✅ `apps/web/components/employees/EmployeeTableSection.tsx`

## 🚀 Como Testar

### 1. Teste como Admin

```bash
# 1. Login como admin
Email: admin@oticasqueiroz.com.br
Senha: [senha do admin]

# 2. Navegue para Funcionários
# 3. Clique nas ações de um funcionário
# 4. Verifique se a opção "Resetar Senha" aparece
# 5. Tente resetar a senha
# 6. Confirme que a operação foi bem-sucedida
```

### 2. Teste como Employee

```bash
# 1. Login como employee
# 2. Navegue para Funcionários (se tiver acesso)
# 3. Clique nas ações de um funcionário
# 4. Verifique que a opção "Resetar Senha" NÃO aparece
# 5. Navegue para Clientes
# 6. Verifique que a opção "Resetar Senha" aparece para clientes
```

## ⚠️ Observações Importantes

1. **Segurança**: A senha é sempre transmitida de forma segura via HTTPS
2. **Hash**: A senha é automaticamente criptografada com bcrypt no backend
3. **Validação**: Validação tanto no frontend (React Hook Form + Zod) quanto no backend (Zod)
4. **Permissões**: O backend sempre valida as permissões, mesmo que o frontend permita a ação
5. **Auditoria**: Recomenda-se implementar log de alterações de senha para auditoria futura

## 🎯 Benefícios

- ✅ **Interface visual**: Não precisa mais acessar o banco de dados diretamente
- ✅ **Segurança**: Permissões validadas em múltiplas camadas
- ✅ **Consistência**: Mesma experiência para gestão de clientes e funcionários
- ✅ **Facilidade**: Processo rápido e intuitivo
- ✅ **Validações**: Garante senhas seguras com mínimo de caracteres

## 📚 Próximos Passos (Opcionais)

1. **Implementar log de auditoria** para registrar alterações de senha
2. **Adicionar notificação por email** quando senha é alterada
3. **Implementar expiração de senha** após X dias
4. **Adicionar requisitos de complexidade** de senha (letras maiúsculas, números, símbolos)
5. **Implementar histórico de senhas** para evitar reutilização

---

**Data de implementação**: 15/10/2025  
**Desenvolvedor**: AI Assistant  
**Status**: ✅ Concluído e testado


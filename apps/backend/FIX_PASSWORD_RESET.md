# Fix: Reset de Senha - Hash não estava sendo aplicado

## 🐛 Problema Identificado

Quando um administrador ou funcionário tentava resetar a senha de outro usuário através da interface web, a senha era salva **em texto plano** no banco de dados, ao invés de ser hasheada com bcrypt.

### Sintomas
- Reset de senha aparentemente funcionava sem erros
- Porém, ao tentar fazer login com a nova senha, retornava "credenciais inválidas"
- A senha não estava sendo criptografada antes de ser salva

## 🔍 Causa Raiz

O fluxo de reset de senha era:

```
UserController.resetUserPassword()
  ↓
UserService.updatePassword(userId, newPassword) 
  ↓
UserService.updateUser(userId, { password: newPassword })  ❌ PROBLEMA!
  ↓
UserRepository.update(userId, { password: newPassword })
  ↓
BaseRepository.update() → findByIdAndUpdate()
  ↓
MongoDB (senha em texto plano ❌)
```

### Por que acontecia?

1. **`UserService.updatePassword`** chamava `updateUser` passando a senha em texto plano
2. **`updateUser`** chamava `userRepository.update` que é do `BaseRepository`
3. **`BaseRepository.update`** usa `findByIdAndUpdate` que **NÃO** aciona os hooks de `pre-save` do Mongoose
4. Os hooks de `pre-save` que hasheiam senhas **só funcionam** em operações de `.save()`, não em `findByIdAndUpdate`
5. Resultado: senha salva em texto plano ❌

### Métodos disponíveis no Repository

O `IUserRepository` já tinha um método específico para atualizar senhas:

```typescript
/**
 * Atualiza senha do usuário
 * @param id ID do usuário
 * @param hashedPassword Nova senha hasheada
 * @returns Usuário atualizado ou null
 */
updatePassword(id: string, hashedPassword: string): Promise<IUser | null>;
```

Mas o `UserService.updatePassword` **não estava usando** este método!

## ✅ Solução Implementada

Modificamos o `UserService.updatePassword` para:

1. **Hashear a senha** usando bcrypt antes de salvar
2. **Usar o método específico** `userRepository.updatePassword` que espera receber a senha já hasheada

### Código Anterior (ERRADO ❌)

```typescript
async updatePassword(userId: string, newPassword: string): Promise<void> {
  if (!newPassword?.trim() || newPassword.length < 6) {
    throw new ValidationError(
      "Nova senha deve ter pelo menos 6 caracteres",
      ErrorCode.INVALID_PASSWORD
    );
  }

  // ❌ Passava senha em texto plano para updateUser
  await this.updateUser(userId, { password: newPassword });
}
```

### Código Novo (CORRETO ✅)

```typescript
async updatePassword(userId: string, newPassword: string): Promise<void> {
  if (!newPassword?.trim() || newPassword.length < 6) {
    throw new ValidationError(
      "Nova senha deve ter pelo menos 6 caracteres",
      ErrorCode.INVALID_PASSWORD
    );
  }

  // ✅ Hasheia a senha antes de salvar
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // ✅ Usa o método específico do repository
  await this.userRepository.updatePassword(userId, hashedPassword);
}
```

### Import adicionado

```typescript
import bcrypt from "bcrypt";
```

## 🧪 Como Testar

### Teste 1: Reset de senha por Admin

```bash
# 1. Faça login como admin na aplicação
# 2. Acesse a página de Funcionários
# 3. Clique em "Ações" de um funcionário
# 4. Selecione "Resetar Senha"
# 5. Digite uma nova senha (ex: "novaSenha123")
# 6. Confirme a senha
# 7. Aguarde mensagem de sucesso
# 8. Faça logout
# 9. Tente fazer login com o funcionário usando "novaSenha123"
# ✅ Deve funcionar!
```

### Teste 2: Reset de senha de cliente

```bash
# 1. Faça login como admin ou employee
# 2. Acesse a página de Clientes
# 3. Clique em "Ações" de um cliente
# 4. Selecione "Resetar Senha"
# 5. Digite uma nova senha
# 6. Confirme
# 7. Faça logout e teste login com o cliente
# ✅ Deve funcionar!
```

### Teste 3: Alterar própria senha

```bash
# 1. Faça login como qualquer usuário
# 2. Acesse "Perfil"
# 3. Clique em "Alterar Minha Senha"
# 4. Digite senha atual
# 5. Digite nova senha
# 6. Confirme
# 7. Faça logout e teste login com a nova senha
# ✅ Deve funcionar!
```

## 📊 Impacto

### Antes do Fix
- ❌ Reset de senha **não funcionava**
- ❌ Senhas salvas em **texto plano** (vulnerabilidade de segurança!)
- ❌ Impossível fazer login após reset

### Depois do Fix
- ✅ Reset de senha **funcionando corretamente**
- ✅ Senhas **hasheadas com bcrypt** (seguro)
- ✅ Login funcionando normalmente após reset

## 🔐 Segurança

Este fix corrige uma **vulnerabilidade de segurança crítica** onde senhas estavam sendo salvas em texto plano no banco de dados após resets.

**Recomendações:**
1. ✅ **Fix aplicado** - senhas agora são hasheadas
2. ⚠️ **Verificar banco de dados** - se houve resets de senha antes deste fix, essas senhas podem estar em texto plano
3. 🔧 **Forçar reset** - considere forçar reset de senha para usuários afetados

## 📝 Arquivos Modificados

- **`apps/backend/src/services/UserService.ts`**
  - Adicionado import de `bcrypt`
  - Modificado método `updatePassword` para hashear senha antes de salvar
  - Agora usa `userRepository.updatePassword` ao invés de `updateUser`

## 🎯 Conclusão

O problema estava na forma como o `UserService.updatePassword` atualizava a senha:
- **Antes**: usava `updateUser` que não hasheava a senha
- **Depois**: hasheia a senha e usa `updatePassword` do repository

Este fix garante que **todas** as senhas sejam hasheadas corretamente antes de serem salvas no banco de dados.

---

**Data do Fix**: 15/10/2025  
**Desenvolvedor**: AI Assistant  
**Status**: ✅ Corrigido e testado  
**Commit**: `fix: corrige hash de senha ao resetar senha de usuario`


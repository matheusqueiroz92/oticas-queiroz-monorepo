# Changelog do Backend - Sistema Óticas Queiroz

## [2024-12-19] - Mudanças de CPF Opcional e Login por O.S.

### ✨ Novas Funcionalidades

#### Sistema de Login por O.S. (Ordem de Serviço)
- **Implementado login usando número da O.S. como usuário e senha**
  - Usuário: número da O.S. (ex: "12345")
  - Senha: mesmo número da O.S. (ex: "12345")
  - Funciona apenas para clientes que possuem pedidos com O.S.
- **Adicionado método `findUserByServiceOrder()` no AuthModel**
- **Atualizado AuthService para suportar login por O.S.**
- **Adicionados testes unitários para nova funcionalidade**

### 🔄 Mudanças Importantes

#### CPF Opcional
- **UserSchema**: CPF não é mais obrigatório para nenhum tipo de usuário
- **LegacyClientSchema**: CPF opcional com índice sparse para permitir múltiplos documentos sem CPF
- **Interfaces atualizadas**: IUser e ILegacyClient agora têm CPF opcional
- **Validadores ajustados**: Validação de CPF apenas quando o campo é fornecido

### 📝 Arquivos Modificados

#### Schemas
- `src/schemas/UserSchema.ts` - CPF opcional + ajuste de índices
- `src/schemas/LegacyClientSchema.ts` - CPF opcional com sparse index

#### Models
- `src/models/AuthModel.ts` - Adicionado método findUserByServiceOrder()
- `src/models/LegacyClientModel.ts` - Interface ajustada para CPF opcional

#### Services
- `src/services/AuthService.ts` - Lógica de login por O.S.
- `src/services/UserService.ts` - Validações ajustadas para CPF opcional
- `src/services/LegacyClientService.ts` - Validações ajustadas para CPF opcional

#### Controllers
- `src/controllers/AuthController.ts` - Validação de CPF ajustada
- `src/controllers/LegacyClientController.ts` - Schema de validação CPF opcional

#### Validators
- `src/validators/userValidators.ts` - Validação CPF opcional

#### Interfaces
- `src/interfaces/IUser.ts` - CPF opcional
- `src/interfaces/ILegacyClient.ts` - CPF opcional

#### Testes
- `src/__tests__/unit/services/AuthService.test.ts` - Testes para login por O.S.

### 🚀 Como Usar

#### Login Tradicional (mantido)
```json
{
  "login": "user@email.com", // ou CPF/CNPJ
  "password": "senha123"
}
```

#### Novo Login por O.S.
```json
{
  "login": "12345", // número da O.S.
  "password": "12345" // mesmo número da O.S.
}
```

#### Cadastro de Cliente sem CPF
```json
{
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999"
  // CPF é opcional agora
}
```

### ⚠️ Observações Importantes

1. **Compatibilidade**: Sistema mantém compatibilidade total com logins existentes
2. **Validação**: CPF ainda é validado quando fornecido
3. **Índices**: Banco de dados permite múltiplos registros sem CPF
4. **Segurança**: Login por O.S. funciona apenas para clientes com pedidos válidos

### 🔄 Próximas Etapas

- [ ] Atualizar frontend para suportar as novas funcionalidades
- [ ] Adicionar documentação da API (Swagger)
- [ ] Testes de integração para novas funcionalidades 
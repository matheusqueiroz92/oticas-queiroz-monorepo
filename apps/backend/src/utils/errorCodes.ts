export enum ErrorCode {
  // Erros de autenticação (401-403)
  UNAUTHORIZED = "UNAUTHORIZED", // Não autenticado
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS", // Não autorizado
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS", // Credenciais inválidas
  INVALID_TOKEN = "INVALID_TOKEN", // Token inválido ou expirado

  // Erros de validação (400)
  VALIDATION_ERROR = "VALIDATION_ERROR", // Dados inválidos
  DUPLICATE_EMAIL = "DUPLICATE_EMAIL", // Email já cadastrado
  DUPLICATE_CPF = "DUPLICATE_CPF", // CPF já cadastrado
  INVALID_PASSWORD = "INVALID_PASSWORD", // Senha inválida
  INVALID_EMAIL = "INVALID_EMAIL", // Email inválido
  INVALID_CPF = "INVALID_CPF", // CPF inválido
  INVALID_RG = "INVALID_RG", // RG inválido
  INVALID_ROLE = "INVALID_ROLE", // Role inválida
  INVALID_DATE = "INVALID_DATE", // Data inválida

  // Erros de recursos (404)
  USER_NOT_FOUND = "USER_NOT_FOUND", // Usuário não encontrado
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND", // Recurso não encontrado
  NO_RESULTS = "NO_RESULTS", // Sem resultados para a busca

  // Erros de upload (400)
  FILE_TOO_LARGE = "FILE_TOO_LARGE", // Arquivo muito grande
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE", // Tipo de arquivo não suportado

  // Erros de operação (400)
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED", // Operação não permitida

  // Erros internos (500)
  INTERNAL_ERROR = "INTERNAL_ERROR", // Erro interno do servidor
}

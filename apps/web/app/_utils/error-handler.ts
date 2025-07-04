import { toast } from "sonner";
import { AxiosError } from "axios";

interface ErrorHandlerOptions {
  showDetails?: boolean;
  customMessage?: string;
  duration?: number;
}

export class ErrorHandler {
  static handle(error: unknown, options: ErrorHandlerOptions = {}) {
    console.error("Error occurred:", error);

    const { showDetails = false, customMessage, duration = 6000 } = options;

    let errorMessage = "Ocorreu um erro inesperado";
    let errorDetails: string | undefined;
    let hasSpecificMessage = false;
    let validationMessages: string[] = [];

    if (error instanceof AxiosError) {
      const response = error.response;
      const data = response?.data;

      // Extrair mensagens de validação se existirem
      if (data?.errors) {
        validationMessages = ErrorHandler.extractValidationMessages(data.errors);
      }

      // Prioridade 1: Mensagem específica da API
      if (data?.message) {
        errorMessage = data.message;
        hasSpecificMessage = true;
      }
      // Prioridade 2: Campo error da resposta
      else if (data?.error) {
        errorMessage = data.error;
        hasSpecificMessage = true;
      }
      // Prioridade 3: Mensagem do erro Axios
      else if (error.message) {
        errorMessage = error.message;
        hasSpecificMessage = true;
      }
      // Prioridade 4: Mensagem customizada (fallback)
      else if (customMessage) {
        errorMessage = customMessage;
        hasSpecificMessage = true;
      }

      // Só usar mensagens genéricas de status HTTP se não houver mensagem específica
      if (!hasSpecificMessage && response?.status) {
        switch (response.status) {
          case 400:
            errorMessage = "Dados inválidos enviados para o servidor";
            break;
          case 401:
            errorMessage = "Sessão expirada. Faça login novamente";
            break;
          case 403:
            errorMessage = "Você não tem permissão para realizar esta ação";
            break;
          case 404:
            errorMessage = "Recurso não encontrado";
            break;
          case 409:
            errorMessage = "Conflito de dados. Verifique se o registro já existe";
            break;
          case 422:
            errorMessage = "Dados não puderam ser processados. Verifique os campos";
            break;
          case 500:
            errorMessage = "Erro interno do servidor. Tente novamente em alguns momentos";
            break;
          default:
            errorMessage = `Erro ${response.status}: Falha na comunicação com o servidor`;
        }
      }

      // Concatenar mensagem customizada com mensagens de validação, se existirem
      if (validationMessages.length > 0) {
        if (customMessage) {
          errorMessage = `${customMessage}: ${validationMessages.join("; ")}`;
        } else {
          errorMessage = validationMessages.join("; ");
        }
      }

      // Preparar detalhes do erro SÓ para o toast secundário
      if (showDetails) {
        if (data?.details) {
          errorDetails = JSON.stringify(data.details, null, 2);
        } else if (data?.errors) {
          errorDetails = JSON.stringify(data.errors, null, 2);
        } else if (data) {
          errorDetails = JSON.stringify(data, null, 2);
        }
      } else {
        errorDetails = undefined; // Nunca mostrar JSON no toast principal
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = undefined;
    }

    // Exibir toast de erro
    toast.error(errorMessage, {
      description: undefined, // Nunca mostrar JSON no toast principal
      duration,
      action: showDetails && errorDetails ? {
        label: "Ver detalhes",
        onClick: () => {
          console.log("Detalhes do erro:", errorDetails);
          toast.info("Detalhes do erro", {
            description: errorDetails,
            duration: 10000,
          });
        },
      } : undefined,
    });

    return {
      message: errorMessage,
      details: errorDetails,
      statusCode: error instanceof AxiosError ? error.response?.status : undefined,
    };
  }

  // Método auxiliar para extrair mensagens de validação
  static extractValidationMessages(errors: any): string[] {
    const messages: string[] = [];

    if (Array.isArray(errors)) {
      for (const error of errors) {
        if (typeof error === 'string') {
          messages.push(error);
        } else if (typeof error === 'object' && error !== null) {
          // Priorizar campo 'message'
          const msg = (error as any).message;
          if (typeof msg === 'string') {
            messages.push(msg);
          } else {
            // Procurar qualquer string em propriedades
            for (const value of Object.values(error)) {
              if (typeof value === 'string') {
                messages.push(value);
              }
            }
          }
        }
      }
    } else if (typeof errors === 'object' && errors !== null) {
      for (const fieldErrors of Object.values(errors)) {
        if (Array.isArray(fieldErrors)) {
          for (const fieldError of fieldErrors) {
            if (typeof fieldError === 'string') {
              messages.push(fieldError);
            } else if (typeof fieldError === 'object' && fieldError !== null) {
              const msg = (fieldError as any).message;
              if (typeof msg === 'string') {
                messages.push(msg);
              } else {
                for (const value of Object.values(fieldError)) {
                  if (typeof value === 'string') {
                    messages.push(value);
                  }
                }
              }
            }
          }
        } else if (typeof fieldErrors === 'string') {
          messages.push(fieldErrors);
        } else if (typeof fieldErrors === 'object' && fieldErrors !== null) {
          const msg = (fieldErrors as any).message;
          if (typeof msg === 'string') {
            messages.push(msg);
          } else {
            for (const value of Object.values(fieldErrors)) {
              if (typeof value === 'string') {
                messages.push(value);
              }
            }
          }
        }
      }
    }

    return messages;
  }

  static success(message: string, description?: string, duration?: number) {
    toast.success(message, {
      description,
      duration: duration || 4000,
    });
  }

  static warning(message: string, description?: string, duration?: number) {
    toast.warning(message, {
      description,
      duration: duration || 5000,
    });
  }

  static info(message: string, description?: string, duration?: number) {
    toast.info(message, {
      description,
      duration: duration || 4000,
    });
  }
}

// Funções de conveniência para uso direto
export const handleError = (error: unknown, customMessage?: string, showDetails?: boolean) => {
  return ErrorHandler.handle(error, { customMessage, showDetails });
};

export const showSuccess = (message: string, description?: string, duration?: number) => {
  return ErrorHandler.success(message, description, duration);
};

export const showWarning = (message: string, description?: string, duration?: number) => {
  return ErrorHandler.warning(message, description, duration);
};

export const showInfo = (message: string, description?: string, duration?: number) => {
  return ErrorHandler.info(message, description, duration);
}; 
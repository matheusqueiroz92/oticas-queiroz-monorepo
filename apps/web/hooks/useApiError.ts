import { toast } from "sonner";
import { AxiosError } from "axios";

interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
}

interface ApiErrorResponse {
  message?: string;
  error?: string;
  errors?: any;
  details?: any;
}

export const useApiError = () => {
  const handleError = (
    error: unknown,
    customMessage?: string,
    showDetails?: boolean
  ) => {
    console.error("API Error:", error);

    let errorMessage = customMessage || "Ocorreu um erro inesperado";
    let errorDetails: string | undefined;

    if (error instanceof AxiosError) {
      const response = error.response;
      const data = response?.data as ApiErrorResponse;

      // Extrair mensagem de erro da resposta
      if (data?.message) {
        errorMessage = data.message;
      } else if (data?.error) {
        errorMessage = data.error;
      } else if (data?.errors) {
        // Tratar erros de validação
        if (Array.isArray(data.errors)) {
          errorMessage = data.errors.join(", ");
        } else if (typeof data.errors === "object") {
          const errorMessages = Object.values(data.errors).flat();
          errorMessage = errorMessages.join(", ");
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Adicionar informações de status HTTP quando relevante
      if (response?.status) {
        switch (response.status) {
          case 400:
            if (!customMessage && !data?.message) {
              errorMessage = "Dados inválidos enviados para o servidor";
            }
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
            if (!customMessage && !data?.message) {
              errorMessage = "Conflito de dados. Verifique se o registro já existe";
            }
            break;
          case 422:
            if (!customMessage && !data?.message) {
              errorMessage = "Dados não puderam ser processados. Verifique os campos";
            }
            break;
          case 500:
            errorMessage = "Erro interno do servidor. Tente novamente em alguns momentos";
            break;
          default:
            if (!customMessage && !data?.message) {
              errorMessage = `Erro ${response.status}: ${error.message}`;
            }
        }
      }

      // Preparar detalhes do erro se solicitado
      if (showDetails && data?.details) {
        errorDetails = JSON.stringify(data.details, null, 2);
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    // Exibir toast de erro
    toast.error(errorMessage, {
      description: errorDetails,
      duration: 6000, // 6 segundos para dar tempo de ler
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
  };

  const handleSuccess = (
    message: string,
    description?: string,
    duration?: number
  ) => {
    toast.success(message, {
      description,
      duration: duration || 4000,
    });
  };

  const handleWarning = (
    message: string,
    description?: string,
    duration?: number
  ) => {
    toast.warning(message, {
      description,
      duration: duration || 5000,
    });
  };

  const handleInfo = (
    message: string,
    description?: string,
    duration?: number
  ) => {
    toast.info(message, {
      description,
      duration: duration || 4000,
    });
  };

  return {
    handleError,
    handleSuccess,
    handleWarning,
    handleInfo,
  };
};

export default useApiError;
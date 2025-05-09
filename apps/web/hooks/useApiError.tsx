import { useState } from 'react';
import axios, { AxiosError } from 'axios';

interface ApiErrorState {
  generalError: string | null;
  fieldErrors: Record<string, string>;
}

interface UseApiErrorReturn extends ApiErrorState {
  setErrors: (error: unknown) => void;
  clearErrors: () => void;
  hasErrors: boolean;
  setFieldError: (field: string, message: string) => void;
  removeFieldError: (field: string) => void;
  setGeneralErrorMessage: (message: string) => void;
}

/**
 * Hook para gerenciar erros de API de maneira consistente em toda a aplicação
 */
export function useApiError(): UseApiErrorReturn {
  const [state, setState] = useState<ApiErrorState>({
    generalError: null,
    fieldErrors: {},
  });

  // Verifica se tem algum erro (geral ou de campo)
  const hasErrors = !!state.generalError || Object.keys(state.fieldErrors).length > 0;

  // Limpa todos os erros
  const clearErrors = () => {
    setState({
      generalError: null,
      fieldErrors: {},
    });
  };

  // Define um erro específico para um campo
  const setFieldError = (field: string, message: string) => {
    setState(prev => ({
      ...prev,
      fieldErrors: {
        ...prev.fieldErrors,
        [field]: message,
      },
    }));
  };

  // Remove um erro específico de um campo
  const removeFieldError = (field: string) => {
    setState(prev => {
      const updatedFieldErrors = { ...prev.fieldErrors };
      delete updatedFieldErrors[field];
      
      return {
        ...prev,
        fieldErrors: updatedFieldErrors,
      };
    });
  };

  // Define uma mensagem de erro geral
  const setGeneralErrorMessage = (message: string) => {
    setState(prev => ({
      ...prev,
      generalError: message,
    }));
  };

  // Função principal para processar erros da API
  const setErrors = (error: unknown) => {
    // Limpa erros anteriores
    clearErrors();
    
    console.error("API Error:", error);

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // Processar erros de validação de campo
      if (axiosError.response?.data?.errors && typeof axiosError.response.data.errors === 'object') {
        const apiFieldErrors: Record<string, string> = {};
        
        Object.entries(axiosError.response.data.errors).forEach(([field, message]) => {
          apiFieldErrors[field] = Array.isArray(message) ? message[0] : String(message);
        });
        
        setState(prev => ({
          ...prev,
          fieldErrors: apiFieldErrors,
        }));
      } 
      // Processar mensagem de erro geral
      else if (axiosError.response?.data?.message) {
        setState(prev => ({
          ...prev,
          generalError: axiosError.response?.data?.message,
        }));
      } 
      // Erros HTTP específicos
      else if (axiosError.response?.status === 401) {
        setState(prev => ({
          ...prev,
          generalError: "Não autorizado. Verifique suas credenciais ou faça login novamente.",
        }));
      }
      else if (axiosError.response?.status === 403) {
        setState(prev => ({
          ...prev,
          generalError: "Você não tem permissão para acessar este recurso.",
        }));
      }
      else if (axiosError.response?.status === 404) {
        setState(prev => ({
          ...prev,
          generalError: "O recurso solicitado não foi encontrado.",
        }));
      }
      else if (axiosError.response?.status === 429) {
        setState(prev => ({
          ...prev,
          generalError: "Muitas requisições. Tente novamente mais tarde.",
        }));
      }
      else if (axiosError.response?.status != null && axiosError.response.status >= 500) {
        setState(prev => ({
          ...prev,
          generalError: "Erro no servidor. Tente novamente mais tarde.",
        }));
      }
      else {
        setState(prev => ({
          ...prev,
          generalError: "Ocorreu um erro ao processar sua solicitação.",
        }));
      }
    } 
    // Para erros que não são do Axios
    else if (error instanceof Error) {
      setState(prev => ({
        ...prev,
        generalError: error.message,
      }));
    } 
    // Para outros tipos de erros desconhecidos
    else {
      setState(prev => ({
        ...prev,
        generalError: "Ocorreu um erro inesperado.",
      }));
    }
  };

  return {
    ...state,
    setErrors,
    clearErrors,
    hasErrors,
    setFieldError,
    removeFieldError,
    setGeneralErrorMessage,
  };
}
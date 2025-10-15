"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  getAllCashRegisters,
  checkOpenCashRegister,
  openCashRegister,
  closeCashRegister,
  getCashRegisterById,
  getCashRegisterSummary,
  getCurrentCashRegister,
} from "@/app/_services/cashRegisterService";
import { getPaymentsByCashRegister } from "@/app/_services/paymentService";
import { QUERY_KEYS } from "@/app/_constants/query-keys";
import { useUsers } from "@/hooks/useUsers";
import type {
  OpenCashRegisterDTO,
  CloseCashRegisterDTO,
  CashRegisterFilters,
} from "@/app/_types/cash-register";

export function useCashRegister(enableQueries: boolean = true) {
  const [filters, setFilters] = useState<CashRegisterFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.PAGINATED(currentPage, filters),
    queryFn: () => getAllCashRegisters({ ...filters, page: currentPage }),
    placeholderData: (prevData) => prevData,
  });

  const {
    data: openCurrentCashRegister,
    isLoading: isLoadingOpenCurrentRegister,
    refetch: refetchOpenCurrentCashRegister,
  } = useQuery({
    queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
    queryFn: checkOpenCashRegister,
    refetchOnWindowFocus: false, // Desabilitado para evitar múltiplas chamadas
    retry: false, // Não tentar novamente em caso de erro 404
    enabled: enableQueries, // Desabilitar queries quando não necessário
  });

  const cashRegisters = data?.registers || [];
  
  const totalPages = data?.pagination?.totalPages || 1;
  
  const totalRegisters = data?.pagination?.total || 0;
  
  const activeRegister =
    openCurrentCashRegister?.isOpen && openCurrentCashRegister?.data
      ? openCurrentCashRegister.data
      : null;

  const openCashRegisterMutation = useMutation({
    mutationFn: openCashRegister,
    onSuccess: (result) => {
      toast({
        title: "Caixa aberto",
        description: "O caixa foi aberto com sucesso.",
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.ALL,
      });

      return result;
    },
    onError: (error) => {
      console.error("Erro ao abrir caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível abrir o caixa. Verifique as informações e tente novamente.",
      });
      throw error;
    },
  });

  const closeCashRegisterMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CloseCashRegisterDTO }) =>
      closeCashRegister(id, data),
    onSuccess: (result) => {
      toast({
        title: "Caixa fechado",
        description: "O caixa foi fechado com sucesso.",
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.ALL,
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.CASH_REGISTERS.OPEN,
      });

      return result;
    },
    onError: (error) => {
      console.error("Erro ao fechar caixa:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível fechar o caixa. Verifique as informações e tente novamente.",
      });
      throw error;
    },
  });

  const fetchCashRegisterById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id),
      queryFn: () => getCashRegisterById(id),
      enabled: !!id,
      retry: false,
    });
  };

  const fetchCashRegisterSummary = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.SUMMARY(id),
      queryFn: () => getCashRegisterSummary(id),
      enabled: !!id,
      retry: false,
    });
  };

  const fetchPaymentsByCashRegister = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.PAYMENTS.BY_CASH_REGISTER(id),
      queryFn: () => getPaymentsByCashRegister(id),
      enabled: !!id,
      retry: false,
    });
  };

  const useCashRegisterDetails = (id: string | null) => {
    const registerQuery = useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id as string),
      queryFn: () => getCashRegisterById(id as string),
      enabled: !!id,
      retry: false,
    });

    const summaryQuery = useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.SUMMARY(id as string),
      queryFn: () => getCashRegisterSummary(id as string),
      enabled: !!id,
      retry: false,
    });

    const paymentsQuery = useQuery({
      queryKey: QUERY_KEYS.PAYMENTS.BY_CASH_REGISTER(id as string),
      queryFn: () => getPaymentsByCashRegister(id as string),
      enabled: !!id,
      retry: false,
    });

    return {
      register: registerQuery.data,
      summary: summaryQuery.data,
      payments: paymentsQuery.data || [],
      isLoading: registerQuery.isLoading || summaryQuery.isLoading || paymentsQuery.isLoading,
      error: registerQuery.error || summaryQuery.error || paymentsQuery.error,
      refetch: () => {
        registerQuery.refetch();
        summaryQuery.refetch();
        paymentsQuery.refetch();
      }
    };
  };

  const fetchCurrentCashRegister = () => {
    return useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      queryFn: () => getCurrentCashRegister(),
      retry: false,
      enabled: enableQueries, // Desabilitar queries quando não necessário
    });
  };

  const updateFilters = (newFilters: CashRegisterFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const checkForOpenRegister = async (): Promise<boolean> => {
    await refetchOpenCurrentCashRegister();
    return !!activeRegister;
  };

  const handleOpenCashRegister = (data: OpenCashRegisterDTO) => {
    return openCashRegisterMutation.mutateAsync(data);
  };

  const handleCloseCashRegister = (id: string, data: CloseCashRegisterDTO) => {
    return closeCashRegisterMutation.mutateAsync({ id, data });
  };
  
  const useCloseCashRegister = (id: string | null) => {
    const registerQuery = useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.DETAIL(id as string),
      queryFn: () => getCashRegisterById(id as string),
      enabled: !!id,
      retry: false,
    });
    
    const closeCashRegisterMut = useMutation({
      mutationFn: ({ id, data }: { id: string; data: CloseCashRegisterDTO }) =>
        closeCashRegister(id, data),
      onSuccess: (result) => {
        // Invalidar todas as queries relacionadas ao caixa
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CASH_REGISTERS.ALL,
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CASH_REGISTERS.OPEN,
        });
        
        return result;
      },
      onError: (error) => {
        console.error("Erro ao fechar caixa:", error);
        throw error;
      },
    });
    
    return {
      register: registerQuery.data,
      isLoading: registerQuery.isLoading,
      error: registerQuery.error,
      isClosing: closeCashRegisterMut.isPending,
      closeRegister: (data: CloseCashRegisterDTO) => {
        if (!id) return Promise.reject(new Error("ID do caixa não fornecido"));
        return closeCashRegisterMut.mutateAsync({ id, data });
      }
    };
  };
  
  const useOpenCashRegister = (onSuccess?: () => void) => {
    const router = useRouter();
    const { toast } = useToast();
    const [hasCashRegisterOpen, setHasCashRegisterOpen] = useState(false);
    
    const checkCashRegisterQuery = useQuery({
      queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
      queryFn: checkOpenCashRegister,
      retry: false,
      refetchOnWindowFocus: false,
      enabled: enableQueries, // Desabilitar queries quando não necessário
    });

    
    useEffect(() => {
      const cashRegisterData = checkCashRegisterQuery.data;
      if (cashRegisterData) {
        setHasCashRegisterOpen(cashRegisterData.isOpen);
        
        if (cashRegisterData.isOpen) {
          toast({
            variant: "destructive",
            title: "Caixa já aberto",
            description: "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
          });
        }
      } else {
        setHasCashRegisterOpen(false);
      }
    }, [checkCashRegisterQuery.data, toast]);
    
    const openCashRegisterMut = useMutation({
      mutationFn: openCashRegister,
      onSuccess: (result) => {
        toast({
          title: "Caixa aberto",
          description: "O caixa foi aberto com sucesso.",
        });
        
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CASH_REGISTERS.CURRENT,
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.CASH_REGISTERS.ALL,
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/cash-register");
        }
        
        return result;
      },
      onError: (error) => {
        console.error("Erro ao abrir caixa:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível abrir o caixa. Tente novamente.",
        });
        throw error;
      },
    });
    
    return {
      isChecking: checkCashRegisterQuery.isLoading,
      checkError: checkCashRegisterQuery.error,
      hasCashRegisterOpen,
      isOpening: openCashRegisterMut.isPending,
      openCashRegister: (data: OpenCashRegisterDTO) => {
        if (hasCashRegisterOpen) {
          toast({
            variant: "destructive",
            title: "Caixa já aberto",
            description: "Já existe um caixa aberto. Feche-o antes de abrir um novo.",
          });
          return Promise.reject(new Error("Já existe um caixa aberto"));
        }
        return openCashRegisterMut.mutateAsync(data);
      },
      refetchStatus: checkCashRegisterQuery.refetch
    };
  };
  
  const useCashRegisterList = () => {
    const [search, setSearch] = useState("");
    const [date, setDate] = useState<Date | undefined>(undefined);
    
    const {
      cashRegisters,
      activeRegister,
      isLoading,
      error,
      currentPage,
      totalPages,
      totalRegisters,
      setCurrentPage,
      updateFilters,
      navigateToOpenRegister,
      navigateToRegisterDetails,
      navigateToCloseRegister,
      refetch
    } = useCashRegister();
    
    const { getAllUsers, usersMap } = useUsers();
    
    useEffect(() => {
      const loadAllUsers = async () => {
        await getAllUsers();
      };
      
      loadAllUsers();
    }, [getAllUsers]);
    
    useEffect(() => {
      if (cashRegisters.length > 0 && !isLoading) {
        const userIds = cashRegisters
          .map(register => register.openedBy)
          .filter((id, index, self) => id && self.indexOf(id) === index);
        
        if (userIds.length > 0) {
          getAllUsers();
        }
      }
    }, [cashRegisters, isLoading, getAllUsers]);
    
    const applyDateFilter = () => {
      if (date) {
        updateFilters({
          startDate: format(date, "yyyy-MM-dd"),
          endDate: format(date, "yyyy-MM-dd"),
        });
      }
    };
    
    const clearFilters = () => {
      updateFilters({});
      setDate(undefined);
      setSearch("");
    };
    
    const applySearchFilter = (searchTerm: string) => {
      setSearch(searchTerm);
      updateFilters({ search: searchTerm });
    };
    
    return {
      cashRegisters,
      activeRegister,
      usersMap,
      isLoading,
      error,
      currentPage,
      totalPages,
      totalRegisters,
      search,
      date,
      setSearch: applySearchFilter,
      setDate,
      setCurrentPage,
      applyDateFilter,
      clearFilters,
      navigateToOpenRegister,
      navigateToRegisterDetails,
      navigateToCloseRegister,
      refetch
    };
  };

  const navigateToCashRegister = () => {
    router.push("/cash-register");
  }
  
  const navigateToRegisterDetails = (id: string) => {
    router.push(`/cash-register/${id}`);
  };

  const navigateToOpenRegister = () => {
    router.push("/cash-register/open");
  };

  const navigateToCloseRegister = (id: string) => {
    router.push(`/cash-register/close/${id}`);
  };

  const handlePrint = () => {
    window.print();
  };

  return {
    cashRegisters,
    currentCashRegister: activeRegister,
    activeRegister,
    isLoading: isLoading || isLoadingOpenCurrentRegister,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalRegisters,
    filters,
    isOpening: openCashRegisterMutation.isPending,
    isClosing: closeCashRegisterMutation.isPending,
    setCurrentPage,
    updateFilters,
    fetchCashRegisterById,
    fetchCurrentCashRegister,
    fetchCashRegisterSummary,
    fetchPaymentsByCashRegister,
    useCashRegisterDetails,
    useCloseCashRegister,
    useOpenCashRegister,
    useCashRegisterList,
    handleOpenCashRegister,
    handleCloseCashRegister,
    navigateToCashRegister,
    navigateToRegisterDetails,
    navigateToOpenRegister,
    navigateToCloseRegister,
    checkForOpenRegister,
    refetch,
    refetchOpenCurrentCashRegister,
    refetchCurrentCashRegister: refetchOpenCurrentCashRegister,
    handlePrint
  };
}
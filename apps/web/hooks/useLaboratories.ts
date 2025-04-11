"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { useCallback, useState, useEffect } from "react";
import {
  getAllLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  toggleLaboratoryStatus,
  deleteLaboratory,
} from "@/app/services/laboratoryService";
import { QUERY_KEYS } from "@/app/constants/query-keys";
import type { Laboratory, LaboratoryFilters, ApiError, LoggedEmployee } from "@/app/types/laboratory";
import { createLaboratoryForm, LaboratoryFormData } from "@/schemas/laboratory-schema";
import { api } from "@/app/services/authService";
import type { AxiosError } from "axios";
import Cookies from "js-cookie";

export function useLaboratories() {
  const [filters, setFilters] = useState<LaboratoryFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(currentPage, filters),
    queryFn: () => getAllLaboratories({ ...filters, page: currentPage }),
    placeholderData: (prevData) => prevData,
  });

  const laboratories = data?.laboratories || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const totalLaboratories = data?.pagination?.total || 0;

  const createLaboratoryMutation = useMutation({
    mutationFn: createLaboratory,
    onSuccess: (newLaboratory) => {
      toast({
        title: "Laboratório criado",
        description: "O laboratório foi criado com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LABORATORIES.ALL });

      return newLaboratory;
    },
    onError: (error: unknown) => {
      console.error("Erro ao criar laboratório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o laboratório.",
      });
    },
  });

  const updateLaboratoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Laboratory> }) =>
      updateLaboratory(id, data),
    onSuccess: (updatedLaboratory) => {
      toast({
        title: "Laboratório atualizado",
        description: "O laboratório foi atualizado com sucesso.",
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.DETAIL(updatedLaboratory._id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(),
      });

      return updatedLaboratory;
    },
    onError: (error: unknown, variables) => {
      console.error(
        `Erro ao atualizar laboratório com ID ${variables.id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório.",
      });
    },
  });

  const toggleLaboratoryStatusMutation = useMutation({
    mutationFn: toggleLaboratoryStatus,
    onSuccess: (updatedLaboratory) => {
      const statusText = updatedLaboratory.isActive ? "ativado" : "desativado";
      toast({
        title: "Status atualizado",
        description: `Laboratório ${statusText} com sucesso.`,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.DETAIL(updatedLaboratory._id),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(),
      });

      return updatedLaboratory;
    },
    onError: (error: unknown, id) => {
      console.error(
        `Erro ao alternar status do laboratório com ID ${id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do laboratório.",
      });
    },
  });

  const deleteLaboratoryMutation = useMutation({
    mutationFn: deleteLaboratory,
    onSuccess: () => {
      toast({
        title: "Laboratório excluído",
        description: "O laboratório foi excluído com sucesso.",
      });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.LABORATORIES.ALL });

      return true;
    },
    onError: (error: unknown, id) => {
      console.error(`Erro ao excluir laboratório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o laboratório.",
      });
      return false;
    },
  });

  const fetchLaboratoryById = (id: string) => {
    return useQuery({
      queryKey: QUERY_KEYS.LABORATORIES.DETAIL(id),
      queryFn: () => getLaboratoryById(id),
      enabled: !!id,
    });
  };

  const useLaboratoriesList = () => {
    const [search, setSearch] = useState("");
    
    const {
      laboratories,
      isLoading,
      error,
      updateFilters,
      navigateToLaboratoryDetails,
      navigateToCreateLaboratory,
    } = useLaboratories();
    
    const handleSearch = () => {
      updateFilters({ search });
    };
    
    const showEmptyState = !isLoading && laboratories.length === 0;
    
    return {
      laboratories,
      isLoading,
      error,
      search,
      showEmptyState,
      setSearch,
      handleSearch,
      navigateToLaboratoryDetails,
      navigateToCreateLaboratory
    };
  };

  const useLaboratoryDetails = (id: string | null) => {
    const router = useRouter();
    
    const laboratoryQuery = useQuery({
      queryKey: QUERY_KEYS.LABORATORIES.DETAIL(id as string),
      queryFn: () => getLaboratoryById(id as string),
      enabled: !!id,
    });

    const toggleStatusMut = useMutation({
      mutationFn: toggleLaboratoryStatus,
      onSuccess: (updatedLaboratory) => {
        const statusText = updatedLaboratory.isActive ? "ativado" : "desativado";
        toast({
          title: "Status atualizado",
          description: `Laboratório ${statusText} com sucesso.`,
        });

        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.LABORATORIES.DETAIL(updatedLaboratory._id),
        });
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.LABORATORIES.PAGINATED(),
        });
        
        laboratoryQuery.refetch();
        
        return updatedLaboratory;
      },
      onError: (error: unknown) => {
        console.error(`Erro ao alternar status do laboratório:`, error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível alterar o status do laboratório.",
        });
      },
    });
    
    const navigateBack = () => {
      router.push("/laboratories");
    };
    
    return {
      laboratory: laboratoryQuery.data,
      isLoading: laboratoryQuery.isLoading,
      error: laboratoryQuery.error,
      isTogglingStatus: toggleStatusMut.isPending,
      toggleStatus: (laboratoryId: string) => toggleStatusMut.mutateAsync(laboratoryId),
      navigateBack,
      navigateToEdit: () => navigateToEditLaboratory(id as string),
      refetch: laboratoryQuery.refetch
    };
  };

  const useCreateLaboratory = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loggedEmployee, setLoggedEmployee] = useState<LoggedEmployee | null>(null);
  
  const [streetValue, setStreetValue] = useState("");
  const [numberValue, setNumberValue] = useState("");
  const [complementValue, setComplementValue] = useState("");
  const [neighborhoodValue, setNeighborhoodValue] = useState("");
  const [cityValue, setCityValue] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [zipCodeValue, setZipCodeValue] = useState("");
  
  const form = createLaboratoryForm();
  
  useEffect(() => {
    const userId = Cookies.get("userId");
    const name = Cookies.get("name");
    const email = Cookies.get("email");
    const role = Cookies.get("role");

    if (userId && name && role) {
      const userData = {
        id: userId,
        name,
        email: email || "",
        role,
      };

      setLoggedEmployee(userData);
    }
  }, []);
  
  useEffect(() => {
    if (currentStep === 1) {
      setStreetValue(form.getValues("address.street") || "");
      setNumberValue(form.getValues("address.number") || "");
      setComplementValue(form.getValues("address.complement") || "");
      setNeighborhoodValue(form.getValues("address.neighborhood") || "");
      setCityValue(form.getValues("address.city") || "");
      setStateValue(form.getValues("address.state") || "");
      setZipCodeValue(form.getValues("address.zipCode") || "");
    }
  }, [currentStep, form]);
  
  const createLaboratoryMut = useMutation({
    mutationFn: async (data: LaboratoryFormData) => {
      try {
        const response = await api.post("/api/laboratories", data);
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiError>;
        console.error(
          "Detalhes do erro da API:",
          axiosError.response?.data || axiosError.message
        );
        throw axiosError;
      }
    },
    onSuccess: () => {
      toast({
        title: "Laboratório cadastrado",
        description: "O laboratório foi cadastrado com sucesso.",
      });
      
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.LABORATORIES.ALL 
      });

      router.push("/laboratories");
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error("Erro ao cadastrar laboratório:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erro ao cadastrar laboratório. Tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    },
  });
  
  const checkCanContinue = () => {
    if (currentStep === 0) {
      return !!form.getValues("name") && 
             !!form.getValues("contactName") && 
             !!form.getValues("email") && 
             !!form.getValues("phone");
    } else if (currentStep === 1) {
      return !!streetValue && 
             !!numberValue && 
             !!neighborhoodValue && 
             !!cityValue && 
             !!stateValue && 
             !!zipCodeValue;
    }
    return true;
  };
  
  const nextStep = () => {
    if (currentStep === 0) {
      form.trigger(['name', 'contactName', 'email', 'phone']).then((isValid) => {
        if (isValid) {
          setCurrentStep(1);
        }
      });
    } else if (currentStep === 1) {
      form.setValue("address.street", streetValue);
      form.setValue("address.number", numberValue);
      form.setValue("address.complement", complementValue);
      form.setValue("address.neighborhood", neighborhoodValue);
      form.setValue("address.city", cityValue);
      form.setValue("address.state", stateValue);
      form.setValue("address.zipCode", zipCodeValue);
      
      form.trigger([
        'address.street', 
        'address.number', 
        'address.neighborhood', 
        'address.city', 
        'address.state', 
        'address.zipCode'
      ]).then((isValid) => {
        if (isValid) {
          const formData = form.getValues();
          onSubmit(formData);
        }
      });
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleStepClick = (newStep: number) => {
    if (newStep <= currentStep) {
      setCurrentStep(newStep);
      return;
    }
    
    if (newStep > currentStep) {
      nextStep();
    }
  };
  
  const onSubmit = (data: LaboratoryFormData) => {
    const enhancedData = {
      ...data,
      address: {
        street: streetValue,
        number: numberValue,
        complement: complementValue,
        neighborhood: neighborhoodValue,
        city: cityValue,
        state: stateValue,
        zipCode: zipCodeValue
      }
    };
    
    createLaboratoryMut.mutateAsync(enhancedData);
  };
  
  const steps = [
    { id: "basic", label: "Informações Básicas" },
    { id: "address", label: "Endereço" },
  ];
  
  const navigateBack = () => {
    router.push("/laboratories");
  };
  
  return {
    form,
    currentStep,
    loggedEmployee,
    steps,
    isCreating: createLaboratoryMut.isPending,
    streetValue,
    setStreetValue,
    numberValue,
    setNumberValue,
    complementValue,
    setComplementValue,
    neighborhoodValue,
    setNeighborhoodValue,
    cityValue,
    setCityValue,
    stateValue,
    setStateValue,
    zipCodeValue,
    setZipCodeValue,
    setCurrentStep,
    nextStep,
    prevStep,
    handleStepClick,
    checkCanContinue,
    onSubmit,
    navigateBack
  };
  };

  const useEditLaboratory = (id: string | null, onSuccess?: () => void) => {
    const router = useRouter();
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(0);
    const [isUpdating, setIsUpdating] = useState(false);
    const [loggedEmployee, setLoggedEmployee] = useState<LoggedEmployee | null>(null);
    
    const [streetValue, setStreetValue] = useState("");
    const [numberValue, setNumberValue] = useState("");
    const [complementValue, setComplementValue] = useState("");
    const [neighborhoodValue, setNeighborhoodValue] = useState("");
    const [cityValue, setCityValue] = useState("");
    const [stateValue, setStateValue] = useState("");
    const [zipCodeValue, setZipCodeValue] = useState("");
    
    const form = createLaboratoryForm();
    
    const laboratoryQuery = useQuery({
      queryKey: QUERY_KEYS.LABORATORIES.DETAIL(id as string),
      queryFn: () => getLaboratoryById(id as string),
      enabled: !!id,
    });
    
    // Initialize form with laboratory data when available
    useEffect(() => {
      if (laboratoryQuery.data) {
        const laboratory = laboratoryQuery.data;
        form.reset({
          name: laboratory.name,
          contactName: laboratory.contactName,
          email: laboratory.email,
          phone: laboratory.phone,
          address: laboratory.address,
          isActive: laboratory.isActive
        });
        
        // Set address values for the form
        if (laboratory.address) {
          setStreetValue(laboratory.address.street || "");
          setNumberValue(laboratory.address.number || "");
          setComplementValue(laboratory.address.complement || "");
          setNeighborhoodValue(laboratory.address.neighborhood || "");
          setCityValue(laboratory.address.city || "");
          setStateValue(laboratory.address.state || "");
          setZipCodeValue(laboratory.address.zipCode || "");
        }
      }
    }, [laboratoryQuery.data, form]);
    
    // Set logged employee data from cookies on component mount
    useEffect(() => {
      const userId = Cookies.get("userId");
      const name = Cookies.get("name");
      const email = Cookies.get("email");
      const role = Cookies.get("role");

      if (userId && name && role) {
        const userData = {
          id: userId,
          name,
          email: email || "",
          role,
        };

        setLoggedEmployee(userData);
      }
    }, []);
    
    const updateLaboratoryMut = useMutation({
      mutationFn: async ({ id, data }: { id: string; data: Partial<Laboratory> }) => {
        return updateLaboratory(id, data);
      },
      onSuccess: (result) => {
        toast({
          title: "Laboratório atualizado",
          description: "As informações do laboratório foram atualizadas com sucesso."
        });
        
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.LABORATORIES.ALL 
        });
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.LABORATORIES.DETAIL(id as string) 
        });
        
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/laboratories/${id}`);
        }
        
        return result;
      },
      onError: (error) => {
        console.error("Erro ao atualizar laboratório:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível atualizar o laboratório."
        });
      },
    });
    
    const nextStep = () => {
      if (currentStep === 0) {
        form.trigger(['name', 'contactName', 'email', 'phone']).then((isValid) => {
          if (isValid) {
            setCurrentStep(1);
            window.scrollTo(0, 0);
          }
        });
      } else if (currentStep === 1) {
        form.setValue("address.street", streetValue);
        form.setValue("address.number", numberValue);
        form.setValue("address.complement", complementValue);
        form.setValue("address.neighborhood", neighborhoodValue);
        form.setValue("address.city", cityValue);
        form.setValue("address.state", stateValue);
        form.setValue("address.zipCode", zipCodeValue);
        
        form.trigger([
          'address.street', 
          'address.number', 
          'address.neighborhood', 
          'address.city', 
          'address.state', 
          'address.zipCode'
        ]).then((isValid) => {
          if (isValid) {
            const formData = form.getValues();
            onSubmit(formData);
          }
        });
      }
    };
    
    const prevStep = () => {
      if (currentStep > 0) {
        setCurrentStep(currentStep - 1);
        window.scrollTo(0, 0);
      }
    };
    
    const handleStepClick = (newStep: number) => {
      if (newStep <= currentStep) {
        setCurrentStep(newStep);
        return;
      }
      
      if (newStep > currentStep) {
        nextStep();
      }
    };
    
    const checkCanContinue = () => {
      if (currentStep === 0) {
        return !!form.getValues("name") && 
              !!form.getValues("contactName") && 
              !!form.getValues("email") && 
              !!form.getValues("phone");
      } else if (currentStep === 1) {
        return !!streetValue && 
              !!numberValue && 
              !!neighborhoodValue && 
              !!cityValue && 
              !!stateValue && 
              !!zipCodeValue;
      }
      return true;
    };
    
    const onSubmit = (data: LaboratoryFormData) => {
      if (!id) return;
      
      setIsUpdating(true);
      
      const updatedData: Partial<Laboratory> = {
        ...data,
        address: {
          street: streetValue,
          number: numberValue,
          complement: complementValue,
          neighborhood: neighborhoodValue,
          city: cityValue,
          state: stateValue,
          zipCode: zipCodeValue
        }
      };
      
      updateLaboratoryMut.mutateAsync({ id, data: updatedData })
        .finally(() => setIsUpdating(false));
    };
    
    const navigateBack = () => {
      router.push(`/laboratories/${id}`);
    };
    
    const steps = [
      { id: "basic", label: "Informações Básicas" },
      { id: "address", label: "Endereço" },
    ];
    
    return {
      form,
      currentStep,
      loggedEmployee,
      steps,
      laboratory: laboratoryQuery.data,
      isLoading: laboratoryQuery.isLoading,
      error: laboratoryQuery.error,
      isUpdating: isUpdating || updateLaboratoryMut.isPending,
      streetValue,
      setStreetValue,
      numberValue,
      setNumberValue,
      complementValue,
      setComplementValue,
      neighborhoodValue,
      setNeighborhoodValue,
      cityValue,
      setCityValue,
      stateValue,
      setStateValue,
      zipCodeValue,
      setZipCodeValue,
      setCurrentStep,
      nextStep,
      prevStep,
      handleStepClick,
      checkCanContinue,
      onSubmit,
      navigateBack
    };
  };

  const updateFilters = (newFilters: LaboratoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handleCreateLaboratory = (data: Omit<Laboratory, "_id">) => {
    return createLaboratoryMutation.mutateAsync(data);
  };

  const handleUpdateLaboratory = (id: string, data: Partial<Laboratory>) => {
    return updateLaboratoryMutation.mutateAsync({ id, data });
  };

  const handleToggleLaboratoryStatus = (id: string) => {
    return toggleLaboratoryStatusMutation.mutateAsync(id);
  };

  const handleDeleteLaboratory = (id: string) => {
    return deleteLaboratoryMutation.mutateAsync(id);
  };

  const navigateToLaboratoryDetails = (id: string) => {
    router.push(`/laboratories/${id}`);
  };

  const navigateToCreateLaboratory = () => {
    router.push("/laboratories/new");
  };

  const navigateToEditLaboratory = (id: string) => {
    router.push(`/laboratories/${id}/edit`);
  };

  const formatAddress = (address: Laboratory["address"]) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  const getLaboratoryName = useCallback((id: string): string => {
    if (typeof id === 'string' && id.includes('ObjectId')) {
      try {
        const matches = id.match(/ObjectId\('([^']+)'\)/);
        if (matches && matches[1]) {
          id = matches[1];
        }
      } catch (err) {
        console.error("Erro ao extrair ID do laboratório:", err);
      }
    }
    
    const lab = laboratories.find(lab => lab._id === id);
    return lab ? lab.name : "Laboratório não encontrado";
  }, [laboratories]);


  return {
    laboratories,
    isLoading,
    error: error ? String(error) : null,
    currentPage,
    totalPages,
    totalLaboratories,
    filters,
    isCreating: createLaboratoryMutation.isPending,
    isUpdating: updateLaboratoryMutation.isPending,
    isTogglingStatus: toggleLaboratoryStatusMutation.isPending,
    isDeleting: deleteLaboratoryMutation.isPending,
    setCurrentPage,
    updateFilters,
    fetchLaboratoryById,
    useLaboratoryDetails,
    useCreateLaboratory,
    useLaboratoriesList,
    useEditLaboratory,
    getLaboratoryName,
    handleCreateLaboratory,
    handleUpdateLaboratory,
    handleToggleLaboratoryStatus,
    handleDeleteLaboratory,
    navigateToLaboratoryDetails,
    navigateToCreateLaboratory,
    navigateToEditLaboratory,
    formatAddress,
    refetch,
  };
}
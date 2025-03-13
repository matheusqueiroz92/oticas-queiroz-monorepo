import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  getAllLaboratories,
  getLaboratoryById,
  createLaboratory,
  updateLaboratory,
  toggleLaboratoryStatus,
  deleteLaboratory,
} from "@/app/services/laboratory";
import type { Laboratory } from "@/app/types/laboratory";

interface LaboratoryFilters {
  search?: string;
  page?: number;
  isActive?: boolean;
}

export function useLaboratories() {
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [currentLaboratory, setCurrentLaboratory] = useState<Laboratory | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLaboratories, setTotalLaboratories] = useState(0);
  const [filters, setFilters] = useState<LaboratoryFilters>({});

  const router = useRouter();
  const { toast } = useToast();

  const fetchLaboratories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parâmetros de busca
      const params = {
        page: currentPage,
        ...filters,
      };

      // Buscar todos os laboratórios
      const { laboratories: fetchedLaboratories, pagination } =
        await getAllLaboratories(params);

      setLaboratories(fetchedLaboratories);

      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalLaboratories(pagination.total || fetchedLaboratories.length);
      } else {
        setTotalPages(1);
        setTotalLaboratories(fetchedLaboratories.length);
      }
    } catch (error: unknown) {
      console.error("Erro ao buscar laboratórios:", error);

      // Se for um erro de Axios, podemos verificar o status e a mensagem
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: { status?: number; data?: { message?: string } };
        };

        // Se for um erro 404 específico, apenas definimos uma lista vazia
        if (
          axiosError.response?.status === 404 &&
          axiosError.response?.data?.message === "Nenhum laboratório encontrado"
        ) {
          setLaboratories([]);
        } else {
          setError("Não foi possível carregar os laboratórios.");
        }
      } else {
        setError("Não foi possível carregar os laboratórios.");
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchLaboratories();
  }, [fetchLaboratories]);

  const fetchLaboratoryById = async (
    id: string
  ): Promise<Laboratory | null> => {
    try {
      setLoading(true);
      setError(null);

      const laboratory = await getLaboratoryById(id);

      if (laboratory) {
        setCurrentLaboratory(laboratory);
        return laboratory;
      }
      setError("Laboratório não encontrado.");
      return null;
    } catch (error) {
      console.error(`Erro ao buscar laboratório com ID ${id}:`, error);
      setError("Não foi possível carregar os detalhes do laboratório.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLaboratory = async (
    data: Omit<Laboratory, "_id">
  ): Promise<Laboratory | null> => {
    try {
      setLoading(true);
      const newLaboratory = await createLaboratory(data);

      toast({
        title: "Laboratório criado",
        description: "O laboratório foi criado com sucesso.",
      });

      return newLaboratory;
    } catch (error) {
      console.error("Erro ao criar laboratório:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Não foi possível criar o laboratório.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLaboratory = async (
    id: string,
    data: Partial<Laboratory>
  ): Promise<Laboratory | null> => {
    try {
      setLoading(true);
      const updatedLaboratory = await updateLaboratory(id, data);

      toast({
        title: "Laboratório atualizado",
        description: "O laboratório foi atualizado com sucesso.",
      });

      if (currentLaboratory?._id === id) {
        setCurrentLaboratory(updatedLaboratory);
      }

      return updatedLaboratory;
    } catch (error) {
      console.error(`Erro ao atualizar laboratório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o laboratório.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLaboratoryStatus = async (
    id: string
  ): Promise<Laboratory | null> => {
    try {
      setLoading(true);
      const updatedLaboratory = await toggleLaboratoryStatus(id);

      const statusText = updatedLaboratory.isActive ? "ativado" : "desativado";
      toast({
        title: "Status atualizado",
        description: `Laboratório ${statusText} com sucesso.`,
      });

      if (currentLaboratory?._id === id) {
        setCurrentLaboratory(updatedLaboratory);
      }

      return updatedLaboratory;
    } catch (error) {
      console.error(
        `Erro ao alternar status do laboratório com ID ${id}:`,
        error
      );
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar o status do laboratório.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLaboratory = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await deleteLaboratory(id);

      toast({
        title: "Laboratório excluído",
        description: "O laboratório foi excluído com sucesso.",
      });

      if (currentLaboratory?._id === id) {
        setCurrentLaboratory(null);
      }

      fetchLaboratories();
      return true;
    } catch (error) {
      console.error(`Erro ao excluir laboratório com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível excluir o laboratório.",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: LaboratoryFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Função para navegar para a página de detalhes do laboratório
  const navigateToLaboratoryDetails = (id: string) => {
    router.push(`/laboratories/${id}`);
  };

  // Função para navegar para a página de criação de laboratório
  const navigateToCreateLaboratory = () => {
    router.push("/laboratories/new");
  };

  // Função para navegar para a página de edição de laboratório
  const navigateToEditLaboratory = (id: string) => {
    router.push(`/laboratories/${id}/edit`);
  };

  // Função para formatar endereço completo
  const formatAddress = (address: Laboratory["address"]) => {
    return `${address.street}, ${address.number}${address.complement ? `, ${address.complement}` : ""} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  return {
    laboratories,
    currentLaboratory,
    loading,
    error,
    currentPage,
    totalPages,
    totalLaboratories,
    filters,
    setCurrentPage,
    updateFilters,
    fetchLaboratories,
    fetchLaboratoryById,
    handleCreateLaboratory,
    handleUpdateLaboratory,
    handleToggleLaboratoryStatus,
    handleDeleteLaboratory,
    navigateToLaboratoryDetails,
    navigateToCreateLaboratory,
    navigateToEditLaboratory,
    formatAddress,
  };
}

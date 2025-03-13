"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import {
  getAllPayments,
  getPaymentById,
  createPayment,
  cancelPayment,
  getPaymentsByCashRegister,
} from "@/app/services/paymentService";
import { checkOpenCashRegister } from "@/app/services/cashRegisterService";
import type {
  IPayment,
  CreatePaymentDTO,
  PaymentType,
  PaymentStatus,
} from "@/app/types/payment";

interface PaymentFilters {
  search?: string;
  page?: number;
  type?: PaymentType;
  paymentMethod?: string;
  status?: PaymentStatus;
  startDate?: string;
  endDate?: string;
}

export function usePayments() {
  const [payments, setPayments] = useState<IPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPayments, setTotalPayments] = useState(0);
  const [currentPayment, setCurrentPayment] = useState<IPayment | null>(null);
  const [filters, setFilters] = useState<PaymentFilters>({});

  const router = useRouter();
  const { toast } = useToast();

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Preparar parâmetros de busca
      const params = {
        page: currentPage,
        ...filters,
      };

      // Buscar todos os pagamentos
      const { payments: fetchedPayments, pagination } =
        await getAllPayments(params);

      setPayments(fetchedPayments);

      if (pagination) {
        setTotalPages(pagination.totalPages || 1);
        setTotalPayments(pagination.total || fetchedPayments.length);
      } else {
        setTotalPages(1);
        setTotalPayments(fetchedPayments.length);
      }
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error);
      setError("Não foi possível carregar os pagamentos.");
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Função para buscar um pagamento específico
  const fetchPaymentById = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const payment = await getPaymentById(id);

      if (payment) {
        setCurrentPayment(payment);
        return payment;
      }
      setError("Pagamento não encontrado.");
      return null;
    } catch (error) {
      console.error(`Erro ao buscar pagamento com ID ${id}:`, error);
      setError("Não foi possível carregar os detalhes do pagamento.");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para verificar se há um caixa aberto antes de criar um pagamento
  const checkForOpenCashRegisterBeforePayment = async (): Promise<
    string | null
  > => {
    try {
      const result = await checkOpenCashRegister();

      if (result.isOpen && result.data) {
        return result.data._id;
      }

      // Notificar que não há caixa aberto
      toast({
        variant: "destructive",
        title: "Nenhum caixa aberto",
        description:
          "É necessário abrir um caixa antes de registrar pagamentos.",
      });

      return null;
    } catch (error) {
      console.error("Erro ao verificar status do caixa:", error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível verificar o status do caixa.",
      });

      return null;
    }
  };

  // Função para criar um novo pagamento
  const handleCreatePayment = async (data: CreatePaymentDTO) => {
    try {
      // Verificar se há um caixa aberto e obter seu ID
      const cashRegisterId = await checkForOpenCashRegisterBeforePayment();

      if (!cashRegisterId) {
        // Se não houver caixa aberto, redirecionar para abrir um
        router.push("/cash-register/open");
        return null;
      }

      setLoading(true);

      // Adicionar o ID do caixa aos dados do pagamento
      const paymentData = {
        ...data,
        cashRegisterId,
      };

      const result = await createPayment(paymentData);

      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });

      // Recarregar a lista após a criação
      fetchPayments();

      return result;
    } catch (error) {
      console.error("Erro ao criar pagamento:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description:
          "Não foi possível registrar o pagamento. Verifique as informações e tente novamente.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para cancelar um pagamento
  const handleCancelPayment = async (id: string) => {
    try {
      setLoading(true);

      const result = await cancelPayment(id);

      if (result) {
        toast({
          title: "Pagamento cancelado",
          description: "O pagamento foi cancelado com sucesso.",
        });

        // Atualizar o pagamento atual se estiver visualizando-o
        if (currentPayment && currentPayment._id === id) {
          setCurrentPayment({
            ...currentPayment,
            status: "cancelled",
          });
        }

        // Atualizar a lista de pagamentos
        fetchPayments();

        return result;
      }
      throw new Error("Não foi possível cancelar o pagamento.");
    } catch (error) {
      console.error(`Erro ao cancelar pagamento com ID ${id}:`, error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível cancelar o pagamento.",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar pagamentos de um caixa específico
  const fetchPaymentsByCashRegister = async (cashRegisterId: string) => {
    try {
      setLoading(true);

      const cashRegisterPayments =
        await getPaymentsByCashRegister(cashRegisterId);

      return cashRegisterPayments;
    } catch (error) {
      console.error(
        `Erro ao buscar pagamentos do caixa ${cashRegisterId}:`,
        error
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Função para atualizar filtros
  const updateFilters = (newFilters: PaymentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Voltar para a primeira página ao filtrar
  };

  // Função para navegar para detalhes do pagamento
  const navigateToPaymentDetails = (id: string) => {
    router.push(`/payments/${id}`);
  };

  // Função para navegar para a página de criação de pagamento
  const navigateToCreatePayment = () => {
    router.push("/payments/new");
  };

  return {
    payments,
    currentPayment,
    loading,
    error,
    currentPage,
    totalPages,
    totalPayments,
    filters,
    setCurrentPage,
    updateFilters,
    fetchPayments,
    fetchPaymentById,
    handleCreatePayment,
    handleCancelPayment,
    fetchPaymentsByCashRegister,
    navigateToPaymentDetails,
    navigateToCreatePayment,
    checkForOpenCashRegisterBeforePayment,
  };
}

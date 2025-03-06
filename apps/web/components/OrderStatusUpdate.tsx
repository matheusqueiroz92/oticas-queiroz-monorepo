import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/app/services/auth";
import type { AxiosError } from "axios";

// Interface para o pedido
interface OrderDetail {
  _id: string;
  status: string;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Props do componente
interface OrderStatusUpdateProps {
  order: OrderDetail;
  onUpdateSuccess: () => void;
}

// Schema para validação - apenas para status
const updateStatusSchema = z.object({
  status: z.string().min(1, "Status é obrigatório"),
});

type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;

export default function OrderStatusUpdate({
  order,
  onUpdateSuccess,
}: OrderStatusUpdateProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  // Inicializar o formulário apenas com o campo de status
  const form = useForm<UpdateStatusFormData>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: order.status || "pending",
    },
  });

  // Mutation para atualizar o status do pedido
  const updateOrderStatus = useMutation({
    mutationFn: async (data: UpdateStatusFormData) => {
      try {
        // Enviar apenas o campo status
        const response = await api.put(`/api/orders/${order._id}/status`, {
          status: data.status,
        });
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
        title: "Status atualizado",
        description: "O status do pedido foi atualizado com sucesso.",
      });
      setOpen(false);
      onUpdateSuccess();
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error("Erro ao atualizar status do pedido:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erro ao atualizar status. Tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    },
  });

  // Função de submissão do formulário
  function onSubmit(data: UpdateStatusFormData) {
    updateOrderStatus.mutate(data);
  }

  // Tradução de status para exibição
  const translateStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: "Pendente",
      in_production: "Em Produção",
      ready: "Pronto",
      delivered: "Entregue",
    };

    return statusMap[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Alterar Status</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Atualizar Status do Pedido</DialogTitle>
          <DialogDescription>
            Atualize o status atual do pedido
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Status Atual:{" "}
                    <span className="font-medium">
                      {translateStatus(order.status)}
                    </span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o novo status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="in_production">Em Produção</SelectItem>
                      <SelectItem value="ready">Pronto</SelectItem>
                      <SelectItem value="delivered">Entregue</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={updateOrderStatus.isPending}>
                {updateOrderStatus.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Atualizar Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

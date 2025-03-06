import { useState, useEffect } from "react";
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

// Interface para laboratório
interface Laboratory {
  _id: string;
  name: string;
  isActive: boolean;
}

// Interface para o pedido
interface OrderDetail {
  _id: string;
  status: string;
  laboratoryId?: string;
  glassesType?: string;
  // Outros campos que podem ser usados...
  paymentMethod: string;
  totalPrice: number;
}

interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

// Props do componente
interface OrderLaboratoryUpdateProps {
  order: OrderDetail;
  onUpdateSuccess: () => void;
}

// Schema para validação - agora APENAS com laboratório
const updateLaboratorySchema = z.object({
  laboratoryId: z.string().min(1, "Laboratório é obrigatório"),
});

type UpdateLaboratoryFormData = z.infer<typeof updateLaboratorySchema>;

export default function OrderLaboratoryUpdate({
  order,
  onUpdateSuccess,
}: OrderLaboratoryUpdateProps) {
  const [open, setOpen] = useState(false);
  const [laboratories, setLaboratories] = useState<Laboratory[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Inicializar o formulário apenas com o campo de laboratório
  const form = useForm<UpdateLaboratoryFormData>({
    resolver: zodResolver(updateLaboratorySchema),
    defaultValues: {
      laboratoryId: order.laboratoryId || "",
    },
  });

  // Buscar lista de laboratórios ativos
  useEffect(() => {
    const fetchLaboratories = async () => {
      try {
        setLoading(true);
        // Buscar apenas laboratórios ativos
        const response = await api.get("/api/laboratories", {
          params: { isActive: true },
        });

        // Verificar o formato da resposta
        let labData: Laboratory[] = [];
        if (Array.isArray(response.data)) {
          labData = response.data;
        } else if (
          response.data?.laboratories &&
          Array.isArray(response.data.laboratories)
        ) {
          labData = response.data.laboratories;
        }

        setLaboratories(labData.filter((lab) => lab.isActive));
      } catch (error) {
        console.error("Erro ao buscar laboratórios:", error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível carregar a lista de laboratórios.",
        });
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchLaboratories();
    }
  }, [open, toast]);

  // Mutation para atualizar apenas o laboratório do pedido
  const updateOrderLaboratory = useMutation({
    mutationFn: async (data: UpdateLaboratoryFormData) => {
      try {
        // Enviar apenas o campo laboratoryId
        const response = await api.put(`/api/orders/${order._id}/laboratory`, {
          laboratoryId: data.laboratoryId,
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
        title: "Laboratório atualizado",
        description: "O laboratório do pedido foi atualizado com sucesso.",
      });
      setOpen(false);
      onUpdateSuccess();
    },
    onError: (error: AxiosError<ApiError>) => {
      console.error("Erro ao atualizar laboratório do pedido:", error);

      const errorMessage =
        error.response?.data?.message ||
        "Erro ao atualizar laboratório. Tente novamente.";

      toast({
        variant: "destructive",
        title: "Erro",
        description: errorMessage,
      });
    },
  });

  // Função de submissão do formulário
  function onSubmit(data: UpdateLaboratoryFormData) {
    updateOrderLaboratory.mutate(data);
  }

  // Só mostrar o botão para atualizar se for óculos de grau
  if (order.glassesType !== "prescription") {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          {order.laboratoryId ? "Alterar Laboratório" : "Associar Laboratório"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {order.laboratoryId
              ? "Alterar Laboratório"
              : "Associar Laboratório"}
          </DialogTitle>
          <DialogDescription>
            Selecione o laboratório que confeccionará os óculos.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="laboratoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Laboratório</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um laboratório" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {laboratories.length > 0 ? (
                          laboratories.map((lab) => (
                            <SelectItem key={lab._id} value={lab._id}>
                              {lab.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-sm text-muted-foreground">
                            Nenhum laboratório ativo encontrado
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="pt-4">
                <Button
                  type="submit"
                  disabled={
                    updateOrderLaboratory.isPending || laboratories.length === 0
                  }
                >
                  {updateOrderLaboratory.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Salvar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}

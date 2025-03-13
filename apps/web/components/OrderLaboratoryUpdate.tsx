import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { api } from "@/app/services/auth";
import { useOrders } from "@/hooks/useOrders";
import { API_ROUTES } from "../app/constants/api-routes";

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
  glassesType: string;
  laboratoryId?: string;
}

// Props do componente
interface OrderLaboratoryUpdateProps {
  order: OrderDetail;
  onUpdateSuccess: () => void;
}

// Schema para validação
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
  const { handleUpdateOrderLaboratory } = useOrders();

  // Inicializar o formulário
  const form = useForm<UpdateLaboratoryFormData>({
    resolver: zodResolver(updateLaboratorySchema),
    defaultValues: {
      laboratoryId: order.laboratoryId || "",
    },
  });

  // Buscar lista de laboratórios ativos
  useEffect(() => {
    const fetchLaboratories = async () => {
      if (!open) return;

      try {
        setLoading(true);
        // Buscar apenas laboratórios ativos
        const response = await api.get(API_ROUTES.LABORATORIES.ACTIVE);

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
      } finally {
        setLoading(false);
      }
    };

    fetchLaboratories();
  }, [open]);

  // Função de submissão do formulário
  async function onSubmit(data: UpdateLaboratoryFormData) {
    try {
      setLoading(true);
      const result = await handleUpdateOrderLaboratory(
        order._id,
        data.laboratoryId
      );
      if (result) {
        setOpen(false);
        onUpdateSuccess();
      }
    } finally {
      setLoading(false);
    }
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
                  disabled={loading || laboratories.length === 0}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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

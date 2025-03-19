import { useState } from "react";
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
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/useToast";

// Interface para o pedido
interface OrderDetail {
  _id: string;
  status: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { handleUpdateOrderStatus, translateOrderStatus } = useOrders();
  const { toast } = useToast();

  // Inicializar o formulário apenas com o campo de status
  const form = useForm<UpdateStatusFormData>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: order.status || "pending",
    },
  });

  // Função de submissão do formulário
  async function onSubmit(data: UpdateStatusFormData) {
    // Se o status não mudou, não fazer nada
    if (data.status === order.status) {
      toast({
        description: "Nenhuma alteração foi feita no status.",
      });
      setOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await handleUpdateOrderStatus(order._id, data.status);
      if (result) {
        toast({
          title: "Status atualizado",
          description: `O pedido foi atualizado para ${translateOrderStatus(data.status)}.`,
        });
        setOpen(false);
        onUpdateSuccess();
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

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
                      {translateOrderStatus(order.status)}
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
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
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
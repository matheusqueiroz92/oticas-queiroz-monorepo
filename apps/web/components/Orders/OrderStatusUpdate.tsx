import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, AlertTriangle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

interface OrderDetail {
  _id: string;
  status: string;
  laboratoryId?: string | null;
}

interface OrderStatusUpdateProps {
  order: OrderDetail;
  onUpdateSuccess: () => void;
}

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { handleUpdateOrderStatus, translateOrderStatus } = useOrders();
  const { toast } = useToast();

  const form = useForm<UpdateStatusFormData>({
    resolver: zodResolver(updateStatusSchema),
    defaultValues: {
      status: order.status || "pending",
    },
  });

  // Verificar se o status selecionado é "in_production" e não há laboratório
  const selectedStatus = form.watch("status");
  const showLaboratoryWarning = 
    order.status === "pending" && 
    selectedStatus === "in_production" && 
    !order.laboratoryId;

  async function onSubmit(data: UpdateStatusFormData) {
    if (data.status === order.status) {
      toast({
        description: "Nenhuma alteração foi feita no status.",
      });
      setOpen(false);
      return;
    }

    // Verificar se está tentando mudar para "em produção" sem laboratório
    if (order.status === "pending" && data.status === "in_production" && !order.laboratoryId) {
      setErrorMessage("Não é possível alterar o status para Em Produção sem associar um laboratório ao pedido.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
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
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      setErrorMessage(error.message || "Não foi possível atualizar o status do pedido.");
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

            {showLaboratoryWarning && (
              <Alert variant="destructive" className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700 text-sm">
                  Para alterar o status para 'Em Produção', é necessário associar um laboratório 
                  a este pedido primeiro.
                </AlertDescription>
              </Alert>
            )}

            {errorMessage && (
              <Alert variant="destructive" className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700 text-sm">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <DialogFooter className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting || showLaboratoryWarning}
              >
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
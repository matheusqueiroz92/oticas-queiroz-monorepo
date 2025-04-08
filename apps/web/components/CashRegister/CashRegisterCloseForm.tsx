import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { type UseFormReturn } from "react-hook-form";
import type { CloseCashRegisterFormValues } from "@/schemas/cash-register-schema";
import type { ICashRegister } from "@/app/types/cash-register";
import { formatCurrency } from "@/app/utils/formatters";

interface CashRegisterCloseFormProps {
  form: UseFormReturn<CloseCashRegisterFormValues>;
  cashRegister: ICashRegister;
  isSubmitting: boolean;
  difference: number | null;
  showConfirmDialog: boolean;
  setShowConfirmDialog: (show: boolean) => void;
  onSubmit: (data: CloseCashRegisterFormValues) => void;
  onConfirmClose: () => void;
  onCancel: () => void;
}

export function CashRegisterCloseForm({
  form,
  cashRegister,
  isSubmitting,
  difference,
  showConfirmDialog,
  setShowConfirmDialog,
  onSubmit,
  onConfirmClose,
  onCancel,
}: CashRegisterCloseFormProps) {
  
  const hasDifference = difference !== null && Math.abs(difference) > 0.001; // Usar uma pequena margem para evitar problemas de arredondamento

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Fechamento de Caixa</CardTitle>
          <CardDescription>
            Informe o valor final em dinheiro para fechar o caixa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="closingBalance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Final em Caixa (R$) *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input
                          placeholder="0,00"
                          className="pl-10"
                          {...field}
                          value={
                            field.value !== undefined
                              ? String(field.value).replace(".", ",")
                              : ""
                          }
                          onChange={(e) => {
                            const value = e.target.value.replace(
                              /[^0-9,.]/g,
                              ""
                            );
                            field.onChange(
                              value === ""
                                ? 0
                                : Number.parseFloat(value.replace(",", "."))
                            );
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Este valor deve representar o montante físico em dinheiro
                      presente no caixa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasDifference && (
                <Alert
                  variant={
                    difference && difference < 0 ? "destructive" : "default"
                  }
                  className="my-4"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>
                    {difference && difference < 0
                      ? "Falta dinheiro no caixa!"
                      : "Sobra de dinheiro no caixa!"}
                  </AlertTitle>
                  <AlertDescription>
                    {difference && difference < 0
                      ? `Há uma diferença negativa de ${formatCurrency(Math.abs(difference))}. Verifique se houve erro na contagem ou possível desvio.`
                      : `Há uma diferença positiva de ${formatCurrency(difference || 0)}. Verifique se houve erro na contagem ou registro de vendas.`}
                  </AlertDescription>
                </Alert>
              )}

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observações sobre o fechamento do caixa..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Adicione informações relevantes sobre o fechamento do
                      caixa, especialmente se houver diferenças no valor.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  Fechar Caixa
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Fechamento de Caixa</AlertDialogTitle>
            <AlertDialogDescription>
              {hasDifference
                ? "Há uma diferença entre o valor esperado e o valor informado. Deseja continuar?"
                : "Confirme o fechamento do caixa."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Saldo Esperado:</span>
                <span className="font-medium">
                  {formatCurrency(cashRegister.currentBalance)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Saldo Informado:</span>
                <span className="font-medium">
                  {formatCurrency(form.getValues("closingBalance") || 0)}
                </span>
              </div>

              {hasDifference && (
                <>
                  <Separator className="my-2" />
                  <div className="flex justify-between">
                    <span>Diferença:</span>
                    <span
                      className={`font-bold ${difference && difference < 0 ? "text-red-600" : "text-green-600"}`}
                    >
                      {formatCurrency(difference || 0)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmClose}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                "Confirmar Fechamento"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
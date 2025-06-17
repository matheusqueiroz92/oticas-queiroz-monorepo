import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, DollarSign, Calendar } from "lucide-react";
import { type UseFormReturn } from "react-hook-form";
import type { OpenCashRegisterFormValues } from "@/schemas/cash-register-schema";

interface CashRegisterOpenFormProps {
  form: UseFormReturn<OpenCashRegisterFormValues>;
  isSubmitting: boolean;
  onSubmit: (data: OpenCashRegisterFormValues) => void;
  onCancel: () => void;
  hasCashRegisterOpen: boolean;
}

export function CashRegisterOpenForm({
  form,
  isSubmitting,
  onSubmit,
  onCancel,
  hasCashRegisterOpen,
}: CashRegisterOpenFormProps) {
  if (hasCashRegisterOpen) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">Caixa já aberto</CardTitle>
          <CardDescription className="text-red-700">
            Já existe um caixa aberto no sistema. Você precisa fechar o caixa
            atual antes de abrir um novo.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            onClick={onCancel}
            className="mr-2"
          >
            Voltar
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Abertura de Caixa</CardTitle>
        <CardDescription>
          Informe o saldo inicial e observações para abrir o caixa.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-blue-50 p-4 rounded-md mb-6 flex items-center space-x-3">
          <Calendar className="h-5 w-5 text-blue-600" />
          <div>
            <div className="text-sm text-blue-600 font-medium">
              Data de Abertura
            </div>
            <div className="text-blue-700">
              {format(new Date(), "PPP", { locale: ptBR })} às{" "}
              {format(new Date(), "HH:mm", { locale: ptBR })}
            </div>
          </div>
        </div>

        <Form {...form}>
          <form
            id="openCashRegisterForm"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <FormField
              control={form.control}
              name="openingBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Saldo Inicial (R$)</FormLabel>
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
                    Valor em dinheiro disponível no início do dia
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações sobre a abertura do caixa (opcional)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          form="openCashRegisterForm"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processando...
            </>
          ) : (
            "Abrir Caixa"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
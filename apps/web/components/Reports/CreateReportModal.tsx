"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  reportTypeOptions,
  reportFormatOptions,
  orderStatusOptions,
  paymentMethodOptions,
  productCategoryOptions,
} from "@/app/types/report";
import { cn } from "../../lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { reportService } from "@/app/services/reportService";
import { useToast } from "@/hooks/useToast";

// Esquema de validação para o formulário
const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  type: z.enum(["sales", "inventory", "customers", "orders", "financial"]),
  format: z.enum(["json", "pdf", "excel", "csv"]).default("excel"),
  filters: z.object({
    // Usamos nullable() para o formulário permitir null nos campos de data,
    // mas esses valores serão convertidos para undefined quando enviados para a API
    startDate: z.date().optional().nullable(),
    endDate: z.date().optional().nullable(),
    status: z.array(z.string()).optional(),
    paymentMethod: z.array(z.string()).optional(),
    productCategory: z.array(z.string()).optional(),
    minValue: z.number().optional().nullable(),
    maxValue: z.number().optional().nullable(),
  }),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateReportModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateReportModalProps) {
  const [activeFilterTab, setActiveFilterTab] = useState("date");
  const { toast } = useToast();

  // Inicializar formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      type: "sales",
      format: "excel",
      filters: {
        startDate: null,
        endDate: null,
        status: [],
        paymentMethod: [],
        productCategory: [],
        minValue: null,
        maxValue: null,
      },
    },
  });

  // Mutation para criar relatório
  const createReportMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Formatar dados para a API
      const reportData = {
        name: data.name,
        type: data.type,
        format: data.format,
        filters: {
          // Converter valores null para undefined
          startDate: data.filters.startDate || undefined,
          endDate: data.filters.endDate || undefined,
          // Converter arrays vazios para undefined
          status: data.filters.status?.length ? data.filters.status : undefined,
          paymentMethod: data.filters.paymentMethod?.length
            ? data.filters.paymentMethod
            : undefined,
          productCategory: data.filters.productCategory?.length
            ? data.filters.productCategory
            : undefined,
          // Converter null para undefined
          minValue:
            data.filters.minValue !== null ? data.filters.minValue : undefined,
          maxValue:
            data.filters.maxValue !== null ? data.filters.maxValue : undefined,
        },
      };

      return reportService.createReport(reportData);
    },
    onSuccess: () => {
      form.reset();
      onSuccess();
    },
    onError: (error) => {
      console.error("Erro ao criar relatório:", error);
      toast({
        title: "Erro ao criar relatório",
        description: "Ocorreu um erro ao criar o relatório. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Manipulador de envio do formulário
  const onSubmit = (data: FormValues) => {
    // A mutação vai converter os tipos apropriadamente:
    // - null para undefined nos campos de data
    // - arrays vazios para undefined
    // - valores null numéricos para undefined
    createReportMutation.mutate(data);
  };

  // Resetar formulário quando o modal fechar
  const handleClose = () => {
    if (!createReportMutation.isPending) {
      form.reset();
      onClose();
    }
  };

  // Função auxiliar para obter filtros aplicáveis a um tipo de relatório
  const getApplicableFilters = (type: string) => {
    switch (type) {
      case "sales":
        return ["date", "payment"];
      case "inventory":
        return ["product"];
      case "customers":
        return ["date"];
      case "orders":
        return ["date", "status", "payment"];
      case "financial":
        return ["date", "payment", "value"];
      default:
        return ["date"];
    }
  };

  const reportType = form.watch("type");
  const applicableFilters = getApplicableFilters(reportType);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Relatório</DialogTitle>
          <DialogDescription>
            Defina as informações e filtros para gerar um novo relatório
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome do Relatório */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Relatório</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do relatório" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Relatório */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Relatório</FormLabel>
                    <Select
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Resetar para a primeira aba de filtro aplicável
                        const filters = getApplicableFilters(value);
                        setActiveFilterTab(filters[0] || "date");
                      }}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {reportTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      O tipo determina quais dados serão incluídos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Formato de Saída */}
            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Formato de Saída</FormLabel>
                  <div className="flex flex-wrap gap-3">
                    {reportFormatOptions.map((option) => (
                      <FormItem
                        key={option.value}
                        className="flex items-center space-x-2"
                      >
                        <FormControl>
                          <div
                            className={cn(
                              "cursor-pointer px-4 py-2 rounded-md border",
                              field.value === option.value
                                ? "bg-primary text-primary-foreground border-primary"
                                : "bg-background hover:bg-muted"
                            )}
                            onClick={() => field.onChange(option.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                field.onChange(option.value);
                              }
                            }}
                          >
                            {option.label}
                          </div>
                        </FormControl>
                      </FormItem>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção de Filtros */}
            <div className="border rounded-md">
              <div className="p-4 border-b bg-muted/50">
                <h3 className="font-medium">Filtros do Relatório</h3>
                <p className="text-sm text-muted-foreground">
                  Defina filtros para personalizar os dados do relatório
                </p>
              </div>

              <Tabs
                value={activeFilterTab}
                onValueChange={setActiveFilterTab}
                className="p-4"
              >
                <TabsList>
                  {applicableFilters.includes("date") && (
                    <TabsTrigger value="date">Período</TabsTrigger>
                  )}
                  {applicableFilters.includes("status") && (
                    <TabsTrigger value="status">Status</TabsTrigger>
                  )}
                  {applicableFilters.includes("payment") && (
                    <TabsTrigger value="payment">Pagamento</TabsTrigger>
                  )}
                  {applicableFilters.includes("product") && (
                    <TabsTrigger value="product">Produto</TabsTrigger>
                  )}
                  {applicableFilters.includes("value") && (
                    <TabsTrigger value="value">Valor</TabsTrigger>
                  )}
                </TabsList>

                {/* Filtro de Período */}
                {applicableFilters.includes("date") && (
                  <TabsContent value="date" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Data Inicial */}
                      <FormField
                        control={form.control}
                        name="filters.startDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data Inicial</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", {
                                        locale: ptBR,
                                      })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    const endDate =
                                      form.getValues("filters.endDate");
                                    return endDate ? date > endDate : false;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Data Final */}
                      <FormField
                        control={form.control}
                        name="filters.endDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Data Final</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "dd/MM/yyyy", {
                                        locale: ptBR,
                                      })
                                    ) : (
                                      <span>Selecione uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent
                                className="w-auto p-0"
                                align="start"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value || undefined}
                                  onSelect={field.onChange}
                                  disabled={(date) => {
                                    const startDate =
                                      form.getValues("filters.startDate");
                                    return startDate ? date < startDate : false;
                                  }}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                )}

                {/* Filtro de Status */}
                {applicableFilters.includes("status") && (
                  <TabsContent value="status" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="filters.status"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel>Status dos Pedidos</FormLabel>
                            <FormDescription>
                              Selecione os status que deseja incluir no
                              relatório
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {orderStatusOptions.map((option) => (
                              <FormField
                                key={option.value}
                                control={form.control}
                                name="filters.status"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option.value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            option.value
                                          )}
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value || [];
                                            const newValues = checked
                                              ? [...currentValues, option.value]
                                              : currentValues.filter(
                                                  (value) =>
                                                    value !== option.value
                                                );
                                            field.onChange(newValues);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {option.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                )}

                {/* Filtro de Método de Pagamento */}
                {applicableFilters.includes("payment") && (
                  <TabsContent value="payment" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="filters.paymentMethod"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel>Métodos de Pagamento</FormLabel>
                            <FormDescription>
                              Selecione os métodos de pagamento a incluir
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {paymentMethodOptions.map((option) => (
                              <FormField
                                key={option.value}
                                control={form.control}
                                name="filters.paymentMethod"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option.value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            option.value
                                          )}
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value || [];
                                            const newValues = checked
                                              ? [...currentValues, option.value]
                                              : currentValues.filter(
                                                  (value) =>
                                                    value !== option.value
                                                );
                                            field.onChange(newValues);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {option.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                )}

                {/* Filtro de Categoria de Produto */}
                {applicableFilters.includes("product") && (
                  <TabsContent value="product" className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="filters.productCategory"
                      render={() => (
                        <FormItem>
                          <div className="mb-2">
                            <FormLabel>Categorias de Produto</FormLabel>
                            <FormDescription>
                              Selecione as categorias a incluir no relatório
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {productCategoryOptions.map((option) => (
                              <FormField
                                key={option.value}
                                control={form.control}
                                name="filters.productCategory"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={option.value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(
                                            option.value
                                          )}
                                          onCheckedChange={(checked) => {
                                            const currentValues =
                                              field.value || [];
                                            const newValues = checked
                                              ? [...currentValues, option.value]
                                              : currentValues.filter(
                                                  (value) =>
                                                    value !== option.value
                                                );
                                            field.onChange(newValues);
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="text-sm font-normal cursor-pointer">
                                        {option.label}
                                      </FormLabel>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                )}

                {/* Filtro de Faixa de Valor */}
                {applicableFilters.includes("value") && (
                  <TabsContent value="value" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="filters.minValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Mínimo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0.00"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                    ? Number.parseFloat(e.target.value)
                                    : null;
                                  field.onChange(value);
                                }}
                                value={field.value === null ? "" : field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="filters.maxValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Máximo</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1000.00"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value
                                    ? Number.parseFloat(e.target.value)
                                    : null;
                                  field.onChange(value);
                                }}
                                value={field.value === null ? "" : field.value}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={createReportMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createReportMutation.isPending}>
                {createReportMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Relatório"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

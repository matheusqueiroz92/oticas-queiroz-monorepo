"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

import {
  reportTypeMap,
  reportFormatMap,
  reportTypeOptions,
  reportFormatOptions,
  orderStatusOptions,
  paymentMethodOptions,
  productCategoryOptions,
} from "@/app/types/report";
import type {
  ReportType,
  ReportFormat,
  CreateReportDTO,
} from "@/app/types/report";

// Schema para validação do formulário
const reportFormSchema = z.object({
  name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  type: z.enum(
    ["sales", "inventory", "customers", "orders", "financial"] as const,
    {
      required_error: "Selecione o tipo de relatório",
    }
  ),
  format: z.enum(["pdf", "excel", "csv", "json"] as const, {
    required_error: "Selecione o formato de exportação",
  }),
  filters: z.object({
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    status: z.array(z.string()).default([]),
    paymentMethod: z.array(z.string()).default([]),
    productCategory: z.array(z.string()).default([]),
    minValue: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().positive().optional()
    ),
    maxValue: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z.number().positive().optional()
    ),
  }),
});

type ReportFormValues = z.infer<typeof reportFormSchema>;

interface CreateReportFormProps {
  onSubmit: (data: CreateReportDTO) => Promise<void>;
  isSubmitting: boolean;
  onCancel: () => void;
}

export function CreateReportForm({
  onSubmit,
  isSubmitting,
  onCancel,
}: CreateReportFormProps) {
  const [selectedType, setSelectedType] = useState<ReportType>("sales");

  // Inicializar formulário
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      name: "",
      type: "sales",
      format: "pdf",
      filters: {
        status: [],
        paymentMethod: [],
        productCategory: [],
      },
    },
  });

  // Observar mudanças no tipo de relatório
  const reportType = form.watch("type");

  // Atualizar nome padrão quando o tipo muda
  const handleTypeChange = (type: ReportType) => {
    setSelectedType(type);

    // Sugerir um nome padrão baseado no tipo
    const currentName = form.getValues("name");
    if (!currentName || currentName.startsWith("Relatório de ")) {
      const today = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
      form.setValue("name", `Relatório de ${reportTypeMap[type]} - ${today}`);
    }

    // Limpar filtros específicos quando o tipo muda
    form.setValue("filters.status", []);
    form.setValue("filters.paymentMethod", []);
    form.setValue("filters.productCategory", []);
    form.setValue("filters.minValue", undefined);
    form.setValue("filters.maxValue", undefined);
  };

  const handleSubmit = async (data: ReportFormValues) => {
    // Converter para o formato esperado pela API
    const reportData: CreateReportDTO = {
      name: data.name,
      type: data.type,
      format: data.format,
      filters: {
        ...data.filters,
      },
    };

    await onSubmit(reportData);
  };

  // Renderizar campos específicos baseados no tipo de relatório
  const renderTypeSpecificFilters = () => {
    switch (selectedType) {
      case "sales":
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Métodos de Pagamento</h3>
              <div className="grid grid-cols-2 gap-2">
                {paymentMethodOptions.map((option) => (
                  <FormField
                    key={option.value}
                    control={form.control}
                    name="filters.paymentMethod"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, option.value]);
                              } else {
                                field.onChange(
                                  current.filter(
                                    (item) => item !== option.value
                                  )
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="filters.minValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Mínimo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          );
                        }}
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
                    <FormLabel>Valor Máximo (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value)
                          );
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        );

      case "orders":
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Status dos Pedidos</h3>
              <div className="grid grid-cols-2 gap-2">
                {orderStatusOptions.map((option) => (
                  <FormField
                    key={option.value}
                    control={form.control}
                    name="filters.status"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, option.value]);
                              } else {
                                field.onChange(
                                  current.filter(
                                    (item) => item !== option.value
                                  )
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        );

      case "inventory":
        return (
          <>
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Categorias de Produtos</h3>
              <div className="grid grid-cols-2 gap-2">
                {productCategoryOptions.map((option) => (
                  <FormField
                    key={option.value}
                    control={form.control}
                    name="filters.productCategory"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(option.value)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, option.value]);
                              } else {
                                field.onChange(
                                  current.filter(
                                    (item) => item !== option.value
                                  )
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <FormLabel className="text-sm">
                          {option.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </div>
          </>
        );

      case "financial":
        return (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              O relatório financeiro irá incluir receitas, despesas e lucro no
              período selecionado.
            </p>
          </div>
        );

      case "customers":
        return (
          <div className="py-2">
            <p className="text-sm text-muted-foreground">
              O relatório de clientes irá mostrar informações sobre aquisição e
              comportamento de clientes no período selecionado.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Relatório *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Relatório de Vendas Mensal"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Relatório *</FormLabel>
                <Select
                  onValueChange={(value: ReportType) => {
                    field.onChange(value);
                    handleTypeChange(value);
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
                  O tipo determina quais dados serão incluídos no relatório
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="format"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Formato do Relatório *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {reportFormatOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Formato para download do relatório quando estiver pronto
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Período</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Se não especificado, será considerado o início do mês atual
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                          variant={"outline"}
                          className={`w-full pl-3 text-left font-normal ${
                            !field.value ? "text-muted-foreground" : ""
                          }`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione a data</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => {
                          const startDate = form.getValues("filters.startDate");
                          return startDate ? date < startDate : false;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    Se não especificado, será considerado o dia atual
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h2 className="text-lg font-medium">Filtros Específicos</h2>
          {renderTypeSpecificFilters()}
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Gerar Relatório"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

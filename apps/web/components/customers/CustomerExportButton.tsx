import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText, FileSpreadsheet, Database, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { getAllUsersForExport } from "@/app/_services/userService";
import { exportCustomers } from "@/app/_utils/clientExport";
import type { User } from "@/app/_types/user";

interface CustomerExportButtonProps {
  filters?: Record<string, any>;
  buttonText?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export function CustomerExportButton({
  filters = {},
  buttonText = "Exportar",
  variant = "default",
  size = "default",
  disabled = false,
}: CustomerExportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getCustomerType = (customer: User) => {
    const purchases = customer.purchases?.length || 0;
    if (purchases >= 5) return "VIP";
    if (purchases >= 1) return "Regular";
    return "Novo";
  };

  const getCustomerStatus = (customer: User) => {
    // Lógica simples para status - pode ser expandida
    // Como não temos essas propriedades no tipo User, vamos usar uma lógica padrão
    return "Ativo";
  };

  const handleExport = async (format: "excel" | "pdf" | "csv" | "json") => {
    setIsLoading(true);
    try {
      toast({
        title: "Iniciando exportação",
        description: `Buscando dados para exportação em formato ${format.toUpperCase()}...`,
      });

      // Aplicar filtros para clientes
      const exportFilters = {
        ...filters,
        role: 'customer',
        page: undefined,
        limit: 9999
      };

      const allCustomers = await getAllUsersForExport(exportFilters);
      
      if (!allCustomers || allCustomers.length === 0) {
        toast({
          variant: "warning",
          title: "Sem dados para exportar",
          description: "Não há clientes que correspondam aos filtros aplicados.",
        });
        return;
      }
      
      toast({
        title: "Processando exportação",
        description: `Preparando arquivo com ${allCustomers.length} clientes...`,
      });
      
      const title = `Relatório de Clientes (${allCustomers.length} itens)`;
      
      // Preparar dados para exportação
      const exportData = allCustomers.map((customer: User) => ({
        Nome: customer.name || "",
        Email: customer.email || "",
        Telefone: customer.phone || "",
        CPF: customer.cpf || "",
        "Data de Nascimento": customer.birthDate ? new Date(customer.birthDate).toLocaleDateString('pt-BR') : "",
        Endereço: customer.address || "",
        "Tipo de Cliente": getCustomerType(customer),
        Status: getCustomerStatus(customer),
        "Total de Compras": customer.purchases?.length || 0,
        "Débitos (R$)": (customer.debts || 0).toFixed(2),
        "Data de Cadastro": customer.createdAt ? new Date(customer.createdAt).toLocaleDateString('pt-BR') : "",
        "Última Atualização": customer.updatedAt ? new Date(customer.updatedAt).toLocaleDateString('pt-BR') : "",
      }));

      // Usar a função de exportação personalizada
      const blob = await exportCustomers({
        data: exportData,
        format,
        title,
        filename: `clientes_${new Date().toISOString().split('T')[0]}`
      });

      // Fazer download do arquivo
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      
      const extensions = {
        excel: 'xlsx',
        pdf: 'pdf',
        csv: 'csv',
        json: 'json'
      };
      
      a.download = `clientes_${new Date().toISOString().split('T')[0]}.${extensions[format]}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Exportação concluída",
        description: `Arquivo ${format.toUpperCase()} baixado com sucesso.`,
      });
      
    } catch (error) {
      console.error('Erro na exportação:', error);
      toast({
        variant: "destructive",
        title: "Erro na exportação",
        description: "Não foi possível exportar os dados. Tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={variant} 
          size={size} 
          disabled={disabled || isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {buttonText}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport("excel")}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("csv")}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-blue-600" />
          CSV (.csv)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("pdf")}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          PDF (.pdf)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport("json")}
          disabled={isLoading}
          className="cursor-pointer"
        >
          <Database className="mr-2 h-4 w-4 text-purple-600" />
          JSON (.json)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 
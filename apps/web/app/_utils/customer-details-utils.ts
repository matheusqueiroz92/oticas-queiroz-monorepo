import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date: string | Date): string => {
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
};

export const getInitials = (name: string): string => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2);
}; 
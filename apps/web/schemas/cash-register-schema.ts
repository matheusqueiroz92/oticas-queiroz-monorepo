import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import type { OpenCashRegisterDTO, CloseCashRegisterDTO } from "../app/_types/cash-register";

// Schema para abrir um caixa
export const openCashRegisterSchema = z.object({
  openingBalance: z.preprocess(
    (value) => value === "" || value === undefined ? 0 : Number.parseFloat(String(value).replace(",", ".")),
    z.number().min(0, "O valor não pode ser negativo")
  ),
  observations: z.string().optional(),
});

// Schema para fechar um caixa
export const closeCashRegisterSchema = z.object({
  closingBalance: z.preprocess(
    (value) => value === "" || value === undefined ? 0 : Number.parseFloat(String(value).replace(",", ".")),
    z.number().min(0, "O valor não pode ser negativo")
  ),
  observations: z.string().optional(),
});

// Tipos inferidos dos schemas
export type OpenCashRegisterFormValues = z.infer<typeof openCashRegisterSchema>;
export type CloseCashRegisterFormValues = z.infer<typeof closeCashRegisterSchema>;

// Função para criar o formulário de abertura de caixa com React Hook Form
export const createOpenCashRegisterForm = () => {
  return useForm<OpenCashRegisterFormValues>({
    resolver: zodResolver(openCashRegisterSchema),
    defaultValues: {
      openingBalance: 0,
      observations: "",
    },
  });
};

// Função para criar o formulário de fechamento de caixa com React Hook Form
export const createCloseCashRegisterForm = () => {
  return useForm<CloseCashRegisterFormValues>({
    resolver: zodResolver(closeCashRegisterSchema),
    defaultValues: {
      closingBalance: 0,
      observations: "",
    },
  });
};
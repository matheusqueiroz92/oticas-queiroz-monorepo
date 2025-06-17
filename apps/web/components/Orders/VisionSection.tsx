import React, { useState, useEffect } from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import type { OrderFormReturn } from "@/app/_types/form-types";

interface VisionSectionProps {
  eye: "left" | "right";
  form: OrderFormReturn;
}

export default function VisionSection({ eye, form }: VisionSectionProps) {
  // Estados para armazenar os valores de input como strings
  const [sphInput, setSphInput] = useState<string>("");
  const [cylInput, setCylInput] = useState<string>("");
  const [axisInput, setAxisInput] = useState<string>("");
  const [pdInput, setPdInput] = useState<string>("");

  // Inicializar os valores dos inputs baseados nos valores do formulário
  useEffect(() => {
    // Para campos numéricos, verificamos se não são undefined, null ou zero
    const sph = form.getValues(`prescriptionData.${eye}Eye.sph`);
    if (sph && sph !== "0") {
      // Converter formato do backend (com ponto) para formato de exibição (com vírgula)
      setSphInput(String(sph).replace('.', ','));
    }

    const cyl = form.getValues(`prescriptionData.${eye}Eye.cyl`);
    if (cyl && cyl !== "0") {
      // Converter formato do backend (com ponto) para formato de exibição (com vírgula)
      setCylInput(String(cyl).replace('.', ','));
    }

    const axis = form.getValues(`prescriptionData.${eye}Eye.axis`);
    if (axis !== 0 && axis !== undefined) {
      setAxisInput(axis.toString());
    }

    const pd = form.getValues(`prescriptionData.${eye}Eye.pd`);
    if (pd !== 0 && pd !== undefined) {
      setPdInput(pd.toString());
    }
  }, [form, eye]);

  // Função para lidar com inputs numéricos genéricos
  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void,
    setInputState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const inputValue = e.target.value;
    setInputState(inputValue);
    
    // Se o campo estiver vazio, definimos como undefined
    if (inputValue === "") {
      onChange(undefined);
      return;
    }
    
    // Caso contrário, convertemos para número
    const numValue = Number.parseFloat(inputValue);
    if (!Number.isNaN(numValue)) {
      onChange(numValue);
    }
  };

  // Função para tratar inputs de dioptria
  const handleDioptriaInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: string) => void,
    setInputState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const inputValue = e.target.value;
    setInputState(inputValue);
    
    // Se o campo estiver vazio, definimos como string vazia
    if (inputValue === "") {
      onChange("");
      return;
    }
    
    // Validar formato: permite +, -, números e tanto vírgula quanto ponto decimal
    if (/^[+-]?\d*[.,]?\d*$/.test(inputValue)) {
      // Normalizar para formato consistente (substituir vírgula por ponto para armazenamento)
      const normalizedValue = inputValue.replace(',', '.');
      
      onChange(normalizedValue); // Passa o valor normalizado para armazenamento
    }
  };

  // Função específica para o campo de eixo que tem validação de min/max
  const handleAxisInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void
  ) => {
    const inputValue = e.target.value;
    setAxisInput(inputValue);
    
    // Se o campo estiver vazio, definimos como undefined
    if (inputValue === "") {
      onChange(undefined);
      return;
    }
    
    // Validação de min/max para o eixo
    const numValue = Number.parseInt(inputValue, 10);
    if (!Number.isNaN(numValue)) {
      const boundedValue = Math.min(180, Math.max(0, numValue));
      onChange(boundedValue);
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

      {/* Campo Esférico */}
      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.sph`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Esf.</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={sphInput}
                onChange={(e) => handleDioptriaInput(e, field.onChange, setSphInput)}
                aria-label={`Esférico do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Campo Cilíndrico */}
      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.cyl`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Cil.</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={cylInput}
                onChange={(e) => handleDioptriaInput(e, field.onChange, setCylInput)}
                aria-label={`Cilíndrico do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Campo Eixo */}
      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.axis`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Eixo</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="numeric"
                value={axisInput}
                onChange={(e) => handleAxisInput(e, field.onChange)}
                aria-label={`Eixo do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Campo D.P. */}
      <FormField
        control={form.control}
        name={`prescriptionData.${eye}Eye.pd`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>D.P.</FormLabel>
            <FormControl>
              <Input
                type="text"
                inputMode="decimal"
                value={pdInput}
                onChange={(e) => handleNumericInput(e, field.onChange, setPdInput)}
                aria-label={`PD do olho ${eye === "left" ? "esquerdo" : "direito"}`}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
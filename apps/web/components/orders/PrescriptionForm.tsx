import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import EyeFormSection from "./EyeFormSection";
import type { OrderFormReturn } from "../../app/_types/form-types";

interface PrescriptionFormProps {
  form: OrderFormReturn;
}

export default function PrescriptionForm({ form }: PrescriptionFormProps) {
  const [ndInput, setNdInput] = useState<string>("");
  const [ocInput, setOcInput] = useState<string>("");
  const [additionInput, setAdditionInput] = useState<string>("");
  const [bridgeInput, setBridgeInput] = useState<string>("");
  const [rimInput, setRimInput] = useState<string>("");
  const [avInput, setAvInput] = useState<string>("");
  const [amInput, setAmInput] = useState<string>("");

  // Função para sincronizar valores dos campos
  const syncFieldValues = () => {
    const nd = form.getValues("prescriptionData.nd");
    if (nd !== 0 && nd !== undefined) {
      setNdInput(nd.toString());
    }

    const oc = form.getValues("prescriptionData.oc");
    if (oc !== 0 && oc !== undefined) {
      setOcInput(oc.toString());
    }

    const addition = form.getValues("prescriptionData.addition");
    if (addition !== 0 && addition !== undefined) {
      setAdditionInput(addition.toString());
    }

    // Sincronizar os campos Ponte, Aro, AV e AM
    const bridge = form.getValues("prescriptionData.bridge");
    if (bridge !== 0 && bridge !== undefined) {
      setBridgeInput(bridge.toString());
    }

    const rim = form.getValues("prescriptionData.rim");
    if (rim !== 0 && rim !== undefined) {
      setRimInput(rim.toString());
    }

    const vh = form.getValues("prescriptionData.vh");
    if (vh !== 0 && vh !== undefined) {
      setAvInput(vh.toString());
    }

    const sh = form.getValues("prescriptionData.sh");
    if (sh !== 0 && sh !== undefined) {
      setAmInput(sh.toString());
    }
  };

  useEffect(() => {
    syncFieldValues();
  }, [form]);

  // Efeito adicional para sincronizar quando os valores mudarem
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name && name.includes("prescriptionData")) {
        // Pequeno delay para garantir que o valor foi atualizado
        setTimeout(syncFieldValues, 0);
      }
    });

    return () => subscription.unsubscribe();
  }, [form]);

  const handleNumericInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    onChange: (value: number | undefined) => void,
    setInputState: React.Dispatch<React.SetStateAction<string>>
  ) => {
    const inputValue = e.target.value;
    setInputState(inputValue);
    
    if (inputValue === "") {
      onChange(undefined);
      return;
    }
    
    const numValue = Number.parseFloat(inputValue);
    if (!Number.isNaN(numValue)) {
      onChange(numValue);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dados básicos do médico - compacto */}
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="prescriptionData.doctorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Nome do Médico</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome do médico" 
                  {...field} 
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prescriptionData.clinicName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Nome da Clínica</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Nome da clínica" 
                  {...field} 
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prescriptionData.appointmentDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Data da Consulta</FormLabel>
              <FormControl>
                <Input 
                  type="date" 
                  {...field} 
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Seções dos olhos lado a lado */}
      <div className="grid grid-cols-2 gap-6">
        <EyeFormSection eye="right" title="Olho Direito" form={form} />
        <EyeFormSection eye="left" title="Olho Esquerdo" form={form} />
      </div>

      {/* Campos adicionais - mais compactos */}
      <div className="grid grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="prescriptionData.nd"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">D.N.P.</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={ndInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setNdInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="prescriptionData.oc"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">C.O.</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={ocInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setOcInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prescriptionData.addition"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Adição</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={additionInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setAdditionInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Última linha de campos */}
      <div className="grid grid-cols-4 gap-4">
        <FormField
          control={form.control}
          name="prescriptionData.bridge"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Ponte</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={bridgeInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setBridgeInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prescriptionData.rim"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Aro</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={rimInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setRimInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prescriptionData.vh"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">AV</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={avInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setAvInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prescriptionData.sh"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">AM</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={amInput}
                  onChange={(e) => 
                    handleNumericInput(e, field.onChange, setAmInput)
                  }
                  className="h-9 text-sm"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
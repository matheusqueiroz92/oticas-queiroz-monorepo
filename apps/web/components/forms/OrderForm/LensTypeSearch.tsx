import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { UseFormReturn } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/app/services/auth";

// Define o tipo exato para o OrderFormValues
// Isso deve corresponder exatamente à definição no seu schema zod
type OrderFormValues = {
  clientId: string;
  employeeId: string;
  productType: "glasses" | "lensCleaner";
  product: string;
  glassesType: "prescription" | "sunglasses";
  glassesFrame: "with" | "no";
  paymentMethod: string;
  paymentEntry?: number;
  installments?: number;
  deliveryDate?: string;
  status: string;
  laboratoryId?: string;
  lensType?: string;
  observations?: string;
  totalPrice: number;
  prescriptionData?: {
    doctorName?: string;
    clinicName?: string;
    appointmentDate?: string;
    leftEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    rightEye: {
      sph: number;
      cyl: number;
      axis: number;
    };
    nd: number;
    addition: number;
  };
};

// Interface para tipos de lente
interface LensType {
  _id: string;
  name: string;
  description?: string;
  brand?: string;
}

// Interface para as props do componente com tipagem específica
interface LensTypeSelectionProps {
  form: UseFormReturn<OrderFormValues, undefined, undefined>;
}

export default function LensTypeSelection({ form }: LensTypeSelectionProps) {
  const [lensTypeSearch, setLensTypeSearch] = useState("");
  const [lensTypes, setLensTypes] = useState<LensType[]>([]);
  const [filteredLensTypes, setFilteredLensTypes] = useState<LensType[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newLensType, setNewLensType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Função para carregar tipos de lente
  useEffect(() => {
    const fetchLensTypes = async () => {
      setIsLoading(true);

      try {
        // Carregar tipos existentes da API
        const response = await api.get("/api/lens-type");

        if (response?.data) {
          let typesData: LensType[] = [];

          if (Array.isArray(response.data)) {
            typesData = response.data;
          } else if (
            response.data.lensType &&
            Array.isArray(response.data.lensType)
          ) {
            typesData = response.data.lensType;
          }

          setLensTypes(typesData);
        }
      } catch (error) {
        console.error("Erro ao carregar tipos de lente:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLensTypes();
  }, []);

  // Filtrar tipos de lente com base na pesquisa
  useEffect(() => {
    if (!lensTypeSearch.trim()) {
      setFilteredLensTypes([]);
      return;
    }

    const searchLower = lensTypeSearch.toLowerCase();
    const filtered = lensTypes.filter((type) =>
      type.name.toLowerCase().includes(searchLower)
    );
    setFilteredLensTypes(filtered);

    // Mostrar sugestões quando há texto
    setShowSuggestions(lensTypeSearch.trim().length > 0);
  }, [lensTypeSearch, lensTypes]);

  // Detectar cliques fora do componente de sugestões
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelectLensType = (lensType: LensType) => {
    form.setValue("lensType", lensType.name);
    setLensTypeSearch(lensType.name);
    setShowSuggestions(false);
  };

  const handleAddNewLensType = async () => {
    if (!newLensType.trim()) return;

    setIsSubmitting(true);

    try {
      // Criar novo tipo de lente via API
      const response = await api.post("/api/lens-type", {
        name: newLensType,
        description: "", // Campo opcional
      });

      // Adicionar à lista local se a resposta for bem-sucedida
      if (response?.data?._id) {
        const newTypeData = response.data;
        setLensTypes((prev) => [...prev, newTypeData]);

        toast({
          title: "Tipo de lente adicionado",
          description: "O tipo de lente foi adicionado com sucesso.",
        });
      }

      // Atualizar o valor no formulário
      form.setValue("lensType", newLensType);
      setLensTypeSearch(newLensType);

      // Fechar diálogo e limpar
      setShowAddDialog(false);
      setNewLensType("");
    } catch (error) {
      console.error("Erro ao adicionar tipo de lente:", error);

      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível adicionar o tipo de lente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShowAddDialog = () => {
    setNewLensType(lensTypeSearch);
    setShowAddDialog(true);
    setShowSuggestions(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          placeholder="Digite o tipo de lente"
          value={lensTypeSearch}
          onChange={(e) => setLensTypeSearch(e.target.value)}
          onFocus={() => {
            if (lensTypeSearch.trim().length > 0) {
              setShowSuggestions(true);
            }
          }}
          disabled={isLoading}
        />

        {isLoading && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1"
        >
          {filteredLensTypes.length > 0 ? (
            <ul className="py-1">
              {filteredLensTypes.map((lensType) => (
                <li key={lensType._id} className="p-0">
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer"
                    onClick={() => handleSelectLensType(lensType)}
                  >
                    {lensType.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-3">
              <p className="text-sm text-gray-500 mb-2">
                Nenhum tipo de lente encontrado.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleShowAddDialog}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar "{lensTypeSearch}"
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Diálogo para adicionar novo tipo de lente */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Tipo de Lente</DialogTitle>
            <DialogDescription>
              Digite o nome do novo tipo de lente a ser adicionado ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newLensType}
              onChange={(e) => setNewLensType(e.target.value)}
              placeholder="Nome do tipo de lente"
              className="w-full"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAddNewLensType}
              disabled={isSubmitting || !newLensType.trim()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adicionando...
                </>
              ) : (
                "Adicionar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

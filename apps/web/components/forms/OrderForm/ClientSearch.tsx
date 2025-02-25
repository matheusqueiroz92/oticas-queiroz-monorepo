import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  // FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import type { Customer } from "../../../app/types/customer";

interface ClientSearchProps {
  customers: Customer[];
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  form: any;
  onClientSelect: (clientId: string, name: string) => void;
}

export default function ClientSearch({
  customers,
  form,
  onClientSelect,
}: ClientSearchProps) {
  const [customerSearch, setCustomerSearch] = useState("");
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [customClientSelected, setCustomClientSelected] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers([]);
      return;
    }

    const searchLower = customerSearch.toLowerCase();
    const filtered = customers.filter((customer) =>
      customer.name?.toLowerCase().includes(searchLower)
    );
    setFilteredCustomers(filtered);

    // Mostrar sugestões quando há texto e sugestões
    setShowSuggestions(customerSearch.trim().length > 0);
  }, [customerSearch, customers]);

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

  const handleSelectCustomer = (customer: Customer) => {
    onClientSelect(customer._id ?? "", customer.name ?? "");
    setCustomerSearch(customer.name ?? "");
    setShowSuggestions(false);
    setCustomClientSelected(false);
  };

  const handleSelectCustomClient = () => {
    if (!customerSearch.trim()) return;

    onClientSelect("custom", customerSearch);
    setShowSuggestions(false);
    setCustomClientSelected(true);
  };

  return (
    <FormField
      control={form.control}
      name="clientId"
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>Cliente</FormLabel>
          <div className="relative">
            <Input
              placeholder="Digite o nome do cliente"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onFocus={() => {
                if (customerSearch.trim().length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1"
              >
                <ul className="py-1">
                  {filteredCustomers.map((customer) => (
                    <li key={customer._id} className="p-0">
                      <button
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer"
                        onClick={() => handleSelectCustomer(customer)}
                        aria-label={`Selecionar cliente ${customer.name}`}
                      >
                        {customer.name}
                      </button>
                    </li>
                  ))}
                  <li className="p-0">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-100 cursor-pointer text-blue-600"
                      onClick={handleSelectCustomClient}
                      aria-label={`Adicionar cliente novo: ${customerSearch}`}
                    >
                      + Adicionar cliente novo: "{customerSearch}"
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
          {customClientSelected && (
            <div className="mt-2 p-2 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-800">
                Novo cliente: {customerSearch}
              </p>
            </div>
          )}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

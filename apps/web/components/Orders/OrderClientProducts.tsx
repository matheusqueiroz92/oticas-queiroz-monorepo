import { useState, useEffect } from "react";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { formatCurrency } from "@/app/_utils/formatters";
import type { Customer } from "@/app/_types/customer";
import type { Product } from "@/app/_types/product";
import { Loader2, Lock, RefreshCw } from "lucide-react";

import { useInstitutions } from "@/hooks/useInstitutions";
import { useOrders } from "@/hooks/useOrders";
import ClientSearch from "@/components/Orders/ClientSearch";
import ProductSearch from "@/components/Orders/ProductSearch";
import SelectedProductsList from "@/components/Orders/SelectedProductList";
import OrderSummary from "./OrderSummary";

interface OrderClientProductsProps {
  form: any;
  customersData: Customer[];
  productsData: Product[];
  selectedProducts: Product[];
  selectedCustomer: Customer | null;
  hasLenses: boolean;
  showInstallments: boolean;
  fetchAllCustomers: (searchQuery?: string) => Promise<Customer[]>;
  setShowInstallments: (show: boolean) => void;
  handleClientSelect: (clientId: string, name: string) => void;
  handleAddProduct: (product: Product) => Promise<void>;
  handleRemoveProduct: (productId: string) => void;
  handleUpdateProductPrice: (productId: string, newPrice: number) => void;
  handleDiscountChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  calculateInstallmentValue: () => number;
  selectedResponsible?: Customer | null;
  handleResponsibleSelect?: (clientId: string, name: string) => void;
}

export default function OrderClientProducts({
  form,
  customersData,
  productsData,
  selectedProducts,
  selectedCustomer,
  hasLenses,
  showInstallments,
  setShowInstallments,
  fetchAllCustomers,
  handleClientSelect,
  handleAddProduct,
  handleRemoveProduct,
  handleUpdateProductPrice,
  handleDiscountChange,
  calculateInstallmentValue,
  selectedResponsible,
  handleResponsibleSelect,
}: OrderClientProductsProps) {
  const [loadedInstitutions, setLoadedInstitutions] = useState<any[]>([]);
  
  const { 
    institutions, 
    isLoading: isLoadingInstitutions,
    fetchAllInstitutions
  } = useInstitutions({
    enablePagination: false
  });

  const {
    nextServiceOrder,
    isLoadingNextServiceOrder,
    nextServiceOrderError,
    fetchNextServiceOrder,
    getServiceOrderDisplayValue
  } = useOrders({ enableQueries: true });

  useEffect(() => {
    if (institutions && institutions.length > 0) {
      setLoadedInstitutions(institutions);
    }
  }, [institutions]);
  
  useEffect(() => {
    const isInstitutional = form.watch("isInstitutionalOrder");
    if (isInstitutional && loadedInstitutions.length === 0) {
      fetchAllInstitutions();
    }
  }, [form, loadedInstitutions.length, fetchAllInstitutions]);

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Coluna principal - Cliente e Produtos */}
      <div className="col-span-8 space-y-4">
        {/* Seção do Cliente */}
        <div className="space-y-3">
          <h3 className="text-sm text-[var(--primary-blue)] font-medium border-b pb-1">
            INFORMAÇÕES DO CLIENTE
          </h3>
          
          <div className="grid grid-cols-5 gap-3">
            {/* Cliente */}
            <div className="col-span-4">
              <ClientSearch
                customers={customersData || []}
                form={form}
                onClientSelect={handleClientSelect}
                fetchAllCustomers={fetchAllCustomers}
                selectedCustomer={selectedCustomer}
              />
            </div>

            {/* O.S. */}
            <div className="col-span-1 flex flex-col">
              <FormLabel className="text-xs flex items-center gap-1 mt-2">
                Nº da O.S.
                {!isLoadingNextServiceOrder && (
                  <button
                    type="button"
                    onClick={fetchNextServiceOrder}
                    className="ml-1 p-0.5 hover:bg-gray-100 rounded"
                    title="Atualizar próximo número"
                  >
                    <RefreshCw className="h-3 w-3 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </FormLabel>
              <div className="relative">
                <Input
                  type="text"
                  placeholder={getServiceOrderDisplayValue()}
                  value={getServiceOrderDisplayValue()}
                  readOnly
                  disabled
                  className={`mt-2 bg-gray-100 cursor-not-allowed border border-gray-200 rounded text-sm h-9 ${
                    nextServiceOrder && !isLoadingNextServiceOrder 
                      ? 'text-blue-800 font-medium' 
                      : 'text-gray-600'
                  }`}
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  {isLoadingNextServiceOrder ? (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
                  ) : (
                    <Lock className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {nextServiceOrderError 
                  ? "Erro ao carregar" 
                  : "Gerado automaticamente"
                }
              </p>
            </div>
          </div>
          
          {/* Cliente selecionado - compacto */}
          {selectedCustomer && (
            <div className="bg-blue-50 p-2 rounded border border-blue-100 text-xs">
              <div className="grid grid-cols-4 gap-2">
                <div><strong>Nome:</strong> {selectedCustomer.name}</div>
                {selectedCustomer.phone && (
                  <div><strong>Tel:</strong> {selectedCustomer.phone}</div>
                )}
                {selectedCustomer.email && (
                  <div><strong>Email:</strong> {selectedCustomer.email}</div>
                )}
                {selectedCustomer.cpf && (
                  <div><strong>CPF:</strong> {selectedCustomer.cpf}</div>
                )}
              </div>
            </div>
          )}

          {/* Seção do Responsável */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="hasResponsible"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        if (!checked) {
                          form.setValue("responsibleClientId", "");
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-sm font-medium text-blue-700">
                      Há um responsável pela compra?
                    </FormLabel>
                    <FormDescription className="text-xs text-gray-600">
                      Marque se outra pessoa será responsável pelos débitos desta compra
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch("hasResponsible") && (
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="responsibleClientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-blue-700">
                        Cliente Responsável
                      </FormLabel>
                      <div className="mt-1">
                        <ClientSearch
                          customers={customersData || []}
                          form={form}
                          onClientSelect={handleResponsibleSelect || (() => {})}
                          fetchAllCustomers={fetchAllCustomers}
                          selectedCustomer={selectedResponsible}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Responsável selecionado - compacto */}
                {selectedResponsible && (
                  <div className="bg-orange-50 p-2 rounded border border-orange-100 text-xs">
                    <div className="grid grid-cols-4 gap-2">
                      <div><strong>Responsável:</strong> {selectedResponsible.name}</div>
                      {selectedResponsible.phone && (
                        <div><strong>Tel:</strong> {selectedResponsible.phone}</div>
                      )}
                      {selectedResponsible.email && (
                        <div><strong>Email:</strong> {selectedResponsible.email}</div>
                      )}
                      {selectedResponsible.cpf && (
                        <div><strong>CPF:</strong> {selectedResponsible.cpf}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Seção dos Produtos */}
        <div className="space-y-3">
          <h3 className="text-sm text-[var(--primary-blue)] font-medium border-b pb-1">
            PRODUTOS
          </h3>
          
          <ProductSearch
            products={productsData || []}
            form={form}
            onProductAdd={handleAddProduct}
            selectedProducts={selectedProducts}
          />
          
          <div className="max-h-40 overflow-y-auto">
            <SelectedProductsList
              products={selectedProducts}
              onUpdatePrice={handleUpdateProductPrice}
              onRemoveProduct={handleRemoveProduct}
            />
          </div>
        </div>

        {/* Valores - compacto */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded border">
          <FormField
            control={form.control}
            name="totalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Preço Total</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    readOnly
                    placeholder="0,00"
                    {...field}
                    value={field.value || ''}
                    className="border bg-gray-100 rounded text-sm h-8"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="discount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Desconto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    onChange={handleDiscountChange}
                    value={field.value === 0 ? '' : field.value}
                    className="border rounded text-sm h-8"
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="finalPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Preço Final</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    readOnly
                    placeholder="0,00"
                    className="font-medium border bg-gray-100 rounded text-sm h-8"
                    {...field}
                    value={field.value || ''}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Checkbox Pedido Institucional - compacto */}
        <div className="flex items-center space-x-2">
          <FormField
            control={form.control}
            name="isInstitutionalOrder"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (checked && loadedInstitutions.length === 0) {
                        fetchAllInstitutions();
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm">Pedido Institucional</FormLabel>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Seleção de Instituição */}
        {form.watch("isInstitutionalOrder") && (
          <FormField
            control={form.control}
            name="institutionId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Instituição</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                  onOpenChange={(open) => {
                    if (open && loadedInstitutions.length === 0 && !isLoadingInstitutions) {
                      fetchAllInstitutions();
                    }
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Selecione a instituição" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingInstitutions ? (
                      <div className="flex items-center justify-center py-2">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        <span className="text-sm">Carregando...</span>
                      </div>
                    ) : loadedInstitutions.length > 0 ? (
                      loadedInstitutions.map((institution) => (
                        <SelectItem key={institution._id} value={institution._id}>
                          {institution.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="text-center py-2 text-sm text-muted-foreground">
                        Nenhuma instituição encontrada
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      
      {/* Coluna lateral - Resumo e Pagamento */}
      <div className="col-span-4 space-y-4">
        <OrderSummary 
          form={form}
          selectedProducts={selectedProducts}
        />
        
        {/* Seção de Pagamento e Entrega */}
        <div className="bg-gray-50 rounded-lg border p-3">
          <h3 className="text-sm font-medium text-[var(--primary-blue)] border-b pb-2 mb-3">
            PAGAMENTO E ENTREGA
          </h3>
          
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Forma de Pagamento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(value);
                      setShowInstallments(
                        value === "credit" || value === "bank_slip" || value === "promissory_note" || value === "check"
                      );
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="credit">Cartão de Crédito</SelectItem>
                      <SelectItem value="debit">Cartão de Débito</SelectItem>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="bank_slip">Boleto Bancário</SelectItem>
                      <SelectItem value="promissory_note">Nota Promissória</SelectItem>
                      <SelectItem value="check">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="paymentEntry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Entrada</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0,00"
                        onChange={(e) => {
                          const value = e.target.value === '' ? '' : Number.parseFloat(e.target.value);
                          field.onChange(value);
                        }}
                        value={field.value === null || field.value === undefined || field.value === 0 ? '' : field.value}
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {showInstallments && (
                <FormField
                  control={form.control}
                  name="installments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Parcelas</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={12}
                          placeholder="1"
                          onChange={(e) => {
                            const value = e.target.value === '' ? '' : Number.parseInt(e.target.value);
                            field.onChange(value);
                          }}
                          value={field.value === null || field.value === undefined || field.value === 0 ? '' : field.value}
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {showInstallments && (form?.watch("installments") || 0) > 0 && (
              <div className="p-2 bg-blue-50 rounded text-xs text-blue-800 border border-blue-100">
                Valor das parcelas: {formatCurrency(calculateInstallmentValue())}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <FormField
                control={form.control}
                name="orderDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Data Pedido</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        className="h-8 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deliveryDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Data Entrega</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field} 
                        disabled={!hasLenses}
                        className={!hasLenses ? "bg-gray-100 cursor-not-allowed h-8 text-sm" : "h-8 text-sm"}
                      />
                    </FormControl>
                    {!hasLenses && (
                      <p className="text-xs text-muted-foreground">
                        Adicione lentes para alterar
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações..."
                      className="min-h-[60px] text-sm resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
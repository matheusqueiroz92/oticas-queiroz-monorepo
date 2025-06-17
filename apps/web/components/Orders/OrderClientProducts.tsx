import { useState, useEffect } from "react";
import { 
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
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
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

import { useInstitutions } from "@/hooks/useInstitutions";
import { useOrders } from "@/hooks/useOrders";
import ClientSearch from "@/components/orders/ClientSearch";
import ProductSearch from "@/components/orders/ProductSearch";
import SelectedProductsList from "@/components/orders/SelectedProductList";
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
  const [isInstitutionalOrder, setIsInstitutionalOrder] = useState(false);
  const [hasResponsible, setHasResponsible] = useState(false);
  
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
    if (isInstitutionalOrder && loadedInstitutions.length === 0) {
      fetchAllInstitutions();
    }
  }, [isInstitutionalOrder, loadedInstitutions.length, fetchAllInstitutions]);

  return (
    <div className="grid grid-cols-12 gap-6 h-full">
      {/* Coluna principal - Cliente e Produtos */}
      <div className="col-span-8 space-y-6">
        {/* Seção do Cliente */}
        <div className="space-y-4 bg-background rounded-lg border p-4 shadow-sm">
          <h3 className="text-base font-semibold text-primary border-b pb-2">INFORMAÇÕES DO CLIENTE</h3>
          <div className="grid grid-cols-5 gap-4 items-start">
            <div className="col-span-4">
              <ClientSearch
                customers={customersData || []}
                form={form}
                onClientSelect={handleClientSelect}
                fetchAllCustomers={fetchAllCustomers}
                selectedCustomer={selectedCustomer}
              />
            </div>
            <div className="col-span-1">
              <FormField
                control={form.control}
                name="serviceOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Nº da O.S.</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        value={getServiceOrderDisplayValue()}
                        readOnly
                        disabled
                        className={`bg-background text-foreground border-input focus:ring-primary ${
                          nextServiceOrder && !isLoadingNextServiceOrder 
                            ? 'text-blue-800 font-medium' 
                            : 'text-gray-600'
                        }`}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">
                      {nextServiceOrderError 
                        ? "Erro ao carregar" 
                        : "Gerado automaticamente"
                      }
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          {selectedCustomer && (
            <div className="bg-blue-100/10 p-2 rounded border border-blue-100 text-xs mt-2">
              <div className="grid grid-cols-4 gap-2">
                <div><strong>Nome:</strong> {selectedCustomer.name}</div>
                {selectedCustomer.phone && <div><strong>Tel:</strong> {selectedCustomer.phone}</div>}
                {selectedCustomer.email && <div><strong>Email:</strong> {selectedCustomer.email}</div>}
                {selectedCustomer.cpf && <div><strong>CPF:</strong> {selectedCustomer.cpf}</div>}
              </div>
            </div>
          )}
          <div className="space-y-3 mt-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="isInstitutionalOrder" 
                checked={isInstitutionalOrder} 
                onCheckedChange={(checked) => {
                  setIsInstitutionalOrder(!!checked);
                  form.setValue("isInstitutionalOrder", !!checked);
                }} 
              />
              <Label htmlFor="isInstitutionalOrder" className="text-xs font-medium text-blue-700">
                Pedido Institucional
              </Label>
              <span className="text-xs text-muted-foreground">
                Marque se este pedido é para uma instituição
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Checkbox 
                id="hasResponsible" 
                checked={hasResponsible} 
                onCheckedChange={(checked) => {
                  setHasResponsible(!!checked);
                  form.setValue("hasResponsible", !!checked);
                }} 
              />
              <Label htmlFor="hasResponsible" className="text-xs font-medium text-blue-700">Há um responsável pela compra?</Label>
              <span className="text-xs text-muted-foreground">Marque se outra pessoa será responsável pelos débitos desta compra</span>
            </div>
          </div>
          
          {isInstitutionalOrder && (
            <div className="space-y-2 mt-4">
              <FormField
                control={form.control}
                name="institutionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Instituição</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma instituição" />
                      </SelectTrigger>
                      <SelectContent>
                        {loadedInstitutions.map((institution) => (
                          <SelectItem key={institution._id} value={institution._id}>
                            {institution.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
          
          {hasResponsible && (
            <div className="space-y-2 mt-2">
              <Label className="text-xs text-muted-foreground">Cliente Responsável</Label>
              <ClientSearch
                customers={customersData || []}
                form={form}
                onClientSelect={handleResponsibleSelect || (() => {})}
                fetchAllCustomers={fetchAllCustomers}
                selectedCustomer={selectedResponsible}
              />
              {selectedResponsible && (
                <div className="bg-orange-100/10 p-2 rounded border border-orange-100 text-xs">
                  <div className="grid grid-cols-4 gap-2">
                    <div><strong>Responsável:</strong> {selectedResponsible.name}</div>
                    {selectedResponsible.phone && <div><strong>Tel:</strong> {selectedResponsible.phone}</div>}
                    {selectedResponsible.email && <div><strong>Email:</strong> {selectedResponsible.email}</div>}
                    {selectedResponsible.cpf && <div><strong>CPF:</strong> {selectedResponsible.cpf}</div>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Seção de Produtos */}
        <div className="space-y-4 bg-background rounded-lg border p-4 shadow-sm">
          <h3 className="text-base font-semibold text-primary border-b pb-2">PRODUTOS</h3>
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
      </div>
      
      {/* Coluna lateral - Resumo e Pagamento */}
      <div className="col-span-4 space-y-4">
        <OrderSummary 
          form={form}
          selectedProducts={selectedProducts}
        />
        
        {/* Seção de Pagamento e Entrega */}
        <Card className="bg-muted">
          <CardHeader className="text-sm font-medium text-[var(--primary-blue)] border-b pb-2 mb-3">
            PAGAMENTO E ENTREGA
          </CardHeader>
          
          <CardContent className="space-y-3">
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
                      <SelectTrigger className="h-8 text-sm bg-background text-foreground border-input focus:ring-primary">
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
                        className="h-8 text-sm bg-background text-foreground border-input focus:ring-primary"
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
                          className="h-8 text-sm bg-background text-foreground border-input focus:ring-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {showInstallments && (form?.watch("installments") || 0) > 0 && (
              <div className="p-2 bg-blue-100/10 rounded text-xs text-blue-800 border border-blue-100">
                Valor das parcelas: {formatCurrency(calculateInstallmentValue())}
              </div>
            )}

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
                      className="h-8 text-sm bg-background text-foreground border-input focus:ring-primary"
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
                  <FormLabel className={`text-xs ${hasLenses ? 'text-orange-600 font-medium' : ''}`}>
                    Data Entrega {hasLenses && <span className="text-red-500">*</span>}
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field} 
                      disabled={!hasLenses}
                      min={hasLenses ? new Date().toISOString().split('T')[0] : undefined}
                      className={!hasLenses 
                        ? "bg-gray-100 cursor-not-allowed h-8 text-sm text-gray-500 border-input" 
                        : "h-8 text-sm bg-background text-foreground border-input focus:ring-primary"
                      }
                    />
                  </FormControl>
                  {hasLenses ? (
                    <p className="text-xs text-orange-600">
                      ⚠️ Obrigatório para pedidos com lentes (data futura)
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Adicione lentes para habilitar este campo
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações..."
                      className="min-h-[60px] text-sm resize-none bg-background text-foreground border-input focus:ring-primary"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
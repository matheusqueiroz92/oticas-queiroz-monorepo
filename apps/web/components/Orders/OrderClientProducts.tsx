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
import { formatCurrency } from "@/app/utils/formatters";
import type { Customer } from "@/app/types/customer";
import type { Product } from "@/app/types/product";

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
}: OrderClientProductsProps) {
  
  const renderPaymentSection = () => {
    const paymentMethod = form.watch("paymentMethod");
    const isParcelamento = paymentMethod === "bank_slip" || paymentMethod === "promissory_note";

    return (
      <div className="space-y-3 mt-4">
        <h3 className="text-sm font-medium border-b pb-1">Pagamento e Entrega</h3>
        
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
                    value === "credit" || value === "bank_slip" || value === "promissory_note"
                  );
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger className="border border-gray-200 rounded text-sm h-9">
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
                <FormLabel className="text-xs">Valor de Entrada</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    onChange={(e) => {
                      const value = e.target.value ? Number.parseFloat(e.target.value) : '';
                      field.onChange(value);
                    }}
                    value={field.value === 0 ? '' : (field.value as string | number | undefined)}
                    className="border border-gray-200 rounded text-sm h-9"
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
                  <FormLabel className="text-xs">Nº de Parcelas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      placeholder="1"
                      onChange={(e) => {
                        const value = e.target.value ? Number.parseInt(e.target.value) : '';
                        field.onChange(value);
                      }}
                      value={field.value === 0 ? '' : (field.value as string | number | undefined)}
                      className="border border-gray-200 rounded text-sm h-9"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {showInstallments && (form?.watch("installments") || 0) > 0 && (
          <div className="p-2 bg-blue-50 rounded text-sm text-blue-800 border border-blue-100 mt-1">
            Valor das parcelas: {formatCurrency(calculateInstallmentValue())}
            {isParcelamento && (
              <p className="mt-1 text-xs">
                Método de parcelamento: <strong>{paymentMethod === "bank_slip" ? "Boleto Bancário" : "Nota Promissória"}</strong>
              </p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 mt-2">
          <FormField
            control={form.control}
            name="orderDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Data do Pedido</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    className="border border-gray-200 rounded text-sm h-9"
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
                <FormLabel className="text-xs">Data de Entrega</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="date" 
                      {...field} 
                      disabled={!hasLenses}
                      className={!hasLenses ? "bg-gray-100 cursor-not-allowed border border-gray-200 rounded text-sm h-9" : "border border-gray-200 rounded text-sm h-9"}
                    />
                    {!hasLenses && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <span className="text-xs text-gray-500">Bloqueado</span>
                      </div>
                    )}
                  </div>
                </FormControl>
                {!hasLenses ? (
                  <p className="text-xs text-muted-foreground mt-1">
                    Adicione lentes para mudar a data.
                  </p>
                ) : null}
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
                  placeholder="Observações sobre o pedido..."
                  className="min-h-[60px] border border-gray-200 rounded text-sm"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3">
            <h3 className="text-sm font-medium border-b pb-1">Informações do Cliente</h3>
            
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-3">
                <ClientSearch
                  customers={customersData || []}
                  form={form}
                  onClientSelect={handleClientSelect}
                  fetchAllCustomers={fetchAllCustomers}
                />
              </div>

              <div className="col-span-1">
                <FormField
                  control={form.control}
                  name="serviceOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Nº da O.S.</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Número da O.S."
                          onChange={(e) => {
                            const value = e.target.value ? Number.parseInt(e.target.value) : '';
                            field.onChange(value);
                          }}
                          value={field.value === 0 ? '' : (field.value as string | number | undefined)}
                          className="border border-gray-200 rounded text-sm h-9"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          {selectedCustomer && (
            <div className="bg-blue-50 p-2 rounded border border-blue-100 text-sm">
              <p className="font-medium text-blue-800 mb-1">Cliente Selecionado</p>
              <div className="grid grid-cols-2 gap-1">
                <p><span className="font-medium">Nome:</span> {selectedCustomer.name}</p>
                {selectedCustomer.email && (
                  <p><span className="font-medium">Email:</span> {selectedCustomer.email}</p>
                )}
                {selectedCustomer.phone && (
                  <p><span className="font-medium">Telefone:</span> {selectedCustomer.phone}</p>
                )}
                {selectedCustomer.cpf && (
                  <p><span className="font-medium">CPF:</span> {selectedCustomer.cpf}</p>
                )}
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <h3 className="text-sm font-medium border-b pb-1">Produtos</h3>
            
            <ProductSearch
              products={productsData || []}
              form={form}
              onProductAdd={handleAddProduct}
              selectedProducts={selectedProducts}
            />
            
            <SelectedProductsList
              products={selectedProducts}
              onUpdatePrice={handleUpdateProductPrice}
              onRemoveProduct={handleRemoveProduct}
            />
            
            <div className="grid grid-cols-3 gap-3 p-2 bg-gray-50 rounded border border-gray-200">
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
                        className="border border-gray-200 bg-gray-100 rounded text-sm h-9"
                      />
                    </FormControl>
                    <FormMessage />
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
                        className="border border-gray-200 rounded text-sm h-9"
                      />
                    </FormControl>
                    <FormMessage />
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
                        className="font-medium border border-gray-200 bg-gray-100 rounded text-sm h-9"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-4">
          <OrderSummary 
            form={form}
            selectedProducts={selectedProducts}
          />
          {renderPaymentSection()}
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { Loader2, ChevronRight, User, File } from "lucide-react";
import type { Customer } from "@/app/_types/customer";
import type { Product } from "@/app/_types/product";
import { OrderFormValues } from "@/app/_types/form-types";
import OrderStepProgress from "@/components/Orders/OrderStepProgress";
import OrderClientProducts from "@/components/Orders/OrderClientProducts";
import OrderPrescription from "@/components/Orders/OrderPrescription";
import OrderConfirmation from "@/components/Orders/OrderConfirmation";
import OrderSuccessScreen from "@/components/Orders/OrderSuccessScreen";
import { useCustomers } from "@/hooks/useCustomers";

const numericInputStyles = `
  /* Remove as setas para todos os navegadores */
  input::-webkit-outer-spin-button,
  input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Firefox */
  input[type=number] {
    -moz-appearance: textfield;
  }
`;

const steps = [
  { id: "client", label: "Cliente e Produtos" },
  { id: "prescription", label: "Receita" },
  { id: "confirm", label: "Confirmação" }
];

interface OrderFormProps {
  form: any;
  selectedProducts: Product[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  selectedCustomer: Customer | null;
  setSelectedCustomer: React.Dispatch<React.SetStateAction<Customer | null>>;
  hasLenses: boolean;
  setHasLenses: React.Dispatch<React.SetStateAction<boolean>>;
  showInstallments: boolean;
  setShowInstallments: React.Dispatch<React.SetStateAction<boolean>>;
  submittedOrder: any;
  isCreating: boolean;
  customersData: Customer[];
  productsData: Product[];
  loggedEmployee: { id: string; name: string; email: string; role: string; } | null;
  onSubmit: (data: OrderFormValues) => void;
  onCancel: () => void;
  onViewOrdersList: () => void;
  onViewOrderDetails: (id: string) => void;
  onCreateNewOrder: () => void;
  handleAddProduct: (product: Product) => Promise<void>;
  handleRemoveProduct: (productId: string) => void;
  handleUpdateProductPrice: (productId: string, newPrice: number) => void;
  handleClientSelect: (clientId: string, name: string) => void;
  updateFinalPrice: (total: number, discount: number) => void;
  calculateInstallmentValue: () => number;
  isEditing?: boolean;
}

export function OrderForm({
  form,
  selectedProducts, 
  selectedCustomer,
  hasLenses,
  showInstallments,
  setShowInstallments,
  submittedOrder,
  isCreating,
  customersData,
  productsData,
  loggedEmployee,
  isEditing = false,
  onSubmit,
  onCancel,
  onViewOrdersList,
  onViewOrderDetails,
  onCreateNewOrder,
  handleAddProduct,
  handleRemoveProduct,
  handleUpdateProductPrice,
  handleClientSelect,
  updateFinalPrice,
  calculateInstallmentValue,
}: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showPdfDownload, setShowPdfDownload] = useState(false);

  useEffect(() => {
    if (submittedOrder) {
      setShowPdfDownload(true);
    }
  }, [submittedOrder]);

  const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const discount = e.target.value ? Number.parseFloat(e.target.value) : '';
    form.setValue("discount", discount as number);
    updateFinalPrice(form.getValues("totalPrice") || 0, discount || 0);
  };

  const { 
    customers: initialCustomers,
    isLoading: isLoadingCustomers,
    fetchAllCustomers
  } = useCustomers({
    pageSize: 100,
    enablePagination: false
  });

  const checkCanContinue = () => {
    let canContinue = true;
    
    if (!form) return false;
    
    switch (currentStep) {
      case 0:
        canContinue = !!form.getValues("clientId") && selectedProducts.length > 0 && !!form.getValues("paymentMethod");
        break;
      case 1:
        canContinue = true;
        break;
      case 2:
        canContinue = true;
        break;
    }
    
    return canContinue;
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmitForm = () => {
    const formElement = document.getElementById('orderForm') as HTMLFormElement;
    if (formElement) {
      formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
    } else {
      console.error("Form element not found");
      onSubmit(form.getValues() as OrderFormValues);
    }
  };

  // Função para obter o texto do botão baseado no contexto
  const getSubmitButtonText = () => {
    if (isCreating) {
      return isEditing ? "Atualizando..." : "Processando...";
    }
    return isEditing ? "Atualizar Pedido" : "Finalizar Pedido";
  };

  // Função para obter o título do formulário
  const getFormTitle = () => {
    return isEditing ? "Editar Pedido" : "Novo Pedido";
  };

  // Função para obter a descrição do formulário
  const getFormDescription = () => {
    return isEditing ? "Atualize os dados do pedido" : "Cadastre um novo pedido";
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <OrderClientProducts
            form={form}
            customersData={customersData}
            productsData={productsData}
            selectedProducts={selectedProducts}
            selectedCustomer={selectedCustomer}
            hasLenses={hasLenses}
            showInstallments={showInstallments}
            fetchAllCustomers={fetchAllCustomers}
            setShowInstallments={setShowInstallments}
            handleClientSelect={handleClientSelect}
            handleAddProduct={handleAddProduct}
            handleRemoveProduct={handleRemoveProduct}
            handleUpdateProductPrice={handleUpdateProductPrice}
            handleDiscountChange={handleDiscountChange}
            calculateInstallmentValue={calculateInstallmentValue}
          />
        );

      case 1:
        return (
          <OrderPrescription
            form={form}
            selectedProducts={selectedProducts}
          />
        );

      case 2:
        return (
          <OrderConfirmation
            form={form}
            selectedProducts={selectedProducts}
            selectedCustomer={selectedCustomer}
            calculateInstallmentValue={calculateInstallmentValue}
            showInstallments={showInstallments}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Adiciona o CSS para remover as setas dos inputs numéricos */}
      <style jsx global>{numericInputStyles}</style>
      
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="border-b bg-gray-50 p-4 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <File className="h-5 w-5 text-[var(--secondary-red)]" />
            </div>
            <div>
              <h1 className="text-xl text-[var(--secondary-red)] font-bold">
                {getFormTitle()}
              </h1>
              <p className="text-muted-foreground">{getFormDescription()}</p>
            </div>
          </div>
          {loggedEmployee && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="h-4 w-4" /> Vendedor: {loggedEmployee.name}
            </p>
          )}
        </div>

        {!showPdfDownload ? (
          <div className="p-4">
            <Form {...form}>
              <form
                id="orderForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  onSubmit(form.getValues() as OrderFormValues);
                }}
                className="space-y-6"
              >
                <OrderStepProgress
                  steps={steps}
                  currentStep={currentStep}
                  setCurrentStep={setCurrentStep}
                />
                
                <div className="min-h-[calc(100vh-400px)]">
                  {renderStepContent()}
                </div>
                
                <div className="flex justify-between pt-4 border-t">
                  <div>
                    {currentStep > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        size="sm"
                        className="flex items-center text-sm h-9"
                      >
                        <ChevronRight className="h-4 w-4 mr-1 rotate-180" />
                        Anterior
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onCancel}
                      size="sm"
                      className="text-sm h-9"
                    >
                      Cancelar
                    </Button>
                    
                    {currentStep < steps.length - 1 ? (
                      <Button 
                        type="button" 
                        onClick={nextStep}
                        disabled={!checkCanContinue()}
                        size="sm"
                        className="flex items-center text-sm h-9"
                      >
                        Próximo
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    ) : (
                      <Button 
                        type="button" 
                        disabled={isCreating || selectedProducts.length === 0}
                        size="sm"
                        className="text-sm h-9"
                        onClick={handleSubmitForm}
                      >
                        {isCreating ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {getSubmitButtonText()}
                          </>
                        ) : (
                          getSubmitButtonText()
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
            </Form>
          </div>
        ) : (
          <div className="p-4">
            <OrderSuccessScreen
              form={form}
              submittedOrder={submittedOrder}
              selectedCustomer={selectedCustomer}
              onViewOrdersList={onViewOrdersList}
              onViewOrderDetails={onViewOrderDetails}
              onCreateNewOrder={onCreateNewOrder}
            />
          </div>
        )}
      </div>
    </>
  );
}
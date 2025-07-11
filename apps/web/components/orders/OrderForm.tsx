import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
} from "@/components/ui/form";
import { Loader2, ChevronRight } from "lucide-react";
import type { Customer } from "@/app/_types/customer";
import type { Product } from "@/app/_types/product";
import { OrderFormValues, orderFormSchema } from "@/app/_types/form-types";
import OrderStepProgress from "@/components/orders/OrderStepProgress";
import OrderClientProducts from "@/components/orders/OrderClientProducts";
import OrderPrescription from "@/components/orders/OrderPrescription";
import OrderConfirmation from "@/components/orders/OrderConfirmation";
import { useCustomers } from "@/hooks/useCustomers";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isLens } from "@/app/_utils/product-utils";

const numericInputStyles = `
  /* Remove as setas dos inputs numéricos */
  input[type="number"]::-webkit-outer-spin-button,
  input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
  
  input[type="number"] {
    -moz-appearance: textfield;
  }
`;

const steps = [
  { id: "client", label: "Cliente e Produtos" },
  { id: "prescription", label: "Receita" },
  { id: "confirm", label: "Confirmação" }
];

interface OrderFormProps {
  isEditing?: boolean;
  initialData?: Partial<OrderFormValues>;
  hasLenses: boolean;
  setHasLenses: React.Dispatch<React.SetStateAction<boolean>>;
  showInstallments: boolean;
  setShowInstallments: React.Dispatch<React.SetStateAction<boolean>>;
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
  handleResponsibleSelect?: (clientId: string, name: string) => void;
  updateFinalPrice: (total: number, discount: number) => void;
  calculateInstallmentValue: () => number;
}

export function OrderForm({
  isEditing = false,
  initialData,
  hasLenses,
  setHasLenses,
  showInstallments,
  setShowInstallments,
  customersData,
  productsData,
  loggedEmployee,
  onSubmit,
  onCancel,
  // onViewOrdersList,
  // onViewOrderDetails,
  // onCreateNewOrder,
  // handleAddProduct,
  // handleRemoveProduct,
  // handleUpdateProductPrice,
  // handleClientSelect,
  // handleResponsibleSelect,
  // updateFinalPrice,
  // calculateInstallmentValue,
}: OrderFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedResponsible, setSelectedResponsible] = useState<Customer | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || "",
      clientId: initialData?.clientId || "",
      hasResponsible: initialData?.hasResponsible || false,
      responsibleClientId: initialData?.responsibleClientId || "",
      products: initialData?.products || [],
      paymentMethod: initialData?.paymentMethod || "",
      paymentStatus: initialData?.paymentStatus || "pending",
      paymentEntry: initialData?.paymentEntry || 0,
      installments: initialData?.installments || undefined,
      orderDate: initialData?.orderDate || "",
      deliveryDate: initialData?.deliveryDate || "",
      status: initialData?.status || "pending",
      laboratoryId: initialData?.laboratoryId || "",
      observations: initialData?.observations || "",
      totalPrice: initialData?.totalPrice || 0,
      discount: initialData?.discount || 0,
      finalPrice: initialData?.finalPrice || 0,
      prescriptionData: {
        doctorName: initialData?.prescriptionData?.doctorName || "",
        clinicName: initialData?.prescriptionData?.clinicName || "",
        appointmentDate: initialData?.prescriptionData?.appointmentDate || "",
        rightEye: { 
          sph: initialData?.prescriptionData?.rightEye?.sph || "", 
          cyl: initialData?.prescriptionData?.rightEye?.cyl || "", 
          axis: initialData?.prescriptionData?.rightEye?.axis || 0, 
          pd: initialData?.prescriptionData?.rightEye?.pd || 0 
        },
        leftEye: { 
          sph: initialData?.prescriptionData?.leftEye?.sph || "", 
          cyl: initialData?.prescriptionData?.leftEye?.cyl || "", 
          axis: initialData?.prescriptionData?.leftEye?.axis || 0, 
          pd: initialData?.prescriptionData?.leftEye?.pd || 0 
        },
        nd: initialData?.prescriptionData?.nd || 0,
        oc: initialData?.prescriptionData?.oc || 0,
        addition: initialData?.prescriptionData?.addition || 0,
        bridge: initialData?.prescriptionData?.bridge || 0,
        rim: initialData?.prescriptionData?.rim || 0,
        vh: initialData?.prescriptionData?.vh || 0,
        sh: initialData?.prescriptionData?.sh || 0,
      },
    },
    mode: "onChange",
  });

  // Effect para resetar o formulário quando initialData mudar
  useEffect(() => {
    if (initialData && mounted) {
      
      // Resetar o formulário com os novos dados
      form.reset({
        employeeId: initialData.employeeId || "",
        clientId: initialData.clientId || "",
        hasResponsible: initialData.hasResponsible || false,
        responsibleClientId: initialData.responsibleClientId || "",
        products: initialData.products || [],
        paymentMethod: initialData.paymentMethod || "",
        paymentStatus: initialData.paymentStatus || "pending",
        paymentEntry: initialData.paymentEntry || 0,
        installments: initialData.installments || undefined,
        orderDate: initialData.orderDate || "",
        deliveryDate: initialData.deliveryDate || "",
        status: initialData.status || "pending",
        laboratoryId: initialData.laboratoryId || "",
        observations: initialData.observations || "",
        totalPrice: initialData.totalPrice || 0,
        discount: initialData.discount || 0,
        finalPrice: initialData.finalPrice || 0,
        prescriptionData: {
          doctorName: initialData.prescriptionData?.doctorName || "",
          clinicName: initialData.prescriptionData?.clinicName || "",
          appointmentDate: initialData.prescriptionData?.appointmentDate || "",
          rightEye: { 
            sph: initialData.prescriptionData?.rightEye?.sph || "", 
            cyl: initialData.prescriptionData?.rightEye?.cyl || "", 
            axis: initialData.prescriptionData?.rightEye?.axis || 0, 
            pd: initialData.prescriptionData?.rightEye?.pd || 0 
          },
          leftEye: { 
            sph: initialData.prescriptionData?.leftEye?.sph || "", 
            cyl: initialData.prescriptionData?.leftEye?.cyl || "", 
            axis: initialData.prescriptionData?.leftEye?.axis || 0, 
            pd: initialData.prescriptionData?.leftEye?.pd || 0 
          },
          nd: initialData.prescriptionData?.nd || 0,
          oc: initialData.prescriptionData?.oc || 0,
          addition: initialData.prescriptionData?.addition || 0,
          bridge: initialData.prescriptionData?.bridge || 0,
          rim: initialData.prescriptionData?.rim || 0,
          vh: initialData.prescriptionData?.vh || 0,
          sh: initialData.prescriptionData?.sh || 0,
        },
      });
      
      // Configurar produtos selecionados
      if (initialData.products && initialData.products.length > 0) {
        setSelectedProducts(initialData.products);
      }
    }
  }, [initialData, mounted, form]);

  // Effect separado para configurar o cliente selecionado quando ambos initialData e customersData estiverem disponíveis
  useEffect(() => {
    if (initialData?.clientId && customersData && customersData.length > 0 && mounted) {
      const customer = customersData.find(c => c._id === initialData.clientId);
      if (customer && (!selectedCustomer || selectedCustomer._id !== customer._id)) {
        setSelectedCustomer(customer);
      }
    }
  }, [initialData?.clientId, customersData, mounted, selectedCustomer]);

  useEffect(() => {
    if (mounted && !initialData) {
      // Valores padrão para novo pedido
      const today = new Date().toISOString().split("T")[0];
      form.setValue("orderDate", today);
      form.setValue("deliveryDate", today);
      form.setValue("prescriptionData.appointmentDate", today);
      
      // Definir employeeId se loggedEmployee estiver disponível
      if (loggedEmployee?.id) {
        form.setValue("employeeId", loggedEmployee.id);
      }
    }
  }, [mounted, form, loggedEmployee, initialData]);

  const { isSubmitting } = form.formState;

  // Sincronizar produtos selecionados com o campo do formulário e detectar lentes
  useEffect(() => {
    form.setValue("products", selectedProducts);
    
    // Verificar se há lentes nos produtos selecionados
    const hasLensProducts = selectedProducts.some(product => 
      isLens(product.productType) || 
      (product.name && product.name.toLowerCase().includes('lente'))
    );
    
    // Atualizar estado hasLenses
    if (hasLensProducts !== hasLenses) {
      setHasLenses(hasLensProducts);
    }
    
    // Se não há lentes, limpar a data de entrega
    if (!hasLensProducts) {
      form.setValue("deliveryDate", "");
    }
    
    // Calcular preços - mantendo o desconto atual
    const totalPrice = selectedProducts.reduce((sum, product) => sum + (product.sellPrice || 0), 0);
    const currentDiscount = form.getValues("discount") || 0;
    const finalPrice = Math.max(0, totalPrice - currentDiscount);
    
    form.setValue("totalPrice", totalPrice);
    form.setValue("finalPrice", finalPrice);
    
    console.log("OrderForm - Recalculando preços:");
    console.log("Total:", totalPrice);
    console.log("Desconto atual:", currentDiscount);
    console.log("Final:", finalPrice);
  }, [selectedProducts, form, hasLenses, setHasLenses]);

  // Função removida - agora o desconto é controlado diretamente no OrderClientProducts
  // const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const discount = e.target.value ? Number.parseFloat(e.target.value) : 0;
  //   form.setValue("discount", discount);
  //   updateFinalPriceInternal(form.getValues("totalPrice") || 0, discount);
  // };

  const { 
    fetchAllCustomers
  } = useCustomers({
    pageSize: 100,
    enablePagination: false
  });

  // Funções internas para gerenciar produtos e clientes
  const handleAddProductInternal = async (product: Product) => {
    console.log("OrderForm: Adicionando produto:", product);
    setSelectedProducts(prev => {
      const newProducts = [...prev, product];
      console.log("OrderForm: Produtos após adição:", newProducts);
      return newProducts;
    });
  };

  const handleRemoveProductInternal = (productId: string) => {
    console.log("OrderForm: Removendo produto:", productId);
    setSelectedProducts(prev => prev.filter(p => p._id !== productId));
  };

  const handleClientSelectInternal = (clientId: string, name: string) => {
    console.log("OrderForm: Selecionando cliente:", clientId, name);
    setSelectedCustomer({ _id: clientId, name } as Customer);
    form.setValue("clientId", clientId);
  };

  const handleResponsibleSelectInternal = (clientId: string, name: string) => {
    console.log("OrderForm: Selecionando responsável:", clientId, name);
    setSelectedResponsible({ _id: clientId, name } as Customer);
    form.setValue("responsibleClientId", clientId);
  };

  const handleUpdateProductPriceInternal = (productId: string, newPrice: number) => {
    console.log("OrderForm: Atualizando preço do produto:", productId, newPrice);
    setSelectedProducts(prev => 
      prev.map(p => p._id === productId ? { ...p, sellPrice: newPrice } : p)
    );
  };

  // const updateFinalPriceInternal = (total: number, discount: number) => {
  //   const finalPrice = total - discount;
  //   form.setValue("totalPrice", total);
  //   form.setValue("discount", discount);
  //   form.setValue("finalPrice", finalPrice);
  // };

  const calculateInstallmentValueInternal = () => {
    const finalPrice = form.getValues("finalPrice") || 0;
    const paymentEntry = form.getValues("paymentEntry") || 0;
    const installments = form.getValues("installments") || 1;
    
    // Calcular o valor restante após descontar a entrada
    const remainingAmount = Math.max(0, finalPrice - paymentEntry);
    
    console.log("Cálculo das parcelas:");
    console.log("Valor final:", finalPrice);
    console.log("Entrada:", paymentEntry);
    console.log("Valor restante:", remainingAmount);
    console.log("Parcelas:", installments);
    console.log("Valor por parcela:", remainingAmount / installments);
    
    return remainingAmount / installments;
  };

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
    if (isSubmitting) {
      return isEditing ? "Atualizando..." : "Processando...";
    }
    return isEditing ? "Atualizar Pedido" : "Finalizar Pedido";
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
            selectedResponsible={selectedResponsible}
            hasLenses={hasLenses}
            showInstallments={showInstallments}
            fetchAllCustomers={fetchAllCustomers}
            setShowInstallments={setShowInstallments}
            handleClientSelect={handleClientSelectInternal}
            handleResponsibleSelect={handleResponsibleSelectInternal}
            handleAddProduct={handleAddProductInternal}
            handleRemoveProduct={handleRemoveProductInternal}
            handleUpdateProductPrice={handleUpdateProductPriceInternal}
            handleDiscountChange={() => {}} // Função removida - controlada diretamente no componente
            calculateInstallmentValue={calculateInstallmentValueInternal}
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
            calculateInstallmentValue={calculateInstallmentValueInternal}
            showInstallments={showInstallments}
          />
        );

      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <>
      {/* Adiciona o CSS para remover as setas dos inputs numéricos */}
      <style jsx global>{numericInputStyles}</style>
      
      <div className="bg-background border border-input shadow-sm">
        <div className="border-b bg-muted p-4">
          <OrderStepProgress
            steps={steps}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
            compact={true}
          />
        </div>

        <div className="p-6">
          <Form {...form}>
            <form
              id="orderForm"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmit(form.getValues() as OrderFormValues);
              }}
              className="space-y-6"
            >
              <div className="min-h-[400px]">
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
                      disabled={isSubmitting || selectedProducts.length === 0}
                      size="sm"
                      className="text-sm h-9"
                      onClick={handleSubmitForm}
                    >
                      {isSubmitting ? (
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
      </div>
    </>
  );
}
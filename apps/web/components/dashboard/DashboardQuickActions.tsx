"use client";

import {
  Plus,
  UserPlus,
  Package,
  HandCoins,
  FileText,
} from "lucide-react";
import { QuickActionButton } from "@/components/dashboard/QuickActionButton";
import { OrderDialog } from "@/components/orders/OrderDialog";
import { CustomerDialog } from "@/components/customers/CustomerDialog";
import { ProductDialog } from "@/components/products/ProductDialog";
import { PaymentDialog } from "@/components/payments/PaymentDialog";

interface DialogStates {
  orderDialogOpen: boolean;
  customerDialogOpen: boolean;
  productDialogOpen: boolean;
  paymentDialogOpen: boolean;
}

interface DashboardQuickActionsProps {
  dialogStates: DialogStates;
  openDialog: (dialogName: keyof DialogStates) => void;
  closeDialog: (dialogName: keyof DialogStates) => void;
}

export function DashboardQuickActions({
  dialogStates,
  openDialog,
  closeDialog,
}: DashboardQuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 xl:grid-cols-5 gap-4">
      <QuickActionButton
        icon={Plus}
        title="Novo Pedido"
        description="Criar pedido"
        onClick={() => openDialog('orderDialogOpen')}
        ariaLabel="Abrir novo pedido"
      >
        <OrderDialog
          open={dialogStates.orderDialogOpen}
          onOpenChange={() => closeDialog('orderDialogOpen')}
          mode="create"
        />
      </QuickActionButton>

      <QuickActionButton
        icon={UserPlus}
        title="Novo Cliente"
        description="Cadastrar cliente"
        onClick={() => openDialog('customerDialogOpen')}
        ariaLabel="Abrir novo cliente"
      >
        <CustomerDialog
          open={dialogStates.customerDialogOpen}
          onOpenChange={() => closeDialog('customerDialogOpen')}
          mode="create"
        />
      </QuickActionButton>

      <QuickActionButton
        icon={Package}
        title="Novo Produto"
        description="Cadastrar produto"
        onClick={() => openDialog('productDialogOpen')}
        ariaLabel="Abrir novo produto"
      >
        <ProductDialog
          open={dialogStates.productDialogOpen}
          onOpenChange={() => closeDialog('productDialogOpen')}
          mode="create"
        />
      </QuickActionButton>

      <QuickActionButton
        icon={HandCoins}
        title="Novo Pagamento"
        description="Cadastrar pagamento"
        onClick={() => openDialog('paymentDialogOpen')}
        ariaLabel="Abrir novo pagamento"
      >
        <PaymentDialog
          open={dialogStates.paymentDialogOpen}
          onOpenChange={() => closeDialog('paymentDialogOpen')}
          mode="create"
        />
      </QuickActionButton>

      <QuickActionButton
        icon={FileText}
        title="Novo Relatório"
        description="Gerar relatório"
        onClick={() => openDialog('customerDialogOpen')}
        ariaLabel="Abrir novo relatório"
      >
        <CustomerDialog
          open={dialogStates.customerDialogOpen}
          onOpenChange={() => closeDialog('customerDialogOpen')}
          mode="create"
        />
      </QuickActionButton>
    </div>
  );
} 
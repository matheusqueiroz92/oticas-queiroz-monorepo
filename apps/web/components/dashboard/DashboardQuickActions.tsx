"use client";

import {
  FilePlus,
  FileText,
  UserPlus,
  PackagePlus,
  HandCoins,
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
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
      <QuickActionButton
        icon={FilePlus}
        title="Gerar Pedido"
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
        title="Cadastrar Cliente"
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
        icon={PackagePlus}
        title="Incluir Produto"
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
        title="Registrar Pagamento"
        onClick={() => openDialog('paymentDialogOpen')}
        ariaLabel="Abrir novo pagamento"
      />
      
      {/* Renderizar PaymentDialog apenas quando aberto */}
      {dialogStates.paymentDialogOpen && (
        <PaymentDialog
          open={dialogStates.paymentDialogOpen}
          onOpenChange={() => closeDialog('paymentDialogOpen')}
          mode="create"
        />
      )}

      {/* <QuickActionButton
        icon={FileText}
        title="Gerar Relatório"
        onClick={() => openDialog('customerDialogOpen')}
        ariaLabel="Abrir novo relatório"
      >
        <CustomerDialog
          open={dialogStates.customerDialogOpen}
          onOpenChange={() => closeDialog('customerDialogOpen')}
          mode="create"
        />
      </QuickActionButton> */}
    </div>
  );
} 
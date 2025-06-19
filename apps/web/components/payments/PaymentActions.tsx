"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { PaymentDialog } from "./PaymentDialog";

interface PaymentActionsProps {
  onRefresh?: () => void;
}

export function PaymentActions({ onRefresh }: PaymentActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSuccess = () => {
    onRefresh?.();
  };

  return (
    <>
      <div className="flex gap-2">
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        )}
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Pagamento
        </Button>
      </div>

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        mode="create"
      />
    </>
  );
} 
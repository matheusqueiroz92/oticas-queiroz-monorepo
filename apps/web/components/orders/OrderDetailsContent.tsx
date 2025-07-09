import OrderDetails from "@/components/orders/OrderDetails";
import { customBadgeStyles } from "@/app/_utils/custom-badge-styles";
import type { Order } from "@/app/_types/order";

interface OrderDetailsContentProps {
  order: Order;
  onGoBack: () => void;
  onRefresh: () => void;
}

export function OrderDetailsContent({ order, onGoBack, onRefresh }: OrderDetailsContentProps) {
  return (
    <>
      <style jsx global>{customBadgeStyles}</style>
      <OrderDetails
        order={order}
        onGoBack={onGoBack}
        onRefresh={onRefresh}
      />
    </>
  );
} 
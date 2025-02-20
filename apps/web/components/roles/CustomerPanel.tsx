import { MyOrders } from "../sections/MyOrders";
import { PaymentHistory } from "../sections/PaymentHistory";

export const CustomerPanel = () => (
  <div className="space-y-8">
    <MyOrders />
    <PaymentHistory />
  </div>
);

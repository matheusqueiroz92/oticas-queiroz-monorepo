import { QuickActions } from "../ui/QuickActions";
import { OrderManagement } from "../sections/OrderManagement";

export const EmployeePanel = () => (
  <div className="space-y-8">
    <QuickActions />
    <OrderManagement />
  </div>
);

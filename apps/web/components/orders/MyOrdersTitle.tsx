import { ShoppingCart } from "lucide-react";

interface MyOrdersTitleProps {
  title: string;
  isCustomer: boolean;
}

export function MyOrdersTitle({ title, isCustomer }: MyOrdersTitleProps) {
  if (!isCustomer) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 pb-4">
      <ShoppingCart className="h-6 w-6 text-blue-600" />
      <h1 className="text-2xl font-bold">{title}</h1>
    </div>
  );
} 
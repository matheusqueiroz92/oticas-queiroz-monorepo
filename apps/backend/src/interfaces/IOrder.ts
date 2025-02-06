export interface IOrder {
  clientId: string;
  products: string[];
  status: "pending" | "in_production" | "ready" | "delivered";
  laboratoryId?: string;
  totalPrice: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Product {
  _id: string;
  name: string;
  category: string;
  description: string;
  image: string;
  brand: string;
  modelGlasses: string;
  price: number;
  stock: number;
  createdAt: Date;
  updatedAt: Date;
}

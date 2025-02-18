export interface IProduct {
  _id: string;
  name: string;
  category: string;
  description: string;
  brand: string;
  modelGlasses: string;
  price: number;
  stock: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateProductDTO {
  name: string;
  category: string;
  description: string;
  brand: string;
  modelGlasses: string;
  price: number;
  stock: number;
}

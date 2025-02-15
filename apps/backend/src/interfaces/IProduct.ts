export interface IProduct {
  _id: string;
  name: string;
  category: string;
  description: string;
  brand: string;
  modelGlasses: string;
  price: number;
  stock: number;
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

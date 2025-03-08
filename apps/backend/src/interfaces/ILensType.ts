export interface ILensType {
  _id: string;
  name: string;
  description?: string;
  brand?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateLensTypeDTO {
  name: string;
  description?: string;
  brand?: string;
}

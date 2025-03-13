export interface ILensType {
  _id: string;
  name: string;
  description?: string;
  brand?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICreateLensTypeDTO = Omit<
  ILensType,
  "_id" | "createdAt" | "updatedAt"
>;

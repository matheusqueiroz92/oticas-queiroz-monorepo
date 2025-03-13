export interface ILaboratory {
  _id?: string;
  name: string;
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  phone: string;
  email: string;
  contactName: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ICreateLaboratoryDTO = Omit<
  ILaboratory,
  "_id" | "createdAt" | "updatedAt"
>;

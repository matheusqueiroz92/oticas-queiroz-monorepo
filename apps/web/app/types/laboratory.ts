export interface Laboratory {
  _id: string;
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

export interface LaboratoryFilters {
  search?: string;
  page?: number;
  isActive?: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

export interface LoggedEmployee {
  id: string;
  name: string;
  email: string;
  role: string;
}
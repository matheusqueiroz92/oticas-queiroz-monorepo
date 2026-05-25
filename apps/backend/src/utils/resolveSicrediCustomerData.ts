import type { IUser } from "../interfaces/IUser";
import type { SicrediCustomerData } from "../validators/sicrediValidators";

export interface SicrediAddressDetails {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
}

export function isSicrediAddressComplete(
  address?: SicrediAddressDetails | null
): address is SicrediAddressDetails {
  if (!address) return false;
  return Boolean(
    address.logradouro?.trim() &&
      address.numero?.trim() &&
      address.bairro?.trim() &&
      address.cidade?.trim() &&
      address.uf?.trim()?.length === 2 &&
      address.cep?.replace(/\D/g, "").length >= 8
  );
}

export function resolveSicrediCustomerData(user: IUser): {
  data: Partial<SicrediCustomerData>;
  isComplete: boolean;
  missingFields: string[];
} {
  const cpfCnpj = (user.cpf || user.cnpj || "").replace(/\D/g, "");
  const details = user.addressDetails;
  const missingFields: string[] = [];

  if (!user.name?.trim()) missingFields.push("nome");
  if (cpfCnpj.length < 11) missingFields.push("cpfCnpj");
  if (!details?.logradouro?.trim()) missingFields.push("logradouro");
  if (!details?.numero?.trim()) missingFields.push("numero");
  if (!details?.bairro?.trim()) missingFields.push("bairro");
  if (!details?.cidade?.trim()) missingFields.push("cidade");
  if (!details?.uf?.trim() || details.uf.trim().length !== 2) missingFields.push("uf");
  if ((details?.cep || "").replace(/\D/g, "").length < 8) missingFields.push("cep");

  const data: Partial<SicrediCustomerData> = {
    nome: user.name,
    cpfCnpj,
    endereco: details
      ? {
          logradouro: details.logradouro || "",
          numero: details.numero || "",
          complemento: details.complemento,
          bairro: details.bairro || "",
          cidade: details.cidade || "",
          uf: (details.uf || "").toUpperCase(),
          cep: (details.cep || "").replace(/\D/g, ""),
        }
      : undefined,
  };

  return {
    data,
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

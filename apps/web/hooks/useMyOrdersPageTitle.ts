import { useMemo } from 'react';

export function useMyOrdersPageTitle(isCustomer: boolean, isEmployee: boolean, loggedUserName: string) {
  const pageInfo = useMemo(() => {
    if (isCustomer) {
      return {
        title: "Meus Pedidos",
        description: "Pedidos realizados por você",
      };
    } else if (isEmployee) {
      return {
        title: "Meus Pedidos",
        description: `Pedidos registrados por ${loggedUserName || 'você'}`,
      };
    }
    return {
      title: "Meus Pedidos",
      description: "Seus pedidos",
    };
  }, [isCustomer, isEmployee, loggedUserName]);

  return pageInfo;
} 
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function usePageTitle() {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);

  // Garante que só renderiza descrições após hidratação
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getPageTitle = (): { title: string; description?: string } => {
    switch (pathname) {
      case "/dashboard":
        return {
          title: "Dashboard",
          description: isClient ? "Visão geral da loja: atalhos, informações e estatísticas" : undefined
        };
      case "/profile":
        return {
          title: "Perfil",
          description: isClient ? "Configurações da sua conta e informações pessoais" : undefined
        };
      case "/customers":
        return {
          title: "Clientes",
          description: isClient ? "Cadastro e gestão de clientes da loja" : undefined
        };
      case "/employees":
        return {
          title: "Funcionários",
          description: isClient ? "Gestão da equipe e permissões de acesso" : undefined
        };
      case "/orders":
        return {
          title: "Pedidos",
          description: isClient ? "Gerencie todos os pedidos da loja: visualização, filtragem e detalhes" : undefined
        };
      case "/my-orders":
        return {
          title: "Meus Pedidos",
          description: isClient ? "Histórico dos seus pedidos: visualização, filtragem e detalhes" : undefined
        };
      case "/my-debts":
        return {
          title: "Meus Débitos",
          description: isClient ? "Controle das suas pendências financeiras: visualização, filtragem e detalhes" : undefined
        };
      case "/products":
        return {
          title: "Produtos",
          description: isClient ? "Catálogo e controle de estoque: visualização, filtragem e detalhes" : undefined
        };
      case "/payments":
        return {
          title: "Pagamentos",
          description: isClient ? "Controle financeiro e transações: visualização, filtragem e detalhes" : undefined
        };
      case "/cash-register":
        return {
          title: "Caixa",
          description: isClient ? "Controle de abertura e fechamento de caixa: visualização, filtragem e detalhes" : undefined
        };
      case "/laboratories":
        return {
          title: "Laboratórios",
          description: isClient ? "Gestão de laboratórios parceiros: visualização, filtragem e detalhes" : undefined
        };
      case "/reports":
        return {
          title: "Relatórios",
          description: isClient ? "Análises e relatórios gerenciais: visualização, filtragem e detalhes" : undefined
        };
      case "/legacy-clients":
        return {
          title: "Clientes Legados",
          description: isClient ? "Clientes do sistema anterior: visualização, filtragem e detalhes" : undefined
        };
      case "/institutions":
        return {
          title: "Instituições",
          description: isClient ? "Gestão de instituições parceiras: visualização, filtragem e detalhes" : undefined
        };
      case "/checks":
        return {
          title: "Gestão de Cheques",
          description: isClient ? "Controle de cheques recebidos: visualização, filtragem e detalhes" : undefined
        };
      default:
        // Para rotas dinâmicas, extrair o título da URL
        if (pathname.includes("/customers/")) {
          return { 
            title: "Detalhes do Cliente",
            description: isClient ? "Visualize os detalhes do cliente" : undefined
          };
        }
        if (pathname.includes("/employees/")) {
          return { 
            title: "Detalhes do Funcionário",
            description: isClient ? "Visualize os detalhes do funcionário" : undefined
          };
        }
        if (pathname.includes("/orders/")) {
          return { 
            title: "Detalhes do Pedido",
            description: isClient ? "Visualize os detalhes do pedido" : undefined
          };
        }
        if (pathname.includes("/products/")) {
          return { 
            title: "Detalhes do Produto",
            description: isClient ? "Visualize os detalhes do produto" : undefined
          };
        }
        if (pathname.includes("/payments/")) {
          return { 
            title: "Detalhes do Pagamento",
            description: isClient ? "Visualize os detalhes do pagamento" : undefined
          };
        }
        if (pathname.includes("/cash-register/")) {
          return { 
            title: "Detalhes do caixa",
            description: isClient ? "Visualize os detalhes do caixa" : undefined
          };
        }
        if (pathname.includes("/laboratories/")) {
          return { 
            title: "Detalhes do Laboratório",
            description: isClient ? "Visualize os detalhes do laboratório" : undefined
          };
        }
        if (pathname.includes("/reports/")) {
          return { 
            title: "Relatórios",
            description: isClient ? "Visualize os relatórios" : undefined
          };
        }
        if (pathname.includes("/legacy-clients/")) {
          return { 
            title: "Detalhes do Cliente Legado",
            description: isClient ? "Visualize os detalhes do cliente legado" : undefined
          };
        }
        if (pathname.includes("/institutions/")) {
          return { 
            title: "Detalhes da Instituição",
            description: isClient ? "Visualize os detalhes da instituição" : undefined
          };
        }
        if (pathname.includes("/checks/")) {
          return { 
            title: "Detalhes do Cheque",
            description: isClient ? "Visualize os detalhes do cheque" : undefined
          };
        }
        return { 
          title: "Página",
          description: isClient ? "Página não encontrada" : undefined
        };
    }
  };

  return getPageTitle();
} 
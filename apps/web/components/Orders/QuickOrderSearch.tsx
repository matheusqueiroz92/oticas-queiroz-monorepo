import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileText, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api } from "@/app/_services/authService";
import { API_ROUTES } from "@/app/_constants/api-routes";
import { formatCurrency, formatDate, getOrderStatusClass, translateOrderStatus } from "@/app/_utils/formatters";
import { useUsers } from "@/hooks/useUsers";
import type { Order } from "@/app/_types/order";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface OrderSearchResult extends Partial<Order> {
  _id: string;
  clientId: string;
  finalPrice: number;
  status: "pending" | "in_production" | "ready" | "delivered" | "cancelled";
  serviceOrder?: string;
  cpf?: string;
  orderDate?: string | Date;
  createdAt?: string | Date;
}

interface QuickOrderSearchProps {
  className?: string;
}

export const QuickOrderSearch: React.FC<QuickOrderSearchProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<OrderSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { getUserName, fetchUsers } = useUsers();

  const searchOrders = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchParams: Record<string, string> = {};
      
      const cleanSearch = query.trim().replace(/\D/g, '');
      
      if (/^\d{11}$/.test(cleanSearch)) {
        searchParams.cpf = cleanSearch;
      } else if (/^\d{4,7}$/.test(cleanSearch)) {
        searchParams.serviceOrder = cleanSearch;
      } else {
        searchParams.search = query.trim();
      }
      
      searchParams._t = Date.now().toString();
      
      const response = await api.get(API_ROUTES.ORDERS.LIST, {
        params: searchParams,
        headers: {
          'Cache-Control': 'no-cache',
          'X-Timestamp': Date.now().toString()
        }
      });

      let results: OrderSearchResult[] = [];
      if (Array.isArray(response.data)) {
        results = response.data;
      } else if (response.data?.orders) {
        results = response.data.orders;
      }

      const clientIds = results.map(order => 
        typeof order.clientId === 'string' ? order.clientId : ''
      ).filter(Boolean);
      
      if (clientIds.length > 0) {
        fetchUsers(clientIds);
      }

      setSearchResults(results.slice(0, 5));
    } catch (error) {
      console.error("Erro ao buscar pedidos:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery) {
        searchOrders(searchQuery);
        setShowResults(true);
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (resultsRef.current && !resultsRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (searchResults.length > 0) {
      const clientIds = searchResults
        .map(order => {
          if (typeof order.clientId === 'string') {
            if (order.clientId.includes('ObjectId')) {
              try {
                const matches = order.clientId.match(/ObjectId\('([^']+)'\)/);
                if (matches && matches[1]) {
                  return matches[1];
                }
              } catch (err) {
                console.error("Erro ao extrair ID do cliente:", err);
              }
            }
            return order.clientId;
          }
          else if (
            typeof order.clientId === 'object' &&
            order.clientId !== null &&
            '_id' in order.clientId
          ) {
            return (order.clientId as { _id: string })._id;
          }
          return '';
        })
        .filter(Boolean);

      if (clientIds.length > 0) {
        fetchUsers(clientIds);
      }
    }
  }, [searchResults, fetchUsers]);

  const viewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
  };

  const getClientName = (clientId: string | any): string => {
    if (!clientId) return "Cliente";
    
    if (typeof clientId === 'object' && clientId !== null && clientId.name) {
      return clientId.name;
    }
    
    if (typeof clientId === 'string' && clientId.includes('ObjectId')) {
      try {
        const matches = clientId.match(/ObjectId\('([^']+)'\)/);
        if (matches && matches[1]) {
          return getUserName(matches[1]);
        }
      } catch (err) {
        console.error("Erro ao extrair ID do cliente:", err);
      }
    }
    
    return getUserName(clientId);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-[var(--primary-blue)]">
          Busca Rápida de Pedidos
        </CardTitle>
        <CardDescription>
          Pesquise por cliente, CPF ou número da O.S.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="relative">
            <Input
              placeholder="Buscar pedido..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(!!searchQuery)}
              className="pl-9 pr-8"
              aria-label="Buscar pedido por cliente, CPF ou O.S."
            />
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            
            <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                  <div className="w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs">?</div>
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Você pode buscar por:</p>
                <ul className="list-disc pl-4 text-xs mt-1">
                  <li>Nome do cliente</li>
                  <li>CPF (formato: 12345678900)</li>
                  <li>Número da O.S. (4 a 7 dígitos)</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

            {searchQuery && (
              <Button 
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-5 w-5 p-0 text-muted-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Dropdown de resultados */}
          {showResults && (searchResults.length > 0 || isLoading) && (
            <div 
              ref={resultsRef}
              className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[300px] overflow-y-auto"
            >
              {isLoading ? (
                <div className="p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Buscando pedidos...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="py-1">
                  {searchResults.map((order) => (
                    <div 
                      key={order._id} 
                      className="cursor-pointer hover:bg-slate-100 p-3 border-b transition-colors"
                      onClick={() => viewOrder(order._id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <span className="font-medium">
                              {getClientName(order.clientId) === "Carregando..." ? (
                                <span className="flex items-center">
                                  <span>Cliente</span>
                                  <Loader2 className="h-3 w-3 ml-1 animate-spin" />
                                </span>
                              ) : (
                                getClientName(order.clientId)
                              )}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {order.serviceOrder ? `O.S.: ${order.serviceOrder}` : ''} 
                            {order.serviceOrder && order.cpf ? ' • ' : ''}
                            {order.cpf ? `CPF: ${order.cpf}` : ''}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(order.finalPrice)}</div>
                          <div className="mt-1">
                            <Badge className={getOrderStatusClass(order.status)}>
                              {translateOrderStatus(order.status)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-2">
                        {formatDate(order.orderDate || order.createdAt)}
                      </div>
                    </div>
                  ))}
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full text-primary justify-center h-10"
                    onClick={() => router.push('/orders')}
                  >
                    Ver todos os pedidos
                  </Button>
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  Nenhum pedido encontrado
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
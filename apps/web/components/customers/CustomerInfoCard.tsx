import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Mail, Phone, MapPin, SquareUserRound, IdCard } from "lucide-react";
import { useUsers } from "@/hooks/useUsers";
import { getInitials } from "@/app/_utils/customer-details-utils";
import type { User } from "@/app/_types/user";

interface CustomerInfoCardProps {
  customer: User;
  customerSince: string;
}

export function CustomerInfoCard({ customer, customerSince }: CustomerInfoCardProps) {
  const { getUserImageUrl } = useUsers();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-6">
          <Avatar className="w-20 h-20">
            <AvatarImage src={customer.image ? getUserImageUrl(customer.image) : undefined} alt={customer.name} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xl font-semibold">
              {getInitials(customer.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-xl font-semibold mb-2">{customer.name}</h2>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Cliente desde {customerSince}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.email && (
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm">{customer.email}</p>
                  </div>
                </div>
              )}
              
              {customer.phone && (
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Telefone</p>
                    <p className="font-medium text-sm">{customer.phone}</p>
                  </div>
                </div>
              )}

              {customer.rg && (
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <SquareUserRound className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">RG</p>
                    <p className="font-medium text-sm">{customer.rg}</p>
                  </div>
                </div>
              )}
              
              {customer.cpf && (
                <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">CPF</p>
                    <p className="font-medium text-sm">{customer.cpf}</p>
                  </div>
                </div>
              )}
            </div>
            {customer.address && (
              <div className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Endereço</p>
                  <p className="font-medium text-sm">{customer.address}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
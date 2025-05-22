"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, ArrowLeft, Mail, Phone, MapPin, CreditCard, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import type { User } from "../../app/_types/user";

interface UserDetailsCardProps {
  user: User;
  title: string;
  fields: Array<{
    key: keyof User | string;
    label: string;
    render?: (user: User) => React.ReactNode;
    icon?: React.ReactNode;
  }>;
}

export const UserDetailsCard: React.FC<UserDetailsCardProps> = ({
  user,
  title,
  fields,
}) => {
  const router = useRouter();
  
  const getIconForField = (key: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      email: <Mail className="h-4 w-4" />,
      phone: <Phone className="h-4 w-4" />,
      address: <MapPin className="h-4 w-4" />,
      debts: <CreditCard className="h-4 w-4" />,
      purchases: <ShoppingBag className="h-4 w-4" />
    };
    
    return iconMap[key];
  };

  const getBgColorByRole = () => {
    switch(user.role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-indigo-600';
      case 'employee':
        return 'bg-gradient-to-r from-blue-500 to-teal-500';
      case 'customer':
      default:
        return 'bg-gradient-to-r from-teal-500 to-emerald-500';
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-2 pl-0 hover:bg-transparent hover:text-primary flex items-center gap-1"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Voltar</span>
        </Button>
        <h1 className="text-2xl font-bold">{title}</h1>
      </div>
      
      <Card className="overflow-hidden border-none shadow-lg">
        <div className={`${getBgColorByRole()} h-32 md:h-48`}></div>
        
        <CardHeader className="relative px-6 -mt-20 flex flex-col items-center bg-transparent">
          <Avatar className="h-32 w-32 border-4 border-background shadow-md">
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="text-3xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          
          <div className="mt-4 text-center">
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <Badge className="mt-2" variant={user.role === 'admin' ? 'destructive' : user.role === 'employee' ? 'default' : 'secondary'}>
              {user.role === 'admin' ? 'Administrador' : user.role === 'employee' ? 'Funcionário' : 'Cliente'}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="px-6 py-6">
          <div className="bg-muted/40 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Informações</h3>
            
            <div className="space-y-6">
              {fields.map((field) => (
                <div key={field.key} className="flex items-start">
                  <div className="bg-primary/10 rounded-full p-2 mr-4">
                    {field.icon || getIconForField(field.key as string) || <div className="w-4 h-4" />}
                  </div>
                  
                  <div className="flex-1 border-b border-border pb-3">
                    <p className="text-sm text-muted-foreground">{field.label}</p>
                    <p className="font-medium mt-1">
                      {field.render
                        ? field.render(user)
                        : user[field.key as keyof User]?.toString() || 'Não informado'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <Button 
              variant="outline" 
              className="flex gap-2 items-center"
              onClick={() => router.push(`/users/${user._id}/edit`)}
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
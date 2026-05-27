import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { User, Mail, Shield, Building } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserInfoCardProps {
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  };
  title: string;
  description?: string;
  showEditButton?: boolean;
  customAction?: {
    text: string;
    icon: React.ReactNode;
    onClick: () => void;
  };
  onEditClick?: () => void;
  onBackClick?: () => void;
  children?: React.ReactNode;
}

export function UserInfoCard({
  user,
  description,
  showEditButton = false,
  customAction,
  onEditClick,
  onBackClick,
  children
}: UserInfoCardProps) {
  const router = useRouter();

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Shield className="h-3.5 w-3.5 mr-1" />
            Administrador
          </Badge>
        );
      case "employee":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Building className="h-3.5 w-3.5 mr-1" />
            Funcionário
          </Badge>
        );
      case "customer":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <User className="h-3.5 w-3.5 mr-1" />
            Cliente
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <User className="h-3.5 w-3.5 mr-1" />
            {role}
          </Badge>
        );
    }
  };

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      router.back();
    }
  };

  return (
    <Card className="shadow-sm border">
      <CardHeader className="p-4 sm:p-6 bg-gray-50 border-b">
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0">
            <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
              <User className="h-5 w-5 text-primary shrink-0" />
              <span className="truncate">{user.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{user.email}</span>
              {getRoleBadge(user.role)}
            </CardDescription>
          </div>
          <div className="shrink-0">
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
              <AvatarImage
                src={user.image}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xl bg-primary/20 text-primary">
                {user.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        
        {children}
        
        <div className="flex flex-wrap justify-between gap-2 mt-6 pt-4 border-t">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleBackClick}
            className="gap-2"
          >
            Voltar
          </Button>
          <div className="flex flex-wrap gap-2">
            {customAction && (
              <Button size="sm" onClick={customAction.onClick} className="gap-2">
                {customAction.icon}
                {customAction.text}
              </Button>
            )}
            {showEditButton && (
              <Button size="sm" onClick={onEditClick} className="gap-2">
                <User className="h-4 w-4" />
                Editar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
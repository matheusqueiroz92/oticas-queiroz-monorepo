"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "../../app/types/user"; // Certifique-se de que a interface User está definida

interface UserDetailsCardProps {
  user: User;
  title: string;
  fields: Array<{
    key: keyof User | string;
    label: string;
    render?: (user: User) => React.ReactNode;
  }>;
}

export const UserDetailsCard: React.FC<UserDetailsCardProps> = ({
  user,
  // title,
  fields,
}) => {
  return (
    <div className="flex justify-center items-center min-h-screen p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center space-y-2 p-4">
          <Avatar className="h-20 w-20">
            {/* Use o caminho completo da imagem */}
            <AvatarImage src={user.image} alt={user.name} />
            <AvatarFallback className="text-xl">
              {user.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <CardTitle className="text-xl">{user.name}</CardTitle>{" "}
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {fields.map((field) => (
              <div key={field.key} className="flex justify-between">
                <span className="font-medium">{field.label}:</span>
                <span className="text-gray-600">
                  {field.render
                    ? field.render(user)
                    : user[field.key as keyof User]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

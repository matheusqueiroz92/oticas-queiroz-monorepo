import React, { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface ActionButton {
  text: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

interface ProfileSectionProps {
  title: string;
  description?: string;
  titleIcon?: ReactNode | (() => ReactNode);
  footer?: ReactNode;
  children: ReactNode;
  actions?: ActionButton[];
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  description,
  titleIcon,
  footer,
  children,
  actions = [],
}) => {
  const router = useRouter();

  return (
    <Card className="shadow-sm border">
      <CardHeader className="p-6 bg-gray-50 border-b">
        <div className="flex items-center">
          {titleIcon && (
            <div className="mr-2 text-primary">
              {typeof titleIcon === 'function' 
                ? titleIcon() 
                : React.isValidElement(titleIcon) 
                  ? titleIcon 
                  : null}
            </div>
          )}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        {children}
      </CardContent>
      
      {(footer || actions.length > 0) && (
        <CardFooter className="p-6 bg-gray-50 border-t">
          {footer ? (
            footer
          ) : actions.length > 0 ? (
            <div className="flex items-center gap-2 w-full justify-end">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || "default"}
                  onClick={action.onClick}
                  className="gap-2"
                >
                  {action.icon}
                  {action.text}
                </Button>
              ))}
            </div>
          ) : null}
        </CardFooter>
      )}
    </Card>
  );
};
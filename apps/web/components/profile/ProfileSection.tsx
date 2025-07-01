import React, { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  footer,
  children,
  actions = [],
}) => {

  return (
    <Card className="shadow-sm border">
      <CardContent className="p-6">
        {children}
      </CardContent>
      
      {(footer || actions.length > 0) && (
        <CardFooter>
          {footer ? (
            footer
          ) : actions.length > 0 ? (
            <div className="flex items-center gap-2 w-full">
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || "outline"}
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
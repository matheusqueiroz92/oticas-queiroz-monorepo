import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  ariaLabel?: string;
  children?: ReactNode;
}

export function QuickActionButton({
  icon: Icon,
  title,
  description,
  onClick,
  ariaLabel,
  children,
}: QuickActionButtonProps) {
  return (
    <>
      {children}
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel || title}
        className="h-full w-full text-left"
        style={{ all: "unset" }}
      >
        <Card className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 hover:bg-muted/50 hover:border-primary/50 h-full w-full">
          <CardContent className="flex items-center justify-center p-4 gap-3">
            <div className="rounded-full bg-blue-100/50 dark:bg-blue-100/10 p-3 flex items-center justify-center">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col items-center justify-center">
              <span className="text-base font-bold">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </CardContent>
        </Card>
      </button>
    </>
  );
} 
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickActionButtonProps {
  icon: LucideIcon;
  title: string;
  description?: string;
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
        className="cursor-pointer appearance-none bg-transparent border-0 p-0 text-left w-full"
      >
        <Card className="hover:shadow-md transition-colors duration-300 cursor-pointer border-2 hover:bg-muted/50 hover:border-primary/50 h-full w-full">
          <CardContent className="flex items-center justify-start p-3 sm:p-4 gap-2 sm:gap-3">
            <div className="rounded-full bg-blue-100/50 dark:bg-blue-100/10 p-2 sm:p-3 shrink-0 flex items-center justify-center">
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="flex flex-col items-start justify-center min-w-0">
              <span className="text-sm sm:text-base lg:text-lg text-primary font-semibold leading-tight">{title}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </CardContent>
        </Card>
      </button>
    </>
  );
} 
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
        <Card className={[
          "group relative overflow-hidden border border-border",
          "hover:border-[var(--primary-blue)]/40 hover:shadow-md transition-all duration-200",
          "cursor-pointer h-full w-full bg-gradient-to-br from-background to-muted/20",
          "hover:from-[var(--primary-blue)]/3 hover:to-[var(--primary-blue)]/6",
        ].join(" ")}>
          <CardContent className="flex items-center justify-start p-3 sm:p-4 gap-3 sm:gap-4">
            <div className={[
              "rounded-xl p-2.5 sm:p-3 shrink-0 flex items-center justify-center transition-colors duration-200",
              "bg-[var(--primary-blue)]/8 group-hover:bg-[var(--primary-blue)]/15",
              "dark:bg-[var(--primary-blue)]/15 dark:group-hover:bg-[var(--primary-blue)]/25",
            ].join(" ")}>
              <Icon className="h-5 w-5 text-[var(--primary-blue)]" />
            </div>
            <div className="flex flex-col items-start justify-center min-w-0">
              <span className="text-sm font-semibold text-foreground group-hover:text-[var(--primary-blue)] leading-tight transition-colors duration-200">
                {title}
              </span>
              {description && (
                <span className="text-xs text-muted-foreground mt-0.5">{description}</span>
              )}
            </div>
          </CardContent>
        </Card>
      </button>
    </>
  );
}

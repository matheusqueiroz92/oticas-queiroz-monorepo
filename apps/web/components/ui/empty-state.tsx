import React from "react";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-8 text-center border border-dashed rounded-xl bg-muted/30 animate-fade-in">
      {icon && (
        <div className="mb-4 rounded-full bg-primary/8 p-4 text-primary/60">
          {icon}
        </div>
      )}
      <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

import React from "react";

interface PageTitleProps {
  title: string;
  description?: string;
}

export function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--primary-blue)] dark:text-zinc-100 leading-tight">
        {title}
      </h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

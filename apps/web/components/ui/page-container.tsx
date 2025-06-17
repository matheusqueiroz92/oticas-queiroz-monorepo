import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "6xl" | "7xl" | "full";
  padding?: boolean;
  paddingY?: boolean;
  paddingX?: boolean;
}

export function PageContainer({ 
  children, 
  className,
  maxWidth = "full",
  padding = true,
  paddingY = true,
  paddingX = true
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md", 
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    "6xl": "max-w-6xl",
    "7xl": "max-w-7xl",
    full: "w-full"
  };

  const paddingClasses = [];
  
  if (padding) {
    paddingClasses.push("px-4 md:px-8 py-6");
  } else {
    if (paddingX) paddingClasses.push("px-4 md:px-8");
    if (paddingY) paddingClasses.push("py-6");
  }

  return (
    <div 
      className={cn(
        maxWidthClasses[maxWidth],
        maxWidth !== "full" && "mx-auto",
        ...paddingClasses,
        className
      )}
    >
      {children}
    </div>
  );
} 
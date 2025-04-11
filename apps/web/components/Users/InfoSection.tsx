import React, { ReactNode } from "react";

interface InfoSectionProps {
  title: string;
  icon: ReactNode | (() => ReactNode);
  children: ReactNode;
}

export function InfoSection({
  title,
  icon,
  children
}: InfoSectionProps) {
  return (
    <div>
      <h3 className="text-md font-medium mb-4 flex items-center">
        <span className="mr-2">
          {typeof icon === 'function' 
            ? icon() 
            : React.isValidElement(icon) 
              ? <span className="text-primary">{icon}</span> 
              : icon}
        </span>
        {title}
      </h3>
      {children}
    </div>
  );
};
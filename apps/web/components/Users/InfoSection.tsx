import React, { ReactNode } from "react";

interface InfoSectionProps {
  title: string;
  icon: ReactNode | (() => ReactNode);
  children: ReactNode;
}

export const InfoSection: React.FC<InfoSectionProps> = ({
  title,
  icon,
  children
}) => {
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
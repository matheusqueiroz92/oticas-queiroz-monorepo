import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "neutral";
}

export const Button = ({
  variant = "primary",
  children,
  ...props
}: ButtonProps) => {
  const variants = {
    primary: "bg-[var(--primary-blue)] text-white hover:bg-blue-800",
    danger: "bg-[var(--secondary-red)] text-white hover:bg-red-700",
    neutral: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  };

  return (
    <button
      className={`px-4 py-2 rounded-md transition-colors ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
};

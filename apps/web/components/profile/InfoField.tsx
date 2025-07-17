// import React, { ReactNode } from "react";

// interface InfoFieldProps {
//   label: string;
//   value: ReactNode;
//   icon?: ReactNode | (() => ReactNode);
// }

// export function InfoField({
//   label,
//   value,
//   icon
// }: InfoFieldProps) {
//   return (
//     <div>
//       <h4 className="text-sm font-medium text-muted-foreground flex items-center">
//         {icon && (
//           <span className="mr-1 text-gray-400">
//             {typeof icon === 'function' 
//               ? icon() 
//               : React.isValidElement(icon) 
//                 ? icon 
//                 : null}
//           </span>
//         )}
//         {label}
//       </h4>
//       <p className="mt-1 font-medium">{value || "Não informado"}</p>
//     </div>
//   );
// };
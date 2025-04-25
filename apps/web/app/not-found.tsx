"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { FileQuestion, Home, ArrowLeft, Search } from "lucide-react";
import { useState } from "react";
import LogoOticasQueiroz from "../public/logo-oticas-queiroz-branca.png";
import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  const router = useRouter();
  const [isNavigatingBack, setIsNavigatingBack] = useState(false);

  const handleGoBack = () => {
    setIsNavigatingBack(true);
    router.back();
    
    // Se por algum motivo o router.back() não funcionar após 1 segundo,
    // redirecionamos para a home
    setTimeout(() => {
      router.push("/");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--primary-blue)] p-4">
      <div className="w-32 h-32">
        <Image
          src={LogoOticasQueiroz}
          alt="Óticas Queiroz Logo"
          className="object-contain"
          priority
        />
      </div>
      <Card className="max-w-lg w-full shadow-lg border-t-4 border-t-[var(--secondary-red)]">
        <CardHeader className="text-center pb-2">
          <div className="w-20 h-20 bg-blue-50 rounded-full mx-auto mb-4 flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-[var(--secondary-red)]" />
          </div>
          <CardTitle className="text-2xl font-bold text-[var(--secondary-red)]">Página não encontrada</CardTitle>
        </CardHeader>
        
        <CardContent className="text-center">
          <p className="text-gray-600 mb-6">
            A página que você está procurando não existe ou foi movida para outro endereço.
          </p>
          
          <div className="space-y-3 text-left px-4 py-3 bg-blue-50 rounded-md border border-blue-100">
            <h3 className="font-medium flex items-center gap-1 text-blue-800">
              <Search className="h-4 w-4" />
              Sugestões:
            </h3>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>Verifique se o endereço (URL) foi digitado corretamente</li>
              <li>Retorne à página anterior ou à página inicial</li>
              <li>Utilize o menu de navegação para encontrar o que procura</li>
              <li>Se você acha que isso é um erro, entre em contato com o suporte</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between gap-4 pt-2">
          <Button 
            variant="outline" 
            onClick={handleGoBack}
            disabled={isNavigatingBack}
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          
          <Button 
            asChild
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Página inicial
            </Link>
          </Button>
        </CardFooter>
      </Card>
      
      <div className="mt-8 text-center text-sm text-white">
        <p>Óticas Queiroz &copy; {new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </div>
  );
}
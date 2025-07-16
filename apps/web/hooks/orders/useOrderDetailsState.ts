import { useCallback } from 'react';
import { useRouter } from "next/navigation";

export function useOrderDetailsState() {
  const router = useRouter();

  const handleGoBack = useCallback(() => {
    router.push('/orders');
  }, [router]);

  return {
    handleGoBack,
  };
} 
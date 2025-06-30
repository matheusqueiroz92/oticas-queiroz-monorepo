"use client";

import { Upload, X, Camera } from "lucide-react";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: File | null;
  onChange: (value: File | null) => void;
  disabled?: boolean;
  className?: string;
  existingImageUrl?: string;
}

export function ImageUpload({
  onChange,
  disabled = false,
  className,
  existingImageUrl,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(existingImageUrl || null);
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Atualizar preview quando existingImageUrl mudar
  useEffect(() => {
    if (existingImageUrl) {
      setPreview(existingImageUrl);
    }
  }, [existingImageUrl]);

  // Cleanup para garantir que a câmera seja desligada quando o componente for desmontado
  useEffect(() => {
    return () => {
      // Forçar parada da câmera quando o componente for desmontado
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setIsCapturing(false);
    };
  }, []);

  // Parar câmera quando o componente for desabilitado
  useEffect(() => {
    if (disabled && isCapturing) {
      stopCamera();
    }
  }, [disabled, isCapturing]);
  

  // Detectar se é dispositivo móvel
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações no frontend
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error(
        "Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.",
      );
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Arquivo muito grande. Máximo 5MB.");
      return;
    }

    // Mostrar preview local
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    onChange(file);
    toast.success("Imagem selecionada com sucesso!");
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    stopCamera();
  };

  const handleFileClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const startCamera = async () => {
    if (disabled) return;
    
    try {
      setIsCapturing(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: isMobile() ? 'environment' : 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
      setIsCapturing(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Definir tamanho do canvas igual ao vídeo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Desenhar frame atual do vídeo no canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Converter canvas para blob
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        
        // Criar preview
        const reader = new FileReader();
        reader.onload = (e) => {
          setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        onChange(file);
        stopCamera();
        toast.success("Foto capturada com sucesso!");
      }
    }, 'image/jpeg', 0.8);
  };

  return (
    <div className={cn("space-y-3", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        disabled={disabled}
        className="hidden"
      />
      


      <div className="flex items-start gap-4">
        {isCapturing ? (
          <div className="flex flex-col items-center gap-2">
            <video
              ref={videoRef}
              className="w-64 h-48 rounded-lg border object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        ) : (
          <div
            className={cn(
              "relative flex h-32 w-32 items-center justify-center rounded-lg border border-dashed border-gray-300 transition-colors",
              disabled && "cursor-not-allowed opacity-50",
            )}
          >
            {preview ? (
              <>
                <Image
                  src={preview}
                  alt="Preview"
                  fill
                  className="rounded-lg object-cover"
                />
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove();
                    }}
                    className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-md hover:bg-red-600"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-2 text-gray-500">
                <Upload className="h-6 w-6" />
                <span className="text-center text-xs">
                  Foto do cliente
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {!isCapturing ? (
            <>
              <button
                type="button"
                onClick={handleFileClick}
                disabled={disabled}
                className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <Upload className="h-4 w-4" />
                Selecionar Arquivo
              </button>
              
              <button
                type="button"
                onClick={startCamera}
                disabled={disabled}
                className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
              >
                <Camera className="h-4 w-4" />
                Tirar Foto
              </button>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={capturePhoto}
                className="flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
                Capturar
              </button>
              
              <button
                type="button"
                onClick={stopCamera}
                className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <X className="h-4 w-4" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">JPEG, PNG ou WebP (máx. 5MB)</p>
    </div>
  );
} 
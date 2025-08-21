import { useRef } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onComplete?: (result: { success: boolean; imageURL?: string; error?: string }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * Simple file upload component using native HTML input and form data
 */
export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760, // 10MB default
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Verificar tamanho do arquivo
    if (file.size > maxFileSize) {
      onComplete?.({ 
        success: false, 
        error: `Arquivo muito grande. Máximo: ${Math.round(maxFileSize / 1024 / 1024)}MB` 
      });
      return;
    }

    // Verificar tipo do arquivo
    if (!file.type.startsWith('image/')) {
      onComplete?.({ 
        success: false, 
        error: "Apenas imagens são permitidas" 
      });
      return;
    }

    try {
      console.log("Uploading file:", file.name);
      
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Upload result:", result);

      onComplete?.({ 
        success: true, 
        imageURL: result.objectPath || result.imageURL 
      });

      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Upload error:", error);
      onComplete?.({ 
        success: false, 
        error: "Falha no upload da imagem" 
      });
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        multiple={maxNumberOfFiles > 1}
      />
      <Button 
        type="button"
        onClick={() => fileInputRef.current?.click()} 
        className={buttonClassName}
      >
        {children}
      </Button>
    </div>
  );
}
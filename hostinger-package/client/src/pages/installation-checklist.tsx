import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CheckCircle } from "lucide-react";
import TicketForm from "@/components/forms/ticket-form";
import SuccessModal from "@/components/modals/success-modal";
import { useToast } from "@/hooks/use-toast";
import { type Store, type Supplier } from "@shared/mysql-schema";

export default function InstallationChecklist() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [responsibleName, setResponsibleName] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Get data from localStorage
  const supplierData = localStorage.getItem("supplier_access");
  const storeData = localStorage.getItem("selected_store");
  
  const supplier: Supplier | null = supplierData ? JSON.parse(supplierData) : null;
  const store: Store | null = storeData ? JSON.parse(storeData) : null;

  // Redirect if no access
  if (!supplier || !store) {
    setLocation("/supplier-access");
    return null;
  }

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      // Convert photos to compressed base64 strings for storage
      const photoUrls: string[] = [];
      for (const photo of photos) {
        if (photo) {
          const compressedBase64 = await new Promise<string>((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
              // Resize image to max 800px width/height to reduce size
              const maxSize = 800;
              let { width, height } = img;
              
              if (width > height && width > maxSize) {
                height = (height * maxSize) / width;
                width = maxSize;
              } else if (height > maxSize) {
                width = (width * maxSize) / height;
                height = maxSize;
              }
              
              canvas.width = width;
              canvas.height = height;
              
              ctx?.drawImage(img, 0, 0, width, height);
              
              // Compress to 70% quality JPEG
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
              resolve(compressedDataUrl);
            };
            
            const reader = new FileReader();
            reader.onload = () => {
              img.src = reader.result as string;
            };
            reader.readAsDataURL(photo);
          });
          photoUrls.push(compressedBase64);
        }
      }

      const installationData = {
        loja_id: store.codigo_loja, // Use codigo_loja for installations
        fornecedor_id: supplier.id,
        responsible: responsibleName,
        installationDate: installationDate,
        photos: photoUrls,
      };

      const response = await fetch("/api/installations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(installationData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao finalizar instalação");
      }

      return response.json();
    },
    onSuccess: () => {
      setShowSuccessModal(true);
      queryClient.invalidateQueries({ queryKey: ["/api/installations"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao finalizar instalação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (index: number, file: File | null) => {
    setPhotos(prev => {
      const newPhotos = [...prev];
      if (file) {
        newPhotos[index] = file;
      } else {
        newPhotos.splice(index, 1);
      }
      return newPhotos;
    });
  };

  const handleFinalize = () => {
    if (!responsibleName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o nome do instalador.",
        variant: "destructive",
      });
      return;
    }

    if (!installationDate) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe a data da instalação.",
        variant: "destructive",
      });
      return;
    }

    finalizeMutation.mutate();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    localStorage.removeItem("supplier_access");
    localStorage.removeItem("selected_store");
    setLocation("/supplier-access");
  };

  const handleLogout = () => {
    localStorage.removeItem("supplier_access");
    localStorage.removeItem("selected_store");
    setLocation("/supplier-access");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Checklist de Instalação</h1>
          <Button variant="outline" onClick={handleLogout}>
            Voltar
          </Button>
        </div>

        {/* Store Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700">Nome da Loja</Label>
                <p className="text-gray-900 font-medium">{store.nome_loja}</p>
              </div>
              <div>
                <Label className="block text-sm font-medium text-gray-700">Código da Loja</Label>
                <p className="text-gray-900">{store.codigo_loja}</p>
              </div>
              <div className="md:col-span-2">
                <Label className="block text-sm font-medium text-gray-700">Endereço</Label>
                <p className="text-gray-900">
                  {store.logradouro}, {store.numero} {store.complemento && `- ${store.complemento}`}<br/>
                  {store.bairro} - {store.cidade}, {store.uf} - CEP: {store.cep}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Installation Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Instalação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="responsible" className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Instalador *
              </Label>
              <Input
                id="responsible"
                placeholder="Digite o nome do responsável"
                value={responsibleName}
                onChange={(e) => setResponsibleName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Data da Instalação *
              </Label>
              <Input
                id="date"
                type="date"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Photo Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Fotos da Instalação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  {photos[index] ? (
                    <div className="relative w-full h-full">
                      <img
                        src={URL.createObjectURL(photos[index])}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => handlePhotoUpload(index, null)}
                      >
                        ×
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                      <Camera className="h-8 w-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-500">Foto {index + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoUpload(index, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleFinalize}
            disabled={finalizeMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {finalizeMutation.isPending ? "Finalizando..." : "Instalação Finalizada"}
          </Button>
          <Button
            onClick={() => setShowTicketForm(true)}
            variant="outline"
            className="flex-1"
          >
            Abrir Chamado
          </Button>
        </div>
      </div>

      {/* Modals */}
      {showTicketForm && (
        <TicketForm
          open={showTicketForm}
          onClose={() => setShowTicketForm(false)}
          entityId={store.id.toString()}
          entityName={store.nome_loja}
          type="store"
        />
      )}

      <SuccessModal
        open={showSuccessModal}
        onClose={handleSuccessModalClose}
        title="Instalação Finalizada!"
        message="A instalação foi registrada com sucesso no sistema."
      />
    </div>
  );
}
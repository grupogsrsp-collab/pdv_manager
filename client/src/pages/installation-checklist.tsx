import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Camera, Check, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FileUpload from "@/components/file-upload";
import TicketForm from "@/components/forms/ticket-form";
import SuccessModal from "@/components/modals/success-modal";
import { type Store } from "@shared/schema";

export default function InstallationChecklist() {
  const [, setLocation] = useLocation();
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const [installerName, setInstallerName] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const { data: store, isLoading } = useQuery<Store>({
    queryKey: ["/api/stores", storeId],
    enabled: !!storeId,
  });

  const completeInstallationMutation = useMutation({
    mutationFn: async () => {
      if (!installerName || !installationDate) {
        throw new Error("Preencha todos os campos obrigatórios");
      }
      
      return apiRequest("POST", `/api/stores/${storeId}/complete-installation`, {
        installerName,
        installationDate,
        photos,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/stores", storeId] });
      setShowSuccessModal(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCompleteInstallation = () => {
    completeInstallationMutation.mutate();
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setLocation("/supplier");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Carregando dados da loja...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">Loja não encontrada</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Store Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Check List de Instalação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700">Nome da Loja</Label>
              <p className="text-gray-900">{store.name}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">CNPJ</Label>
              <p className="text-gray-900">{store.cnpj || "Não informado"}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Endereço</Label>
              <p className="text-gray-900">{store.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Details */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Detalhes da Instalação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="installer" className="block text-sm font-medium text-gray-700 mb-2">
                Responsável da Loja
              </Label>
              <Input
                id="installer"
                type="text"
                placeholder="Nome do responsável"
                value={installerName}
                onChange={(e) => setInstallerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                Data da Instalação
              </Label>
              <Input
                id="date"
                type="date"
                value={installationDate}
                onChange={(e) => setInstallationDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Photo Upload Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Fotos da Loja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, index) => (
              <FileUpload
                key={index}
                onFileSelect={(file) => {
                  // In a real implementation, this would upload the file and return a URL
                  const newPhotos = [...photos, `photo-${index}-${file.name}`];
                  setPhotos(newPhotos);
                }}
                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary transition duration-200 cursor-pointer"
              >
                <Camera className="text-gray-400 text-2xl mb-2 mx-auto" />
                <p className="text-sm text-gray-600">Adicionar Foto</p>
              </FileUpload>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          className="flex-1 bg-success hover:bg-success/90 text-white py-3 px-6 rounded-lg font-semibold transition duration-200"
          onClick={handleCompleteInstallation}
          disabled={completeInstallationMutation.isPending}
        >
          <Check className="h-4 w-4 mr-2" />
          Instalação Finalizada
        </Button>
        <Button
          className="flex-1 bg-warning hover:bg-warning/90 text-white py-3 px-6 rounded-lg font-semibold transition duration-200"
          onClick={() => setShowTicketForm(true)}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Abrir Chamado
        </Button>
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <TicketForm
          open={showTicketForm}
          onClose={() => setShowTicketForm(false)}
          entityId={storeId!}
          entityName={store.name}
          type="supplier"
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={handleSuccessClose}
        title="Sucesso!"
        message="Instalação finalizada com sucesso!"
      />
    </div>
  );
}

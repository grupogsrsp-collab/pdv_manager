import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import TicketForm from "@/components/forms/ticket-form";
import SuccessModal from "@/components/modals/success-modal";
import { type Store, type Kit } from "@shared/schema";

export default function StoreDashboard() {
  const [, setLocation] = useLocation();
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [kitUsage, setKitUsage] = useState<Record<string, boolean>>({});

  // Get store data from localStorage (set during access)
  const storeData = localStorage.getItem("store_access");
  const store: Store | null = storeData ? JSON.parse(storeData) : null;

  // Redirect if no store access
  if (!store) {
    setLocation("/store-access");
    return null;
  }

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/stores", store.id, "kits"],
    enabled: !!store.id,
  });

  const handleKitToggle = (kitId: string, used: boolean) => {
    setKitUsage(prev => ({ ...prev, [kitId]: used }));
  };

  const handleFinalize = () => {
    setShowSuccessModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("store_access");
    setLocation("/store-access");
  };



  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Store Info */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dados da Loja</CardTitle>
            <Button variant="outline" onClick={handleLogout}>
              Trocar Loja
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700">Código da Loja</Label>
              <p className="text-gray-900">{store.code}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Nome</Label>
              <p className="text-gray-900">{store.name}</p>
            </div>
            <div>
              <Label className="block text-sm font-medium text-gray-700">Endereço</Label>
              <p className="text-gray-900">{store.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Installation Status */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Status da Instalação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div
              className={`h-3 w-3 rounded-full ${
                store.installationCompleted ? "bg-success" : "bg-warning"
              }`}
            />
            <span className="text-sm font-medium">
              {store.installationCompleted ? "Instalação Concluída" : "Instalação Pendente"}
            </span>
          </div>
          {store.installationCompleted && store.installationDate && (
            <p className="text-sm text-gray-600 mt-2">
              Concluída em: {new Date(store.installationDate).toLocaleDateString("pt-BR")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Kits Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Confirmação de Kits Instalados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {kits.length === 0 ? (
              <p className="text-gray-600">Nenhum kit disponível para esta loja.</p>
            ) : (
              kits.map((kit) => (
                <div key={kit.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={kit.id}
                    checked={kitUsage[kit.id] || kit.used || false}
                    onCheckedChange={(checked) => handleKitToggle(kit.id, checked as boolean)}
                  />
                  <Label htmlFor={kit.id} className="flex-1">
                    {kit.name}
                  </Label>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      kitUsage[kit.id] || kit.used
                        ? "bg-success text-white"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {kitUsage[kit.id] || kit.used ? "Utilizado" : "Não utilizado"}
                  </span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photos Section */}
      {store.photos && store.photos.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fotos da Instalação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {store.photos.map((photo, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="h-32 bg-gray-200 rounded flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Foto {index + 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <Button
          className="flex-1 bg-success hover:bg-success/90 text-white py-3 px-6 rounded-lg font-semibold"
          onClick={handleFinalize}
        >
          Finalizar Confirmação
        </Button>
        <Button
          className="flex-1 bg-warning hover:bg-warning/90 text-white py-3 px-6 rounded-lg font-semibold"
          onClick={() => setShowTicketForm(true)}
        >
          Abrir Chamado
        </Button>
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <TicketForm
          open={showTicketForm}
          onClose={() => setShowTicketForm(false)}
          entityId={store.id}
          entityName={store.name}
          type="store"
        />
      )}

      {/* Success Modal */}
      <SuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Sucesso!"
        message="Confirmação realizada com sucesso!"
      />
    </div>
  );
}

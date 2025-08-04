import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import TicketForm from "@/components/forms/ticket-form";
import { type Store, type Kit } from "@shared/mysql-schema";

interface InstallationStatus {
  isInstalled: boolean;
  installation?: {
    responsible: string;
    fornecedor_id: number;
    installationDate: string;
  };
  supplier?: {
    id: number;
    nome_fornecedor: string;
    cnpj: string;
  };
}

interface StoreCompleteInfo {
  store: Store;
  installationStatus: InstallationStatus;
}

export default function StoreDashboard() {
  const [, setLocation] = useLocation();
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [currentKitIndex, setCurrentKitIndex] = useState(0);

  // Get store data from localStorage (set during access)
  const storeData = localStorage.getItem("store_access");
  const store: Store | null = storeData ? JSON.parse(storeData) : null;

  // Redirect if no store access
  if (!store) {
    setLocation("/store-access");
    return null;
  }

  const { data: storeInfo } = useQuery<StoreCompleteInfo>({
    queryKey: ["/api/stores", store.codigo_loja, "complete-info"],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${store.codigo_loja}/complete-info`);
      if (!response.ok) throw new Error('Failed to fetch store info');
      return response.json();
    },
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  const handlePrevKit = () => {
    setCurrentKitIndex(prev => Math.max(0, prev - 1));
  };

  const handleNextKit = () => {
    setCurrentKitIndex(prev => Math.min(kits.length - 1, prev + 1));
  };

  const handleLogout = () => {
    localStorage.removeItem("store_access");
    setLocation("/store-access");
  };

  const handleFinalize = () => {
    // Implement finalization logic
    alert("Processo finalizado com sucesso!");
  };

  if (!storeInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Carregando dados da loja...</div>
      </div>
    );
  }

  const { store: storeDetails, installationStatus } = storeInfo;
  const visibleKits = kits.slice(currentKitIndex, currentKitIndex + 3);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-lg mb-4">Código da Loja</h3>
              <p className="text-gray-700 mb-2"><strong>Código:</strong> {storeDetails.codigo_loja}</p>
              <p className="text-gray-700 mb-2"><strong>Nome da Loja:</strong> {storeDetails.nome_loja}</p>
              <p className="text-gray-700"><strong>Nome do Responsável:</strong> {storeDetails.nome_operador}</p>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-4">Endereço</h3>
              <p className="text-gray-700 mb-1">{storeDetails.logradouro}, {storeDetails.numero}</p>
              {storeDetails.complemento && <p className="text-gray-700 mb-1">{storeDetails.complemento}</p>}
              <p className="text-gray-700 mb-1">{storeDetails.bairro} - {storeDetails.cidade}, {storeDetails.uf}</p>
              <p className="text-gray-700">CEP: {storeDetails.cep}</p>
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
          <div className="flex items-center gap-4 mb-6">
            {installationStatus.isInstalled ? (
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-2 px-4 py-2">
                <CheckCircle className="h-5 w-5" />
                Instalação Concluída
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-2 px-4 py-2">
                <XCircle className="h-5 w-5" />
                Não Concluída
              </Badge>
            )}
          </div>

          {installationStatus.isInstalled && installationStatus.installation && installationStatus.supplier && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Instalador Responsável</p>
                <p className="text-gray-900">{installationStatus.installation.responsible}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Nome do Fornecedor</p>
                <p className="text-gray-900">{installationStatus.supplier.nome_fornecedor}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">CNPJ do Fornecedor</p>
                <p className="text-gray-900">{installationStatus.supplier.cnpj}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kit Confirmation */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Confirmação de Kits Instalados</CardTitle>
        </CardHeader>
        <CardContent>
          {kits.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum kit disponível
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {visibleKits.map((kit) => (
                  <Card key={kit.id} className="border-2 border-gray-200">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{kit.nome_peca}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {kit.image ? (
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          <img 
                            src={kit.image} 
                            alt={kit.nome_peca}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-gray-400">Sem imagem</span>
                        </div>
                      )}
                      <p className="text-sm text-gray-600">{kit.descricao}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Navigation arrows */}
              {kits.length > 3 && (
                <div className="flex justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handlePrevKit}
                    disabled={currentKitIndex === 0}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  <span className="flex items-center text-sm text-gray-600">
                    {Math.floor(currentKitIndex / 3) + 1} de {Math.ceil(kits.length / 3)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={handleNextKit}
                    disabled={currentKitIndex + 3 >= kits.length}
                    className="flex items-center gap-2"
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleFinalize}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
        >
          Finalizar
        </Button>
        <Button 
          onClick={() => setShowTicketForm(true)}
          variant="outline"
          className="px-8 py-3"
        >
          Abrir Chamado
        </Button>
      </div>

      {/* Ticket Form Modal */}
      {showTicketForm && (
        <TicketForm
          open={showTicketForm}
          onClose={() => setShowTicketForm(false)}
          entityId={storeDetails.id.toString()}
          entityName={storeDetails.nome_loja}
          type="store"
        />
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, CheckCircle, XCircle, ThumbsUp, ThumbsDown } from "lucide-react";
import TicketForm from "@/components/forms/ticket-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  const [kitSelections, setKitSelections] = useState<Record<number, 'sim' | 'nao' | null>>({});
  const { toast } = useToast();

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

  const updateKitUsageMutation = useMutation({
    mutationFn: async ({ kitId, action }: { kitId: number; action: 'sim' | 'nao' }) => {
      return apiRequest("PATCH", `/api/kits/${kitId}/usage`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/kits"] });
      toast({
        title: "Sucesso",
        description: "Uso do kit atualizado!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar uso do kit",
        variant: "destructive",
      });
    },
  });

  const handleKitUsage = (kitId: number, action: 'sim' | 'nao') => {
    // Update local selection state for visual feedback
    setKitSelections(prev => ({
      ...prev,
      [kitId]: action
    }));
    
    updateKitUsageMutation.mutate({ kitId, action });
  };

  // Initialize kit selections when kits are loaded
  useEffect(() => {
    if (kits.data) {
      const initialSelections: Record<number, 'sim' | 'nao' | null> = {};
      kits.data.forEach((kit: Kit) => {
        initialSelections[kit.id] = null;
      });
      setKitSelections(initialSelections);
    }
  }, [kits.data]);

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
                      {kit.image_url ? (
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          <img 
                            src={kit.image_url} 
                            alt={kit.nome_peca}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                          <span className="text-gray-400">Sem imagem</span>
                        </div>
                      )}
                      
                      {/* Usage buttons */}
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-sm font-medium text-gray-700 mb-3">Esta peça foi utilizada?</p>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <Button
                            onClick={() => handleKitUsage(kit.id, 'sim')}
                            className={`
                              flex items-center gap-2 px-6 py-3 transition-all duration-200 font-medium
                              ${kitSelections[kit.id] === 'sim' 
                                ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg scale-105' 
                                : kitSelections[kit.id] === 'nao'
                                ? 'bg-green-200 text-green-700 hover:bg-green-300 opacity-60' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                              }
                            `}
                            size="sm"
                            disabled={updateKitUsageMutation.isPending}
                            data-testid={`button-sim-${kit.id}`}
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Sim
                          </Button>
                          <Button
                            onClick={() => handleKitUsage(kit.id, 'nao')}
                            className={`
                              flex items-center gap-2 px-6 py-3 transition-all duration-200 font-medium
                              ${kitSelections[kit.id] === 'nao' 
                                ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg scale-105' 
                                : kitSelections[kit.id] === 'sim'
                                ? 'bg-red-200 text-red-700 hover:bg-red-300 opacity-60' 
                                : 'bg-red-500 hover:bg-red-600 text-white'
                              }
                            `}
                            size="sm"
                            disabled={updateKitUsageMutation.isPending}
                            data-testid={`button-nao-${kit.id}`}
                          >
                            <ThumbsDown className="h-4 w-4" />
                            Não
                          </Button>
                        </div>
                        
                        {/* Visual feedback for selection */}
                        {kitSelections[kit.id] && (
                          <div className="text-center">
                            <div className={`
                              inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
                              ${kitSelections[kit.id] === 'sim' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                              }
                            `}>
                              {kitSelections[kit.id] === 'sim' ? (
                                <>
                                  <CheckCircle className="h-3 w-3" />
                                  Peça utilizada
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-3 w-3" />
                                  Peça não utilizada
                                </>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="text-center text-xs text-gray-500">
                          Total - Sim: {kit.sim} | Não: {kit.nao}
                        </div>
                      </div>
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
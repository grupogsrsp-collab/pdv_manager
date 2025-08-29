import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { type Store, type FotoFinal } from "@shared/mysql-schema";
import TicketForm from "@/components/forms/ticket-form";

export default function StoreDashboard() {
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [, setLocation] = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Get store from localStorage
  const storeData = localStorage.getItem("store_access");
  const store: Store = storeData ? JSON.parse(storeData) : null;

  if (!store) {
    setLocation("/store-access");
    return null;
  }

  // Fetch store complete info
  const { data: storeInfo } = useQuery({
    queryKey: ["/api/stores", store.codigo_loja, "complete-info"],
    queryFn: async () => {
      const response = await fetch(`/api/stores/${store.codigo_loja}/complete-info`);
      if (!response.ok) throw new Error('Failed to fetch store info');
      return response.json();
    },
  });

  // Extract fotos finais from installation data
  const fotosFinais = storeInfo?.installationStatus?.installation?.fotosFinais || [];
  
  // Verificar se loja já foi finalizada
  useEffect(() => {
    if (storeInfo?.installationStatus?.installation?.finalizada) {
      setIsFinalized(true);
    }
  }, [storeInfo]);

  const handleLogout = () => {
    localStorage.removeItem("store_access");
    setLocation("/store-access");
  };

  const handleFinalize = async () => {
    if (storeInfo?.installationStatus?.installation) {
      try {
        // Marcar instalação como finalizada no backend
        const response = await fetch('/api/installations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...storeInfo.installationStatus.installation,
            finalizada: true
          })
        });
        
        if (response.ok) {
          setIsFinalized(true);
          setShowSuccessModal(true);
          // Invalidar cache para atualizar dados
          queryClient.invalidateQueries({ queryKey: ["/api/stores", store.codigo_loja, "complete-info"] });
        }
      } catch (error) {
        console.error('Erro ao finalizar:', error);
      }
    }
  };

  // Mouse drag handlers for desktop navigation
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollContainerRef.current?.offsetLeft || 0));
    setScrollLeft(scrollContainerRef.current?.scrollLeft || 0);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - (scrollContainerRef.current?.offsetLeft || 0);
    const walk = (x - startX) * 2;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Scroll navigation with buttons
  const scrollGallery = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // width of one photo + gap
      const newScrollLeft = direction === 'left' 
        ? scrollContainerRef.current.scrollLeft - scrollAmount
        : scrollContainerRef.current.scrollLeft + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth'
      });
    }
  };

  if (!storeInfo) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Carregando dados da loja...</div>
      </div>
    );
  }

  const { store: storeDetails, installationStatus } = storeInfo;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Check List do Lojista</h1>
      </div>
      
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <p className="text-sm font-medium text-gray-700">Instalador Responsável</p>
                <p className="text-gray-900">{installationStatus.installation.responsible}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">Data da Instalação</p>
                <p className="text-gray-900">{new Date(installationStatus.installation.installationDate).toLocaleDateString('pt-BR')}</p>
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

      {/* Photo Gallery */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Revise a Instalação</CardTitle>
        </CardHeader>
        <CardContent>
          {fotosFinais.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhuma foto de instalação encontrada
            </div>
          ) : (
            <div className="w-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-600">📱 Mobile: Deslize com o dedo | 🖥️ Desktop: Arraste com o mouse ou use as setas</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollGallery('left')}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => scrollGallery('right')}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div 
                ref={scrollContainerRef}
                className={`flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                style={{ scrollBehavior: 'smooth' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
              >
                {fotosFinais.map((fotoBase64: string, index: number) => (
                  <div key={index} className="min-w-[300px] snap-center">
                    <div className="bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={fotoBase64} 
                        alt={`Foto da instalação ${index + 1}`}
                        className="w-full h-64 object-cover select-none"
                        draggable={false}
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <p className="text-sm text-gray-600">Foto {index + 1}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4">
        <Button 
          onClick={handleFinalize}
          disabled={isFinalized}
          className={isFinalized 
            ? "bg-gray-600 hover:bg-gray-600 text-white px-8 py-3 cursor-not-allowed" 
            : "bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          }
        >
          {isFinalized ? "Loja Finalizada" : "Finalizar"}
        </Button>
        <Button 
          onClick={() => setShowTicketForm(true)}
          variant="outline"
          className="px-8 py-3"
        >
          Abrir Chamado
        </Button>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-semibold text-green-600 flex items-center justify-center gap-2">
              <CheckCircle className="h-6 w-6" />
              Loja Finalizada com Sucesso!
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
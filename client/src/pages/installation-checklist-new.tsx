import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CheckCircle, MapPin, Navigation } from "lucide-react";
import TicketForm from "@/components/forms/ticket-form";
import SuccessModal from "@/components/modals/success-modal";
import { useToast } from "@/hooks/use-toast";
import { type Store, type Supplier, type Kit } from "@shared/mysql-schema";

// Tipos específicos para as 4 fotos da loja
interface FotoLojaEspecifica {
  url_foto_frente_loja?: string;
  url_foto_interna_loja?: string;
  url_foto_interna_lado_direito?: string;
  url_foto_interna_lado_esquerdo?: string;
}

interface Installation {
  id: string;
  loja_id: string;
  fornecedor_id: number;
  responsible: string;
  installationDate: string;
  fotosOriginais?: string[];
  fotosFinais?: string[];
  justificativaFotos?: string;
  latitude?: number;
  longitude?: number;
  endereco_geolocalizacao?: string;
  finalizada?: boolean;
}

export default function InstallationChecklistNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [responsibleName, setResponsibleName] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  
  // Estados para as 4 fotos específicas (File objects para novas fotos)
  const [fotosOriginais, setFotosOriginais] = useState<{
    frente_loja?: File;
    interna_loja?: File;
    interna_lado_direito?: File;
    interna_lado_esquerdo?: File;
  }>({});
  
  // Estados para fotos já salvas (URLs base64)
  const [fotosOriginaisBase64, setFotosOriginaisBase64] = useState<FotoLojaEspecifica>({});
  
  // Estados para fotos finais dos kits
  const [fotosFinais, setFotosFinais] = useState<File[]>([]);
  const [fotosFinaisBase64, setFotosFinaisBase64] = useState<string[]>([]);
  
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [photoJustification, setPhotoJustification] = useState("");
  const [showJustificationField, setShowJustificationField] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);
  const [locationData, setLocationData] = useState<{
    latitude: number;
    longitude: number;
    address: string;
    mapScreenshot?: string;
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Get data from localStorage
  const supplierData = localStorage.getItem("supplier_access");
  const storeData = localStorage.getItem("selected_store");
  
  const supplier: Supplier | null = supplierData ? JSON.parse(supplierData) : null;
  const store: Store | null = storeData ? JSON.parse(storeData) : null;

  // Fetch kits data
  const { data: kits = [], isLoading: kitsLoading } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  // Fetch existing installation data for this store
  const { data: existingInstallation, isLoading: installationLoading } = useQuery<Installation | null>({
    queryKey: ["/api/installations/store", store?.codigo_loja],
    enabled: !!store?.codigo_loja,
  });

  // Redirect if no access
  if (!supplier || !store) {
    setLocation("/supplier-access");
    return null;
  }

  // Load existing installation data when available
  useEffect(() => {
    if (existingInstallation) {
      console.log("Carregando dados da instalação existente:", existingInstallation);
      
      setIsEditMode(true);
      setResponsibleName(existingInstallation.responsible || "");
      setInstallationDate(existingInstallation.installationDate || "");
      setPhotoJustification(existingInstallation.justificativaFotos || "");
      
      // Para manter compatibilidade, mapear fotos do array antigo para nova estrutura
      if (existingInstallation.fotosOriginais && Array.isArray(existingInstallation.fotosOriginais)) {
        const fotosExistentes: FotoLojaEspecifica = {};
        const fotos = existingInstallation.fotosOriginais;
        if (fotos[0]) fotosExistentes.url_foto_frente_loja = fotos[0];
        if (fotos[1]) fotosExistentes.url_foto_interna_loja = fotos[1];
        if (fotos[2]) fotosExistentes.url_foto_interna_lado_direito = fotos[2];
        if (fotos[3]) fotosExistentes.url_foto_interna_lado_esquerdo = fotos[3];
        setFotosOriginaisBase64(fotosExistentes);
      }
      
      // Carregar fotos finais existentes
      if (existingInstallation.fotosFinais && Array.isArray(existingInstallation.fotosFinais) && kits.length > 0) {
        const finalPhotosArray = new Array(kits.length).fill("");
        existingInstallation.fotosFinais.forEach((photo, index) => {
          if (index < kits.length && photo && photo.trim() !== "") {
            finalPhotosArray[index] = photo;
          }
        });
        setFotosFinaisBase64(finalPhotosArray);
      }
      
      // Se há fotos faltando, mostrar campo de justificativa
      const fotosFaltando = contarFotosFaltando();
      if (fotosFaltando > 0) {
        setShowJustificationField(true);
      }
      
      // Carregar dados de geolocalização se existirem
      if (existingInstallation.latitude && existingInstallation.longitude) {
        setLocationData({
          latitude: existingInstallation.latitude,
          longitude: existingInstallation.longitude,
          address: existingInstallation.endereco_geolocalizacao || `${existingInstallation.latitude.toFixed(6)}, ${existingInstallation.longitude.toFixed(6)}`
        });
      }
    }
  }, [existingInstallation]);

  // Função para contar fotos faltando
  const contarFotosFaltando = (): number => {
    let faltando = 0;
    
    // Contar fotos originais faltando
    if (!fotosOriginais.frente_loja && !fotosOriginaisBase64.url_foto_frente_loja) faltando++;
    if (!fotosOriginais.interna_loja && !fotosOriginaisBase64.url_foto_interna_loja) faltando++;
    if (!fotosOriginais.interna_lado_direito && !fotosOriginaisBase64.url_foto_interna_lado_direito) faltando++;
    if (!fotosOriginais.interna_lado_esquerdo && !fotosOriginaisBase64.url_foto_interna_lado_esquerdo) faltando++;
    
    // Contar fotos finais dos kits faltando
    for (let i = 0; i < kits.length; i++) {
      if (!fotosFinais[i] && !fotosFinaisBase64[i]) {
        faltando++;
      }
    }
    
    return faltando;
  };

  // Função para capturar geolocalização
  const captureGeolocation = async (): Promise<{latitude: number, longitude: number, address: string}> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocalização não suportada"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
          
          resolve({
            latitude,
            longitude,
            address
          });
        },
        () => {
          reject(new Error("Erro ao obter localização"));
        },
        {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 300000
        }
      );
    });
  };

  // Função para converter File para base64 comprimido
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
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
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(compressedDataUrl);
      };
      
      const reader = new FileReader();
      reader.onload = () => {
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      setIsCapturingLocation(true);
      
      // Tentar capturar geolocalização
      let geoData = null;
      try {
        geoData = await Promise.race([
          captureGeolocation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 8000)
          )
        ]) as {latitude: number, longitude: number, address: string};
        
        setLocationData(geoData);
        console.log("Localização capturada:", geoData);
      } catch (error) {
        console.log("Geolocalização não disponível, continuando sem localização");
        geoData = null;
      } finally {
        setIsCapturingLocation(false);
      }
      
      // Converter novas fotos para base64
      const fotosConvertidas: string[] = [];
      
      // Foto da frente da loja
      if (fotosOriginais.frente_loja) {
        fotosConvertidas[0] = await convertFileToBase64(fotosOriginais.frente_loja);
      } else if (fotosOriginaisBase64.url_foto_frente_loja) {
        fotosConvertidas[0] = fotosOriginaisBase64.url_foto_frente_loja;
      }
      
      // Foto interna da loja
      if (fotosOriginais.interna_loja) {
        fotosConvertidas[1] = await convertFileToBase64(fotosOriginais.interna_loja);
      } else if (fotosOriginaisBase64.url_foto_interna_loja) {
        fotosConvertidas[1] = fotosOriginaisBase64.url_foto_interna_loja;
      }
      
      // Foto interna lado direito
      if (fotosOriginais.interna_lado_direito) {
        fotosConvertidas[2] = await convertFileToBase64(fotosOriginais.interna_lado_direito);
      } else if (fotosOriginaisBase64.url_foto_interna_lado_direito) {
        fotosConvertidas[2] = fotosOriginaisBase64.url_foto_interna_lado_direito;
      }
      
      // Foto interna lado esquerdo
      if (fotosOriginais.interna_lado_esquerdo) {
        fotosConvertidas[3] = await convertFileToBase64(fotosOriginais.interna_lado_esquerdo);
      } else if (fotosOriginaisBase64.url_foto_interna_lado_esquerdo) {
        fotosConvertidas[3] = fotosOriginaisBase64.url_foto_interna_lado_esquerdo;
      }

      // Converter fotos finais dos kits
      const fotosFinaisConvertidas: string[] = [];
      for (let i = 0; i < kits.length; i++) {
        if (fotosFinais[i]) {
          fotosFinaisConvertidas[i] = await convertFileToBase64(fotosFinais[i]);
        } else if (fotosFinaisBase64[i]) {
          fotosFinaisConvertidas[i] = fotosFinaisBase64[i];
        }
      }

      const installationData = {
        loja_id: store.codigo_loja,
        fornecedor_id: supplier.id,
        responsible: responsibleName,
        installationDate: installationDate,
        fotosOriginais: fotosConvertidas,
        fotosFinais: fotosFinaisConvertidas,
        justificativaFotos: photoJustification || undefined,
        latitude: geoData?.latitude,
        longitude: geoData?.longitude,
        endereco_geolocalizacao: geoData?.address,
        mapa_screenshot_url: geoData?.mapScreenshot,
        geolocalizacao_timestamp: geoData ? new Date().toISOString() : undefined,
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

  const handleFotoUpload = (tipo: keyof typeof fotosOriginais, file: File | null) => {
    setFotosOriginais(prev => ({
      ...prev,
      [tipo]: file || undefined
    }));
    
    // Se removeu uma foto, limpar também a base64
    if (!file) {
      const campo = `url_${tipo}` as keyof FotoLojaEspecifica;
      setFotosOriginaisBase64(prev => ({
        ...prev,
        [campo]: undefined
      }));
    }
  };

  const handleFotoFinalUpload = (index: number, file: File | null) => {
    setFotosFinais(prev => {
      const newPhotos = [...prev];
      if (file) {
        newPhotos[index] = file;
      } else {
        newPhotos.splice(index, 1);
      }
      return newPhotos;
    });
    
    // Se removeu uma foto, limpar também a base64
    if (!file) {
      setFotosFinaisBase64(prev => {
        const newPhotos = [...prev];
        newPhotos[index] = "";
        return newPhotos;
      });
    }
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

    // Verificar se todas as 4 fotos foram preenchidas
    const fotosFaltando = contarFotosFaltando();
    
    if (fotosFaltando > 0) {
      if (!photoJustification.trim()) {
        setShowJustificationField(true);
        toast({
          title: "Fotos obrigatórias",
          description: `Faltam ${fotosFaltando} foto(s). Por favor, justifique a ausência das fotos em falta.`,
          variant: "destructive",
        });
        return;
      }
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

  // Configuração dos 4 campos de foto obrigatórios
  const camposFoto = [
    {
      id: 'frente_loja',
      label: 'Foto da Frente da Loja',
      key: 'frente_loja' as keyof typeof fotosOriginais,
      base64Key: 'url_foto_frente_loja' as keyof FotoLojaEspecifica
    },
    {
      id: 'interna_loja',
      label: 'Foto Interna da Loja',
      key: 'interna_loja' as keyof typeof fotosOriginais,
      base64Key: 'url_foto_interna_loja' as keyof FotoLojaEspecifica
    },
    {
      id: 'interna_lado_direito',
      label: 'Foto Interna Lado Direito',
      key: 'interna_lado_direito' as keyof typeof fotosOriginais,
      base64Key: 'url_foto_interna_lado_direito' as keyof FotoLojaEspecifica
    },
    {
      id: 'interna_lado_esquerdo',
      label: 'Foto Interna Lado Esquerdo',
      key: 'interna_lado_esquerdo' as keyof typeof fotosOriginais,
      base64Key: 'url_foto_interna_lado_esquerdo' as keyof FotoLojaEspecifica
    }
  ];

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
            <CardTitle className="flex items-center justify-between">
              Detalhes da Instalação
              {isEditMode && (
                <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Loja Já Finalizada
                </div>
              )}
            </CardTitle>
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
                data-testid="input-responsible"
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
                data-testid="input-date"
              />
            </div>
          </CardContent>
        </Card>

        {/* Fotos Originais da Loja - EXATAMENTE 4 CAMPOS */}
        <Card>
          <CardHeader>
            <CardTitle>Fotos Originais da Loja</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Instalador, fotografe a loja antes de iniciar a instalação. São obrigatórias exatamente 4 fotos.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {camposFoto.map((campo) => {
                const temFoto = fotosOriginais[campo.key] || fotosOriginaisBase64[campo.base64Key];
                
                return (
                  <div
                    key={campo.id}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {temFoto ? (
                      <div className="relative w-full h-full">
                        <img
                          src={fotosOriginais[campo.key] 
                            ? URL.createObjectURL(fotosOriginais[campo.key]!) 
                            : fotosOriginaisBase64[campo.base64Key]
                          }
                          alt={campo.label}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleFotoUpload(campo.key, null)}
                          data-testid={`button-remove-${campo.id}`}
                        >
                          ×
                        </Button>
                        {fotosOriginaisBase64[campo.base64Key] && !fotosOriginais[campo.key] && (
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                            ✓ Salva
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-700 font-medium mb-1">{campo.label}</span>
                        <span className="text-xs text-gray-500">Obrigatória</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          data-testid={`input-${campo.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFotoUpload(campo.key, file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fotos Finais dos Kits */}
        <Card>
          <CardHeader>
            <CardTitle>Fotos Após Instalação</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Instalador, fotografe todos os itens instalados
            </p>
          </CardHeader>
          <CardContent>
            {kitsLoading ? (
              <div className="text-center py-4">Carregando kits...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {kits.map((kit, index) => (
                  <div
                    key={kit.id}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {(fotosFinais[index] || fotosFinaisBase64[index]) ? (
                      <div className="relative w-full h-full">
                        <img
                          src={fotosFinais[index] 
                            ? URL.createObjectURL(fotosFinais[index]) 
                            : fotosFinaisBase64[index]
                          }
                          alt={`Foto final - ${kit.nome_peca}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => handleFotoFinalUpload(index, null)}
                          data-testid={`button-remove-final-${kit.id}`}
                        >
                          ×
                        </Button>
                        {fotosFinaisBase64[index] && !fotosFinais[index] && (
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                            ✓ Salva
                          </div>
                        )}
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-700 font-medium mb-1">{kit.nome_peca}</span>
                        <span className="text-xs text-gray-500">{kit.descricao}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          data-testid={`input-foto-final-${kit.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFotoFinalUpload(index, file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campo de Justificativa - APENAS QUANDO NECESSÁRIO */}
        {showJustificationField && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-orange-800">Justificar Ausência de Foto</CardTitle>
              <p className="text-sm text-orange-600 mt-2">
                Algumas fotos obrigatórias estão em falta. Por favor, justifique o motivo.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Descreva o motivo da ausência das fotos..."
                value={photoJustification}
                onChange={(e) => setPhotoJustification(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-justification"
              />
            </CardContent>
          </Card>
        )}

        {/* Geolocalização */}
        {locationData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização Capturada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Latitude: {locationData.latitude.toFixed(6)}<br/>
                Longitude: {locationData.longitude.toFixed(6)}<br/>
                Endereço: {locationData.address}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Ticket Form */}
        {showTicketForm && (
          <TicketForm
            onClose={() => setShowTicketForm(false)}
            storeId={store.codigo_loja}
            supplierId={supplier.id}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => setShowTicketForm(true)}
            variant="outline"
            className="flex-1"
            data-testid="button-open-ticket"
          >
            Abrir Chamado
          </Button>
          
          <Button
            onClick={handleFinalize}
            disabled={finalizeMutation.isPending || isCapturingLocation}
            className="flex-1 bg-green-600 hover:bg-green-700"
            data-testid="button-finalize"
          >
            {finalizeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {isCapturingLocation ? "Capturando localização..." : "Finalizando..."}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Instalação Finalizada
              </div>
            )}
          </Button>
        </div>

        {/* Success Modal */}
        <SuccessModal
          isOpen={showSuccessModal}
          onClose={handleSuccessModalClose}
          title="Instalação Finalizada!"
          message="A instalação foi registrada com sucesso. Obrigado!"
        />
      </div>
    </div>
  );
}
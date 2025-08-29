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

export default function InstallationChecklist() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [responsibleName, setResponsibleName] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [originalPhotos, setOriginalPhotos] = useState<File[]>([]);
  const [postInstallationPhotos, setPostInstallationPhotos] = useState<File[]>([]);
  const [originalPhotosBase64, setOriginalPhotosBase64] = useState<string[]>([]);
  const [postInstallationPhotosBase64, setPostInstallationPhotosBase64] = useState<string[]>([]);
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

  // Fetch kits data
  const { data: kits = [], isLoading: kitsLoading } = useQuery<Kit[]>({
    queryKey: ["/api/kits"],
  });

  // Get data from localStorage
  const supplierData = localStorage.getItem("supplier_access");
  const storeData = localStorage.getItem("selected_store");
  
  const supplier: Supplier | null = supplierData ? JSON.parse(supplierData) : null;
  const store: Store | null = storeData ? JSON.parse(storeData) : null;

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
    if (existingInstallation && kits.length > 0) {
      console.log("Carregando dados da instalação existente:", existingInstallation);
      console.log("Fotos originais:", existingInstallation.fotosOriginais);
      console.log("Fotos finais:", existingInstallation.fotosFinais);
      
      setIsEditMode(true);
      setResponsibleName(existingInstallation.responsible || "");
      setInstallationDate(existingInstallation.installationDate || "");
      setPhotoJustification(existingInstallation.justificativaFotos || "");
      
      // Carregar fotos originais existentes - garantir que tenham o mesmo tamanho que o array de kits
      if (existingInstallation.fotosOriginais && Array.isArray(existingInstallation.fotosOriginais)) {
        console.log("Configurando fotos originais:", existingInstallation.fotosOriginais.length);
        // Criar array com o tamanho dos kits para manter posições corretas
        const originalPhotosArray = new Array(kits.length).fill("");
        existingInstallation.fotosOriginais.forEach((photo, index) => {
          if (index < kits.length && photo && photo.trim() !== "") {
            originalPhotosArray[index] = photo;
          }
        });
        setOriginalPhotosBase64(originalPhotosArray);
      }
      
      // Carregar fotos finais existentes - garantir que tenham o mesmo tamanho que o array de kits
      if (existingInstallation.fotosFinais && Array.isArray(existingInstallation.fotosFinais)) {
        console.log("Configurando fotos finais:", existingInstallation.fotosFinais.length);
        // Criar array com o tamanho dos kits para manter posições corretas
        const finalPhotosArray = new Array(kits.length).fill("");
        existingInstallation.fotosFinais.forEach((photo, index) => {
          if (index < kits.length && photo && photo.trim() !== "") {
            finalPhotosArray[index] = photo;
          }
        });
        setPostInstallationPhotosBase64(finalPhotosArray);
      }
      
      // Se há fotos faltando, mostrar campo de justificativa
      const totalExpectedPhotos = kits.length * 2; // originais + finais
      const totalExistingPhotos = (existingInstallation.fotosOriginais?.length || 0) + (existingInstallation.fotosFinais?.length || 0);
      if (totalExistingPhotos < totalExpectedPhotos) {
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
  }, [existingInstallation, kits]);

  // Função para capturar geolocalização (forma simplificada)
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
          enableHighAccuracy: false, // Menos preciso, mais rápido
          timeout: 5000, // 5 segundos apenas
          maximumAge: 300000 // 5 minutos
        }
      );
    });
  };

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      setIsCapturingLocation(true);
      
      // Tentar capturar geolocalização de forma silenciosa
      let geoData = null;
      try {
        geoData = await Promise.race([
          captureGeolocation(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 8000)
          )
        ]) as {latitude: number, longitude: number, address: string, mapScreenshot?: string};
        
        setLocationData(geoData);
        console.log("Localização capturada:", geoData);
      } catch (error) {
        // Falha silenciosa - não mostrar erro para o usuário
        console.log("Geolocalização não disponível, continuando sem localização");
        geoData = null;
      } finally {
        setIsCapturingLocation(false);
      }
      
      // Combinar fotos existentes (base64) com novas fotos (File objects)
      const originalPhotoUrls: string[] = [];
      
      // Adicionar fotos existentes que não foram removidas
      for (let i = 0; i < Math.max(originalPhotos.length, originalPhotosBase64.length); i++) {
        if (originalPhotos[i]) {
          // Nova foto File object - converter para base64
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
            reader.readAsDataURL(originalPhotos[i]);
          });
          originalPhotoUrls.push(compressedBase64);
        } else if (originalPhotosBase64[i]) {
          // Foto existente em base64 - manter
          originalPhotoUrls.push(originalPhotosBase64[i]);
        }
      }

      // Combinar fotos finais existentes (base64) com novas fotos (File objects)
      const postInstallationPhotoUrls: string[] = [];
      
      // Adicionar fotos finais existentes que não foram removidas
      for (let i = 0; i < Math.max(postInstallationPhotos.length, postInstallationPhotosBase64.length); i++) {
        if (postInstallationPhotos[i]) {
          // Nova foto File object - converter para base64
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
            reader.readAsDataURL(postInstallationPhotos[i]);
          });
          postInstallationPhotoUrls.push(compressedBase64);
        } else if (postInstallationPhotosBase64[i]) {
          // Foto existente em base64 - manter
          postInstallationPhotoUrls.push(postInstallationPhotosBase64[i]);
        }
      }

      const installationData = {
        loja_id: store.codigo_loja, // Use codigo_loja for installations
        fornecedor_id: supplier.id,
        responsible: responsibleName,
        installationDate: installationDate,
        fotosOriginais: originalPhotoUrls,
        fotosFinais: postInstallationPhotoUrls,
        justificativaFotos: photoJustification || undefined,
        // Dados de geolocalização
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

  const handleOriginalPhotoUpload = (index: number, file: File | null) => {
    setOriginalPhotos(prev => {
      const newPhotos = [...prev];
      if (file) {
        newPhotos[index] = file;
      } else {
        newPhotos.splice(index, 1);
      }
      return newPhotos;
    });
  };

  const handlePostInstallationPhotoUpload = (index: number, file: File | null) => {
    setPostInstallationPhotos(prev => {
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

    // Verificar se todas as fotos foram preenchidas
    const totalKits = kits.length;
    let missingOriginalPhotos = 0;
    let missingPostInstallationPhotos = 0;
    
    // Contar fotos originais faltando
    for (let i = 0; i < totalKits; i++) {
      if (!originalPhotos[i]) {
        missingOriginalPhotos++;
      }
    }
    
    // Contar fotos finais faltando
    for (let i = 0; i < totalKits; i++) {
      if (!postInstallationPhotos[i]) {
        missingPostInstallationPhotos++;
      }
    }
    
    const totalMissingPhotos = missingOriginalPhotos + missingPostInstallationPhotos;
    
    if (totalMissingPhotos > 0) {
      if (!photoJustification.trim()) {
        setShowJustificationField(true);
        toast({
          title: "Fotos obrigatórias",
          description: `Faltam ${totalMissingPhotos} foto(s). Por favor, justifique a ausência das fotos em falta.`,
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
            <CardTitle>Fotos Originais da Loja</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              Instalador, fotografe a loja antes de iniciar a instalação
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
                    {(originalPhotos[index] || originalPhotosBase64[index]) ? (
                      <div className="relative w-full h-full">
                        <img
                          src={originalPhotos[index] 
                            ? URL.createObjectURL(originalPhotos[index]) 
                            : originalPhotosBase64[index]
                          }
                          alt={`Foto original - ${kit.nome_peca}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            handleOriginalPhotoUpload(index, null);
                            // Remover também da lista base64
                            setOriginalPhotosBase64(prev => {
                              const newPhotos = [...prev];
                              newPhotos[index] = "";
                              return newPhotos;
                            });
                          }}
                        >
                          ×
                        </Button>
                        {originalPhotosBase64[index] && !originalPhotos[index] && (
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
                          className="hidden"
                          data-testid={`input-foto-original-${kit.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Verificar se é uma foto tirada da câmera (verificação básica)
                              if (file.size > 0) {
                                handleOriginalPhotoUpload(index, file);
                              }
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

        {/* Post Installation Photos Section */}
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
                    {(postInstallationPhotos[index] || postInstallationPhotosBase64[index]) ? (
                      <div className="relative w-full h-full">
                        <img
                          src={postInstallationPhotos[index] 
                            ? URL.createObjectURL(postInstallationPhotos[index]) 
                            : postInstallationPhotosBase64[index]
                          }
                          alt={`${kit.nome_peca}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <Button
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => {
                            handlePostInstallationPhotoUpload(index, null);
                            // Remover também da lista base64
                            setPostInstallationPhotosBase64(prev => {
                              const newPhotos = [...prev];
                              newPhotos[index] = "";
                              return newPhotos;
                            });
                          }}
                        >
                          ×
                        </Button>
                        {postInstallationPhotosBase64[index] && !postInstallationPhotos[index] && (
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
                          className="hidden"
                          data-testid={`input-foto-final-${kit.id}`}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Verificar se é uma foto tirada da câmera (verificação básica)
                              if (file.size > 0) {
                                handlePostInstallationPhotoUpload(index, file);
                              }
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

        {/* Justification Field */}
        {showJustificationField && (
          <Card>
            <CardHeader>
              <CardTitle>Justificar Ausência de Foto</CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Por favor, explique o motivo pela ausência de algumas fotos
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Digite a justificativa para a ausência das fotos..."
                value={photoJustification}
                onChange={(e) => setPhotoJustification(e.target.value)}
                className="min-h-[100px]"
                data-testid="textarea-justificativa-fotos"
              />
            </CardContent>
          </Card>
        )}

        {/* Geolocalization Status - Apenas quando tem dados */}
        {locationData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Localização Registrada
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span>Localização do instalador salva!</span>
              </div>
              <div className="text-sm text-gray-600 mt-2">
                <p><strong>Coordenadas:</strong> {locationData.latitude.toFixed(6)}, {locationData.longitude.toFixed(6)}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={handleFinalize}
            disabled={finalizeMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            data-testid="button-finalizar-instalacao"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            {finalizeMutation.isPending ? "Finalizando..." : "Instalação Finalizada"}
          </Button>
          <Button
            onClick={() => setShowTicketForm(true)}
            variant="outline"
            className="flex-1"
            data-testid="button-abrir-chamado"
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
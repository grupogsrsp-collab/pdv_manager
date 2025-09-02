import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, CheckCircle } from "lucide-react";
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
  const [routeObservations, setRouteObservations] = useState<string | null>(null);
  
  // Estados para formulário de chamado
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [ticketDescription, setTicketDescription] = useState("");
  
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
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [photoJustification, setPhotoJustification] = useState("");
  const [showJustificationField, setShowJustificationField] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Refs para controlar os inputs de arquivo de forma mais robusta
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const finalPhotoInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // Estado para prevenir múltiplos uploads simultâneos
  const [isUploading, setIsUploading] = useState(false);
  
  // Mecanismo de segurança para limpar isUploading se ficar preso
  useEffect(() => {
    if (isUploading) {
      console.log('📱 Mobile: Timer de segurança ativado');
      const timeout = setTimeout(() => {
        console.log('📱 Mobile: Timer de segurança executado - liberando scroll');
        setIsUploading(false);
      }, 2000); // 2 segundos de segurança
      
      return () => clearTimeout(timeout);
    }
  }, [isUploading]);

  // Useef para adicionar preventDefault global no mobile
  useEffect(() => {
    const preventFormSubmit = (e: Event) => {
      console.log('📱 Mobile: Form submit global interceptado');
      e.preventDefault();
      e.stopPropagation();
      return false;
    };

    const preventBeforeUnload = (e: BeforeUnloadEvent) => {
      // Prevenir reload acidental durante uploads
      if (isUploading) {
        console.log('📱 Mobile: Reload prevenido durante upload');
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    const preventKeyboardSubmit = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.target as HTMLInputElement)?.type === 'file') {
        console.log('📱 Mobile: Enter em input file prevenido');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // Adiciona listeners para prevenir submissões acidentais
    document.addEventListener('submit', preventFormSubmit, true);
    document.addEventListener('keydown', preventKeyboardSubmit, true);
    window.addEventListener('beforeunload', preventBeforeUnload);

    return () => {
      document.removeEventListener('submit', preventFormSubmit, true);
      document.removeEventListener('keydown', preventKeyboardSubmit, true);
      window.removeEventListener('beforeunload', preventBeforeUnload);
    };
  }, [isUploading]);

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

  // Buscar observações da rota associada à loja
  const { data: routeObservationsData } = useQuery<{ observations: string | null }>({
    queryKey: ["/api/stores", store?.codigo_loja, "route-observations"],
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
      console.log("🔍 Carregando dados da instalação existente:", existingInstallation);
      console.log("🖼️ Fotos originais recebidas:", existingInstallation.fotosOriginais);
      console.log("🖼️ Fotos finais recebidas:", existingInstallation.fotosFinais);
      
      setIsEditMode(true);
      setResponsibleName(existingInstallation.responsible || "");
      setInstallationDate(existingInstallation.installationDate || "");
      setPhotoJustification(existingInstallation.justificativaFotos || "");
      
      // Processar fotos originais - agora vêm das tabelas corretas
      if (existingInstallation.fotosOriginais && Array.isArray(existingInstallation.fotosOriginais)) {
        console.log("📷 Processando fotos originais das tabelas novas...");
        const fotosExistentes: FotoLojaEspecifica = {};
        const fotos = existingInstallation.fotosOriginais;
        
        // As fotos vêm em ordem fixa das tabelas: [frente_loja, interna_loja, lado_direito, lado_esquerdo]
        if (fotos[0] && fotos[0].trim() !== "" && fotos[0] !== "null") {
          fotosExistentes.url_foto_frente_loja = fotos[0];
          console.log("✅ Foto frente loja encontrada:", fotos[0].substring(0, 50) + "...");
        }
        if (fotos[1] && fotos[1].trim() !== "" && fotos[1] !== "null") {
          fotosExistentes.url_foto_interna_loja = fotos[1];
          console.log("✅ Foto interna loja encontrada:", fotos[1].substring(0, 50) + "...");
        }
        if (fotos[2] && fotos[2].trim() !== "" && fotos[2] !== "null") {
          fotosExistentes.url_foto_interna_lado_direito = fotos[2];
          console.log("✅ Foto lado direito encontrada:", fotos[2].substring(0, 50) + "...");
        }
        if (fotos[3] && fotos[3].trim() !== "" && fotos[3] !== "null") {
          fotosExistentes.url_foto_interna_lado_esquerdo = fotos[3];
          console.log("✅ Foto lado esquerdo encontrada:", fotos[3].substring(0, 50) + "...");
        }
        
        console.log("📋 Fotos originais mapeadas:", Object.keys(fotosExistentes));
        setFotosOriginaisBase64(fotosExistentes);
      }
      
      // Carregar fotos finais existentes
      if (existingInstallation.fotosFinais && Array.isArray(existingInstallation.fotosFinais) && kits.length > 0) {
        console.log("📷 Processando fotos finais...");
        const finalPhotosArray = new Array(kits.length).fill("");
        existingInstallation.fotosFinais.forEach((photo, index) => {
          if (index < kits.length && photo && photo.trim() !== "" && photo !== "null") {
            finalPhotosArray[index] = photo;
            console.log(`✅ Foto final ${index + 1} encontrada:`, photo.substring(0, 50) + "...");
          }
        });
        console.log("📋 Fotos finais mapeadas:", finalPhotosArray.filter(p => p !== "").length, "fotos");
        setFotosFinaisBase64(finalPhotosArray);
      }
      
      // Se há fotos faltando, mostrar campo de justificativa
      setTimeout(() => {
        const fotosFaltando = contarFotosFaltando();
        if (fotosFaltando > 0) {
          setShowJustificationField(true);
        }
      }, 100);
    }
  }, [existingInstallation, kits]);

  // Effect para carregar observações da rota
  useEffect(() => {
    if (routeObservationsData?.observations) {
      setRouteObservations(routeObservationsData.observations);
    }
  }, [routeObservationsData]);

  // Mutation para criar chamado
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: { 
      loja_id: string; 
      descricao: string; 
      instalador: string; 
      data_ocorrencia: string; 
      fornecedor_id: number; 
    }) => {
      return apiRequest('POST', '/api/tickets', ticketData);
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Chamado aberto com sucesso.",
      });
      setShowTicketForm(false);
      setTicketDescription("");
    },
    onError: (error) => {
      console.error('Erro ao criar chamado:', error);
      toast({
        title: "Erro",
        description: "Erro ao abrir chamado. Tente novamente.",
        variant: "destructive",
      });
    },
  });

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
      try {
      
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
          fotosOriginais: fotosConvertidas.filter(Boolean) || [],
          fotosFinais: fotosFinaisConvertidas.filter(Boolean) || [],
          justificativaFotos: photoJustification || undefined
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
      } catch (error) {
        console.error("Erro ao finalizar instalação:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Garantir que o estado seja atualizado de forma segura
      requestAnimationFrame(() => {
        setShowSuccessModal(true);
      });
      queryClient.invalidateQueries({ queryKey: ["/api/installations"] });
      
      // Redirecionamento para tela inicial do fornecedor após finalização
      console.log('📱 Mobile: Redirecionando para tela inicial do fornecedor...');
      setTimeout(() => {
        localStorage.removeItem("supplier_access");
        localStorage.removeItem("selected_store");
        // Redirecionar para a tela inicial do fornecedor e forçar refresh
        window.location.href = "/supplier-access";
      }, 2000); // Aguarda 2 segundos para garantir que os dados foram salvos
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao finalizar instalação. Tente novamente.",
        variant: "destructive",
      });
    },
  });

  // Função robusta para upload de fotos originais
  const handleFotoUpload = useCallback((tipo: keyof typeof fotosOriginais, file: File | null) => {
    console.log(`📱 Mobile: handleFotoUpload chamado para ${tipo}`, { file, isUploading });
    
    if (isUploading) {
      console.log('📱 Mobile: Upload já em progresso, cancelando');
      return;
    }

    setIsUploading(true);
    
    // Usar setTimeout em vez de requestAnimationFrame para garantir limpeza do estado
    setTimeout(() => {
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
      
      // Garantir que isUploading seja limpo
      setTimeout(() => {
        setIsUploading(false);
        console.log('📱 Mobile: Upload concluído, scroll liberado');
      }, 50);
    }, 10);
  }, [isUploading]);

  // Função robusta para upload de fotos finais
  const handleFotoFinalUpload = useCallback((index: number, file: File | null) => {
    console.log(`📱 Mobile: handleFotoFinalUpload chamado para kit ${index}`, { file, isUploading });
    
    if (isUploading) {
      console.log('📱 Mobile: Upload já em progresso, cancelando');
      return;
    }

    setIsUploading(true);
    
    // Usar setTimeout em vez de requestAnimationFrame para garantir limpeza do estado
    setTimeout(() => {
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
          const newBase64 = [...prev];
          newBase64.splice(index, 1);
          return newBase64;
        });
      }
      
      // Garantir que isUploading seja limpo
      setTimeout(() => {
        setIsUploading(false);
        console.log('📱 Mobile: Upload final concluído, scroll liberado');
      }, 50);
    }, 10);
  }, [isUploading]);

  const handleFinalize = useCallback(() => {
    console.log('📱 Mobile: handleFinalize chamado');
    
    if (isUploading) {
      console.log('📱 Mobile: Finalização bloqueada - upload em progresso');
      toast({
        title: "Aguarde",
        description: "Aguarde o upload da foto terminar antes de finalizar.",
        variant: "destructive",
      });
      return;
    }
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
  }, [isUploading, responsibleName, installationDate, fotosOriginais, fotosFinais, photoJustification, toast, finalizeMutation]);

  // Função para abrir chamado
  const handleOpenTicket = useCallback(() => {
    if (!responsibleName.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe o nome do instalador antes de abrir o chamado.",
        variant: "destructive",
      });
      return;
    }
    setShowTicketForm(true);
  }, [responsibleName, toast]);

  // Função para submeter chamado
  const handleSubmitTicket = useCallback(() => {
    if (!ticketDescription.trim()) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, descreva o problema.",
        variant: "destructive",
      });
      return;
    }

    const ticketData = {
      loja_id: store?.codigo_loja,
      descricao: ticketDescription.trim(),
      instalador: responsibleName.trim(),
      data_ocorrencia: new Date().toISOString().split('T')[0], // Data atual
      fornecedor_id: supplier?.id,
    };

    createTicketMutation.mutate(ticketData);
  }, [ticketDescription, store?.codigo_loja, responsibleName, supplier?.id, createTicketMutation, toast]);

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Usar requestAnimationFrame para navegação suave
    requestAnimationFrame(() => {
      localStorage.removeItem("supplier_access");
      localStorage.removeItem("selected_store");
      setLocation("/supplier-access");
    });
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
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('📱 Mobile: Form submit prevenido');
        return false;
      }}
      className="min-h-screen bg-gray-50 p-4"
    >
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
                  {store.logradouro && store.numero 
                    ? `${store.logradouro}, Nº ${store.numero}`
                    : store.logradouro 
                      ? store.logradouro
                      : store.numero 
                        ? `Nº ${store.numero}`
                        : ''
                  }
                  {store.complemento && ` - ${store.complemento}`}<br/>
                  {store.bairro && `${store.bairro} - `}{store.cidade && `${store.cidade}, `}{store.uf && `${store.uf}`}
                  {store.cep && ` - CEP: ${store.cep}`}
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
            {routeObservations && (
              <div>
                <Label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </Label>
                <div className="bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900">
                  {routeObservations}
                </div>
              </div>
            )}
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
                const novaFoto = fotosOriginais[campo.key];
                const fotoExistente = fotosOriginaisBase64[campo.base64Key];
                const temFoto = novaFoto || (fotoExistente && fotoExistente.trim() !== "" && fotoExistente !== "null");
                
                console.log(`🖼️ Campo ${campo.label}:`, {
                  novaFoto: !!novaFoto,
                  fotoExistente: !!fotoExistente,
                  fotoExistenteLength: fotoExistente?.length || 0,
                  temFoto,
                  fotoPreview: fotoExistente ? fotoExistente.substring(0, 50) + "..." : "vazio"
                });
                
                return (
                  <div
                    key={campo.id}
                    className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {temFoto ? (
                      <div className="relative w-full h-full">
                        <img
                          src={novaFoto 
                            ? URL.createObjectURL(novaFoto) 
                            : fotoExistente!
                          }
                          alt={campo.label}
                          className="w-full h-full object-cover rounded-lg"
                          onError={(e) => {
                            console.error(`❌ Erro ao carregar imagem ${campo.label}:`, e);
                            console.log("🔍 URL da imagem:", novaFoto ? 'URL.createObjectURL' : fotoExistente?.substring(0, 100) + '...');
                          }}
                          onLoad={() => {
                            console.log(`✅ Imagem ${campo.label} carregada com sucesso`);
                          }}
                        />
                        {fotoExistente && !novaFoto && (
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
                            e.preventDefault();
                            e.stopPropagation();
                            console.log(`📱 Mobile: Upload iniciado para ${campo.label}`);
                            
                            if (isUploading) {
                              console.log('📱 Mobile: Upload original bloqueado - já em progresso');
                              e.target.value = '';
                              return false;
                            }
                            
                            const file = e.target.files?.[0];
                            if (file) {
                              console.log(`📱 Mobile: Arquivo selecionado - ${file.name}`);
                              handleFotoUpload(campo.key, file);
                              
                              // Limpar o input para permitir o mesmo arquivo novamente
                              setTimeout(() => {
                                e.target.value = '';
                              }, 100);
                            }
                            return false;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
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
                {kits.map((kit, index) => {
                  const novaFotoFinal = fotosFinais[index];
                  const fotoFinalExistente = fotosFinaisBase64[index];
                  const temFotoFinal = novaFotoFinal || (fotoFinalExistente && fotoFinalExistente.trim() !== "");
                  
                  console.log(`📸 Kit ${kit.nome_peca} (índice ${index}):`, {
                    novaFotoFinal: !!novaFotoFinal,
                    fotoFinalExistente: !!fotoFinalExistente,
                    fotoFinalExistenteLength: fotoFinalExistente?.length || 0,
                    temFotoFinal
                  });
                  
                  return (
                    <div
                      key={kit.id}
                      className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      {temFotoFinal ? (
                        <div className="relative w-full h-full">
                          <img
                            src={novaFotoFinal 
                              ? URL.createObjectURL(novaFotoFinal) 
                              : fotoFinalExistente!
                            }
                            alt={`Foto final - ${kit.nome_peca}`}
                            className="w-full h-full object-cover rounded-lg"
                            onError={(e) => {
                              console.error(`❌ Erro ao carregar foto final ${kit.nome_peca}:`, e);
                              console.log("🔍 URL da foto final:", novaFotoFinal ? 'URL.createObjectURL' : fotoFinalExistente?.substring(0, 100) + '...');
                            }}
                            onLoad={() => {
                              console.log(`✅ Foto final ${kit.nome_peca} carregada com sucesso`);
                            }}
                          />
                          {fotoFinalExistente && !novaFotoFinal && (
                            <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-medium">
                              ✓ Salva
                            </div>
                          )}
                        </div>
                      ) : (
                        <label 
                          className="cursor-pointer flex flex-col items-center justify-center w-full h-full p-4 text-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log(`📱 Mobile: Label clicado para foto final ${kit.nome_peca}`);
                          }}
                        >
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
                              e.preventDefault();
                              e.stopPropagation();
                              console.log(`📱 Mobile: Upload final iniciado para ${kit.nome_peca}`);
                              
                              if (isUploading) {
                                console.log('📱 Mobile: Upload final bloqueado - já em progresso');
                                e.target.value = '';
                                return false;
                              }
                              
                              const file = e.target.files?.[0];
                              if (file) {
                                console.log(`📱 Mobile: Arquivo final selecionado - ${file.name}`);
                                handleFotoFinalUpload(index, file);
                                
                                // Limpar o input para permitir o mesmo arquivo novamente
                                setTimeout(() => {
                                  e.target.value = '';
                                }, 100);
                              }
                              return false;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
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



        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-4">
          <Button
            type="button"
            onClick={handleFinalize}
            disabled={finalizeMutation.isPending}
            className="bg-green-600 hover:bg-green-700 px-8 py-3"
            data-testid="button-finalize"
          >
            {finalizeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Finalizando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Instalação Finalizada
              </div>
            )}
          </Button>

          <Button
            type="button"
            onClick={handleOpenTicket}
            variant="outline"
            className="border-red-500 text-red-600 hover:bg-red-50 px-8 py-3"
            data-testid="button-open-ticket"
          >
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              Abrir Chamado
            </div>
          </Button>
        </div>

        {/* Modal de Chamado */}
        {showTicketForm && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-lg">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Abrir Chamado</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Descreva o problema encontrado durante a instalação:
                </p>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Loja:</label>
                    <p className="text-sm text-gray-900">{store?.nome_loja}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Instalador:</label>
                    <p className="text-sm text-gray-900">{responsibleName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data:</label>
                    <p className="text-sm text-gray-900">{new Date().toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>

                <Textarea
                  placeholder="Descreva detalhadamente o problema encontrado..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="min-h-[120px] mb-4"
                  data-testid="textarea-ticket-description"
                />
                
                <div className="flex gap-3">
                  <Button 
                    onClick={handleSubmitTicket}
                    disabled={createTicketMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white flex-1"
                  >
                    {createTicketMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Enviando...
                      </div>
                    ) : (
                      'Enviar Chamado'
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setShowTicketForm(false);
                      setTicketDescription("");
                    }}
                    disabled={createTicketMutation.isPending}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal - Independente */}
        {showSuccessModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
          >
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 text-center shadow-lg">
              <div className="mb-4">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-500 mb-4">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Instalação Finalizada!</h3>
                <p className="text-sm text-gray-600 mb-4">A instalação foi registrada com sucesso. Obrigado!</p>
                <Button 
                  onClick={handleSuccessModalClose}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2"
                >
                  OK
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
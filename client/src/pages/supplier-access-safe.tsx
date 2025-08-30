import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Store, CalendarDays, MapPin, Users, Building, Phone, Mail, FileText, Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { type Supplier, type Store as StoreType } from "@shared/mysql-schema";

// Componente MOBILE-SAFE para sugestões
const SuggestionItem = ({ suggestion, isMobile, isProcessing, onSelect }: {
  suggestion: any;
  isMobile: boolean;
  isProcessing: boolean;
  onSelect: (suggestion: any) => void;
}) => {
  const handleInteraction = (e: any) => {
    if (isProcessing) {
      console.log('📱 [SUGGESTION-ITEM] Bloqueado - já processando');
      return;
    }
    
    e.preventDefault();
    e.stopPropagation();
    
    console.log('📱 [SUGGESTION-ITEM] Interação segura ativada');
    onSelect(suggestion);
  };

  return (
    <div
      className="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b last:border-b-0 cursor-pointer transition-all duration-200"
      style={{
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none',
        touchAction: 'manipulation',
        pointerEvents: isProcessing ? 'none' : 'auto'
      }}
      // Mobile: usar onTouchEnd (mais confiável que onTouchStart)
      onTouchEnd={isMobile ? handleInteraction : undefined}
      // Desktop: usar onClick
      onClick={!isMobile ? handleInteraction : undefined}
    >
      <div className="flex items-center gap-4 pointer-events-none">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-lg p-3 flex items-center justify-center min-w-[48px]">
          {suggestion.type === 'supplier' ? <Building className="h-5 w-5" /> : <Users className="h-5 w-5" />}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-semibold text-gray-900 text-lg">
              {suggestion.type === 'supplier' ? 
                suggestion.data.nome_fornecedor : 
                suggestion.data.nome_funcionario
              }
            </div>
            <Badge variant="secondary" className="text-xs">
              {suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'}
            </Badge>
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-1">
            <FileText className="h-4 w-4" />
            {suggestion.type === 'supplier' ? (
              `CNPJ: ${suggestion.data.cnpj || 'Não informado'}`
            ) : (
              `CPF: ${suggestion.data.cpf || 'Não informado'} - Empresa: ${suggestion.data.nome_fornecedor || ''}`
            )}
          </div>
          {suggestion.data.nome_responsavel && suggestion.type === 'supplier' && (
            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <Star className="h-4 w-4" />
              Responsável: {suggestion.data.nome_responsavel}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Versão à prova de erros para mobile com design moderno
export default function SupplierAccessSafe() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [supplierResult, setSupplierResult] = useState<any>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [routeStores, setRouteStores] = useState<StoreType[]>([]);
  const [loadingRouteStores, setLoadingRouteStores] = useState(false);
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

  const { toast } = useToast();

  // Detectar mobile de forma robusta
  const isMobileDevice = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
           window.innerWidth <= 768 ||
           ('ontouchstart' in window);
  }, []);

  // Debounce da busca
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        setDebouncedSearchTerm(searchTerm.trim());
      } else {
        setDebouncedSearchTerm("");
        setSearchSuggestions([]);
        setShowSuggestions(false);
        if (searchTerm.trim().length === 0) {
          setSupplierResult(null);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: supplierData, isLoading, error } = useQuery({
    queryKey: ["/api/suppliers/search", debouncedSearchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) {
        throw new Error('Supplier not found');
      }
      const results = await response.json();
      return results;
    },
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length >= 3,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Atualizar sugestões quando supplierData mudar
  React.useEffect(() => {
    if (supplierData) {
      setSearchSuggestions(supplierData);
      setShowSuggestions(supplierData.length > 0);
    }
  }, [supplierData]);

  const supplier = supplierResult?.data;

  // Função ULTRA-DEFENSIVA para buscar rotas e lojas (versão 100% à prova de falhas)
  const fetchRouteStoresSafe = async (userData: any, userType: string): Promise<void> => {
    console.log('🛡️ [BULLET-PROOF] Iniciando busca ultra-segura de rotas');
    
    // Proteção 1: Verificar dados de entrada
    try {
      if (!userData || !userData.id || !userType) {
        console.warn('🛡️ [BULLET-PROOF] Dados de entrada inválidos');
        setRouteStores([]);
        setLoadingRouteStores(false);
        return;
      }
    } catch (inputError) {
      console.error('🛡️ [BULLET-PROOF] Erro na validação de entrada:', inputError);
      setRouteStores([]);
      setLoadingRouteStores(false);
      return;
    }

    // Proteção 2: Set loading de forma segura
    try {
      setLoadingRouteStores(true);
    } catch (loadingError) {
      console.error('🛡️ [BULLET-PROOF] Erro ao setar loading:', loadingError);
    }

    // Proteção 3: Determinar endpoint
    let routeEndpoint = '';
    try {
      if (userType === 'supplier') {
        routeEndpoint = `/api/routes/supplier/${userData.id}`;
      } else if (userType === 'employee') {
        routeEndpoint = `/api/routes/employee/${userData.id}`;
      } else {
        console.warn('🛡️ [BULLET-PROOF] Tipo de usuário inválido:', userType);
        setRouteStores([]);
        setLoadingRouteStores(false);
        return;
      }
      console.log('🛡️ [BULLET-PROOF] Endpoint determinado:', routeEndpoint);
    } catch (endpointError) {
      console.error('🛡️ [BULLET-PROOF] Erro ao determinar endpoint:', endpointError);
      setRouteStores([]);
      setLoadingRouteStores(false);
      return;
    }

    // Proteção 4: Fazer request com timeout
    let routes = [];
    try {
      console.log('🛡️ [BULLET-PROOF] Fazendo request...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const routeResponse = await fetch(routeEndpoint, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!routeResponse.ok) {
        throw new Error(`HTTP ${routeResponse.status}: ${routeResponse.statusText}`);
      }
      
      const responseText = await routeResponse.text();
      console.log('🛡️ [BULLET-PROOF] Response text:', responseText);
      
      routes = JSON.parse(responseText);
      console.log('🛡️ [BULLET-PROOF] Routes parsed:', routes);
      
    } catch (fetchError) {
      console.error('🛡️ [BULLET-PROOF] Erro no fetch:', fetchError);
      setRouteStores([]);
      setLoadingRouteStores(false);
      return;
    }

    // Proteção 5: Processar dados de forma ultra-defensiva
    let allStores: StoreType[] = [];
    try {
      if (!routes || !Array.isArray(routes) || routes.length === 0) {
        console.log('🛡️ [BULLET-PROOF] Nenhuma rota encontrada');
        setRouteStores([]);
        setLoadingRouteStores(false);
        return;
      }

      const seenStoreIds = new Set<string>();
      
      for (let i = 0; i < routes.length; i++) {
        try {
          const route = routes[i];
          console.log(`🛡️ [BULLET-PROOF] Processando rota ${i}:`, route?.nome || 'sem nome');
          
          if (!route || !route.lojas || !Array.isArray(route.lojas)) {
            console.log(`🛡️ [BULLET-PROOF] Rota ${i} sem lojas válidas`);
            continue;
          }
          
          for (let j = 0; j < route.lojas.length; j++) {
            try {
              const loja = route.lojas[j];
              
              if (!loja || !loja.id) {
                console.log(`🛡️ [BULLET-PROOF] Loja ${j} da rota ${i} inválida`);
                continue;
              }
              
              const lojaIdStr = String(loja.id || '');
              if (!lojaIdStr || seenStoreIds.has(lojaIdStr)) {
                continue;
              }
              
              seenStoreIds.add(lojaIdStr);
              
              const store: StoreType = {
                id: parseInt(lojaIdStr) || Math.random() * 1000000,
                codigo_loja: lojaIdStr,
                nome_loja: String(loja.nome_loja || 'Nome não informado'),
                cidade: String(loja.cidade || 'Cidade não informada'),
                uf: String(loja.uf || ''),
                logradouro: '',
                numero: '',
                complemento: '',
                bairro: '',
                cep: '',
                regiao: '',
                telefone_loja: '',
                nome_operador: ''
              };
              
              allStores.push(store);
              console.log(`🛡️ [BULLET-PROOF] Loja ${j} adicionada:`, store.nome_loja);
              
            } catch (lojaError) {
              console.error(`🛡️ [BULLET-PROOF] Erro ao processar loja ${j}:`, lojaError);
            }
          }
        } catch (routeError) {
          console.error(`🛡️ [BULLET-PROOF] Erro ao processar rota ${i}:`, routeError);
        }
      }
      
    } catch (processError) {
      console.error('🛡️ [BULLET-PROOF] Erro no processamento:', processError);
      allStores = [];
    }

    // Proteção 6: Setar resultado de forma segura
    try {
      console.log(`🛡️ [BULLET-PROOF] Setando ${allStores.length} lojas processadas`);
      setRouteStores(allStores);
    } catch (setError) {
      console.error('🛡️ [BULLET-PROOF] Erro ao setar lojas:', setError);
    }

    // Proteção 7: Finalizar loading de forma segura
    try {
      setLoadingRouteStores(false);
    } catch (finalError) {
      console.error('🛡️ [BULLET-PROOF] Erro ao finalizar loading:', finalError);
    }

    console.log('🛡️ [BULLET-PROOF] Processo completado com sucesso');
  };

  // Função ultra-segura para seleção no mobile
  const handleSelectSuggestionSafe = React.useCallback((suggestion: any) => {
    console.log('🛡️ [ULTRA-SAFE] Iniciando seleção protegida');
    
    // Múltiplas proteções
    if (!suggestion || !suggestion.data || isProcessingSelection) {
      console.log('🛡️ [ULTRA-SAFE] Seleção bloqueada por segurança');
      return;
    }

    // Wrap tudo em try-catch
    try {
      setIsProcessingSelection(true);
      
      // Limpar interface de forma segura
      setShowSuggestions(false);
      setSearchSuggestions([]);
      setDebouncedSearchTerm("");
      
      // Atualizar resultado
      setSupplierResult(suggestion);
      const displayName = suggestion.type === 'supplier' 
        ? (suggestion.data.nome_fornecedor || 'Fornecedor')
        : (suggestion.data.nome_funcionario || 'Funcionário');
      setSearchTerm(displayName);
      
      // Salvar no localStorage de forma segura
      try {
        const safeData = {
          id: suggestion.data.id || '',
          nome_fornecedor: suggestion.data.nome_fornecedor || '',
          nome_funcionario: suggestion.data.nome_funcionario || '',
          cnpj: suggestion.data.cnpj || '',
          cpf: suggestion.data.cpf || '',
          telefone: suggestion.data.telefone || '',
          endereco: suggestion.data.endereco || '',
          searchType: suggestion.type || 'supplier'
        };
        localStorage.setItem("supplier_access", JSON.stringify(safeData));
      } catch (storageError) {
        console.warn('🛡️ [ULTRA-SAFE] Erro localStorage (não crítico):', storageError);
      }
      
      // Toast seguro
      try {
        toast({
          title: "Sucesso!",
          description: `${suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'} selecionado.`,
        });
      } catch (toastError) {
        console.warn('🛡️ [ULTRA-SAFE] Erro toast (não crítico):', toastError);
      }
      
      // CORRIGIDO: Para mobile, NÃO buscar rotas automaticamente (fonte do erro)
      if (isMobileDevice) {
        console.log('📱 [MOBILE-FIX] Mobile detectado - NÃO buscando rotas automaticamente');
        setRouteStores([]);
        setIsProcessingSelection(false);
        console.log('✅ [MOBILE-FIX] Processo mobile finalizado sem erros');
      } else {
        // Desktop: buscar rotas normalmente
        const delay = 100;
        console.log(`⏱️ [DESKTOP] Aguardando ${delay}ms para buscar rotas...`);
        
        setTimeout(() => {
          fetchRouteStoresSafe(suggestion.data, suggestion.type)
            .catch((error) => {
              console.error('🚨 [DESKTOP] Erro ao buscar rotas:', error);
              setRouteStores([]);
            })
            .finally(() => {
              setIsProcessingSelection(false);
              console.log('✅ [DESKTOP] Processo finalizado');
            });
        }, delay);
      }
      
    } catch (error) {
      console.error('🚨 [ULTRA-SAFE] Erro capturado:', error);
      setIsProcessingSelection(false);
      
      try {
        toast({
          title: "Erro",
          description: "Erro ao selecionar. Tente novamente.",
          variant: "destructive"
        });
      } catch {
        console.error('🚨 [ULTRA-SAFE] Nem toast funcionou');
      }
    }
  }, [isProcessingSelection, isMobileDevice, toast]);

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length < 3) {
      setSupplierResult(null);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setDebouncedSearchTerm("");
      setRouteStores([]);
      setSelectedStore(null);
    } else {
      if (supplierResult && 
          value !== (supplierResult.type === 'supplier' ? supplierResult.data.nome_fornecedor : supplierResult.data.nome_funcionario)) {
        setSupplierResult(null);
        setRouteStores([]);
        setSelectedStore(null);
      }
    }
  };

  const handleInputBlur = () => {
    setTimeout(() => setShowSuggestions(false), 300);
  };

  const handleInputFocus = () => {
    if (searchSuggestions.length > 0 && !supplierResult) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho Moderno */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3">
              <Users className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Acesso do Fornecedor</h1>
              <p className="text-blue-100">
                Portal de acesso para fornecedores e funcionários
              </p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm text-blue-100">
              🔍 Busque por nome, CNPJ ou CPF • 📋 Acesse rotas e informações • 📱 Compatível com mobile
            </p>
          </div>
        </div>

        {/* Campo de Busca Moderno */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-gray-800">
              <div className="bg-blue-500 text-white rounded-lg p-2">
                <Search className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xl">Buscar Fornecedor</span>
                <p className="text-sm font-normal text-gray-600 mt-1">
                  Digite pelo menos 3 caracteres para buscar
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="relative">
              <div className="relative">
                <Input
                  id="supplier-search"
                  type="text"
                  placeholder="Ex: João Silva, 12.345.678/0001-90, 123.456.789-00"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  onBlur={handleInputBlur}
                  onFocus={handleInputFocus}
                  className="w-full pl-12 pr-4 py-4 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl shadow-sm transition-all duration-200"
                  data-testid="input-supplier-search"
                />
                <Search className="absolute left-4 top-4 h-6 w-6 text-gray-400" />
              </div>

              {/* Lista de Sugestões MOBILE-SAFE */}
              {showSuggestions && searchSuggestions.length > 0 && !supplierResult && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <SuggestionItem 
                      key={`safe-${suggestion.type}-${suggestion.data.id}-${index}`}
                      suggestion={suggestion}
                      isMobile={isMobileDevice}
                      isProcessing={isProcessingSelection}
                      onSelect={(selectedSuggestion) => {
                        // Mobile: Processo ultra-simplificado
                        if (isMobileDevice) {
                          console.log('📱 [MOBILE-DIRECT] Processo direto para mobile');
                          setIsProcessingSelection(true);
                          setShowSuggestions(false);
                          setSearchSuggestions([]);
                          setSupplierResult(selectedSuggestion);
                          
                          const displayName = selectedSuggestion.type === 'supplier' 
                            ? (selectedSuggestion.data.nome_fornecedor || 'Fornecedor')
                            : (selectedSuggestion.data.nome_funcionario || 'Funcionário');
                          setSearchTerm(displayName);
                          
                          // Mobile: NÃO buscar rotas automaticamente
                          setRouteStores([]);
                          setIsProcessingSelection(false);
                          console.log('📱 [MOBILE-DIRECT] Concluído sem busca de rotas');
                        } else {
                          // Desktop: processo normal
                          handleSelectSuggestionSafe(selectedSuggestion);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {isLoading && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <div>
                    <p className="text-blue-800 font-medium">Buscando...</p>
                    <p className="text-blue-600 text-sm">Localizando fornecedores e funcionários</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultado do Fornecedor - Design Moderno */}
        {supplierResult && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="bg-green-500 text-white rounded-lg p-2">
                  {supplierResult.type === 'supplier' ? <Building className="h-6 w-6" /> : <Users className="h-6 w-6" />}
                </div>
                <div>
                  <span className="text-xl">
                    {supplierResult.type === 'supplier' ? 'Fornecedor Selecionado' : 'Funcionário Selecionado'}
                  </span>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    Informações e rotas disponíveis
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <p className="text-sm font-medium text-blue-800">Nome</p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {supplierResult.type === 'supplier' ? 
                      supplierResult.data.nome_fornecedor : 
                      supplierResult.data.nome_funcionario
                    }
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <p className="text-sm font-medium text-green-800">
                      {supplierResult.type === 'supplier' ? 'CNPJ' : 'CPF'}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {supplierResult.type === 'supplier' ? 
                      (supplierResult.data.cnpj || 'Não informado') : 
                      (supplierResult.data.cpf || 'Não informado')
                    }
                  </p>
                </div>
                
                {supplierResult.data.telefone && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-5 w-5 text-purple-600" />
                      <p className="text-sm font-medium text-purple-800">Telefone</p>
                    </div>
                    <p className="font-semibold text-gray-900">{supplierResult.data.telefone}</p>
                  </div>
                )}
                
                {supplierResult.data.endereco && (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-4 border border-orange-200 col-span-full">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <p className="text-sm font-medium text-orange-800">Endereço</p>
                    </div>
                    <p className="font-semibold text-gray-900">{supplierResult.data.endereco}</p>
                  </div>
                )}
              </div>

              <Separator className="my-6" />

              {/* ÚNICO BOTÃO MOBILE-SAFE - Ver Lojas para Instalação */}
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 border border-green-200">
                <div className="text-center space-y-4">
                  <div className="bg-green-500 text-white rounded-lg p-3 w-12 h-12 mx-auto flex items-center justify-center">
                    <Store className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Ver Lojas para Instalação
                    </h3>
                    <p className="text-green-700 text-sm mb-4">
                      Clique para ver as lojas disponíveis nas rotas deste {supplierResult.type === 'supplier' ? 'fornecedor' : 'funcionário'} e começar as instalações.
                    </p>
                  </div>
                  <Button 
                    onClick={() => {
                      console.log('🔄 [MOBILE-SAFE] Clique registrado - iniciando busca sem processamento');
                      
                      setLoadingRouteStores(true);
                      
                      // SOLUÇÃO: Mover processamento pesado para fora do evento usando requestIdleCallback ou timeout
                      const processoSeparado = () => {
                        console.log('⚡ [MOBILE-SAFE] Executando processamento separado do evento');
                        
                        const endpoint = supplierResult.type === 'supplier' 
                          ? `/api/routes/supplier/${supplierResult.data.id}`
                          : `/api/routes/employee/${supplierResult.data.id}`;
                        
                        fetch(endpoint)
                          .then(response => {
                            if (!response.ok) throw new Error(`HTTP ${response.status}`);
                            return response.json();
                          })
                          .then(routes => {
                            console.log('📦 [MOBILE-SAFE] Dados recebidos:', routes);
                            
                            // Processamento JSON SIMPLIFICADO
                            const storesSimplificadas: StoreType[] = [];
                            
                            if (routes && Array.isArray(routes)) {
                              routes.forEach((route: any) => {
                                if (route.lojas && Array.isArray(route.lojas)) {
                                  route.lojas.forEach((loja: any) => {
                                    if (loja && loja.id && loja.nome_loja) {
                                      storesSimplificadas.push({
                                        id: loja.id,
                                        codigo_loja: String(loja.id),
                                        nome_loja: loja.nome_loja,
                                        cidade: loja.cidade || 'N/A',
                                        uf: loja.uf || '',
                                        logradouro: '',
                                        numero: '',
                                        complemento: '',
                                        bairro: '',
                                        cep: '',
                                        regiao: '',
                                        telefone_loja: '',
                                        nome_operador: ''
                                      });
                                    }
                                  });
                                }
                              });
                            }
                            
                            console.log('✅ [MOBILE-SAFE] Lojas processadas:', storesSimplificadas.length);
                            
                            // Atualizar estado
                            setRouteStores(storesSimplificadas);
                            
                            // Se não encontrou lojas, ir para instalação geral
                            if (storesSimplificadas.length === 0) {
                              console.log('🔄 [MOBILE-SAFE] Indo para instalação geral');
                              localStorage.setItem("supplier_access", JSON.stringify({
                                id: supplierResult.data.id,
                                nome_fornecedor: supplierResult.data.nome_fornecedor || '',
                                searchType: supplierResult.type
                              }));
                              setLocation("/installation-checklist");
                            }
                          })
                          .catch(error => {
                            console.error('❌ [MOBILE-SAFE] Erro na busca:', error);
                            
                            // Fallback: ir direto para instalação geral
                            localStorage.setItem("supplier_access", JSON.stringify({
                              id: supplierResult.data.id,
                              nome_fornecedor: supplierResult.data.nome_fornecedor || '',
                              searchType: supplierResult.type
                            }));
                            setLocation("/installation-checklist");
                          })
                          .finally(() => {
                            setLoadingRouteStores(false);
                          });
                      };
                      
                      // MOBILE-SAFE: buscar rotas mas mostrar resultado
                      if (isMobileDevice) {
                        console.log('📱 [MOBILE-SAFE] Mobile detectado - busca simplificada');
                        setTimeout(processoSeparado, 100);
                      } else {
                        // Desktop: usar processamento normal
                        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
                          requestIdleCallback(processoSeparado);
                        } else {
                          setTimeout(processoSeparado, 50);
                        }
                      }
                    }}
                    disabled={loadingRouteStores}
                    className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                    data-testid="button-view-stores"
                  >
                    {loadingRouteStores ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Buscando...
                      </>
                    ) : (
                      <>
                        <Store className="h-5 w-5 mr-2" />
                        Ver Lojas para Instalação
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SEÇÃO ÚNICA - Lojas encontradas com navegação direta */}
        {routeStores.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="bg-green-500 text-white rounded-lg p-2">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xl">Lojas para Instalação</span>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    {routeStores.length} loja{routeStores.length !== 1 ? 's' : ''} encontrada{routeStores.length !== 1 ? 's' : ''} - Toque para iniciar instalação
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {routeStores.map((store) => (
                  <div 
                    key={store.id} 
                    className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-green-400 active:scale-98"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                      userSelect: 'none',
                      touchAction: 'manipulation'
                    }}
                    onTouchEnd={(e) => {
                      if (isMobileDevice) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('📱 [MOBILE-STORE] Touch direto na loja:', store.nome_loja);
                        
                        try {
                          localStorage.setItem("selected_store", JSON.stringify(store));
                          localStorage.setItem("supplier_access", JSON.stringify({
                            id: supplierResult.data.id,
                            nome_fornecedor: supplierResult.data.nome_fornecedor || '',
                            searchType: supplierResult.type
                          }));
                          setLocation("/installation-checklist");
                        } catch (error) {
                          console.error('❌ [MOBILE-STORE] Erro:', error);
                        }
                      }
                    }}
                    onClick={() => {
                      if (!isMobileDevice) {
                        console.log('🖥️ [DESKTOP-STORE] Click direto na loja:', store.nome_loja);
                        
                        try {
                          localStorage.setItem("selected_store", JSON.stringify(store));
                          localStorage.setItem("supplier_access", JSON.stringify({
                            id: supplierResult.data.id,
                            nome_fornecedor: supplierResult.data.nome_fornecedor || '',
                            searchType: supplierResult.type
                          }));
                          setLocation("/installation-checklist");
                        } catch (error) {
                          console.error('❌ [DESKTOP-STORE] Erro:', error);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-green-500 text-white rounded-lg p-3 flex items-center justify-center">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 text-lg">{store.nome_loja}</h3>
                          <Badge className="bg-green-500 text-white text-xs">
                            → Tocar para Instalar
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Código: {store.codigo_loja}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{store.cidade}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-green-600">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
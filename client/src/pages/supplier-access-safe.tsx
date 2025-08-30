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
      setSearchSuggestions(results);
      setShowSuggestions(results.length > 0);
      
      return results;
    },
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length >= 3,
    retry: false,
  });

  const supplier = supplierResult?.data;

  // Função CORRIGIDA para buscar rotas e lojas (processando dados corretos do backend)
  const fetchRouteStoresSafe = async (userData: any, userType: string): Promise<void> => {
    try {
      setLoadingRouteStores(true);
      console.log('🔍 Buscando rotas para:', { userData, userType });
      
      let routeEndpoint = '';
      if (userType === 'supplier') {
        routeEndpoint = `/api/routes/supplier/${userData.id}`;
      } else if (userType === 'employee') {
        routeEndpoint = `/api/routes/employee/${userData.id}`;
      } else {
        console.warn('Tipo de usuário inválido:', userType);
        setRouteStores([]);
        return;
      }
      
      console.log('📡 Fazendo request para:', routeEndpoint);
      const routeResponse = await fetch(routeEndpoint);
      
      if (routeResponse.ok) {
        const routes = await routeResponse.json();
        console.log('📋 Rotas recebidas do backend:', routes);
        
        if (routes && routes.length > 0) {
          // CORRIGIDO: Extrair lojas diretamente do array 'lojas' retornado pelo backend
          const allStores: StoreType[] = [];
          const seenStoreIds = new Set<string>();
          
          routes.forEach((route: any) => {
            console.log('🔄 Processando rota:', route.nome);
            
            // O backend retorna route.lojas, não route.store_ids
            if (route.lojas && Array.isArray(route.lojas)) {
              console.log('🏪 Lojas na rota:', route.lojas.length);
              
              route.lojas.forEach((loja: any) => {
                // Evitar duplicatas
                if (!seenStoreIds.has(loja.id)) {
                  seenStoreIds.add(loja.id);
                  
                  // Converter para o formato esperado pelo frontend
                  const store: StoreType = {
                    id: parseInt(loja.id) || 0,
                    codigo_loja: loja.id, // loja_id é o código da loja
                    nome_loja: loja.nome_loja || 'Nome não informado',
                    cidade: loja.cidade || 'Cidade não informada',
                    uf: loja.uf || '',
                    logradouro: '', // Não vem do backend nesta consulta
                    bairro: '', // Não vem do backend nesta consulta
                    cep: '', // Não vem do backend nesta consulta
                    telefone_loja: '', // Não vem do backend nesta consulta
                    nome_operador: '', // Não vem do backend nesta consulta
                    email_operador: '' // Não vem do backend nesta consulta
                  };
                  
                  allStores.push(store);
                }
              });
            }
          });
          
          console.log('✅ Lojas processadas:', allStores);
          setRouteStores(allStores);
          
        } else {
          console.log('ℹ️ Nenhuma rota encontrada');
          setRouteStores([]);
        }
      } else {
        console.error('❌ Erro na resposta das rotas:', routeResponse.status);
        setRouteStores([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar rotas e lojas:', error);
      setRouteStores([]);
    } finally {
      setLoadingRouteStores(false);
    }
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
      
      // Buscar rotas para mobile e desktop - com delay apropriado
      const delay = isMobileDevice ? 300 : 100;
      console.log(`⏱️ [ULTRA-SAFE] Aguardando ${delay}ms para buscar rotas...`);
      
      setTimeout(() => {
        fetchRouteStoresSafe(suggestion.data, suggestion.type)
          .finally(() => {
            setIsProcessingSelection(false);
            console.log('✅ [ULTRA-SAFE] Processo finalizado');
          });
      }, delay);
      
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

              {/* Lista de Sugestões Moderna */}
              {showSuggestions && searchSuggestions.length > 0 && !supplierResult && (
                <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={`safe-${suggestion.type}-${suggestion.data.id}-${index}`}
                      className="px-6 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 border-b last:border-b-0 cursor-pointer transition-all duration-200"
                      style={{
                        WebkitTapHighlightColor: 'transparent',
                        userSelect: 'none',
                        touchAction: 'manipulation',
                        pointerEvents: isProcessingSelection ? 'none' : 'auto'
                      }}
                      onClick={() => {
                        try {
                          console.log('🛡️ [ULTRA-SAFE] Click seguro ativado');
                          handleSelectSuggestionSafe(suggestion);
                        } catch (clickError) {
                          console.error('🚨 [ULTRA-SAFE] Erro no click:', clickError);
                        }
                      }}
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

              <div className="space-y-4">
                {routeStores.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Para acessar a lista de instalação, selecione uma loja abaixo:
                    </p>
                    <Button 
                      onClick={() => {
                        if (selectedStore) {
                          // Salvar loja selecionada no localStorage
                          localStorage.setItem("selected_store", JSON.stringify(selectedStore));
                          setLocation("/installation-checklist");
                        } else {
                          toast({
                            title: "Atenção",
                            description: "Selecione uma loja antes de continuar.",
                            variant: "destructive"
                          });
                        }
                      }}
                      disabled={!selectedStore}
                      className={`w-full sm:w-auto font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg ${
                        selectedStore 
                          ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      data-testid="button-installation-checklist"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      {selectedStore ? `Ir para Instalação - ${selectedStore.nome_loja}` : 'Selecione uma loja primeiro'}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                      Nenhuma loja encontrada nas rotas deste {supplierResult.type === 'supplier' ? 'fornecedor' : 'funcionário'}.
                    </p>
                    <Button 
                      onClick={() => setLocation("/installation-checklist")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 shadow-lg"
                      data-testid="button-installation-checklist"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      Ir para Lista de Instalação (Geral)
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lojas das Rotas - Design Melhorado com Seleção */}
        {routeStores.length > 0 && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-t-lg">
              <CardTitle className="flex items-center gap-3 text-gray-800">
                <div className="bg-indigo-500 text-white rounded-lg p-2">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-xl">Selecione uma Loja da Rota</span>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    {routeStores.length} loja{routeStores.length !== 1 ? 's' : ''} encontrada{routeStores.length !== 1 ? 's' : ''} - Clique para selecionar
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {routeStores.map((store, index) => (
                  <div 
                    key={store.id} 
                    className={`rounded-lg p-4 border-2 cursor-pointer transition-all duration-200 ${
                      selectedStore?.id === store.id
                        ? 'bg-gradient-to-br from-green-100 to-blue-100 border-green-500 shadow-lg transform scale-105'
                        : 'bg-gradient-to-br from-gray-50 to-blue-50 border-gray-200 hover:border-blue-300 hover:shadow-lg'
                    }`}
                    onClick={() => {
                      setSelectedStore(store);
                      toast({
                        title: "Loja Selecionada!",
                        description: `${store.nome_loja} foi selecionada para instalação.`,
                      });
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`rounded-lg p-2 flex-shrink-0 ${
                        selectedStore?.id === store.id
                          ? 'bg-green-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}>
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">{store.nome_loja}</h3>
                          {selectedStore?.id === store.id && (
                            <Badge className="bg-green-500 text-white text-xs">
                              ✓ Selecionada
                            </Badge>
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <FileText className="h-4 w-4" />
                            <span>Código: {store.codigo_loja}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{store.cidade || 'Cidade não informada'}</span>
                          </div>
                          {store.logradouro && (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              <span>{store.logradouro}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedStore && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <p className="font-medium text-green-800">Loja Selecionada</p>
                  </div>
                  <p className="text-green-700">
                    <strong>{selectedStore.nome_loja}</strong> - Código: {selectedStore.codigo_loja}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Clique no botão "Ir para Instalação" acima para continuar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loadingRouteStores && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <div>
                  <p className="text-blue-800 font-medium">Carregando lojas das rotas...</p>
                  <p className="text-blue-600 text-sm">Processando informações</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { type Supplier, type Store as StoreType } from "@shared/mysql-schema";

export default function SupplierAccess() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [supplierResult, setSupplierResult] = useState<any>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [routeStores, setRouteStores] = useState<StoreType[]>([]);
  const [loadingRouteStores, setLoadingRouteStores] = useState(false);
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);

  const { toast } = useToast();

  // Debounce da busca - espera 500ms após parar de digitar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        setDebouncedSearchTerm(searchTerm.trim());
      } else {
        setDebouncedSearchTerm("");
        setSearchSuggestions([]);
        setShowSuggestions(false);
        // Só limpa o resultado se não tiver um fornecedor selecionado
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
  
  // Detectar se é mobile de forma mais robusta
  const isMobileDevice = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(window.navigator.userAgent) ||
           window.innerWidth <= 768 ||
           ('ontouchstart' in window);
  }, []);

  const handleSelectSuggestion = React.useCallback((suggestionId: string, suggestionType: string) => {
    console.log('🔍 Iniciando seleção:', { suggestionId, suggestionType, isMobile: isMobileDevice });
    
    if (isProcessingSelection) {
      console.log('⚠️ Já processando seleção, ignorando');
      return;
    }
    
    try {
      const suggestion = searchSuggestions.find(s => 
        s.data.id.toString() === suggestionId && s.type === suggestionType
      );
      
      if (!suggestion) {
        console.log('❌ Sugestão não encontrada');
        return;
      }
      
      console.log('✅ Sugestão encontrada:', suggestion.data.nome_fornecedor || suggestion.data.nome_funcionario);
      
      setIsProcessingSelection(true);
      
      // Limpar estados de busca imediatamente
      setShowSuggestions(false);
      setSearchSuggestions([]);
      setDebouncedSearchTerm("");
      
      // Atualizar resultado
      setSupplierResult(suggestion);
      const displayName = suggestion.type === 'supplier' 
        ? suggestion.data.nome_fornecedor 
        : suggestion.data.nome_funcionario;
      setSearchTerm(displayName);
      
      console.log('💾 Salvando no localStorage...');
      
      // Salvar no localStorage de forma mais segura
      const storageData = {
        id: suggestion.data.id,
        nome_fornecedor: suggestion.data.nome_fornecedor || '',
        nome_funcionario: suggestion.data.nome_funcionario || '',
        cnpj: suggestion.data.cnpj || '',
        cpf: suggestion.data.cpf || '',
        telefone: suggestion.data.telefone || '',
        endereco: suggestion.data.endereco || '',
        searchType: suggestion.type
      };
      
      try {
        localStorage.setItem("supplier_access", JSON.stringify(storageData));
        console.log('✅ Dados salvos no localStorage');
      } catch (storageError) {
        console.error('❌ Erro ao salvar no localStorage:', storageError);
      }
      
      // Toast de sucesso
      toast({
        title: "Sucesso!",
        description: `${suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'} selecionado.`,
      });
      
      console.log('🚀 Iniciando busca de lojas...');
      
      // Para mobile, usar processo mais simples sem buscar lojas automaticamente
      if (isMobileDevice) {
        console.log('📱 Modo mobile - finalizando sem buscar lojas');
        setIsProcessingSelection(false);
      } else {
        // Desktop: buscar lojas normalmente
        setTimeout(async () => {
          try {
            await fetchRouteStores(suggestion.data, suggestion.type);
            console.log('✅ Busca de lojas concluída');
          } catch (error) {
            console.error('❌ Erro ao buscar lojas:', error);
          } finally {
            setIsProcessingSelection(false);
            console.log('🏁 Processamento finalizado');
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('❌ Erro crítico na seleção:', error);
      setIsProcessingSelection(false);
      toast({
        title: "Erro",
        description: "Falha ao processar seleção. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [searchSuggestions, isProcessingSelection, isMobileDevice, toast]);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (value.length < 3) {
      setSupplierResult(null);
      setSearchSuggestions([]);
      setShowSuggestions(false);
      setDebouncedSearchTerm("");
      setRouteStores([]);
    } else {
      // Se há um fornecedor selecionado e o usuário está digitando algo diferente, limpa a seleção
      if (supplierResult && 
          value !== (supplierResult.type === 'supplier' ? supplierResult.data.nome_fornecedor : supplierResult.data.nome_funcionario)) {
        setSupplierResult(null);
        setRouteStores([]);
      }
    }
  };
  
  const handleInputBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };
  
  const handleInputFocus = () => {
    if (searchSuggestions.length > 0 && !supplierResult) {
      setShowSuggestions(true);
    }
  };
  
  const fetchRouteStores = async (userData: any, userType: string): Promise<void> => {
    setLoadingRouteStores(true);
    
    return new Promise<void>((resolve) => {
      const processRouteStores = async () => {
        try {
          let routeEndpoint = '';
          if (userType === 'supplier') {
            routeEndpoint = `/api/routes/supplier/${userData.id}`;
          } else if (userType === 'employee') {
            routeEndpoint = `/api/routes/employee/${userData.id}`;
          } else {
            console.warn('Tipo de usuário inválido:', userType);
            setRouteStores([]);
            setLoadingRouteStores(false);
            resolve();
            return;
          }
          
          console.log('Buscando rotas em:', routeEndpoint);
          
          const routeResponse = await fetch(routeEndpoint);
          if (routeResponse.ok) {
            const routes = await routeResponse.json();
            console.log('Rotas encontradas:', routes);
            
            const storeIds = routes.flatMap((route: any) => route.lojas?.map((loja: any) => loja.id) || []);
            
            if (storeIds.length > 0) {
              console.log('IDs das lojas:', storeIds);
              
              const storeResponse = await fetch(`/api/stores/by-ids`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ storeIds })
              });
              
              if (storeResponse.ok) {
                const stores = await storeResponse.json();
                console.log('Lojas encontradas:', stores);
                setRouteStores(stores || []);
              } else {
                console.error('Erro na resposta ao buscar lojas:', storeResponse.status);
                setRouteStores([]);
              }
            } else {
              console.log('Nenhuma loja encontrada nas rotas');
              setRouteStores([]);
            }
          } else {
            console.error('Erro na resposta das rotas:', routeResponse.status);
            setRouteStores([]);
          }
        } catch (error) {
          console.error('Erro ao buscar lojas das rotas:', error);
          setRouteStores([]);
        } finally {
          setLoadingRouteStores(false);
          resolve();
        }
      };
      
      // Executar com pequeno delay
      setTimeout(processRouteStores, 50);
    });
  };


  // Removido o toast automático - agora é mostrado apenas na seleção
  
  const handleSelectStore = (store: StoreType) => {
    // Store both supplier and store data
    localStorage.setItem("supplier_access", JSON.stringify(supplier));
    localStorage.setItem("selected_store", JSON.stringify(store));
    setLocation("/installation-checklist");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-primary rounded-full flex items-center justify-center mb-4">
              <Store className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Acesso do Fornecedor</h1>
            <p className="text-gray-600 mt-2">Busque seus dados para acessar o sistema</p>
          </div>

          {/* Search Section */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Buscar Dados do Fornecedor</CardTitle>
              <p className="text-sm text-gray-600 mt-1">A busca é feita automaticamente conforme você digita</p>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Input
                      id="search-term"
                      type="text"
                      placeholder="Digite seu Nome, CPF ou CNPJ (min. 3 caracteres)"
                      value={searchTerm}
                      onChange={handleSearchInputChange}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                      className="mt-2"
                      autoComplete="off"
                    />
                    
                    {/* Lista de sugestões com tratamento específico para mobile */}
                    {showSuggestions && searchSuggestions.length > 0 && !supplierResult && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchSuggestions.map((suggestion, index) => {
                          const suggestionId = suggestion.data.id.toString();
                          const suggestionType = suggestion.type;
                          
                          return (
                            <div
                              key={`suggestion-${suggestionId}-${suggestionType}-${index}`}
                              className="px-4 py-3 cursor-pointer hover:bg-gray-100 border-b last:border-b-0 active:bg-gray-200"
                              style={{
                                WebkitTapHighlightColor: 'rgba(0, 0, 0, 0.1)',
                                userSelect: 'none',
                                WebkitUserSelect: 'none'
                              }}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                console.log('🖱️ Mouse down - desktop');
                                handleSelectSuggestion(suggestionId, suggestionType);
                              }}
                              onTouchStart={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('📱 Touch start - mobile');
                                handleSelectSuggestion(suggestionId, suggestionType);
                              }}
                            >
                              <div className="flex justify-between items-start pointer-events-none">
                                <div className="flex-1">
                                  <div className="font-semibold text-gray-900">
                                    {suggestion.type === 'supplier' ? 
                                      suggestion.data.nome_fornecedor : 
                                      suggestion.data.nome_funcionario
                                    }
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {suggestion.type === 'supplier' ? (
                                      `CNPJ: ${suggestion.data.cnpj || 'Não informado'}`
                                    ) : (
                                      `CPF: ${suggestion.data.cpf || 'Não informado'} - Empresa: ${suggestion.data.nome_fornecedor || ''}`
                                    )}
                                  </div>
                                  {suggestion.data.nome_responsavel && suggestion.type === 'supplier' && (
                                    <div className="text-sm text-gray-500">
                                      Responsável: {suggestion.data.nome_responsavel}
                                    </div>
                                  )}
                                </div>
                                <div className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-end">
                  {isLoading && (
                    <div className="flex items-center text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                      Buscando...
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {error && debouncedSearchTerm && searchSuggestions.length === 0 && (
            <Card className="mb-6 border-red-200">
              <CardContent className="pt-6">
                <div className="text-center text-red-600">
                  <p>Fornecedor/Funcionário não encontrado no sistema.</p>
                  <p className="text-sm mt-2">Verifique se os dados estão corretos ou entre em contato com o administrador.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {debouncedSearchTerm && debouncedSearchTerm.length < 3 && searchTerm.length > 0 && (
            <Card className="mb-6 border-yellow-200">
              <CardContent className="pt-6">
                <div className="text-center text-yellow-600">
                  <p>Digite pelo menos 3 caracteres para iniciar a busca.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {supplier && (
            <Card className="mb-6 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-700">Fornecedor Encontrado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label className="block text-sm font-medium text-gray-700">Nome da Empresa</Label>
                    <p className="text-gray-900">{supplier.nome_fornecedor}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700">CNPJ</Label>
                    <p className="text-gray-900">{supplier.cnpj}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700">Responsável</Label>
                    <p className="text-gray-900">{supplier.nome_responsavel}</p>
                  </div>
                  <div>
                    <Label className="block text-sm font-medium text-gray-700">Telefone</Label>
                    <p className="text-gray-900">{supplier.telefone}</p>
                  </div>
                  <div className="md:col-span-2">
                    <Label className="block text-sm font-medium text-gray-700">Endereço</Label>
                    <p className="text-gray-900">{supplier.endereco}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Store Selection - Only show after supplier is found */}
          {supplier && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Lojas da Rota</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Lojas vinculadas às rotas cadastradas</p>
              </CardHeader>
              <CardContent>
                {/* Store Results */}
                {loadingRouteStores ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    Carregando lojas das rotas...
                  </div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {routeStores.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>Nenhuma loja encontrada nas rotas cadastradas.</p>
                        <p className="text-sm mt-2">Verifique se existem rotas ativas para este fornecedor/funcionário.</p>
                      </div>
                    ) : (
                      <>
                        <div className="text-sm text-blue-600 mb-4">
                          {routeStores.length} loja{routeStores.length !== 1 ? 's' : ''} encontrada{routeStores.length !== 1 ? 's' : ''} nas rotas
                        </div>
                        {routeStores.map((store) => (
                          <div
                            key={store.codigo_loja}
                            className="border rounded-lg p-4 transition duration-200 border-gray-200 hover:shadow-md"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">
                                  Código: {store.codigo_loja} - {store.nome_loja}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {store.logradouro}, {store.numero} {store.complemento && `- ${store.complemento}`}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {store.bairro} - {store.cidade}, {store.uf}
                                </p>
                                <p className="text-sm text-gray-500">CEP: {store.cep}</p>
                                <p className="text-sm text-gray-500">Telefone: {store.telefone_loja}</p>
                              </div>
                              <div className="ml-4">
                                <Button 
                                  onClick={() => handleSelectStore(store)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 font-semibold"
                                  data-testid={`button-select-store-${store.codigo_loja}`}
                                >
                                  Selecionar
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}


              </CardContent>
            </Card>
          )}

          <div className="text-center">
            <Button variant="outline" onClick={() => setLocation("/")}>
              Voltar à Página Inicial
            </Button>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
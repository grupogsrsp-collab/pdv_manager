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

// Versão à prova de erros para mobile
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
      
      // Para mobile: NÃO buscar lojas automaticamente (causa dos erros)
      if (isMobileDevice) {
        console.log('📱 [ULTRA-SAFE] Mobile - processo simplificado');
        setTimeout(() => {
          setIsProcessingSelection(false);
          console.log('✅ [ULTRA-SAFE] Mobile finalizado');
        }, 200);
      } else {
        // Desktop pode buscar lojas
        setTimeout(() => {
          fetchRouteStoresSafe(suggestion.data, suggestion.type)
            .finally(() => {
              setIsProcessingSelection(false);
              console.log('✅ [ULTRA-SAFE] Desktop finalizado');
            });
        }, 100);
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

  // Função segura para buscar lojas (só para desktop)
  const fetchRouteStoresSafe = async (userData: any, userType: string): Promise<void> => {
    try {
      setLoadingRouteStores(true);
      
      let routeEndpoint = '';
      if (userType === 'supplier') {
        routeEndpoint = `/api/routes/supplier/${userData.id}`;
      } else if (userType === 'employee') {
        routeEndpoint = `/api/routes/employee/${userData.id}`;
      } else {
        setRouteStores([]);
        return;
      }
      
      const routeResponse = await fetch(routeEndpoint);
      if (routeResponse.ok) {
        const routes = await routeResponse.json();
        
        if (routes && routes.length > 0) {
          const allStoreIds = routes.flatMap((route: any) => route.store_ids || []);
          const uniqueStoreIds = Array.from(new Set(allStoreIds));
          
          if (uniqueStoreIds.length > 0) {
            const storeResponse = await fetch('/api/stores/by-ids', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ storeIds: uniqueStoreIds })
            });
            
            if (storeResponse.ok) {
              const stores = await storeResponse.json();
              setRouteStores(stores || []);
            }
          }
        } else {
          setRouteStores([]);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      setRouteStores([]);
    } finally {
      setLoadingRouteStores(false);
    }
  };

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
      if (supplierResult && 
          value !== (supplierResult.type === 'supplier' ? supplierResult.data.nome_fornecedor : supplierResult.data.nome_funcionario)) {
        setSupplierResult(null);
        setRouteStores([]);
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
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Cabeçalho */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso do Fornecedor</h1>
          <p className="text-gray-600">
            Busque por fornecedor ou funcionário para acessar as rotas e informações
          </p>
        </div>

        {/* Campo de Busca ULTRA-SEGURO */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Dados do Fornecedor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Label htmlFor="supplier-search" className="text-sm font-medium text-gray-700 mb-2 block">
                Digite o nome, CNPJ ou CPF (mínimo 3 caracteres)
              </Label>
              <Input
                id="supplier-search"
                type="text"
                placeholder="Ex: João Silva, 12.345.678/0001-90, 123.456.789-00"
                value={searchTerm}
                onChange={handleSearchInputChange}
                onBlur={handleInputBlur}
                onFocus={handleInputFocus}
                className="w-full pr-10"
                data-testid="input-supplier-search"
              />
              <Search className="absolute right-3 top-8 h-4 w-4 text-gray-400" />

              {/* Lista de Sugestões ULTRA-SEGURA */}
              {showSuggestions && searchSuggestions.length > 0 && !supplierResult && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {searchSuggestions.map((suggestion, index) => (
                    <div
                      key={`safe-${suggestion.type}-${suggestion.data.id}-${index}`}
                      className="px-4 py-3 hover:bg-gray-100 border-b last:border-b-0 cursor-pointer"
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
                  ))}
                </div>
              )}
            </div>

            {isLoading && (
              <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Buscando...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resultado do Fornecedor */}
        {supplierResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                {supplierResult.type === 'supplier' ? 'Fornecedor Selecionado' : 'Funcionário Selecionado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-semibold">
                    {supplierResult.type === 'supplier' ? 
                      supplierResult.data.nome_fornecedor : 
                      supplierResult.data.nome_funcionario
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {supplierResult.type === 'supplier' ? 'CNPJ' : 'CPF'}
                  </p>
                  <p className="font-semibold">
                    {supplierResult.type === 'supplier' ? 
                      (supplierResult.data.cnpj || 'Não informado') : 
                      (supplierResult.data.cpf || 'Não informado')
                    }
                  </p>
                </div>
                {supplierResult.data.telefone && (
                  <div>
                    <p className="text-sm text-gray-600">Telefone</p>
                    <p className="font-semibold">{supplierResult.data.telefone}</p>
                  </div>
                )}
                {supplierResult.data.endereco && (
                  <div>
                    <p className="text-sm text-gray-600">Endereço</p>
                    <p className="font-semibold">{supplierResult.data.endereco}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 space-y-4">
                <Button 
                  onClick={() => setLocation("/installation-checklist")}
                  className="w-full sm:w-auto"
                  data-testid="button-installation-checklist"
                >
                  Ir para Lista de Instalação
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lojas das Rotas */}
        {routeStores.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Lojas das Rotas Associadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {routeStores.map((store, index) => (
                  <div key={store.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{store.nome_loja}</h3>
                        <p className="text-sm text-gray-600">Código: {store.codigo_loja}</p>
                        <p className="text-sm text-gray-600">
                          {store.cidade || 'Cidade não informada'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {loadingRouteStores && (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Carregando lojas das rotas...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
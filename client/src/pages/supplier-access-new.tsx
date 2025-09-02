import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Search, Store, MapPin, Building, FileText, CheckCircle, User, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { type Supplier, type Store as StoreType } from "@shared/mysql-schema";

// Componente para sugestão de fornecedor/funcionário
const SupplierSuggestion = ({ suggestion, onSelect }: {
  suggestion: any;
  onSelect: (suggestion: any) => void;
}) => (
  <div
    className="px-4 py-3 hover:bg-blue-50 border-b cursor-pointer transition-colors"
    onClick={() => onSelect(suggestion)}
  >
    <div className="flex items-center gap-3">
      <div className="bg-blue-500 text-white rounded-lg p-2">
        {suggestion.type === 'supplier' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">
          {suggestion.type === 'supplier' ? 
            suggestion.data.nome_fornecedor : 
            suggestion.data.nome_funcionario
          }
        </div>
        <div className="text-sm text-gray-600">
          {suggestion.type === 'supplier' ? 
            `CNPJ: ${suggestion.data.cnpj || 'Não informado'}` :
            `CPF: ${suggestion.data.cpf || 'Não informado'}`
          }
        </div>
      </div>
      <Badge variant="secondary" className="text-xs">
        {suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'}
      </Badge>
    </div>
  </div>
);

// Componente para exibir loja
const StoreCard = ({ store, onSelect }: {
  store: StoreType;
  onSelect: (store: StoreType) => void;
}) => (
  <div 
    className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-green-400"
    onClick={() => onSelect(store)}
  >
    <div className="flex items-center gap-4">
      <div className="bg-green-500 text-white rounded-lg p-3">
        <Store className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-gray-900">{store.nome_loja}</h3>
          <Badge className="bg-green-500 text-white text-xs">
            → Tocar para Instalar
          </Badge>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Hash className="h-4 w-4" />
            <span>Código: {store.codigo_loja}</span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span>
                {store.logradouro ? `${store.logradouro}` : 'Sem rua'}
                {store.numero ? `, ${store.numero}` : ''}
              </span>
            </div>
            {store.bairro && (
              <div className="ml-5">
                <span>{store.bairro}</span>
              </div>
            )}
            <div className="ml-5">
              <span>{store.cidade}, {store.uf}</span>
              {store.cep && <span className="ml-2">CEP: {store.cep}</span>}
            </div>
          </div>
        </div>
      </div>
      <CheckCircle className="h-6 w-6 text-green-600" />
    </div>
  </div>
);

export default function SupplierAccessNew() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Estados para busca de fornecedor/funcionário
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Estados para lojas das rotas
  const [routeStores, setRouteStores] = useState<StoreType[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(false);

  // Estados para busca manual de loja (ajustado para schema do backend)
  const [manualSearch, setManualSearch] = useState({
    codigo_loja: "",
    cep: "",
    cidade: "",
    uf: "",
    regiao: ""
  });
  const [manualStores, setManualStores] = useState<StoreType[]>([]);
  const [loadingManual, setLoadingManual] = useState(false);

  // Debounce para busca de fornecedor
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        setDebouncedSearchTerm(searchTerm.trim());
      } else {
        setDebouncedSearchTerm("");
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Query para buscar fornecedores/funcionários
  const { data: suggestions, isLoading: loadingSearch } = useQuery({
    queryKey: ["/api/suppliers/search", debouncedSearchTerm],
    queryFn: async () => {
      const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(debouncedSearchTerm)}`);
      if (!response.ok) throw new Error('Busca falhou');
      return response.json();
    },
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length >= 3,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Atualizar sugestões quando dados mudarem
  React.useEffect(() => {
    if (suggestions && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions]);

  // Função para selecionar fornecedor/funcionário
  const handleSelectSupplier = (suggestion: any) => {
    console.log('✅ [SELECT] Fornecedor/funcionário selecionado:', suggestion);
    
    setSelectedSupplier(suggestion);
    setSearchTerm(suggestion.type === 'supplier' ? 
      suggestion.data.nome_fornecedor : 
      suggestion.data.nome_funcionario
    );
    setShowSuggestions(false);
    
    // Salvar no localStorage
    localStorage.setItem("supplier_access", JSON.stringify({
      id: suggestion.data.id,
      nome_fornecedor: suggestion.data.nome_fornecedor || '',
      searchType: suggestion.type
    }));

    toast({
      title: "Selecionado!",
      description: `${suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'} selecionado com sucesso.`,
    });
  };

  // Função para buscar lojas das rotas
  const handleViewRouteStores = async () => {
    if (!selectedSupplier) return;

    console.log('🔍 [ROUTES] Buscando lojas das rotas...');
    setLoadingRoutes(true);

    try {
      const endpoint = selectedSupplier.type === 'supplier' 
        ? `/api/routes/supplier/${selectedSupplier.data.id}`
        : `/api/routes/employee/${selectedSupplier.data.id}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const routes = await response.json();
      console.log('📦 [ROUTES] Dados recebidos:', routes);

      // Processar lojas das rotas
      const stores: StoreType[] = [];
      if (routes && Array.isArray(routes)) {
        routes.forEach((route: any) => {
          if (route.lojas && Array.isArray(route.lojas)) {
            route.lojas.forEach((loja: any) => {
              if (loja && loja.id && loja.nome_loja) {
                stores.push({
                  id: loja.id,
                  codigo_loja: String(loja.id),
                  nome_loja: loja.nome_loja,
                  cidade: loja.cidade || 'N/A',
                  uf: loja.uf || '',
                  logradouro: loja.logradouro || '',
                  numero: loja.numero || '',
                  complemento: loja.complemento || '',
                  bairro: loja.bairro || '',
                  cep: loja.cep || '',
                  regiao: loja.regiao || '',
                  telefone_loja: loja.telefone_loja || '',
                  nome_operador: loja.nome_operador || ''
                });
              }
            });
          }
        });
      }

      setRouteStores(stores);
      
      if (stores.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma loja encontrada nas rotas. Tente a busca manual abaixo.",
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('❌ [ROUTES] Erro:', error);
      setRouteStores([]);
      toast({
        title: "Erro",
        description: "Erro ao buscar lojas das rotas. Tente a busca manual abaixo.",
        variant: "destructive"
      });
    } finally {
      setLoadingRoutes(false);
    }
  };

  // Função para busca manual de lojas (usando POST)
  const handleManualSearch = async () => {
    console.log('🔍 [MANUAL] Iniciando busca manual...');
    setLoadingManual(true);

    try {
      // Criar filtros apenas com campos preenchidos
      const filters: any = {};
      
      Object.entries(manualSearch).forEach(([key, value]) => {
        if (value && value.trim()) {
          filters[key] = value.trim();
        }
      });

      if (Object.keys(filters).length === 0) {
        toast({
          title: "Aviso",
          description: "Preencha ao menos um campo para buscar.",
          variant: "destructive"
        });
        return;
      }

      console.log('🔍 [MANUAL] Filtros enviados:', filters);

      // Usar GET com query parameters para simplicidade
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        params.append(key, String(value));
      });

      const response = await fetch(`/api/stores/search?${params.toString()}`);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const stores = await response.json();
      setManualStores(stores);

      if (stores.length === 0) {
        toast({
          title: "Aviso",
          description: "Nenhuma loja encontrada com os critérios informados.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sucesso!",
          description: `${stores.length} loja(s) encontrada(s).`,
        });
      }

    } catch (error) {
      console.error('❌ [MANUAL] Erro:', error);
      setManualStores([]);
      toast({
        title: "Erro",
        description: "Erro na busca manual. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingManual(false);
    }
  };

  // Função para selecionar loja e ir para instalação
  const handleSelectStore = (store: StoreType) => {
    console.log('🏪 [STORE] Loja selecionada:', store);
    
    try {
      // Salvar loja selecionada
      localStorage.setItem("selected_store", JSON.stringify(store));
      
      // Navegar para instalação
      setLocation("/installation-checklist");
      
    } catch (error) {
      console.error('❌ [STORE] Erro ao selecionar loja:', error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar loja. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Building className="h-6 w-6" />
              Acesso do Fornecedor
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Busca de Fornecedor/Funcionário */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Fornecedor ou Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Label htmlFor="search">Nome, CNPJ ou CPF</Label>
              <Input
                id="search"
                type="text"
                placeholder="Digite o nome, CNPJ ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
                data-testid="input-supplier-search"
              />
              
              {/* Sugestões */}
              {showSuggestions && suggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion: any, index: number) => (
                    <SupplierSuggestion 
                      key={index}
                      suggestion={suggestion}
                      onSelect={handleSelectSupplier}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Fornecedor/Funcionário Selecionado */}
            {selectedSupplier && (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 text-white rounded-lg p-2">
                    {selectedSupplier.type === 'supplier' ? <Building className="h-5 w-5" /> : <User className="h-5 w-5" />}
                  </div>
                  <div>
                    <div className="font-semibold text-green-800">
                      {selectedSupplier.type === 'supplier' ? 
                        selectedSupplier.data.nome_fornecedor : 
                        selectedSupplier.data.nome_funcionario
                      }
                    </div>
                    <div className="text-sm text-green-600">
                      {selectedSupplier.type === 'supplier' ? 
                        `CNPJ: ${selectedSupplier.data.cnpj}` :
                        `CPF: ${selectedSupplier.data.cpf}`
                      }
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    ✓ Selecionado
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Opções de Acesso - Tabs */}
        {selectedSupplier && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <Tabs defaultValue="route-stores" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="route-stores">Ver Lojas para Instalação</TabsTrigger>
                  <TabsTrigger value="manual-search">Buscar Loja Manualmente</TabsTrigger>
                </TabsList>

                {/* Tab 1: Ver Lojas para Instalação */}
                <TabsContent value="route-stores" className="space-y-4">
                  <div className="text-center space-y-4">
                    <div className="bg-green-100 rounded-lg p-4">
                      <Store className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-800 mb-2">
                        Lojas nas Rotas
                      </h3>
                      <p className="text-green-700 text-sm mb-4">
                        Buscar lojas associadas às rotas deste {selectedSupplier.type === 'supplier' ? 'fornecedor' : 'funcionário'}.
                      </p>
                      <Button 
                        onClick={handleViewRouteStores}
                        disabled={loadingRoutes}
                        className="bg-green-500 hover:bg-green-600 text-white px-6 py-2"
                        data-testid="button-view-route-stores"
                      >
                        {loadingRoutes ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Buscando...
                          </>
                        ) : (
                          <>
                            <Store className="h-4 w-4 mr-2" />
                            Ver Lojas para Instalação
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Resultado das Lojas das Rotas */}
                    {routeStores.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium text-gray-900 text-left">
                          Lojas Encontradas ({routeStores.length})
                        </h4>
                        {routeStores.map((store) => (
                          <StoreCard 
                            key={store.id}
                            store={store}
                            onSelect={handleSelectStore}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Tab 2: Buscar Loja Manualmente */}
                <TabsContent value="manual-search" className="space-y-4">
                  <div className="bg-blue-100 rounded-lg p-4 mb-4">
                    <Search className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <h3 className="font-semibold text-blue-800 mb-2 text-center">
                      Busca Manual de Loja
                    </h3>
                    <p className="text-blue-700 text-sm text-center">
                      Busque uma loja específica usando os campos abaixo.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="codigo_loja">Código da Loja</Label>
                      <Input
                        id="codigo_loja"
                        placeholder="Ex: 001, 123..."
                        value={manualSearch.codigo_loja}
                        onChange={(e) => setManualSearch(prev => ({...prev, codigo_loja: e.target.value}))}
                        data-testid="input-codigo-loja"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cidade">Município (Cidade)</Label>
                      <Input
                        id="cidade"
                        placeholder="Ex: São Paulo, Rio de Janeiro..."
                        value={manualSearch.cidade}
                        onChange={(e) => setManualSearch(prev => ({...prev, cidade: e.target.value}))}
                        data-testid="input-cidade"
                      />
                    </div>

                    <div>
                      <Label htmlFor="cep">CEP</Label>
                      <Input
                        id="cep"
                        placeholder="Ex: 01234-567..."
                        value={manualSearch.cep}
                        onChange={(e) => setManualSearch(prev => ({...prev, cep: e.target.value}))}
                        data-testid="input-cep"
                      />
                    </div>

                    <div>
                      <Label htmlFor="regiao">Região</Label>
                      <Input
                        id="regiao"
                        placeholder="Ex: Norte, Sul, Centro..."
                        value={manualSearch.regiao}
                        onChange={(e) => setManualSearch(prev => ({...prev, regiao: e.target.value}))}
                        data-testid="input-regiao"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="uf">Estado (UF)</Label>
                      <Input
                        id="uf"
                        placeholder="Ex: SP, RJ, MG..."
                        value={manualSearch.uf}
                        onChange={(e) => setManualSearch(prev => ({...prev, uf: e.target.value.toUpperCase()}))}
                        maxLength={2}
                        data-testid="input-uf"
                      />
                    </div>
                  </div>

                  <div className="text-center">
                    <Button 
                      onClick={handleManualSearch}
                      disabled={loadingManual}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
                      data-testid="button-manual-search"
                    >
                      {loadingManual ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Buscando...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Buscar Loja
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Resultado da Busca Manual */}
                  {manualStores.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-900">
                        Lojas Encontradas ({manualStores.length})
                      </h4>
                      {manualStores.map((store) => (
                        <StoreCard 
                          key={store.id}
                          store={store}
                          onSelect={handleSelectStore}
                        />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Estado de Loading para pesquisa */}
        {loadingSearch && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p className="text-blue-600">Buscando...</p>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
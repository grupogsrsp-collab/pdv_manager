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

  const [filters, setFilters] = useState({
    cep: "",
    address: "",
    state: "",
    city: "",
    code: "",
  });
  const { toast } = useToast();

  // Debounce da busca - espera 500ms após parar de digitar
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim().length >= 3) {
        setDebouncedSearchTerm(searchTerm.trim());
      } else {
        setDebouncedSearchTerm("");
        setSupplierResult(null);
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
      const result = await response.json();
      setSupplierResult(result);
      // Armazenar no localStorage
      localStorage.setItem("supplier_access", JSON.stringify({...result.data, searchType: result.type}));
      
      return result;
    },
    enabled: !!debouncedSearchTerm && debouncedSearchTerm.length >= 3,
    retry: false,
  });

  const supplier = supplierData?.data;

  const { data: stores = [], isLoading: storesLoading } = useQuery<StoreType[]>({
    queryKey: ["/api/stores", filters, debouncedSearchTerm],
    queryFn: async () => {
      if (debouncedSearchTerm === 'route-filtered') {
        // Buscar lojas baseadas nas rotas do fornecedor/funcionário
        const userData = JSON.parse(localStorage.getItem("supplier_access") || '{}');
        let routeEndpoint = '';
        if (userData.searchType === 'supplier') {
          routeEndpoint = `/api/routes/supplier/${userData.id}`;
        } else if (userData.searchType === 'employee') {
          routeEndpoint = `/api/routes/employee/${userData.id}`;
        }
        
        const routeResponse = await fetch(routeEndpoint);
        if (routeResponse.ok) {
          const routes = await routeResponse.json();
          const storeIds = routes.flatMap((route: any) => route.lojas.map((loja: any) => loja.id));
          
          if (storeIds.length > 0) {
            const storeResponse = await fetch(`/api/stores/by-ids`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ storeIds })
            });
            
            if (storeResponse.ok) {
              let filteredStores = await storeResponse.json();
              
              // Aplicar filtros adicionais se especificados
              if (filters.cep) {
                filteredStores = filteredStores.filter((store: StoreType) => 
                  store.cep.includes(filters.cep.replace(/\D/g, ''))
                );
              }
              if (filters.city) {
                filteredStores = filteredStores.filter((store: StoreType) => 
                  store.cidade.toLowerCase().includes(filters.city.toLowerCase())
                );
              }
              if (filters.state) {
                filteredStores = filteredStores.filter((store: StoreType) => 
                  store.uf.toUpperCase() === filters.state.toUpperCase()
                );
              }
              if (filters.code) {
                filteredStores = filteredStores.filter((store: StoreType) => 
                  store.codigo_loja.includes(filters.code)
                );
              }
              if (filters.address) {
                filteredStores = filteredStores.filter((store: StoreType) => 
                  store.logradouro.toLowerCase().includes(filters.address.toLowerCase())
                );
              }
              
              return filteredStores;
            }
          }
        }
        return [];
      } else {
        const params = new URLSearchParams();
        
        // Add filters to params
        Object.entries(filters).forEach(([key, value]) => {
          if (value && value.trim()) {
            params.append(key, value.trim());
          }
        });
        
        const response = await fetch(`/api/stores?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch stores');
        }
        return response.json();
      }
    },
    enabled: !!supplier, // Only search stores after supplier is found
  });

  // Mostrar toast de sucesso quando encontrar
  React.useEffect(() => {
    if (supplierData && !error) {
      toast({
        title: "Sucesso!",
        description: `${supplierData.type === 'supplier' ? 'Fornecedor' : 'Funcionário'} encontrado com sucesso.`,
      });
      // Buscar rotas associadas
      fetchAssociatedRoutes(supplierData.data, supplierData.type);
    }
  }, [supplierData, error]);

  const fetchAssociatedRoutes = async (userData: any, userType: string) => {
    try {
      let routeEndpoint = '';
      if (userType === 'supplier') {
        routeEndpoint = `/api/routes/supplier/${userData.id}`;
      } else if (userType === 'employee') {
        routeEndpoint = `/api/routes/employee/${userData.id}`;
      }
      
      const routeResponse = await fetch(routeEndpoint);
      if (routeResponse.ok) {
        const routes = await routeResponse.json();
        // Filtrar lojas baseadas nas rotas
        setDebouncedSearchTerm('route-filtered');
      }
    } catch (error) {
      console.error('Erro ao buscar rotas associadas:', error);
    }
  };


  const handleSelectStore = (store: StoreType) => {
    // Store both supplier and store data
    localStorage.setItem("supplier_access", JSON.stringify(supplier));
    localStorage.setItem("selected_store", JSON.stringify(store));
    setLocation("/installation-checklist");
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return digits.replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    handleFilterChange("cep", formatted);
  };

  const formatCnpj = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");
    // Apply CNPJ mask: 00.000.000/0000-00
    return digits
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .slice(0, 18);
  };

  // Função removida - não precisa mais formatar CNPJ

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
                  <Input
                    id="search-term"
                    type="text"
                    placeholder="Digite seu Nome, CPF ou CNPJ (min. 3 caracteres)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="mt-2"
                  />
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
          {error && debouncedSearchTerm && (
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
                <CardTitle>Selecionar Loja para Instalação</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                  <div>
                    <Label htmlFor="cep" className="block text-sm font-medium text-gray-700 mb-2">
                      CEP
                    </Label>
                    <Input
                      id="cep"
                      placeholder="00000-000"
                      value={filters.cep}
                      onChange={handleCepChange}
                      maxLength={9}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome da Rua
                    </Label>
                    <Input
                      id="address"
                      placeholder="Ex: Rua das Flores"
                      value={filters.address}
                      onChange={(e) => handleFilterChange("address", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      Estado
                    </Label>
                    <Input
                      id="state"
                      placeholder="Ex: SP"
                      value={filters.state}
                      onChange={(e) => handleFilterChange("state", e.target.value.toUpperCase())}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      Cidade
                    </Label>
                    <Input
                      id="city"
                      placeholder="Ex: São Paulo"
                      value={filters.city}
                      onChange={(e) => handleFilterChange("city", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                      Código da Loja
                    </Label>
                    <Input
                      id="code"
                      placeholder="Ex: 001"
                      value={filters.code}
                      onChange={(e) => handleFilterChange("code", e.target.value)}
                    />
                  </div>
                </div>

                {/* Store Results */}
                {storesLoading ? (
                  <div className="text-center py-8">Carregando lojas...</div>
                ) : (
                  <div className="space-y-4 mb-6">
                    {stores.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma loja encontrada com os filtros aplicados.
                      </div>
                    ) : (
                      stores.map((store) => (
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
                      ))
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

          {/* Demo data info */}
          <Card className="mt-6 bg-gray-50">
            <CardContent className="pt-6">
              <h4 className="font-medium text-gray-900 mb-2">CNPJs para Teste:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <strong>12.345.678/0001-90</strong> - SuperTech Supplies</p>
                <p>• <strong>98.765.432/0001-10</strong> - ABC Ferramentas</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
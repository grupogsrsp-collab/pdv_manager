import React, { useState } from "react";
import { useLocation } from "wouter";
import { Search, Store, MapPin, Building, Hash, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Store as StoreType } from "@shared/mysql-schema";

export default function SupplierAccessSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Estados básicos
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showingStores, setShowingStores] = useState(false);
  const [routeStores, setRouteStores] = useState<StoreType[]>([]);

  // Função simples de busca de fornecedor
  const searchSupplier = async () => {
    if (searchTerm.length < 3) {
      toast({
        title: "Aviso",
        description: "Digite pelo menos 3 caracteres para buscar",
        variant: "destructive"
      });
      return;
    }

    setLoadingSuggestions(true);
    
    try {
      const response = await fetch(`/api/suppliers/search?q=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data);
        
        if (data.length === 0) {
          toast({
            title: "Nenhum resultado",
            description: "Nenhum fornecedor ou funcionário encontrado",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Erro na busca:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  // Função para selecionar fornecedor
  const selectSupplier = (suggestion: any) => {
    setSelectedSupplier(suggestion);
    setSuggestions([]);
    setSearchTerm(suggestion.type === 'supplier' ? 
      suggestion.data.nome_fornecedor : 
      suggestion.data.nome_funcionario
    );
    
    // Salvar no localStorage
    localStorage.setItem("supplier_access", JSON.stringify({
      id: suggestion.data.id,
      nome_fornecedor: suggestion.data.nome_fornecedor || '',
      searchType: suggestion.type
    }));

    toast({
      title: "Selecionado!",
      description: "Fornecedor/funcionário selecionado com sucesso",
    });
  };

  // Função SIMPLIFICADA para ver lojas - sem processamento pesado
  const viewStores = () => {
    if (!selectedSupplier) {
      toast({
        title: "Aviso",
        description: "Selecione um fornecedor primeiro",
        variant: "destructive"
      });
      return;
    }

    // Simular busca de lojas (temporário)
    setShowingStores(true);
    
    // Fazer busca real em background
    const endpoint = selectedSupplier.type === 'supplier' 
      ? `/api/routes/supplier/${selectedSupplier.data.id}`
      : `/api/routes/employee/${selectedSupplier.data.id}`;

    fetch(endpoint)
      .then(res => res.json())
      .then(routes => {
        const stores: StoreType[] = [];
        
        if (Array.isArray(routes)) {
          routes.forEach((route: any) => {
            if (route?.lojas && Array.isArray(route.lojas)) {
              route.lojas.forEach((loja: any) => {
                if (loja?.id && loja?.nome_loja) {
                  stores.push({
                    id: loja.id,
                    codigo_loja: String(loja.id),
                    nome_loja: loja.nome_loja || 'Sem nome',
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
        
        setRouteStores(stores);
        
        if (stores.length === 0) {
          toast({
            title: "Nenhuma loja",
            description: "Nenhuma loja encontrada nas rotas. Indo para instalação geral.",
          });
          
          // Ir direto para instalação geral
          setTimeout(() => {
            setLocation("/installation-checklist");
          }, 1000);
        }
      })
      .catch(error => {
        console.error('Erro ao buscar lojas:', error);
        
        // Em caso de erro, ir para instalação geral
        toast({
          title: "Aviso",
          description: "Indo para instalação geral",
        });
        
        setTimeout(() => {
          setLocation("/installation-checklist");
        }, 1000);
      });
  };

  // Função para ir para instalação com loja específica
  const goToInstallation = (store?: StoreType) => {
    if (store) {
      localStorage.setItem("selected_store", JSON.stringify(store));
    }
    setLocation("/installation-checklist");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Building className="h-6 w-6" />
              Acesso do Fornecedor - Versão Simplificada
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Passo 1: Buscar Fornecedor */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Passo 1: Buscar Fornecedor ou Funcionário
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search">Nome, CNPJ ou CPF</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  id="search"
                  type="text"
                  placeholder="Digite o nome, CNPJ ou CPF..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      searchSupplier();
                    }
                  }}
                  data-testid="input-supplier-search"
                />
                <Button 
                  onClick={searchSupplier}
                  disabled={loadingSuggestions}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  {loadingSuggestions ? "Buscando..." : "Buscar"}
                </Button>
              </div>
            </div>

            {/* Lista de Sugestões */}
            {suggestions.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="p-3 hover:bg-blue-50 border-b cursor-pointer"
                    onClick={() => selectSupplier(suggestion)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-500 text-white rounded p-2">
                        {suggestion.type === 'supplier' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {suggestion.type === 'supplier' ? 
                            suggestion.data.nome_fornecedor : 
                            suggestion.data.nome_funcionario
                          }
                        </div>
                        <div className="text-sm text-gray-600">
                          {suggestion.type === 'supplier' ? 
                            `CNPJ: ${suggestion.data.cnpj || 'N/A'}` :
                            `CPF: ${suggestion.data.cpf || 'N/A'}`
                          }
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {suggestion.type === 'supplier' ? 'Fornecedor' : 'Funcionário'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fornecedor Selecionado */}
            {selectedSupplier && (
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="bg-green-500 text-white rounded p-2">
                    {selectedSupplier.type === 'supplier' ? <Building className="h-4 w-4" /> : <User className="h-4 w-4" />}
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
                  <Badge className="bg-green-500 text-white ml-auto">
                    ✓ Selecionado
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Passo 2: Ver Lojas */}
        {selectedSupplier && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Passo 2: Ver Lojas para Instalação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showingStores ? (
                <div className="text-center space-y-4">
                  <div className="bg-blue-50 rounded-lg p-6">
                    <Store className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <p className="text-gray-700 mb-4">
                      Clique no botão abaixo para ver as lojas disponíveis para instalação
                    </p>
                    <Button 
                      onClick={viewStores}
                      className="bg-green-500 hover:bg-green-600 text-white px-6 py-3"
                      size="lg"
                    >
                      <Store className="h-5 w-5 mr-2" />
                      Ver Lojas para Instalação
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-gray-600 mb-2">Ou</p>
                    <Button 
                      onClick={() => goToInstallation()}
                      variant="outline"
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      Ir Direto para Instalação Geral
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {routeStores.length > 0 ? (
                    <>
                      <p className="text-gray-700 font-medium">
                        Lojas Encontradas ({routeStores.length})
                      </p>
                      {routeStores.map((store) => (
                        <div 
                          key={store.id}
                          className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 cursor-pointer hover:shadow-lg"
                          onClick={() => goToInstallation(store)}
                        >
                          <div className="flex items-center gap-4">
                            <div className="bg-green-500 text-white rounded-lg p-3">
                              <Store className="h-5 w-5" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold">{store.nome_loja}</h3>
                              <div className="text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Hash className="h-3 w-3" />
                                  Código: {store.codigo_loja}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {store.cidade}, {store.uf}
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-green-500 text-white">
                              → Instalar
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-3">Buscando lojas...</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
import React, { useState } from "react";
import { useLocation } from "wouter";
import { Search, Store, MapPin, Building, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { type Store as StoreType } from "@shared/mysql-schema";

export default function StoreSearch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados para busca
  const [searchFilters, setSearchFilters] = useState({
    codigo_loja: "",
    rua: "",
    bairro: "",
    municipio: "",
    estado: ""
  });
  
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StoreType[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Função para buscar lojas
  const searchStores = async () => {
    // Verificar se pelo menos um campo foi preenchido
    const hasFilter = Object.values(searchFilters).some(value => value.trim() !== "");
    
    if (!hasFilter) {
      toast({
        title: "Aviso",
        description: "Preencha pelo menos um campo para buscar",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    setHasSearched(true);
    
    try {
      // Preparar filtros para envio
      const filters: any = {};
      
      if (searchFilters.codigo_loja) filters.codigo_loja = searchFilters.codigo_loja;
      if (searchFilters.rua) filters.logradouro = searchFilters.rua;
      if (searchFilters.bairro) filters.bairro = searchFilters.bairro;
      if (searchFilters.municipio) filters.cidade = searchFilters.municipio;
      if (searchFilters.estado) filters.uf = searchFilters.estado;
      
      // Usar POST para enviar os filtros
      const response = await fetch('/api/stores/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters)
      });
      
      if (response.ok) {
        const stores = await response.json();
        setSearchResults(stores);
        
        if (stores.length === 0) {
          toast({
            title: "Nenhuma loja encontrada",
            description: "Tente ajustar os filtros de busca",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso!",
            description: `${stores.length} loja(s) encontrada(s)`,
          });
        }
      } else {
        throw new Error("Erro na busca");
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar lojas. Tente novamente.",
        variant: "destructive"
      });
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setSearchFilters({
      codigo_loja: "",
      rua: "",
      bairro: "",
      municipio: "",
      estado: ""
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  // Função para ir para instalação com loja selecionada
  const selectStore = (store: StoreType) => {
    localStorage.setItem("selected_store", JSON.stringify(store));
    toast({
      title: "Loja selecionada!",
      description: `${store.nome_loja} - Indo para instalação...`,
    });
    
    setTimeout(() => {
      setLocation("/installation-checklist");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Search className="h-6 w-6" />
              Buscar Lojas Manualmente
            </CardTitle>
          </CardHeader>
        </Card>

        {/* Formulário de Busca */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Filtros de Busca (Busca Aproximada)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Código da Loja */}
              <div>
                <Label htmlFor="codigo">
                  <Hash className="inline h-3 w-3 mr-1" />
                  Código da Loja
                </Label>
                <Input
                  id="codigo"
                  type="text"
                  placeholder="Ex: 50117"
                  value={searchFilters.codigo_loja}
                  onChange={(e) => setSearchFilters({...searchFilters, codigo_loja: e.target.value})}
                  data-testid="input-store-code"
                />
              </div>

              {/* Rua */}
              <div>
                <Label htmlFor="rua">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Rua
                </Label>
                <Input
                  id="rua"
                  type="text"
                  placeholder="Ex: Rua das Flores"
                  value={searchFilters.rua}
                  onChange={(e) => setSearchFilters({...searchFilters, rua: e.target.value})}
                  data-testid="input-street"
                />
              </div>

              {/* Bairro */}
              <div>
                <Label htmlFor="bairro">
                  <Building className="inline h-3 w-3 mr-1" />
                  Bairro
                </Label>
                <Input
                  id="bairro"
                  type="text"
                  placeholder="Ex: Centro"
                  value={searchFilters.bairro}
                  onChange={(e) => setSearchFilters({...searchFilters, bairro: e.target.value})}
                  data-testid="input-neighborhood"
                />
              </div>

              {/* Município */}
              <div>
                <Label htmlFor="municipio">
                  <Building className="inline h-3 w-3 mr-1" />
                  Município
                </Label>
                <Input
                  id="municipio"
                  type="text"
                  placeholder="Ex: São Paulo"
                  value={searchFilters.municipio}
                  onChange={(e) => setSearchFilters({...searchFilters, municipio: e.target.value})}
                  data-testid="input-city"
                />
              </div>

              {/* Estado */}
              <div>
                <Label htmlFor="estado">
                  <MapPin className="inline h-3 w-3 mr-1" />
                  Estado (UF)
                </Label>
                <Input
                  id="estado"
                  type="text"
                  placeholder="Ex: SP"
                  value={searchFilters.estado}
                  onChange={(e) => setSearchFilters({...searchFilters, estado: e.target.value.toUpperCase()})}
                  maxLength={2}
                  data-testid="input-state"
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={searchStores}
                disabled={searching}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                size="lg"
              >
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Buscando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Buscar Lojas
                  </>
                )}
              </Button>
              
              <Button 
                onClick={clearFilters}
                variant="outline"
                className="border-gray-300"
              >
                Limpar
              </Button>
              
              <Button 
                onClick={() => setLocation("/supplier-access")}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados da Busca */}
        {hasSearched && (
          <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Resultados da Busca
                {searchResults.length > 0 && (
                  <Badge className="ml-2">{searchResults.length} loja(s)</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((store) => (
                    <div 
                      key={store.id}
                      className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 cursor-pointer hover:shadow-lg transition-all"
                      onClick={() => selectStore(store)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-500 text-white rounded-lg p-3">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{store.nome_loja || 'Loja sem nome'}</h3>
                          <div className="text-sm text-gray-600 mt-1 space-y-1">
                            <div className="flex items-center gap-1">
                              <Hash className="h-3 w-3" />
                              Código: {store.codigo_loja}
                            </div>
                            {store.logradouro && (
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {store.logradouro}
                                {store.numero && `, ${store.numero}`}
                                {store.bairro && ` - ${store.bairro}`}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {store.cidade || 'N/A'}, {store.uf || 'N/A'}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-green-500 text-white">
                          Selecionar →
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Store className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">Nenhuma loja encontrada com os filtros informados</p>
                  <p className="text-sm text-gray-500 mt-2">Tente ajustar os critérios de busca</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
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

export default function StoreSearchUltraSimple() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Estados super simples
  const [codigoLoja, setCodigoLoja] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [municipio, setMunicipio] = useState("");
  const [estado, setEstado] = useState("");
  
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<StoreType[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Função de busca ULTRA SIMPLIFICADA
  const searchStores = () => {
    // Verificar se pelo menos um campo foi preenchido
    if (!codigoLoja && !rua && !bairro && !municipio && !estado) {
      toast({
        title: "Aviso",
        description: "Preencha pelo menos um campo para buscar",
        variant: "destructive"
      });
      return;
    }

    setSearching(true);
    setHasSearched(true);
    
    // Criar URL de busca simples
    let url = '/api/stores/search?';
    const params = [];
    
    if (codigoLoja) params.push(`codigo_loja=${encodeURIComponent(codigoLoja)}`);
    if (rua) params.push(`logradouro=${encodeURIComponent(rua)}`);
    if (bairro) params.push(`bairro=${encodeURIComponent(bairro)}`);
    if (municipio) params.push(`cidade=${encodeURIComponent(municipio)}`);
    if (estado) params.push(`uf=${encodeURIComponent(estado)}`);
    
    url += params.join('&');
    
    console.log('Buscando lojas com URL:', url);
    
    // Fazer requisição simples
    fetch(url)
      .then(res => res.json())
      .then(data => {
        console.log('Lojas encontradas:', data);
        setSearchResults(data || []);
        setSearching(false);
        
        if (!data || data.length === 0) {
          toast({
            title: "Nenhuma loja encontrada",
            description: "Tente ajustar os filtros de busca",
            variant: "destructive"
          });
        } else {
          toast({
            title: "Sucesso!",
            description: `${data.length} loja(s) encontrada(s)`,
          });
        }
      })
      .catch(err => {
        console.error('Erro:', err);
        setSearching(false);
        setSearchResults([]);
        toast({
          title: "Erro",
          description: "Erro ao buscar lojas",
          variant: "destructive"
        });
      });
  };

  // Função para limpar
  const clearAll = () => {
    setCodigoLoja("");
    setRua("");
    setBairro("");
    setMunicipio("");
    setEstado("");
    setSearchResults([]);
    setHasSearched(false);
  };

  // Função para selecionar loja
  const selectStore = (store: StoreType) => {
    localStorage.setItem("selected_store", JSON.stringify(store));
    toast({
      title: "Loja selecionada!",
      description: `${store.nome_loja}`,
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
            {/* Código da Loja */}
            <div>
              <Label>
                <Hash className="inline h-3 w-3 mr-1" />
                Código da Loja
              </Label>
              <Input
                type="text"
                placeholder="Ex: 50117"
                value={codigoLoja}
                onChange={(e) => setCodigoLoja(e.target.value)}
                data-testid="input-store-code"
              />
            </div>

            {/* Rua */}
            <div>
              <Label>
                <MapPin className="inline h-3 w-3 mr-1" />
                Rua
              </Label>
              <Input
                type="text"
                placeholder="Ex: Rua das Flores"
                value={rua}
                onChange={(e) => setRua(e.target.value)}
                data-testid="input-street"
              />
            </div>

            {/* Bairro */}
            <div>
              <Label>
                <Building className="inline h-3 w-3 mr-1" />
                Bairro
              </Label>
              <Input
                type="text"
                placeholder="Ex: Centro"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                data-testid="input-neighborhood"
              />
            </div>

            {/* Município */}
            <div>
              <Label>
                <Building className="inline h-3 w-3 mr-1" />
                Município
              </Label>
              <Input
                type="text"
                placeholder="Ex: São Paulo"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                data-testid="input-city"
              />
            </div>

            {/* Estado */}
            <div>
              <Label>
                <MapPin className="inline h-3 w-3 mr-1" />
                Estado (UF)
              </Label>
              <Input
                type="text"
                placeholder="Ex: SP"
                value={estado}
                onChange={(e) => setEstado(e.target.value.toUpperCase())}
                maxLength={2}
                data-testid="input-state"
              />
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={searchStores}
                disabled={searching}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
                size="lg"
                type="button"
              >
                {searching ? "Buscando..." : "Buscar Lojas"}
              </Button>
              
              <Button 
                onClick={clearAll}
                variant="outline"
                className="border-gray-300"
                type="button"
              >
                Limpar
              </Button>
              
              <Button 
                onClick={() => setLocation("/supplier-access")}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
                type="button"
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
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
                      className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border-2 border-green-200 cursor-pointer hover:shadow-lg"
                      onClick={() => selectStore(store)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-green-500 text-white rounded-lg p-3">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{store.nome_loja || 'Loja sem nome'}</h3>
                          <div className="text-sm text-gray-600 mt-1">
                            <div>Código: {store.codigo_loja}</div>
                            {store.logradouro && (
                              <div>
                                {store.logradouro}
                                {store.numero && `, ${store.numero}`}
                                {store.bairro && ` - ${store.bairro}`}
                              </div>
                            )}
                            <div>{store.cidade || 'N/A'}, {store.uf || 'N/A'}</div>
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
                  <p className="text-gray-600">Nenhuma loja encontrada</p>
                  <p className="text-sm text-gray-500 mt-2">Tente ajustar os filtros</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}